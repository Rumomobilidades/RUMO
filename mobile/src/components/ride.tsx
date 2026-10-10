import type { ReactNode } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { formatDistance, formatDuration, formatPrice } from '@/lib/format';
import type { Counterpart, RideStatus } from '@/lib/types';

export function Card({ children }: { children: ReactNode }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {children}
    </ThemedView>
  );
}

/** Estado de carregamento de uma seção inteira. */
export function Loading({ label }: { label: string }) {
  return (
    <View style={styles.centered} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={Brand.green} />
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <Card>
      <ThemedText type="smallBold">{title}</ThemedText>
      {hint ? <ThemedText themeColor="textSecondary">{hint}</ThemedText> : null}
    </Card>
  );
}

const STATUS_TONE: Record<RideStatus, string> = {
  requested: '#B54708',
  accepted: Brand.green,
  arrived: Brand.green,
  in_progress: Brand.green,
  completed: '#475467',
  cancelled: Brand.danger,
};

export function StatusBadge({ status, label }: { status: RideStatus; label: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: STATUS_TONE[status] }]}>
      <ThemedText type="smallBold" style={styles.badgeLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

type TripProps = {
  origin: string;
  destination: string;
  distanceM: number;
  durationS: number;
  priceCents: number;
};

/** Origem, destino e os três números da corrida. */
export function Trip({ origin, destination, distanceM, durationS, priceCents }: TripProps) {
  return (
    <View style={styles.trip}>
      <View style={styles.place}>
        <ThemedText type="small" themeColor="textSecondary">
          Origem
        </ThemedText>
        <ThemedText>{origin}</ThemedText>
      </View>
      <View style={styles.place}>
        <ThemedText type="small" themeColor="textSecondary">
          Destino
        </ThemedText>
        <ThemedText>{destination}</ThemedText>
      </View>
      <View style={styles.numbers}>
        <ThemedText type="smallBold">{formatDistance(distanceM)}</ThemedText>
        <ThemedText type="smallBold">{formatDuration(durationS)}</ThemedText>
        <ThemedText type="smallBold">{formatPrice(priceCents)}</ThemedText>
      </View>
    </View>
  );
}

/** Dados da outra parte da corrida, com toque para ligar. */
export function Person({ title, person }: { title: string; person: Counterpart }) {
  const vehicle = [person.vehicle_model, person.vehicle_plate].filter(Boolean).join(' · ');

  return (
    <View style={styles.place}>
      <ThemedText type="small" themeColor="textSecondary">
        {title}
      </ThemedText>
      <ThemedText type="smallBold">{person.full_name}</ThemedText>
      {vehicle ? <ThemedText>{vehicle}</ThemedText> : null}
      {person.phone ? (
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={() => Linking.openURL(`tel:${person.phone!.replace(/[^\d+]/g, '')}`)}>
          <ThemedText type="linkPrimary">Ligar: {person.phone}</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: Spacing.four, gap: Spacing.three },
  centered: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  badgeLabel: { color: '#ffffff' },
  trip: { gap: Spacing.three },
  place: { gap: Spacing.half },
  numbers: { flexDirection: 'row', justifyContent: 'space-between' },
});
