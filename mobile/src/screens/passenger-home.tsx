import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AccountMenu } from '@/components/account-menu';
import { Button, ErrorText } from '@/components/form';
import { MapScreen } from '@/components/map-screen';
import { Loading, PersonRow, TripNumbers } from '@/components/ride';
import { ThemedText } from '@/components/themed-text';
import { Divider, FloatingButton, Icon, RouteSummary, Row, SearchingBar, StepBar } from '@/components/ui';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { describeError } from '@/lib/errors';
import { firstName, formatDistance, formatDuration, formatPrice } from '@/lib/format';
import { useMyLocation } from '@/lib/location';
import { endedRecently, isActive, statusLabel } from '@/lib/ride-labels';
import { cancelRide, fetchLatestRide, fetchRecentDestinations, requestRide } from '@/lib/rides';
import type { Profile, Quote, RideView } from '@/lib/types';
import { useLive } from '@/lib/use-live';
import { ridePoints, useRouteLine } from '@/lib/use-route-line';
import { PassengerSearch } from '@/screens/passenger-search';
import { RideSummary } from '@/screens/ride-summary';

const HINT: Record<string, string> = {
  requested: 'Estamos avisando os motoristas próximos. Isso pode levar alguns instantes.',
  accepted: 'Seu motorista está indo até o ponto de embarque.',
  arrived: 'Seu motorista está esperando no ponto de embarque.',
  in_progress: 'Você está a caminho do destino. Boa viagem.',
};

const STEP: Record<string, number> = { accepted: 1, arrived: 2, in_progress: 3 };

function ActiveRide({ view, onChanged }: { view: RideView; onChanged: () => Promise<void> }) {
  const { ride, counterpart } = view;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searching = ride.status === 'requested';

  async function cancel() {
    setError(null);
    setBusy(true);
    try {
      await cancelRide(ride.id);
    } catch (e) {
      setError(describeError(e));
    }
    await onChanged();
    setBusy(false);
  }

  function confirmCancel() {
    Alert.alert('Cancelar corrida?', 'Esta ação não pode ser desfeita.', [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar corrida', style: 'destructive', onPress: cancel },
    ]);
  }

  return (
    <>
      <View style={styles.titleBlock}>
        <ThemedText type="heading">{statusLabel(ride.status, 'passageiro')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {HINT[ride.status]}
        </ThemedText>
      </View>

      {searching ? <SearchingBar /> : <StepBar total={3} current={STEP[ride.status] ?? 0} />}

      {counterpart ? (
        <>
          <PersonRow role="Seu motorista" person={counterpart} />
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
      {ride.status !== 'in_progress' ? (
        <Button label="Cancelar corrida" variant="danger" onPress={confirmCancel} busy={busy} />
      ) : null}
    </>
  );
}

function QuoteSheet({
  quote,
  onRequested,
  onExpired,
}: {
  quote: Quote;
  onRequested: () => Promise<void>;
  onExpired: () => void;
}) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setError(null);
    setBusy(true);
    try {
      await requestRide(quote.id);
      await onRequested();
    } catch (e) {
      const code = (e as { message?: string }).message;
      setError(describeError(e));
      await onRequested();
      setBusy(false);
      // Estimativa vencida ou já usada: é preciso calcular de novo.
      if (code === 'quote_expired' || code === 'quote_already_used') onExpired();
    }
  }

  return (
    <>
      <ThemedText type="heading">Escolha sua corrida</ThemedText>

      <View style={[styles.option, { borderColor: theme.text, backgroundColor: theme.backgroundElement }]}>
        <View style={styles.optionIcon}>
          <Icon name="car-sport" size={26} color={Brand.green} />
        </View>
        <View style={styles.optionText}>
          <ThemedText type="bold">RUMO</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDuration(quote.duration_s)} de viagem · {formatDistance(quote.distance_m)}
          </ThemedText>
        </View>
        <ThemedText type="heading">{formatPrice(quote.price_cents)}</ThemedText>
      </View>

      <RouteSummary origin={quote.origin_address} destination={quote.destination_address} />

      <ThemedText type="small" themeColor="textSecondary">
        Confira se os endereços são os que você quis dizer. Preço fechado, válido por 10 minutos.
      </ThemedText>

      <ErrorText>{error}</ErrorText>
      <Button label="Confirmar RUMO" onPress={confirm} busy={busy} />
    </>
  );
}

