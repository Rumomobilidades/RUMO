import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { Button, ErrorText, Field } from '@/components/form';
import { Card, Empty, Loading, Person, StatusBadge, Trip } from '@/components/ride';
import { ThemedText } from '@/components/themed-text';
import { describeError } from '@/lib/errors';
import { endedRecently, isActive, statusLabel } from '@/lib/ride-labels';
import {
  acceptRide,
  advanceRide,
  cancelRide,
  fetchDriver,
  fetchLatestRide,
  fetchOpenRequests,
  setDriverOnline,
  updateVehicle,
} from '@/lib/rides';
import type { Driver, Ride, RideView } from '@/lib/types';
import { useLive } from '@/lib/use-live';
import { RideSummary } from '@/screens/ride-summary';

const APPROVAL_TEXT: Record<Driver['approval_status'], string> = {
  pending: 'Cadastro em análise. Você poderá ficar online depois da aprovação.',
  approved: 'Cadastro aprovado.',
  rejected: 'Cadastro não aprovado. Fale com o suporte.',
};

/** Próximo passo permitido pelo banco a partir de cada estado. */
const NEXT_STEP = {
  accepted: { to: 'arrived', label: 'Cheguei ao local' },
  arrived: { to: 'in_progress', label: 'Iniciar viagem' },
  in_progress: { to: 'completed', label: 'Finalizar viagem' },
} as const;

function ActiveRide({ view, onChanged }: { view: RideView; onChanged: () => Promise<void> }) {
  const { ride, counterpart } = view;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const step = NEXT_STEP[ride.status as keyof typeof NEXT_STEP];
  const cancellable = ride.status === 'accepted' || ride.status === 'arrived';

  async function act(action: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (e) {
      setError(describeError(e));
    }
    // Recarrega sempre: se a ação falhou, o estado real pode ter mudado (ex.: passageiro cancelou).
    await onChanged();
    setBusy(false);
  }

  function confirmCancel() {
    Alert.alert('Cancelar corrida?', 'O passageiro será avisado.', [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar corrida', style: 'destructive', onPress: () => act(() => cancelRide(ride.id)) },
    ]);
  }

  return (
    <Card>
      <StatusBadge status={ride.status} label={statusLabel(ride.status, 'motorista')} />
      {counterpart ? <Person title="Passageiro" person={counterpart} /> : null}
      <Trip
        origin={ride.origin_address}
        destination={ride.destination_address}
        distanceM={ride.distance_m}
        durationS={ride.duration_s}
        priceCents={ride.estimated_price_cents}
      />
      <ErrorText>{error}</ErrorText>
      {step ? (
        <Button label={step.label} busy={busy} onPress={() => act(() => advanceRide(ride.id, step.to))} />
      ) : null}
      {cancellable ? (
        <Button label="Cancelar corrida" variant="danger" disabled={busy} onPress={confirmCancel} />
      ) : null}
    </Card>
  );
}

function Requests({ onAccepted }: { onAccepted: () => Promise<void> }) {
  const live = useLive(fetchOpenRequests, 5000);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function accept(ride: Ride) {
    setError(null);
    setAcceptingId(ride.id);
    try {
      // A disputa é decidida no banco: se outro motorista aceitou antes, vem ride_not_available.
      await acceptRide(ride.id);
    } catch (e) {
      setError(describeError(e));
    }
    await Promise.all([live.refresh(), onAccepted()]);
    setAcceptingId(null);
  }

  if (live.loading) return <Loading label="Buscando solicitações" />;

  const rides = live.data ?? [];

  return (
    <>
      <ThemedText type="smallBold">Solicitações disponíveis</ThemedText>
      <ErrorText>{error ?? live.error}</ErrorText>
      {rides.length === 0 ? (
        <Empty
          title="Nenhuma solicitação no momento"
          hint="Esta lista atualiza sozinha quando um passageiro pedir uma corrida."
        />
      ) : (
        rides.map((ride) => (
          <Card key={ride.id}>
            <Trip
              origin={ride.origin_address}
              destination={ride.destination_address}
              distanceM={ride.distance_m}
              durationS={ride.duration_s}
              priceCents={ride.estimated_price_cents}
            />
            <Button
              label="Aceitar corrida"
              busy={acceptingId === ride.id}
              disabled={acceptingId !== null}
              onPress={() => accept(ride)}
            />
          </Card>
        ))
      )}
    </>
  );
}

