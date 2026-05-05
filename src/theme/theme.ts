import { DarkTheme, DefaultTheme, type Theme as NavTheme } from '@react-navigation/native';

export type ThemeMode = 'light' | 'dark' | 'system';

export function makeNavTheme(mode: 'light' | 'dark'): NavTheme {
  if (mode === 'dark') {
    return {
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: '#8b5cf6',
        background: '#0b1220',
        card: '#0f172a',
        text: '#e5e7eb',
        border: '#1f2937',
        notification: '#ef4444',
      },
    };
  }
  return {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#4f46e5',
      background: '#ffffff',
      card: '#ffffff',
      text: '#111827',
      border: '#e5e7eb',
      notification: '#ef4444',
    },
  };
}

