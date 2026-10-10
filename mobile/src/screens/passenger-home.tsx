import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { AccountMenu } from '@/components/account-menu';
import { Button, ErrorText } from '@/components/form';
import { MapScreen } from '@/components/map-screen';
import { Loading, PersonRow, TripNumbers } from '@/components/ride';
import { ThemedText } from '@/components/themed-text';
import { Divider, FloatingButton, Icon, RouteSummary, Row, SearchingBar, StepBar } from '@/components/ui';
import { Brand, Elevation, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { describeError } from '@/lib/errors';
import { firstName, formatDistance, formatDuration, formatPrice } from '@/lib/format';
import { useMyLocation } from '@/lib/location';
import { useRideAlerts } from '@/lib/notifications';
import { endedRecently, isActive, statusLabel } from '@/lib/ride-labels';
import { cancelRide, fetchLatestRide, fetchRecentDestinations, requestRide } from '@/lib/rides';
import type { PlaceRef, Profile, QuoteOption, RideView } from '@/lib/types';
import { useLive } from '@/lib/use-live';
import { ridePoints, useRouteLine } from '@/lib/use-route-line';
import { PassengerSearch, type SearchResult } from '@/screens/passenger-search';
import { RideSummary } from '@/screens/ride-summary';

const HINT: Record<string, string> = {
  requested: 'Estamos avisando os motoristas próximos. Isso pode levar alguns instantes.',
  accepted: 'Seu motorista está indo até o ponto de embarque.',
  arrived: 'Seu motorista está esperando no ponto de embarque.',
  in_progress: 'Você está a caminho do destino. Boa viagem.',
};

const STEP: Record<string, number> = { accepted: 1, arrived: 2, in_progress: 3 };

/** Minutos desde `iso`, atualizados sozinhos. */
function useMinutesSince(iso: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
}

/** A partir daqui a busca é considerada demorada e o app diz isso com clareza. */
const SLOW_SEARCH_MINUTES = 3;

function ActiveRide({ view, onChanged }: { view: RideView; onChanged: () => Promise<void> }) {
  const { ride, counterpart } = view;
  const waited = useMinutesSince(ride.requested_at);
  const slow = ride.status === 'requested' && waited >= SLOW_SEARCH_MINUTES;
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
        <ThemedText type="heading">
          {slow ? 'Ainda sem motorista' : statusLabel(ride.status, 'passageiro')}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {slow
            ? `Nenhum motorista aceitou em ${waited} min. Você pode continuar aguardando ou cancelar e tentar de novo.`
            : HINT[ride.status]}
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
  quotes,
  onRequested,
  onExpired,
}: {
  quotes: QuoteOption[];
  onRequested: () => Promise<void>;
  onExpired: () => void;
}) {
  const theme = useTheme();
  const [selectedId, setSelectedId] = useState(quotes[0]?.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = quotes.find((quote) => quote.id === selectedId) ?? quotes[0];

  async function confirm() {
    if (!selected) return;
    setError(null);
    setBusy(true);
    try {
      await requestRide(selected.id);
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

  if (!selected) {
    return <ErrorText>Nenhuma categoria de viagem disponível no momento.</ErrorText>;
  }

  return (
    <>
      <View style={styles.titleBlock}>
        <ThemedText type="heading">Escolha uma viagem</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDistance(selected.distance_m)} · cerca de {formatDuration(selected.duration_s)} de viagem
        </ThemedText>
      </View>

      <View accessibilityRole="radiogroup" style={styles.options}>
        {quotes.map((quote) => {
          const isSelected = quote.id === selected.id;
          return (
            <Pressable
              key={quote.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${quote.category.name}, ${formatPrice(quote.price_cents)}`}
              disabled={busy}
              onPress={() => setSelectedId(quote.id)}
              style={[
                styles.option,
                {
                  borderColor: isSelected ? theme.text : 'transparent',
                  backgroundColor: isSelected ? theme.backgroundElement : 'transparent',
                },
              ]}>
              <View style={styles.optionIcon}>
                <Icon name="car-sport" size={26} color={Brand.green} />
              </View>
              <View style={styles.optionText}>
                <View style={styles.optionName}>
                  <ThemedText type="bold">{quote.category.name}</ThemedText>
                  <Icon name="person" size={12} color={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary">
                    {quote.category.seats}
                  </ThemedText>
                </View>
                {quote.category.description ? (
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {quote.category.description}
                  </ThemedText>
                ) : null}
              </View>
              <ThemedText type="heading">{formatPrice(quote.price_cents)}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Preço calculado pela rota e válido por 10 minutos. O pagamento é combinado direto com o
        motorista.
      </ThemedText>

      <ErrorText>{error}</ErrorText>
      <Button label={`Confirmar ${selected.category.name}`} onPress={confirm} busy={busy} />
    </>
  );
}

/** Origem e destino resumidos sobre o mapa; tocar volta para editar os endereços. */
function RoutePill({ origin, destination, onPress }: { origin: string; destination: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Editar endereços"
      onPress={onPress}
      style={({ pressed }) => [
        styles.routePill,
        Elevation,
        { backgroundColor: theme.background },
        pressed && styles.pressed,
      ]}>
      <View style={styles.routePillText}>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {origin}
        </ThemedText>
        <ThemedText type="smallBold" numberOfLines={1}>
          {destination}
        </ThemedText>
      </View>
      <Icon name="pencil" size={16} color={theme.textSecondary} />
    </Pressable>
  );
}

const shortLabel = (label: string) => label.split(' - ')[0] ?? label;

export function PassengerHome({ profile }: { profile: Profile }) {
  const theme = useTheme();
  const userId = profile.id;

  const rideFetcher = useCallback(() => fetchLatestRide(userId, 'passageiro'), [userId]);
  const recentsFetcher = useCallback(() => fetchRecentDestinations(userId), [userId]);
  const live = useLive(rideFetcher);
  const recents = useLive(recentsFetcher, 60000);
  const location = useMyLocation();
  useRideAlerts(live.data, 'passageiro');

  /** Tela de busca aberta, com os pontos já escolhidos (ao editar). */
  const [searching, setSearching] = useState<{ origin: PlaceRef | null; destination: PlaceRef | null } | null>(
    null,
  );
  /** Viagem planejada e cotada, ainda não pedida. */
  const [plan, setPlan] = useState<SearchResult | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [focusToken, setFocusToken] = useState(0);
  // Resumo já visto: guardado só em memória, para não reaparecer nesta sessão.
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  const view = live.data ?? null;
  const active = view && isActive(view.ride) ? view : null;
  const summary = view && !active && endedRecently(view.ride) && view.ride.id !== dismissedId ? view : null;
  const shownPlan = active || summary ? null : plan;
  const firstQuote = shownPlan?.quotes[0] ?? null;

  const points = ridePoints(active?.ride ?? summary?.ride ?? firstQuote ?? null);
  const line = useRouteLine(points.origin, points.destination);
  const recentPlaces = recents.data ?? [];

  if (searching && !active) {
    return (
      <PassengerSearch
        me={location.coords}
        recents={recentPlaces}
        initial={searching}
        onBack={() => setSearching(null)}
        onResult={(result) => {
          setPlan(result);
          setSearching(null);
        }}
      />
    );
  }

  const top = shownPlan ? (
    <>
      <FloatingButton icon="arrow-back" label="Voltar" onPress={() => setPlan(null)} />
      <RoutePill
        origin={firstQuote?.origin_address ?? ''}
        destination={firstQuote?.destination_address ?? ''}
        onPress={() => setSearching({ origin: shownPlan.origin, destination: shownPlan.destination })}
      />
    </>
  ) : (
    <FloatingButton icon="person" label="Abrir menu da conta" onPress={() => setMenuOpen(true)} />
  );

  const idle = !live.loading && !active && !summary && !shownPlan;

  return (
    <>
      <MapScreen
        origin={points.origin}
        destination={points.destination}
        line={line}
        me={location.coords}
        showsUser={location.status === 'granted'}
        focusToken={focusToken}
        top={top}
        floating={
          location.coords && idle ? (
            <FloatingButton
              icon="locate"
              label="Centralizar na minha localização"
              onPress={() => setFocusToken((value) => value + 1)}
            />
          ) : null
        }>
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
              setPlan(null);
            }}
          />
        ) : shownPlan ? (
          <QuoteSheet
            key={shownPlan.quotes[0]?.id}
            quotes={shownPlan.quotes}
            onRequested={async () => {
              await live.refresh();
              recents.refresh();
            }}
            onExpired={() => setPlan(null)}
          />
        ) : (
          <>
            <ErrorText>{live.error}</ErrorText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Informar destino"
              onPress={() => setSearching({ origin: null, destination: null })}
              style={({ pressed }) => [
                styles.search,
                { backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
              ]}>
              <Icon name="search" size={22} />
              <ThemedText type="heading">Para onde?</ThemedText>
            </Pressable>

            {recentPlaces.length > 0 ? (
              <View>
                {recentPlaces.map((place) => (
                  <Row
                    key={place.label}
                    icon="time-outline"
                    title={shortLabel(place.label)}
                    subtitle={place.label}
                    onPress={() => setSearching({ origin: null, destination: place })}
                  />
                ))}
              </View>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                Olá, {firstName(profile.full_name)}. Seus destinos recentes vão aparecer aqui.
              </ThemedText>
            )}

            {location.status === 'denied' || location.status === 'unavailable' ? (
              <Row
                icon="navigate-outline"
                title="Localização desativada"
                subtitle="Ative para embarcar onde você está. Sem ela, escolha o endereço de embarque na busca."
                onPress={() => Linking.openSettings()}
              />
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
    minHeight: 64,
  },
  options: { gap: Spacing.one },
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
  optionName: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    minHeight: 48,
    paddingVertical: 6,
  },
  routePillText: { flex: 1 },
});
