import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ErrorText } from '@/components/form';
import { Card, Empty, Loading, StatusBadge, Trip } from '@/components/ride';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { formatDateTime } from '@/lib/format';
import { statusLabel, whoCancelled } from '@/lib/ride-labels';
import { fetchHistory } from '@/lib/rides';
import type { Profile } from '@/lib/types';
import { useLive } from '@/lib/use-live';

function History({ profile }: { profile: Profile }) {
  const router = useRouter();
  const fetcher = useCallback(() => fetchHistory(profile.id, profile.role), [profile.id, profile.role]);
  const live = useLive(fetcher, 30000);
  const rides = live.data ?? [];

  return (
    <Screen onRefresh={live.refresh} refreshing={live.refreshing}>
      <View style={styles.header}>
        <ThemedText type="subtitle">Histórico</ThemedText>
        <ThemedText themeColor="textSecondary">
          {profile.role === 'motorista' ? 'Corridas que você atendeu.' : 'Corridas que você pediu.'}
        </ThemedText>
      </View>

      <ErrorText>{live.error}</ErrorText>

      {live.loading ? (
        <Loading label="Carregando histórico" />
      ) : rides.length === 0 && !live.error ? (
        <Empty
          title="Nenhuma corrida encerrada ainda"
          hint="Corridas concluídas e canceladas aparecem aqui."
        />
      ) : (
        rides.map((ride) => {
          const cancelled = whoCancelled(ride, profile.id);
          return (
            <Card key={ride.id}>
              <StatusBadge status={ride.status} label={statusLabel(ride.status, profile.role)} />
              <ThemedText themeColor="textSecondary">
                {formatDateTime(ride.completed_at ?? ride.cancelled_at ?? ride.requested_at)}
              </ThemedText>
              {cancelled ? <ThemedText type="small">{cancelled}</ThemedText> : null}
              <Trip
                origin={ride.origin_address}
                destination={ride.destination_address}
                distanceM={ride.distance_m}
                durationS={ride.duration_s}
                priceCents={ride.estimated_price_cents}
              />
            </Card>
          );
        })
      )}

      <View style={styles.footer}>
        <Button label="Voltar" variant="secondary" onPress={() => router.back()} />
      </View>
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
  header: { gap: Spacing.one, marginTop: Spacing.three },
  footer: { marginTop: 'auto' },
});
