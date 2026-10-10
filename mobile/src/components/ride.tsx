import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar, Chip, Icon } from '@/components/ui';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDistance, formatDuration, formatPrice } from '@/lib/format';
import type { Counterpart } from '@/lib/types';

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
  const theme = useTheme();

  return (
    <View style={[styles.empty, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="bold">{title}</ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.emptyHint}>
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

/** A outra pessoa da corrida: iniciais, nome, veículo e botão de ligar. */
export function PersonRow({ role, person }: { role: string; person: Counterpart }) {
  const theme = useTheme();

  return (
    <View style={styles.person}>
      <Avatar name={person.full_name} />
      <View style={styles.personText}>
        <ThemedText type="small" themeColor="textSecondary">
          {role}
        </ThemedText>
        <ThemedText type="bold" numberOfLines={1}>
          {person.full_name}
        </ThemedText>
        {person.vehicle_model || person.vehicle_plate ? (
          <View style={styles.vehicle}>
            {person.vehicle_model ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {person.vehicle_model}
              </ThemedText>
            ) : null}
            {person.vehicle_plate ? <Chip>{person.vehicle_plate}</Chip> : null}
          </View>
        ) : null}
      </View>
      {person.phone ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Ligar para ${person.full_name}`}
          hitSlop={8}
          onPress={() => Linking.openURL(`tel:${person.phone!.replace(/[^\d+]/g, '')}`)}
          style={({ pressed }) => [
            styles.call,
            { backgroundColor: theme.backgroundElement },
            pressed && styles.pressed,
          ]}>
          <Icon name="call" size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Distância, tempo e valor em uma linha. */
export function TripNumbers({
  distanceM,
  durationS,
  priceCents,
}: {
  distanceM: number;
  durationS: number;
  priceCents: number;
}) {
  return (
    <View style={styles.numbers}>
      <View>
        <ThemedText type="small" themeColor="textSecondary">
          Distância
        </ThemedText>
        <ThemedText type="bold">{formatDistance(distanceM)}</ThemedText>
      </View>
      <View>
        <ThemedText type="small" themeColor="textSecondary">
          Tempo
        </ThemedText>
        <ThemedText type="bold">{formatDuration(durationS)}</ThemedText>
      </View>
      <View style={styles.price}>
        <ThemedText type="small" themeColor="textSecondary">
          Valor estimado
        </ThemedText>
        <ThemedText type="heading">{formatPrice(priceCents)}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },
  centered: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  empty: { borderRadius: 16, padding: Spacing.four, gap: Spacing.one, alignItems: 'center' },
  emptyHint: { textAlign: 'center' },
  person: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  personText: { flex: 1, gap: Spacing.half },
  vehicle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.half },
  call: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  numbers: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.four },
  price: { marginLeft: 'auto', alignItems: 'flex-end' },
});
