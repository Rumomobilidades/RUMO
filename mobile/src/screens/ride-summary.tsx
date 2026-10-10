import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/form';
import { PersonRow, TripNumbers } from '@/components/ride';
import { ThemedText } from '@/components/themed-text';
import { Divider, Icon, RouteSummary } from '@/components/ui';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { whoCancelled } from '@/lib/ride-labels';
import type { Ride, RideView, Role } from '@/lib/types';

const pad = (n: number) => String(n).padStart(2, '0');
const hour = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function steps(ride: Ride) {
  const all: [string, string | null][] = [
    ['Corrida solicitada', ride.requested_at],
    ['Motorista aceitou', ride.accepted_at],
    ['Motorista chegou', ride.arrived_at],
    ['Viagem iniciada', ride.started_at],
    ['Viagem finalizada', ride.completed_at],
    ['Corrida cancelada', ride.cancelled_at],
  ];
  return all.filter((step): step is [string, string] => Boolean(step[1]));
}

/** Linha do tempo com o horário real de cada etapa gravada no banco. */
export function Timeline({ ride }: { ride: Ride }) {
  const theme = useTheme();
  const items = steps(ride);

  return (
    <View>
      {items.map(([label, at], index) => {
        const last = index === items.length - 1;
        const cancelled = last && ride.status === 'cancelled';
        return (
          <View key={label} style={styles.step}>
            <View style={styles.stepRail}>
              <View
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: cancelled ? Brand.danger : last ? Brand.green : theme.backgroundSelected,
                  },
                ]}
              />
              {last ? null : <View style={[styles.stepLine, { backgroundColor: theme.backgroundSelected }]} />}
            </View>
            <ThemedText type={last ? 'bold' : 'default'} style={styles.stepLabel}>
              {label}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {hour(at)}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

type Props = { view: RideView; role: Role; userId: string; doneLabel: string; onDone: () => void };

/** Resumo de uma corrida que acabou de terminar (concluída ou cancelada). */
export function RideSummary({ view, role, userId, doneLabel, onDone }: Props) {
  const { ride, counterpart } = view;
  const completed = ride.status === 'completed';
  const cancelled = whoCancelled(ride, userId);

  return (
    <>
      <View style={styles.header}>
        <Icon
          name={completed ? 'checkmark-circle' : 'close-circle'}
          size={40}
          color={completed ? Brand.green : Brand.danger}
        />
        <View style={styles.headerText}>
          <ThemedText type="heading">
            {completed ? (role === 'motorista' ? 'Viagem finalizada' : 'Você chegou') : 'Corrida cancelada'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {cancelled ?? 'Obrigado por viajar com o RUMO.'}
          </ThemedText>
        </View>
      </View>

      <TripNumbers
        distanceM={ride.distance_m}
        durationS={ride.duration_s}
        priceCents={ride.estimated_price_cents}
      />
      {completed ? (
        <ThemedText type="small" themeColor="textSecondary">
          O pagamento ainda não é feito pelo app: combine direto com{' '}
          {role === 'motorista' ? 'o passageiro' : 'o motorista'}.
        </ThemedText>
      ) : null}

      <Divider />
      <RouteSummary origin={ride.origin_address} destination={ride.destination_address} />
      <Divider />
      <Timeline ride={ride} />

      {counterpart ? (
        <>
          <Divider />
          <PersonRow role={role === 'motorista' ? 'Passageiro' : 'Motorista'} person={counterpart} />
        </>
      ) : null}

      <Button label={doneLabel} onPress={onDone} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  headerText: { flex: 1, gap: Spacing.half },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three, minHeight: 34 },
  stepRail: { alignItems: 'center', width: 12, alignSelf: 'stretch', paddingTop: 5 },
  stepDot: { width: 12, height: 12, borderRadius: 6 },
  stepLine: { width: 2, flex: 1, marginVertical: 2 },
  stepLabel: { flex: 1 },
});
