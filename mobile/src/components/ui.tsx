import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand, Elevation, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color?: string }) {
  const theme = useTheme();
  return <Ionicons name={name} size={size} color={color ?? theme.text} />;
}

/** Botão redondo que flutua sobre o mapa. */
export function FloatingButton({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.floating,
        Elevation,
        { backgroundColor: theme.background },
        pressed && styles.pressed,
      ]}>
      <Icon name={icon} size={22} />
    </Pressable>
  );
}

/**
 * Painel inferior sobre o mapa. Cresce com o conteúdo até 72% da tela e rola
 * por dentro a partir daí. `onHeight` informa a altura para o mapa se ajustar.
 */
export function Sheet({
  children,
  onHeight,
}: {
  children: ReactNode;
  onHeight?: (height: number) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      onLayout={(event) => onHeight?.(event.nativeEvent.layout.height)}
      style={[styles.sheet, Elevation, { backgroundColor: theme.background }]}>
      <View style={[styles.grabber, { backgroundColor: theme.backgroundSelected }]} />
      <ScrollView
        bounces={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.sheetContent,
          { paddingBottom: Math.max(insets.bottom, Spacing.three) + Spacing.two },
        ]}>
        {children}
      </ScrollView>
    </View>
  );
}

/** Iniciais dentro de um círculo. */
export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityElementsHidden>
      <ThemedText type="bold" style={{ color: Brand.green, fontSize: size * 0.36 }}>
        {initials}
      </ThemedText>
    </View>
  );
}

export function Chip({ children, tone = 'neutral' }: { children: string; tone?: 'neutral' | 'green' }) {
  const theme = useTheme();
  const green = tone === 'green';

  return (
    <View style={[styles.chip, { backgroundColor: green ? Brand.greenSoft : theme.backgroundElement }]}>
      <ThemedText type="smallBold" style={green ? { color: Brand.green } : undefined}>
        {children}
      </ThemedText>
    </View>
  );
}

export function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

/** Barra que vai e volta: algo está acontecendo, sem prazo conhecido. */
export function SearchingBar() {
  const theme = useTheme();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  return (
    <View
      style={[styles.track, { backgroundColor: theme.backgroundSelected }]}
      accessibilityRole="progressbar">
      <Animated.View
        style={[
          styles.runner,
          {
            transform: [
              { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-120, 360] }) },
            ],
          },
        ]}
      />
    </View>
  );
}

/** Progresso em etapas (ex.: a caminho · chegou · em viagem). */
export function StepBar({ total, current }: { total: number; current: number }) {
  const theme = useTheme();

  return (
    <View style={styles.steps} accessibilityRole="progressbar">
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            styles.step,
            { backgroundColor: index < current ? Brand.green : theme.backgroundSelected },
          ]}
        />
      ))}
    </View>
  );
}

/** Linha de lista tocável, com ícone à esquerda. */
export function Row({
  icon,
  title,
  subtitle,
  onPress,
  trailing,
  danger,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: ReactNode;
  danger?: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.rowIcon, { backgroundColor: theme.backgroundElement }]}>
        <Icon name={icon} size={18} color={danger ? Brand.danger : undefined} />
      </View>
      <View style={styles.rowText}>
        <ThemedText type="bold" numberOfLines={1} style={danger ? { color: Brand.danger } : undefined}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {trailing ?? (onPress ? <Icon name="chevron-forward" size={18} color={theme.textSecondary} /> : null)}
    </Pressable>
  );
}

/** Origem e destino empilhados, com o trilho ponto–linha–quadrado. */
export function RouteSummary({ origin, destination }: { origin: string; destination: string }) {
  const theme = useTheme();

  return (
    <View style={styles.route}>
      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: Brand.green }]} />
        <View style={[styles.line, { backgroundColor: theme.backgroundSelected }]} />
        <View style={[styles.square, { backgroundColor: theme.text }]} />
      </View>
      <View style={styles.routeText}>
        <View>
          <ThemedText type="small" themeColor="textSecondary">
            Embarque
          </ThemedText>
          <ThemedText type="bold" numberOfLines={2}>
            {origin}
          </ThemedText>
        </View>
        <View>
          <ThemedText type="small" themeColor="textSecondary">
            Destino
          </ThemedText>
          <ThemedText type="bold" numberOfLines={2}>
            {destination}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

/** Painel que sobe de baixo, sobre um fundo escurecido. */
export function BottomModal({
  visible,
  onClose,
  children,
  style,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fechar" />
      <View
        style={[
          styles.modal,
          { backgroundColor: theme.background, paddingBottom: Math.max(insets.bottom, Spacing.three) },
          style,
        ]}>
        <View style={[styles.grabber, { backgroundColor: theme.backgroundSelected }]} />
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },
  floating: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '72%',
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    paddingTop: Spacing.two,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: Spacing.two },
  sheetContent: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two, gap: Spacing.three },
  avatar: { backgroundColor: Brand.greenSoft, alignItems: 'center', justifyContent: 'center' },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  divider: { height: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  runner: { width: 120, height: 4, borderRadius: 2, backgroundColor: Brand.green },
  steps: { flexDirection: 'row', gap: 6 },
  step: { flex: 1, height: 4, borderRadius: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  rowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: Spacing.half },
  route: { flexDirection: 'row', gap: Spacing.three },
  rail: { alignItems: 'center', paddingVertical: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { width: 2, flex: 1, marginVertical: 4 },
  square: { width: 10, height: 10, borderRadius: 2 },
  routeText: { flex: 1, gap: Spacing.three },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modal: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: Radius.sheet,
    borderTopRightRadius: Radius.sheet,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
});