export function PassengerHome({ profile }: { profile: Profile }) {
  const theme = useTheme();
  const userId = profile.id;

  const rideFetcher = useCallback(() => fetchLatestRide(userId, 'passageiro'), [userId]);
  const recentsFetcher = useCallback(() => fetchRecentDestinations(userId), [userId]);
  const live = useLive(rideFetcher);
  const recents = useLive(recentsFetcher, 60000);
  const location = useMyLocation();

  const [searching, setSearching] = useState<{ destination: string } | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Resumo já visto: guardado só em memória, para não reaparecer nesta sessão.
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  const view = live.data ?? null;
  const active = view && isActive(view.ride) ? view : null;
  const summary = view && !active && endedRecently(view.ride) && view.ride.id !== dismissedId ? view : null;
  const shownQuote = active || summary ? null : quote;

  const points = ridePoints(active?.ride ?? summary?.ride ?? shownQuote ?? null);
  const line = useRouteLine(points.origin, points.destination);

  if (searching && !active) {
    return (
      <PassengerSearch
        me={location.coords}
        recents={recents.data ?? []}
        initialDestination={searching.destination}
        onBack={() => setSearching(null)}
        onQuote={(next) => {
          setQuote(next);
          setSearching(null);
        }}
      />
    );
  }

  const top = shownQuote ? (
    <FloatingButton icon="arrow-back" label="Voltar" onPress={() => setQuote(null)} />
  ) : (
    <FloatingButton icon="person" label="Abrir menu da conta" onPress={() => setMenuOpen(true)} />
  );

  return (
    <>
      <MapScreen
        origin={points.origin}
        destination={points.destination}
        line={line}
        me={location.coords}
        showsUser={location.status === 'granted'}
        top={top}>
        {live.loading ? (
          <Loading label="Carregando suas corridas" />
        ) : active ? (
          <>
            <ErrorText>{live.error}</ErrorText>
            <ActiveRide view={active} onChanged={live.refresh} />
          </>
        ) : summary ? (
          <RideSummary
            view={summary}
            role="passageiro"
            userId={userId}
            doneLabel="Concluir"
            onDone={() => {
              setDismissedId(summary.ride.id);
              setQuote(null);
            }}
          />
        ) : shownQuote ? (
          <QuoteSheet
            quote={shownQuote}
            onRequested={async () => {
              await live.refresh();
              recents.refresh();
            }}
            onExpired={() => setQuote(null)}
          />
        ) : (
          <>
            <ThemedText type="heading">Para onde vamos, {firstName(profile.full_name)}?</ThemedText>
            <ErrorText>{live.error}</ErrorText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Informar destino"
              onPress={() => setSearching({ destination: '' })}
              style={({ pressed }) => [
                styles.search,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
              ]}>
              <Icon name="search" size={22} />
              <ThemedText type="bold">Para onde?</ThemedText>
            </Pressable>

            {(recents.data ?? []).map((address) => (
              <Row
                key={address}
                icon="time-outline"
                title={address.split(' - ')[0] ?? address}
                subtitle={address}
                onPress={() => setSearching({ destination: address })}
              />
            ))}

            {location.status === 'denied' ? (
              <ThemedText type="small" themeColor="textSecondary">
                Localização desativada. Você pode digitar o endereço de embarque ao pedir a corrida.
              </ThemedText>
            ) : null}
          </>
        )}
      </MapScreen>
      <AccountMenu profile={profile} visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },
  titleBlock: { gap: Spacing.one },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
    minHeight: 60,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 2,
    borderRadius: Radius.large,
    padding: Spacing.three,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Brand.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, gap: Spacing.half },
});
