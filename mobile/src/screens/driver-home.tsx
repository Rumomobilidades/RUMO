import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, StyleSheet, View } from 'react-native';

import { AccountMenu } from '@/components/account-menu';
import { Button, ErrorText, Field } from '@/components/form';
import { MapScreen } from '@/components/map-screen';
import { Empty, Loading, PersonRow, TripNumbers } from '@/components/ride';
import { ThemedText } from '@/components/themed-text';
import {
  BottomModal,
  Divider,
  FloatingButton,
  Icon,
  RouteSummary,
  Row,
  SearchingBar,
  StepBar,
} from '@/components/ui';
import { Brand, Elevation, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { describeError } from '@/lib/errors';
import { formatDistance, formatDuration, formatPrice } from '@/lib/format';
import { useMyLocation } from '@/lib/location';
import { useNewRequestAlert, useRideAlerts } from '@/lib/notifications';
import { endedRecently, isActive, statusLabel } from '@/lib/ride-labels';
import {
  acceptRide,
  advanceRide,
  declineRide,
  cancelRide,
  fetchDriver,
  fetchLatestRide,
  fetchOpenRequests,
  setDriverOnline,
  updateVehicle,
} from '@/lib/rides';
import type { Driver, Profile, Ride, RideView } from '@/lib/types';
import { useLive } from '@/lib/use-live';
import { ridePoints, useRouteLine } from '@/lib/use-route-line';
import { RideSummary } from '@/screens/ride-summary';

/** Próximo passo permitido pelo banco a partir de cada estado. */
const NEXT_STEP = {
  accepted: { to: 'arrived', label: 'Cheguei ao local', hint: 'Vá até o ponto de embarque.' },
  arrived: { to: 'in_progress', label: 'Iniciar viagem', hint: 'Aguarde o passageiro embarcar.' },
  in_progress: { to: 'completed', label: 'Finalizar viagem', hint: 'Leve o passageiro ao destino.' },
} as const;

const STEP: Record<string, number> = { accepted: 1, arrived: 2, in_progress: 3 };

function StatusPill({ online }: { online: boolean }) {
  const theme = useTheme();

  return (
    <View style={[styles.pill, Elevation, { backgroundColor: theme.background }]}>
      <View style={[styles.pillDot, { backgroundColor: online ? Brand.green : theme.textSecondary }]} />
      <ThemedText type="smallBold">{online ? 'Online' : 'Offline'}</ThemedText>
    </View>
  );
}

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
    <>
      <View style={styles.titleBlock}>
        <ThemedText type="heading">{statusLabel(ride.status, 'motorista')}</ThemedText>
        {step ? (
          <ThemedText type="small" themeColor="textSecondary">
            {step.hint}
          </ThemedText>
        ) : null}
      </View>
      <StepBar total={3} current={STEP[ride.status] ?? 0} />

      {counterpart ? (
        <>
          <PersonRow role="Passageiro" person={counterpart} />
          <Divider />
        </>
      ) : null}

      <RouteSummary origin={ride.origin_address} destination={ride.destination_address} />
      <Divider />
      <TripNumbers
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
    </>
  );
}

function RequestCard({
  ride,
  busy,
  blocked,
  onAccept,
  onDecline,
}: {
  ride: Ride;
  busy: boolean;
  blocked: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.request, { borderColor: theme.border }]}>
      <View style={styles.requestHeader}>
        <ThemedText type="subtitle">{formatPrice(ride.estimated_price_cents)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDistance(ride.distance_m)} · {formatDuration(ride.duration_s)}
        </ThemedText>
      </View>
      <RouteSummary origin={ride.origin_address} destination={ride.destination_address} />
      <View style={styles.requestActions}>
        <View style={styles.decline}>
          <Button label="Recusar" variant="secondary" disabled={blocked || busy} onPress={onDecline} />
        </View>
        <View style={styles.accept}>
          <Button label="Aceitar corrida" variant="brand" busy={busy} disabled={blocked} onPress={onAccept} />
        </View>
      </View>
    </View>
  );
}

