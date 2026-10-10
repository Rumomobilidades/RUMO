import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { Button, ErrorText, Field } from '@/components/form';
import { Card, Loading, Person, StatusBadge, Trip } from '@/components/ride';
import { ThemedText } from '@/components/themed-text';
import { describeError } from '@/lib/errors';
import { endedRecently, isActive, statusLabel } from '@/lib/ride-labels';
import { cancelRide, estimateRide, fetchLatestRide, requestRide } from '@/lib/rides';
import type { Quote, RideView } from '@/lib/types';
import { useLive } from '@/lib/use-live';
import { RideSummary } from '@/screens/ride-summary';

const WAITING_HINT: Record<string, string> = {
  requested: 'Assim que um motorista aceitar, os dados dele aparecem aqui.',
  accepted: 'Seu motorista está indo até o ponto de embarque.',
  arrived: 'Seu motorista está no local de embarque.',
  in_progress: 'Boa viagem.',
};

function ActiveRide({ view, onChanged }: { view: RideView; onChanged: () => Promise<void> }) {
  const { ride, counterpart } = view;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancellable = ride.status !== 'in_progress';

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
    <Card>
      <StatusBadge status={ride.status} label={statusLabel(ride.status, 'passageiro')} />
      <ThemedText themeColor="textSecondary">{WAITING_HINT[ride.status]}</ThemedText>
      {counterpart ? <Person title="Motorista" person={counterpart} /> : null}
      <Trip
        origin={ride.origin_address}
        destination={ride.destination_address}
        distanceM={ride.distance_m}
        durationS={ride.duration_s}
        priceCents={ride.estimated_price_cents}
      />
      <ErrorText>{error}</ErrorText>
      {cancellable ? (
        <Button label="Cancelar corrida" variant="danger" onPress={confirmCancel} busy={busy} />
      ) : null}
    </Card>
  );
}

function RequestForm({ onRequested }: { onRequested: () => Promise<void> }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function estimate() {
    setError(null);
    if (origin.trim().length < 5) return setError('Informe o endereço de origem com rua e cidade.');
    if (destination.trim().length < 5) {
      return setError('Informe o endereço de destino com rua e cidade.');
    }

    setBusy(true);
    try {
      setQuote(await estimateRide(origin.trim(), destination.trim()));
    } catch (e) {
      setError(describeError(e));
    }
    setBusy(false);
  }

  async function request() {
    if (!quote) return;
    setError(null);
    setBusy(true);
    try {
      await requestRide(quote.id);
      await onRequested();
    } catch (e) {
      const code = (e as { message?: string }).message;
      // Estimativa vencida ou já usada: volta para calcular de novo.
      if (code === 'quote_expired' || code === 'quote_already_used') setQuote(null);
      setError(describeError(e));
      await onRequested();
    }
    setBusy(false);
  }

  if (quote) {
    return (
      <Card>
        <ThemedText type="smallBold">Estimativa da corrida</ThemedText>
        <Trip
          origin={quote.origin_address}
          destination={quote.destination_address}
          distanceM={quote.distance_m}
          durationS={quote.duration_s}
          priceCents={quote.price_cents}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Confira se os endereços encontrados são os que você quis dizer. A estimativa vale por 10
          minutos.
        </ThemedText>
        <ErrorText>{error}</ErrorText>
        <Button label="Pedir corrida" onPress={request} busy={busy} />
        <Button
          label="Alterar endereços"
          variant="secondary"
          disabled={busy}
          onPress={() => {
            setQuote(null);
            setError(null);
          }}
        />
      </Card>
    );
  }

  return (
    <Card>
      <ThemedText type="smallBold">Para onde vamos?</ThemedText>
      <Field
        label="Origem"
        value={origin}
        onChangeText={setOrigin}
        placeholder="Rua, número e cidade"
        autoCapitalize="words"
        returnKeyType="next"
      />
      <Field
        label="Destino"
        value={destination}
        onChangeText={setDestination}
        placeholder="Rua, número e cidade"
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={estimate}
      />
      <ErrorText>{error}</ErrorText>
      <Button label="Calcular estimativa" onPress={estimate} busy={busy} />
    </Card>
  );
}

export function usePassengerHome(userId: string) {
  const fetcher = useCallback(() => fetchLatestRide(userId, 'passageiro'), [userId]);
  return useLive(fetcher);
}

export function PassengerHome({
  userId,
  live,
}: {
  userId: string;
  live: ReturnType<typeof usePassengerHome>;
}) {
  // Resumo já visto: guardado só em memória, para não reaparecer nesta sessão.
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const view = live.data;

  if (live.loading) return <Loading label="Carregando suas corridas" />;

  if (view && isActive(view.ride)) {
    return (
      <>
        <ErrorText>{live.error}</ErrorText>
        <ActiveRide view={view} onChanged={live.refresh} />
      </>
    );
  }

  if (view && endedRecently(view.ride) && view.ride.id !== dismissedId) {
    return (
      <RideSummary
        view={view}
        role="passageiro"
        userId={userId}
        doneLabel="Pedir outra corrida"
        onDone={() => setDismissedId(view.ride.id)}
      />
    );
  }

  return (
    <>
      <ErrorText>{live.error}</ErrorText>
      <RequestForm onRequested={live.refresh} />
    </>
  );
}
