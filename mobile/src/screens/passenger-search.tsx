import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, ErrorText } from '@/components/form';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Icon, Row } from '@/components/ui';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { describeError } from '@/lib/errors';
import { estimateRide, type PlaceInput } from '@/lib/rides';
import type { LatLng, PlaceRef, QuoteOption } from '@/lib/types';
import { MIN_QUERY, usePlaceSearch } from '@/lib/use-place-search';

/** Um dos dois pontos da viagem: o texto do campo e, se já escolhido, o lugar. */
type Point = { text: string; place: PlaceRef | null };

export type SearchResult = { origin: PlaceRef | null; destination: PlaceRef; quotes: QuoteOption[] };

type Props = {
  /** Posição do aparelho; sem ela o embarque precisa ser escolhido na busca. */
  me: LatLng | null;
  recents: PlaceRef[];
  /** Pontos já escolhidos, ao voltar para editar. `origin: null` = localização atual. */
  initial?: { origin: PlaceRef | null; destination: PlaceRef | null };
  onBack: () => void;
  onResult: (result: SearchResult) => void;
};

const shortLabel = (label: string) => label.split(' - ')[0] ?? label;

/** Tela "Para onde?": embarque e destino com sugestões de endereço. */
export function PassengerSearch({ me, recents, initial, onBack, onResult }: Props) {
  const theme = useTheme();
  const destinationInput = useRef<TextInput>(null);

  const [origin, setOrigin] = useState<Point>({
    text: initial?.origin?.label ?? '',
    place: initial?.origin ?? null,
  });
  const [destination, setDestination] = useState<Point>({
    text: initial?.destination?.label ?? '',
    place: initial?.destination ?? null,
  });
  const [field, setField] = useState<'origin' | 'destination'>('destination');
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Embarque em branco = posição do aparelho, quando ela existe.
  const usingGps = Boolean(me) && origin.text.trim() === '' && !origin.place;
  const active = field === 'origin' ? origin : destination;
  // Com um lugar já escolhido no campo, não há o que sugerir.
  const search = usePlaceSearch(active.place ? '' : active.text, me);

  async function estimate(from: Point, to: Point) {
    const originReady = from.place ?? (usingGpsFor(from) && me ? { lat: me.latitude, lng: me.longitude } : null);
    if (!originReady || !to.place) return;

    setError(null);
    setEstimating(true);
    try {
      const quotes = await estimateRide(originReady as PlaceInput, to.place);
      onResult({ origin: from.place, destination: to.place, quotes });
    } catch (e) {
      setError(describeError(e));
      setEstimating(false);
    }
  }

  function usingGpsFor(point: Point) {
    return Boolean(me) && point.text.trim() === '' && !point.place;
  }

  function choose(place: PlaceRef) {
    if (field === 'origin') {
      const next = { text: place.label, place };
      setOrigin(next);
      if (destination.place) estimate(next, destination);
      else {
        setField('destination');
        destinationInput.current?.focus();
      }
    } else {
      const next = { text: place.label, place };
      setDestination(next);
      estimate(origin, next);
    }
  }

  const originMissing = !usingGps && !origin.place;
  const showIdle = !search.active;

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
          <View style={styles.inputRow}>
            <TextInput
              accessibilityLabel="Local de embarque"
              value={origin.text}
              onChangeText={(text) => setOrigin({ text, place: null })}
              onFocus={() => setField('origin')}
              placeholder={me ? 'Localização atual' : 'De onde você sai?'}
              placeholderTextColor={me ? Brand.green : theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!estimating}
              selectTextOnFocus
            />
            {origin.text ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Limpar embarque"
                hitSlop={10}
                onPress={() => setOrigin({ text: '', place: null })}>
                <Icon name="close-circle" size={20} color={theme.textSecondary} />
              </Pressable>
            ) : null}
          </View>
          <View style={[styles.separator, { backgroundColor: theme.backgroundSelected }]} />
          <View style={styles.inputRow}>
            <TextInput
              ref={destinationInput}
              accessibilityLabel="Destino"
              value={destination.text}
              onChangeText={(text) => setDestination({ text, place: null })}
              onFocus={() => setField('destination')}
              placeholder="Para onde?"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus={!initial?.destination}
              editable={!estimating}
              selectTextOnFocus
            />
            {destination.text ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Limpar destino"
                hitSlop={10}
                onPress={() => setDestination({ text: '', place: null })}>
                <Icon name="close-circle" size={20} color={theme.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <ErrorText>{error}</ErrorText>

      {estimating ? (
        <View style={styles.state} accessibilityRole="progressbar">
          <ActivityIndicator color={Brand.green} />
          <ThemedText type="bold">Calculando rota e preço</ThemedText>
        </View>
      ) : error && origin.place !== undefined && destination.place ? (
        <Button label="Tentar de novo" onPress={() => estimate(origin, destination)} />
      ) : search.loading ? (
        <View style={styles.state} accessibilityRole="progressbar">
          <ActivityIndicator color={Brand.green} />
          <ThemedText type="small" themeColor="textSecondary">
            Buscando endereços
          </ThemedText>
        </View>
      ) : search.error ? (
        <>
          <ErrorText>{search.error}</ErrorText>
          <Button label="Buscar de novo" variant="secondary" onPress={search.retry} />
        </>
      ) : search.active && search.places.length === 0 ? (
        <View style={styles.state}>
          <Icon name="search" size={28} color={theme.textSecondary} />
          <ThemedText type="bold">Nenhum endereço encontrado</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
            Tente incluir o nome da rua e a cidade, por exemplo “Rua Bahia, Blumenau”.
          </ThemedText>
        </View>
      ) : search.active ? (
        <View>
          {search.places.map((place) => (
            <Row
              key={place.id}
              icon="location-outline"
              title={place.title}
              subtitle={place.subtitle}
              trailing={null}
              onPress={() =>
                choose({
                  label: [place.title, place.subtitle].filter(Boolean).join(' - '),
                  lat: place.lat,
                  lng: place.lng,
                })
              }
            />
          ))}
        </View>
      ) : null}

      {showIdle && !estimating ? (
        <View>
          {field === 'origin' && me && !usingGps ? (
            <Row
              icon="navigate"
              title="Usar minha localização atual"
              trailing={null}
              onPress={() => {
                const next = { text: '', place: null };
                setOrigin(next);
                if (destination.place) estimate(next, destination);
                else {
                  setField('destination');
                  destinationInput.current?.focus();
                }
              }}
            />
          ) : null}

          {field === 'destination' && recents.length > 0 ? (
            <>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
                Recentes
              </ThemedText>
              {recents.map((place) => (
                <Row
                  key={place.label}
                  icon="time-outline"
                  title={shortLabel(place.label)}
                  subtitle={place.label}
                  trailing={null}
                  onPress={() => choose(place)}
                />
              ))}
            </>
          ) : null}

          {active.place ? null : (
            <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
              {originMissing && field === 'origin'
                ? `Sem acesso à sua localização. Digite pelo menos ${MIN_QUERY} letras do endereço de embarque.`
                : `Digite pelo menos ${MIN_QUERY} letras para ver sugestões.`}
            </ThemedText>
          )}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  box: {
    flexDirection: 'row',
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  rail: { alignItems: 'center', paddingVertical: 22 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { width: 2, flex: 1, marginVertical: 4 },
  square: { width: 10, height: 10, borderRadius: 2 },
  inputs: { flex: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  // `outlineStyle` só existe na web: tira o contorno azul de foco do navegador.
  input: { flex: 1, fontSize: 16, paddingVertical: 16, ...({ outlineStyle: 'none' } as object) },
  separator: { height: StyleSheet.hairlineWidth },
  state: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  centered: { textAlign: 'center' },
  sectionTitle: { marginTop: Spacing.two, marginBottom: Spacing.one },
  hint: { marginTop: Spacing.three },
});
