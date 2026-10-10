import { Button } from '@/components/form';
import { Card, Person, StatusBadge, Trip } from '@/components/ride';
import { ThemedText } from '@/components/themed-text';
import { formatDateTime } from '@/lib/format';
import { statusLabel, whoCancelled } from '@/lib/ride-labels';
import type { RideView, Role } from '@/lib/types';

type Props = { view: RideView; role: Role; userId: string; doneLabel: string; onDone: () => void };

/** Resumo de uma corrida que acabou de terminar (concluída ou cancelada). */
export function RideSummary({ view, role, userId, doneLabel, onDone }: Props) {
  const { ride, counterpart } = view;
  const endedAt = ride.completed_at ?? ride.cancelled_at;
  const cancelled = whoCancelled(ride, userId);

  return (
    <Card>
      <StatusBadge status={ride.status} label={statusLabel(ride.status, role)} />
      {endedAt ? (
        <ThemedText themeColor="textSecondary">{formatDateTime(endedAt)}</ThemedText>
      ) : null}
      {cancelled ? <ThemedText>{cancelled}</ThemedText> : null}
      {ride.cancel_reason ? (
        <ThemedText themeColor="textSecondary">Motivo: {ride.cancel_reason}</ThemedText>
      ) : null}
      <Trip
        origin={ride.origin_address}
        destination={ride.destination_address}
        distanceM={ride.distance_m}
        durationS={ride.duration_s}
        priceCents={ride.estimated_price_cents}
      />
      {counterpart ? (
        <Person title={role === 'motorista' ? 'Passageiro' : 'Motorista'} person={counterpart} />
      ) : null}
      {ride.status === 'completed' ? (
        <ThemedText type="small" themeColor="textSecondary">
          Valor estimado. O pagamento ainda não é feito pelo app.
        </ThemedText>
      ) : null}
      <Button label={doneLabel} onPress={onDone} />
    </Card>
  );
}
