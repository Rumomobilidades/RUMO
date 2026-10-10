/**
 * Sistema visual do RUMO no app. Mesma família da landing: tinta quase preta,
 * verde da marca e lima como destaque. Ações principais são em tinta (preto no
 * claro, branco no escuro); o verde fica para estado e mapa.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Brand = {
  ink: '#101613',
  green: '#0E8A45',
  greenSoft: '#E7F5EC',
  lime: '#BEE83E',
  danger: '#D92D20',
  warning: '#B54708',
} as const;

export const Colors = {
  light: {
    text: '#101613',
    background: '#ffffff',
    backgroundElement: '#F2F4F3',
    backgroundSelected: '#E4E8E5',
    textSecondary: '#5B6660',
    border: '#E4E8E5',
    /** Fundo e texto do botão principal. */
    action: '#101613',
    onAction: '#ffffff',
  },
  dark: {
    text: '#F2F5F2',
    background: '#101613',
    backgroundElement: '#1B231E',
    backgroundSelected: '#28322C',
    textSecondary: '#9AA69E',
    border: '#28322C',
    action: '#F2F5F2',
    onAction: '#101613',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = { small: 10, medium: 14, large: 20, sheet: 28, pill: 999 } as const;

/** Sombra de elementos que flutuam sobre o mapa. */
export const Elevation = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  default: { elevation: 10 },
});

export const MaxContentWidth = 800;
