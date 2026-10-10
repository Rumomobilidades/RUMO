import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, ErrorText } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Icon, Row } from '@/components/ui';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { describeError } from '@/lib/errors';
import { estimateRide } from '@/lib/rides';
import type { LatLng, Quote } from '@/lib/types';

type Props = {
  /** Posição do aparelho; sem ela a origem precisa ser digitada. */
  me: LatLng | null;
  recents: string[];
  initialDestination?: string;
  onBack: () => void;
  onQuote: (quote: Quote) => void;
};

/** Tela "Para onde?": embarque e destino, com atalhos das últimas corridas. */
export function PassengerSearch({ me, recents, initialDestination = '', onBack, onQuote }: Props) {
  const theme = useTheme();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState(initialDestination);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usingGps = Boolean(me) && origin.trim().length === 0;

  async function estimate(destinationText = destination) {
    setError(null);
    const typedOrigin = origin.trim();

    if (!usingGps && typedOrigin.length < 5) {
      return setError('Informe o endereço de embarque com rua e cidade.');
    }
    if (destinationText.trim().length < 5) {
      return setError('Informe o destino com rua e cidade.');
    }

    setBusy(true);
    try {
      const from = usingGps && me ? { lat: me.latitude, lng: me.longitude } : typedOrigin;
      onQuote(await estimateRide(from, destinationText.trim()));
    } catch (e) {
      setError(describeError(e));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={12} onPress={onBack}>
          <Icon name="arrow-back" size={24} />
        </Pressable>
        <ThemedText type="heading">Planeje sua corrida</ThemedText>
      </View>

      <View style={[styles.box, { backgroundColor: theme.backgroundElement }]}>
        <View style={styles.rail}>
          <View style={[styles.dot, { backgroundColor: Brand.green }]} />
          <View style={[styles.line, { backgroundColor: theme.backgroundSelected }]} />
          <View style={[styles.square, { backgroundColor: theme.text }]} />
        </View>
        <View style={styles.inputs}>
          <TextInput
            accessibilityLabel="Local de embarque"
            value={origin}
            onChangeText={setOrigin}
            placeholder={me ? 'Localização atual' : 'Local de embarque (rua, número e cidade)'}
            placeholderTextColor={me ? Brand.green : theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
            autoCapitalize="words"
            returnKeyType="next"
          />
          <View style={[styles.separator, { backgroundColor: theme.backgroundSelected }]} />
          <TextInput
            accessibilityLabel="Destino"
            value={destination}
            onChangeText={setDestination}
            placeholder="Para onde? (rua, número e cidade)"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
            autoCapitalize="words"
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => estimate()}
          />
        </View>
      </View>

      {me ? null : (
        <ThemedText type="small" themeColor="textSecondary">
          Sem acesso à sua localização: digite o endereço de embarque.
        </ThemedText>
      )}

      <ErrorText>{error}</ErrorText>
      <Button label="Ver preço" onPress={() => estimate()} busy={busy} />

      {recents.length > 0 ? (
        <View>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Destinos recentes
          </ThemedText>
          {recents.map((address) => (
            <Row
              key={address}
              icon="time-outline"
              title={address.split(' - ')[0] ?? address}
              subtitle={address}
              onPress={
                busy
                  ? undefined
                  : () => {
                      setDestination(address);
                      estimate(address);
                    }
              }
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  box: { flexDirection: 'row', borderRadius: Radius.large, paddingHorizontal: Spacing.three, gap: Spacing.three },
  rail: { alignItems: 'center', paddingVertical: 22 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { width: 2, flex: 1, marginVertical: 4 },
  square: { width: 10, height: 10, borderRadius: 2 },
  inputs: { flex: 1 },
  input: { fontSize: 16, paddingVertical: 16 },
  separator: { height: StyleSheet.hairlineWidth },
});
