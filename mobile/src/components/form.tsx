import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Field({ label, secureTextEntry, ...props }: TextInputProps & { label: string }) {
  const theme = useTheme();
  // Campo de senha ganha "Mostrar": dá para conferir o que foi digitado (ou
  // preenchido sozinho pelo teclado) antes de enviar.
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <ThemedText type="smallBold">{label}</ThemedText>
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => setRevealed((value) => !value)}>
            <ThemedText type="small" themeColor="textSecondary">
              {revealed ? 'Ocultar' : 'Mostrar'}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        secureTextEntry={secureTextEntry && !revealed}
        {...props}
      />
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function Button({ label, onPress, busy, disabled, variant = 'primary' }: ButtonProps) {
  const theme = useTheme();
  const primary = variant === 'primary';
  const blocked = disabled || busy;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: primary ? Brand.green : theme.backgroundSelected },
        variant === 'danger' && styles.dangerButton,
        (pressed || blocked) && styles.dimmed,
      ]}>
      {busy ? (
        <ActivityIndicator color={primary ? '#ffffff' : theme.text} />
      ) : (
        <ThemedText
          type="smallBold"
          style={primary ? styles.primaryLabel : variant === 'danger' ? styles.error : undefined}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

type SegmentedProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const theme = useTheme();

  return (
    <View style={[styles.segmented, { backgroundColor: theme.backgroundElement }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: Brand.green }]}>
            <ThemedText type="smallBold" style={selected ? styles.primaryLabel : undefined}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ErrorText({ children }: { children: string | null }) {
  if (!children) return null;
  return (
    <ThemedText type="small" style={styles.error} accessibilityRole="alert">
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: {
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    fontSize: 16,
  },
  button: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  dangerButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Brand.danger },
  dimmed: { opacity: 0.6 },
  primaryLabel: { color: '#ffffff' },
  segmented: { flexDirection: 'row', borderRadius: 14, padding: Spacing.one, gap: Spacing.one },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { color: Brand.danger },
});