function Vehicle({ driver, onSaved }: { driver: Driver; onSaved: () => Promise<void> }) {
  const [model, setModel] = useState(driver.vehicle_model ?? '');
  const [plate, setPlate] = useState(driver.vehicle_plate ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      await updateVehicle(driver.id, model, plate);
      await onSaved();
      setMessage('Veículo salvo.');
    } catch (e) {
      setError(describeError(e));
    }
    setBusy(false);
  }

  return (
    <Card>
      <ThemedText type="smallBold">Seu veículo</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        O passageiro vê estes dados depois que você aceita a corrida.
      </ThemedText>
      <Field label="Modelo e cor" value={model} onChangeText={setModel} placeholder="Onix prata" />
      <Field
        label="Placa"
        value={plate}
        onChangeText={setPlate}
        placeholder="ABC1D23"
        autoCapitalize="characters"
        maxLength={8}
      />
      <ErrorText>{error}</ErrorText>
      {message ? <ThemedText type="small">{message}</ThemedText> : null}
      <Button label="Salvar veículo" variant="secondary" onPress={save} busy={busy} />
    </Card>
  );
}

export function useDriverHome(userId: string) {
  const driverFetcher = useCallback(() => fetchDriver(userId), [userId]);
  const rideFetcher = useCallback(() => fetchLatestRide(userId, 'motorista'), [userId]);
  // A aprovação muda fora do app (dashboard), então o cadastro também é consultado em intervalo.
  const driver = useLive(driverFetcher, 15000);
  const ride = useLive(rideFetcher);

  const refresh = useCallback(async () => {
    await Promise.all([driver.refresh(), ride.refresh()]);
  }, [driver, ride]);

  return { driver, ride, refresh, refreshing: driver.refreshing || ride.refreshing };
}

export function DriverHome({
  userId,
  live,
}: {
  userId: string;
  live: ReturnType<typeof useDriverHome>;
}) {
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (live.driver.loading || live.ride.loading) return <Loading label="Carregando seu painel" />;

  const driver = live.driver.data;
  const view = live.ride.data;

  if (!driver) {
    return (
      <>
        <ErrorText>{live.driver.error ?? 'Cadastro de motorista não encontrado.'}</ErrorText>
        <Button label="Tentar de novo" variant="secondary" onPress={live.refresh} />
      </>
    );
  }

  async function toggleOnline() {
    setError(null);
    setBusy(true);
    try {
      await setDriverOnline(!driver!.is_online);
    } catch (e) {
      setError(describeError(e));
    }
    await live.refresh();
    setBusy(false);
  }

  const approved = driver.approval_status === 'approved';
  const active = view && isActive(view.ride) ? view : null;
  const summary = view && !active && endedRecently(view.ride) && view.ride.id !== dismissedId ? view : null;

  return (
    <>
      <ErrorText>{live.driver.error ?? live.ride.error}</ErrorText>

      {active ? (
        <ActiveRide view={active} onChanged={live.refresh} />
      ) : summary ? (
        <RideSummary
          view={summary}
          role="motorista"
          userId={userId}
          doneLabel="Voltar às solicitações"
          onDone={() => setDismissedId(summary.ride.id)}
        />
      ) : null}

      {!active ? (
        <Card>
          <ThemedText type="smallBold">Situação</ThemedText>
          <ThemedText themeColor="textSecondary">{APPROVAL_TEXT[driver.approval_status]}</ThemedText>
          {approved ? (
            <>
              <ThemedText>
                {driver.is_online
                  ? 'Você está online e pode receber corridas.'
                  : 'Você está offline e não recebe corridas.'}
              </ThemedText>
              <Button
                label={driver.is_online ? 'Ficar offline' : 'Ficar online'}
                variant={driver.is_online ? 'secondary' : 'primary'}
                onPress={toggleOnline}
                busy={busy}
              />
            </>
          ) : null}
          <ErrorText>{error}</ErrorText>
        </Card>
      ) : null}

      {approved && driver.is_online && !active && !summary ? (
        <Requests onAccepted={live.refresh} />
      ) : null}

      {!active && !driver.is_online ? <Vehicle driver={driver} onSaved={live.refresh} /> : null}
    </>
  );
}
