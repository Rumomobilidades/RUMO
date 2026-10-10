import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ErrorText } from '@/components/form';
import { Empty, Loading } from '@/components/ride';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Chip, Icon, RouteSummary } from '@/components/ui';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { formatDateTime, formatDistance, formatDuration, formatPrice } from '@/lib/format';
import { whoCancelled } from '@/lib/ride-labels';
import { fetchHistory } from '@/lib/rides';
import type { Profile, Ride } from '@/lib/types';
import { useLive } from '@/lib/use-live';

function HistoryCard({ ride, userId }: { ride: Ride; userId: string }) {
  const theme = useTheme();
  const completed = ride.status === 'completed';
  const cancelled = whoCancelled(ride, userId);

  return (
    <View style={[styles.card, { borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDateTime(ride.completed_at ?? ride.cancelled_at ?? ride.requested_at)}
          </ThemedText>
          {completed ? <Chip tone="green">Concluída</Chip> : <Chip>Cancelada</Chip>}
        </View>
        <ThemedText type="heading" style={completed ? undefined : { color: theme.textSecondary }}>
          {formatPrice(ride.estimated_price_cents)}
        </ThemedText>
      </View>
      <RouteSummary origin={ride.origin_address} destination={ride.destination_address} />
      <ThemedText type="small" themeColor="textSecondary">
        {formatDistance(ride.distance_m)} · {formatDuration(ride.duration_s)}
        {cancelled ? ` · ${cancelled}` : ''}
      </ThemedText>
    </View>
  );
}

function History({ profile }: { profile: Profile }) {
  const router = useRouter();
  const fetcher = useCallback(() => fetchHistory(profile.id, profile.role), [profile.id, profile.role]);
  const live = useLive(fetcher, 30000);
  const rides = live.data ?? [];
  const done = rides.filter((ride) => ride.status === 'completed');
  const total = done.reduce((sum, ride) => sum + ride.estimated_price_cents, 0);

  return (
    <Screen onRefresh={live.refresh} refreshing={live.refreshing}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} />
        </Pressable>
        <ThemedText type="heading">Histórico</ThemedText>
      </View>

      {rides.length > 0 ? (
        <View style={styles.stats}>
          <View style={styles.stat}>
            <ThemedText type="subtitle">{done.length}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {done.length === 1 ? 'corrida concluída' : 'corridas concluídas'}
            </ThemedText>
          </View>
          <View style={styles.stat}>
            <ThemedText type="subtitle" style={{ color: Brand.green }}>
              {formatPrice(total)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {profile.role === 'motorista' ? 'em corridas atendidas' : 'em corridas feitas'}
            </ThemedText>
          </View>
        </View>
      ) : null}

      <ErrorText>{live.error}</ErrorText>

      {live.loading ? (
        <Loading label="Carregando histórico" />
      ) : rides.length === 0 && !live.error ? (
        <Empty
          title="Nenhuma corrida encerrada ainda"
          hint="Corridas concluídas e canceladas aparecem aqui."
        />
      ) : (
        rides.map((ride) => <HistoryCard key={ride.id} ride={ride} userId={profile.id} />)
      )}
    </Screen>
  );
}

export default function HistoricoScreen() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <Screen>
        <Loading label="Carregando" />
      </Screen>
    );
  }

  return <History profile={profile} />;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  stats: { flexDirection: 'row', gap: Spacing.three },
  stat: { flex: 1, gap: Spacing.half },
  card: { borderWidth: 1, borderRadius: Radius.large, padding: Spacing.three, gap: Spacing.three },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardHeaderText: { gap: Spacing.two },
});