function VehicleModal({
  driver,
  visible,
  onClose,
  onSaved,
}: {
  driver: Driver;
  visible: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [model, setModel] = useState(driver.vehicle_model ?? '');
  const [plate, setPlate] = useState(driver.vehicle_plate ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    setBusy(true);
    try {
      await updateVehicle(driver.id, model, plate);
      await onSaved();
      onClose();
    } catch (e) {
      setError(describeError(e));
    }
    setBusy(false);
  }

  return (
    <BottomModal visible={visible} onClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.modalBody}>
        <ThemedText type="heading">Seu veículo</ThemedText>
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
        <Button label="Salvar" onPress={save} busy={busy} />
      </KeyboardAvoidingView>
    </BottomModal>
  );
}

export function DriverHome({ profile }: { profile: Profile }) {
  const userId = profile.id;
  const driverFetcher = useCallback(() => fetchDriver(userId), [userId]);
  const rideFetcher = useCallback(() => fetchLatestRide(userId, 'motorista'), [userId]);
  // A aprovação muda fora do app (dashboard), então o cadastro também é consultado em intervalo.
  const driverLive = useLive(driverFetcher, 15000);
  const rideLive = useLive(rideFetcher);
  const location = useMyLocation();

  const driver = driverLive.data ?? null;
  const view = rideLive.data ?? null;
  const active = view && isActive(view.ride) ? view : null;

  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const summary = view && !active && endedRecently(view.ride) && view.ride.id !== dismissedId ? view : null;

  const approved = driver?.approval_status === 'approved';
  const listening = Boolean(approved && driver?.is_online && !active && !summary);
  const requests = useLive(listening ? fetchOpenRequests : null, 5000);
  const openRides = listening ? (requests.data ?? []) : [];

  useRideAlerts(rideLive.data, 'motorista');
  useNewRequestAlert(listening ? requests.data : undefined);

  const [menuOpen, setMenuOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const points = ridePoints(active?.ride ?? summary?.ride ?? openRides[0] ?? null);
  const line = useRouteLine(points.origin, points.destination);

  const refreshAll = useCallback(async () => {
    await Promise.all([driverLive.refresh(), rideLive.refresh(), requests.refresh()]);
  }, [driverLive, rideLive, requests]);

  async function toggleOnline() {
    if (!driver) return;
    setError(null);
    setBusy(true);
    try {
      await setDriverOnline(!driver.is_online);
    } catch (e) {
      setError(describeError(e));
    }
    await refreshAll();
    setBusy(false);
  }

  async function decline(ride: Ride) {
    setError(null);
    setAcceptingId(ride.id);
    try {
      await declineRide(ride.id);
    } catch (e) {
      setError(describeError(e));
    }
    await requests.refresh();
    setAcceptingId(null);
  }

  async function accept(ride: Ride) {
    setError(null);
    setAcceptingId(ride.id);
    try {
      // A disputa é decidida no banco: se outro motorista aceitou antes, vem ride_not_available.
      await acceptRide(ride.id);
    } catch (e) {
      setError(describeError(e));
    }
    await refreshAll();
    setAcceptingId(null);
  }

  let sheet;

  if (driverLive.loading || rideLive.loading) {
    sheet = <Loading label="Carregando seu painel" />;
  } else if (!driver) {
    sheet = (
      <>
        <ErrorText>{driverLive.error ?? 'Cadastro de motorista não encontrado.'}</ErrorText>
        <Button label="Tentar de novo" variant="secondary" onPress={refreshAll} />
      </>
    );
  } else if (active) {
    sheet = (
      <>
        <ErrorText>{rideLive.error}</ErrorText>
        <ActiveRide view={active} onChanged={refreshAll} />
      </>
    );
  } else if (summary) {
    sheet = (
      <RideSummary
        view={summary}
        role="motorista"
        userId={userId}
        doneLabel="Voltar às solicitações"
        onDone={() => setDismissedId(summary.ride.id)}
      />
    );
  } else if (!approved) {
    const rejected = driver.approval_status === 'rejected';
    sheet = (
      <>
        <View style={styles.notice}>
          <Icon
            name={rejected ? 'close-circle' : 'hourglass'}
            size={36}
            color={rejected ? Brand.danger : Brand.warning}
          />
          <View style={styles.noticeText}>
            <ThemedText type="heading">{rejected ? 'Cadastro não aprovado' : 'Cadastro em análise'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {rejected
                ? 'Fale com o suporte do RUMO para entender o motivo.'
                : 'Assim que seu cadastro for aprovado, você poderá ficar online. Esta tela atualiza sozinha.'}
            </ThemedText>
          </View>
        </View>
        <Row
          icon="car-outline"
          title="Meu veículo"
          subtitle={driver.vehicle_plate ?? 'Adicione modelo e placa'}
          onPress={() => setVehicleOpen(true)}
        />
        <Button label="Atualizar situação" variant="secondary" onPress={refreshAll} />
      </>
    );
  } else if (!driver.is_online) {
    sheet = (
      <>
        <View style={styles.titleBlock}>
          <ThemedText type="heading">Você está offline</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Fique online para receber solicitações de corrida.
          </ThemedText>
        </View>
        <ErrorText>{error ?? driverLive.error}</ErrorText>
        <Button label="Ficar online" variant="brand" icon="power" onPress={toggleOnline} busy={busy} />
        <Row
          icon="car-outline"
          title="Meu veículo"
          subtitle={
            [driver.vehicle_model, driver.vehicle_plate].filter(Boolean).join(' · ') ||
            'Adicione modelo e placa'
          }
          onPress={() => setVehicleOpen(true)}
        />
      </>
    );
  } else {
    sheet = (
      <>
        <View style={styles.titleBlock}>
          <ThemedText type="heading">
            {openRides.length > 0
              ? openRides.length === 1
                ? 'Nova solicitação'
                : `${openRides.length} solicitações`
              : 'Procurando corridas'}
          </ThemedText>
          {openRides.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Você está online. As solicitações aparecem aqui sozinhas.
            </ThemedText>
          ) : null}
        </View>
        <ErrorText>{error ?? requests.error}</ErrorText>
        {requests.loading ? (
          <Loading label="Buscando solicitações" />
        ) : openRides.length === 0 ? (
          <>
            <SearchingBar />
            <Empty title="Nenhuma solicitação no momento" hint="Deixe o app aberto para não perder corridas." />
          </>
        ) : (
          openRides.map((ride) => (
            <RequestCard
              key={ride.id}
              ride={ride}
              busy={acceptingId === ride.id}
              blocked={acceptingId !== null && acceptingId !== ride.id}
              onAccept={() => accept(ride)}
              onDecline={() => decline(ride)}
            />
          ))
        )}
        <Button label="Ficar offline" variant="secondary" onPress={toggleOnline} busy={busy} />
      </>
    );
  }

  return (
    <>
      <MapScreen
        origin={points.origin}
        destination={points.destination}
        line={line}
        me={location.coords}
        showsUser={location.status === 'granted'}
        top={
          <>
            <FloatingButton icon="person" label="Abrir menu da conta" onPress={() => setMenuOpen(true)} />
            {driver && approved ? <StatusPill online={driver.is_online} /> : null}
            <View style={styles.topSpacer} />
          </>
        }>
        {sheet}
      </MapScreen>
      <AccountMenu profile={profile} visible={menuOpen} onClose={() => setMenuOpen(false)} />
      {driver ? (
        <VehicleModal
          key={`${driver.vehicle_model}|${driver.vehicle_plate}`}
          driver={driver}
          visible={vehicleOpen}
          onClose={() => setVehicleOpen(false)}
          onSaved={refreshAll}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  titleBlock: { gap: Spacing.one },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    height: 40,
  },
  pillDot: { width: 10, height: 10, borderRadius: 5 },
  topSpacer: { width: 48 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  noticeText: { flex: 1, gap: Spacing.one },
  request: { borderWidth: 1, borderRadius: Radius.large, padding: Spacing.three, gap: Spacing.three },
  requestHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  requestActions: { flexDirection: 'row', gap: Spacing.two },
  decline: { flex: 1 },
  accept: { flex: 2 },
  modalBody: { gap: Spacing.three, paddingBottom: Spacing.two },
});
