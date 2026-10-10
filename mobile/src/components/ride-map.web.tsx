import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LatLng } from '@/lib/types';

type Props = {
  origin?: LatLng | null;
  destination?: LatLng | null;
  line?: LatLng[];
  me?: LatLng | null;
  showsUser?: boolean;
  bottomInset?: number;
  topInset?: number;
  focusToken?: number;
};

/**
 * Versão para navegador, só para conferir o layout no computador: a
 * biblioteca de mapas não roda na web. No celular entra `ride-map.tsx`.
 */
export function RideMap({ origin, destination, bottomInset = 0 }: Props) {
  const theme = useTheme();
  const hasTrip = Boolean(origin && destination);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.backgroundElement }]}>
      <View style={[styles.center, { bottom: bottomInset }]}>
        {hasTrip ? (
          <View style={styles.trip}>
            <View style={[styles.dot, { backgroundColor: Brand.green }]} />
            <View style={[styles.line, { backgroundColor: theme.text }]} />
            <View style={[styles.square, { backgroundColor: theme.text }]} />
          </View>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary">
          O mapa aparece no app do celular
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', gap: 16 },
  trip: { alignItems: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8 },
  line: { width: 3, height: 90, marginVertical: 6, opacity: 0.8 },
  square: { width: 16, height: 16, borderRadius: 3 },
});
