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
import { Icon, type IconName } from '@/components/ui';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Field({ label, secureTextEntry, ...props }: TextInputProps & { label: string }) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
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
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: focused ? theme.text : 'transparent',
          },
        ]}
        secureTextEntry={secureTextEntry && !revealed}
        {...props}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
      />
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'brand';
  icon?: IconName;
};

export function Button({ label, onPress, busy, disabled, variant = 'primary', icon }: ButtonProps) {
  const theme = useTheme();
  const blocked = disabled || busy;

  const background =
    variant === 'primary'
      ? theme.action
      : variant === 'brand'
        ? Brand.green
        : variant === 'danger'
          ? 'transparent'
          : theme.backgroundElement;
  const color =
    variant === 'primary'
      ? theme.onAction
      : variant === 'brand'
        ? '#ffffff'
        : variant === 'danger'
          ? Brand.danger
          : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background },
        (pressed || blocked) && styles.dimmed,
      ]}>
      {busy ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={18} color={color} /> : null}
          <ThemedText type="bold" style={{ color }}>
            {label}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

type SegmentedProps<T extends string> = {
  options: readonly { value: T; label: string; icon?: IconName }[];
  value: T;
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const theme = useTheme();

  return (
    <View style={[styles.segmented, { backgroundColor: theme.backgroundElement }]}>
      {options.map((option) => {
        const selected = option.value === value;
        const color = selected ? theme.onAction : theme.text;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: theme.action }]}>
            {option.icon ? <Icon name={option.icon} size={16} color={color} /> : null}
            <ThemedText type="smallBold" style={{ color }}>
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
    <View style={styles.errorBox} accessibilityRole="alert">
      <Icon name="alert-circle" size={18} color={Brand.danger} />
      <ThemedText type="small" style={styles.errorText}>
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.two },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: {
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
    paddingVertical: 15,
    fontSize: 16,
  },
  button: {
    minHeight: 56,
    borderRadius: Radius.medium,
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  dimmed: { opacity: 0.55 },
  segmented: {
    flexDirection: 'row',
    borderRadius: Radius.medium,
    padding: Spacing.one,
    gap: Spacing.one,
  },
  segment: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.small,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
    backgroundColor: '#FEF3F2',
    borderRadius: Radius.small,
    padding: 12,
  },
  errorText: { flex: 1, color: '#B42318' },
});
