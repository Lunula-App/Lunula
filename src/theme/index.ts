import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { TEAL_LIGHT, TEAL_DARK } from './colors';
import { ACCENTS, AccentKey, DEFAULT_ACCENT } from './accents';

// Neutral surface/background tokens stay fixed — only accent colours change
const LIGHT_BASE = {
  background: TEAL_LIGHT.background,
  surface: TEAL_LIGHT.surface,
  surfaceVariant: TEAL_LIGHT.surfaceVariant,
  onBackground: TEAL_LIGHT.onBackground,
  onSurface: TEAL_LIGHT.onSurface,
  onSurfaceVariant: TEAL_LIGHT.onSurfaceVariant,
  outline: TEAL_LIGHT.outline,
  error: TEAL_LIGHT.error,
  onError: TEAL_LIGHT.onError,
};

const DARK_BASE = {
  background: TEAL_DARK.background,
  surface: TEAL_DARK.surface,
  surfaceVariant: TEAL_DARK.surfaceVariant,
  onBackground: TEAL_DARK.onBackground,
  onSurface: TEAL_DARK.onSurface,
  onSurfaceVariant: TEAL_DARK.onSurfaceVariant,
  outline: TEAL_DARK.outline,
  error: TEAL_DARK.error,
  onError: TEAL_DARK.onError,
};

export function buildTheme(isDark: boolean, accentKey: AccentKey = DEFAULT_ACCENT) {
  const accent = ACCENTS[accentKey] ?? ACCENTS[DEFAULT_ACCENT];
  const palette = isDark ? accent.dark : accent.light;
  const base = isDark ? DARK_BASE : LIGHT_BASE;
  const md3 = isDark ? MD3DarkTheme : MD3LightTheme;

  return {
    ...md3,
    colors: {
      ...md3.colors,
      ...base,
      primary: palette.primary,
      primaryContainer: palette.primaryContainer,
      onPrimary: palette.onPrimary,
      onPrimaryContainer: palette.onPrimaryContainer,
      secondary: palette.secondary,
      secondaryContainer: palette.secondaryContainer,
      onSecondary: palette.onSecondary,
    },
  };
}

// Static defaults kept for any imports that reference them directly
export const lightTheme = buildTheme(false, DEFAULT_ACCENT);
export const darkTheme = buildTheme(true, DEFAULT_ACCENT);

export type AppTheme = ReturnType<typeof buildTheme>;
