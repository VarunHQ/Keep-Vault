import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { makeNavTheme, type ThemeMode } from './theme';

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  setMode: (m: ThemeMode) => Promise<void>;
};

const Ctx = createContext<ThemeContextValue | null>(null);

const KEY = 'themeMode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme() ?? 'light';
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void (async () => {
      const saved = await SecureStore.getItemAsync(KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
      setHydrated(true);
    })();
  }, []);

  const resolved: 'light' | 'dark' = mode === 'system' ? system : mode;

  const setMode = useCallback(async (m: ThemeMode) => {
    setModeState(m);
    await SecureStore.setItemAsync(KEY, m);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolved,
      setMode,
    }),
    [mode, resolved, setMode],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useThemeMode() {
  const v = useContext(Ctx);
  if (!v) throw new Error('ThemeProvider missing');
  return v;
}

export function useNavTheme() {
  const { resolved } = useThemeMode();
  return useMemo(() => makeNavTheme(resolved), [resolved]);
}

