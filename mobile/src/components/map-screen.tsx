import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RideMap } from '@/components/ride-map';
import { ThemedView } from '@/components/themed-view';
import { Sheet } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import type { LatLng } from '@/lib/types';

type Props = {
  origin?: LatLng | null;
  destination?: LatLng | null;
  line?: LatLng[];
  me?: LatLng | null;
  showsUser?: boolean;
  /** Botões e avisos que flutuam no topo do mapa. */
  top?: ReactNode;
  /** Botões que flutuam logo acima do painel, à direita (ex.: recentralizar). */
  floating?: ReactNode;
  /** Mude o valor para o mapa voltar à posição do aparelho. */
  focusToken?: number;
  /** Conteúdo do painel inferior. */
  children: ReactNode;
};

/** Tela no modelo "mapa inteiro + painel inferior". */
export function MapScreen({
  origin,
  destination,
  line,
  me,
  showsUser,
  top,
  floating,
  focusToken,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const [sheetHeight, setSheetHeight] = useState(280);

  return (
    <ThemedView style={styles.fill}>
      <RideMap
        origin={origin}
        destination={destination}
        line={line}
        me={me}
        showsUser={showsUser}
        bottomInset={sheetHeight}
        topInset={insets.top}
        focusToken={focusToken}
      />
      <View style={[styles.top, { top: insets.top + Spacing.two }]} pointerEvents="box-none">
        {top}
      </View>
      {floating ? (
        <View style={[styles.floating, { bottom: sheetHeight + Spacing.three }]} pointerEvents="box-none">
          {floating}
        </View>
      ) : null}
      <Sheet onHeight={setSheetHeight}>{children}</Sheet>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  floating: { position: 'absolute', right: Spacing.three, gap: Spacing.two },
});
