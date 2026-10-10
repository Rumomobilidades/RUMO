import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';

/** Marca do RUMO: o mesmo bloco lima com "R" da landing. */
export function BrandMark() {
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="RUMO">
      <View style={styles.block}>
        <ThemedText style={styles.letter}>R</ThemedText>
      </View>
      <ThemedText style={styles.name}>RUMO</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.three },
  block: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Brand.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { color: Brand.ink, fontSize: 22, lineHeight: 26, fontWeight: 800 },
  name: { fontSize: 22, lineHeight: 26, fontWeight: 800, letterSpacing: -0.6 },
});
