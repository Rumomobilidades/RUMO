import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { supabase } from '@/lib/supabase';
import type { Ride, RideView, Role } from '@/lib/types';

/**
 * Três camadas de aviso, da mais imediata para a mais resistente:
 *  1. Tempo real — com o app aberto, as telas se atualizam sozinhas (use-live).
 *  2. Aviso local — com o app aberto, uma mudança importante também vira um
 *     aviso do sistema (este arquivo, `notifyLocal`).
 *  3. Push — com o app em segundo plano ou fechado, quem avisa é o servidor
 *     (gatilho no banco -> função notify-ride). Aqui só registramos o aparelho.
 */

const isWeb = Platform.OS === 'web';
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** No Expo Go para Android o push remoto não existe; lá só há tempo real e aviso local. */
export const pushSupportedHere = !isWeb && !(inExpoGo && Platform.OS === 'android');

type NotificationsModule = typeof import('expo-notifications');
let modulePromise: Promise<NotificationsModule | null> | null = null;

// Carregado sob demanda: em ambientes onde o módulo não existe, o app segue sem avisos.
function load() {
  if (isWeb) return Promise.resolve(null);

  modulePromise ??= import('expo-notifications')
    .then((Notifications) => {
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          // Com o app aberto o aviso local já aparece; silenciar o push evita aviso em dobro.
          const remote = (notification.request.trigger as { type?: string } | null)?.type === 'push';
          return {
            shouldPlaySound: !remote,
            shouldSetBadge: false,
            shouldShowBanner: !remote,
            shouldShowList: !remote,
          };
        },
      });
      return Notifications;
    })
    .catch(() => null);

  return modulePromise;
}

async function ensurePermission(Notifications: NotificationsModule) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('corridas', {
      name: 'Corridas',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 150, 250],
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

let registeredToken: string | null = null;

export type PushStatus = 'registered' | 'denied' | 'unsupported' | 'no-project' | 'failed';

/** Pede permissão e, onde o push remoto existe, registra o aparelho no servidor. */
export async function setupNotifications(): Promise<PushStatus> {
  try {
    const Notifications = await load();
    if (!Notifications) return 'unsupported';
    if (!(await ensurePermission(Notifications))) return 'denied';
    if (!pushSupportedHere) return 'unsupported';

    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      Constants.easConfig?.projectId;
    // Sem projeto EAS configurado não há como obter o endereço de push do aparelho.
    if (!projectId) return 'no-project';

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase.rpc('register_push_token', {
      p_token: token,
      p_platform: Platform.OS,
    });
    if (error) return 'failed';

    registeredToken = token;
    return 'registered';
  } catch {
    return 'failed';
  }
}

/** Ao sair da conta: este aparelho deixa de receber avisos dela. */
export async function unregisterPush() {
  if (!registeredToken) return;
  const token = registeredToken;
  registeredToken = null;
  await supabase.rpc('unregister_push_token', { p_token: token }).then(
    () => undefined,
    () => undefined,
  );
}

/** Aviso do sistema para algo que acabou de acontecer, só com o app em primeiro plano. */
export async function notifyLocal(title: string, body: string) {
  if (AppState.currentState !== 'active') return;
  try {
    const Notifications = await load();
    if (!Notifications || !(await Notifications.getPermissionsAsync()).granted) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: null,
    });
  } catch {
    // Aviso é complemento: se falhar, a tela já mostra o estado certo.
  }
}

const short = (address: string) => address.split(' - ')[0] ?? address;

function passengerMessage(ride: Ride, driverName: string | null): [string, string] | null {
  switch (ride.status) {
    case 'accepted':
      return ['Motorista a caminho', driverName ? `${driverName} aceitou sua corrida.` : 'Um motorista aceitou sua corrida.'];
    case 'arrived':
      return ['Seu motorista chegou', `Encontre-o em ${short(ride.origin_address)}.`];
    case 'in_progress':
      return ['Viagem iniciada', `A caminho de ${short(ride.destination_address)}.`];
    case 'completed':
      return ['Você chegou', 'Viagem concluída.'];
    case 'cancelled':
      return ride.cancelled_by === ride.passenger_id ? null : ['Corrida cancelada', 'O motorista cancelou a corrida.'];
    default:
      return null;
  }
}

/** Dispara um aviso local quando a corrida acompanhada muda de estado. */
export function useRideAlerts(view: RideView | null | undefined, role: Role) {
  const previous = useRef<{ id: string; status: string } | null | undefined>(undefined);
  const ride = view?.ride ?? null;
  const counterpartName = view?.counterpart?.full_name.split(/\s+/)[0] ?? null;

  useEffect(() => {
    // `undefined` em `view` = ainda carregando; não é mudança.
    if (view === undefined) return;

    const before = previous.current;
    previous.current = ride ? { id: ride.id, status: ride.status } : null;

    // Primeira leitura (ao abrir o app) só registra o ponto de partida.
    if (before === undefined || !ride) return;
    if (before && before.id === ride.id && before.status === ride.status) return;
    // Corrida diferente da que estava na tela: só interessa se já chegou mudada.
    if (before?.id !== ride.id && ride.status === 'requested') return;

    if (role === 'passageiro') {
      const message = passengerMessage(ride, counterpartName);
      if (message) notifyLocal(...message);
    } else if (ride.status === 'cancelled' && ride.cancelled_by === ride.passenger_id) {
      notifyLocal('Corrida cancelada', 'O passageiro cancelou a corrida.');
    }
    // Só a mudança de id/status interessa; os demais campos acompanham.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view === undefined, ride?.id, ride?.status]);
}

/** Avisa o motorista quando entra uma solicitação que ele ainda não tinha visto. */
export function useNewRequestAlert(rides: Ride[] | undefined) {
  const known = useRef<Set<string> | null>(null);
  const ids = rides?.map((ride) => ride.id).join(',');

  useEffect(() => {
    if (!rides) return;
    const before = known.current;
    known.current = new Set(rides.map((ride) => ride.id));
    if (!before) return;

    const fresh = rides.find((ride) => !before.has(ride.id));
    if (fresh) {
      notifyLocal(
        'Nova solicitação de corrida',
        `${short(fresh.origin_address)} → ${short(fresh.destination_address)}`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
}
