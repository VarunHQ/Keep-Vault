import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  bootstrap,
  changeVaultPin,
  createVault,
  getWelcomeState,
  lockVault,
  setHasSeenWelcome,
  unlockVault,
} from './vaultService';
import type { BootstrapState, UnlockedVault, VaultInfo, WelcomeState } from './types';

type VaultContextValue = {
  bootstrapState: BootstrapState;
  vaultInfo: VaultInfo | null;
  welcomeState: WelcomeState | null;
  unlocked: UnlockedVault | null;
  refresh: () => Promise<void>;
  setup: (params: { mainPin: string; decoyPin: string }) => Promise<void>;
  unlock: (pin: string) => Promise<void>;
  lock: () => Promise<void>;
  markWelcomeSeen: () => Promise<void>;
  changePin: (params: {
    vaultId: 'main' | 'decoy';
    currentPin: string;
    newPin: string;
    onProgress?: (p: { done: number; total: number }) => void;
  }) => Promise<void>;
  requireUnlocked: () => UnlockedVault;
};

const Ctx = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>('unknown');
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [welcomeState, setWelcomeState] = useState<WelcomeState | null>(null);
  const [unlocked, setUnlocked] = useState<UnlockedVault | null>(null);

  const refresh = useCallback(async () => {
    const res = await bootstrap();
    const ws = await getWelcomeState();
    setVaultInfo(res.info);
    setBootstrapState(res.state);
    setWelcomeState(ws);
    if (res.state === 'needs-setup') setUnlocked(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setup = useCallback(async ({ mainPin, decoyPin }: { mainPin: string; decoyPin: string }) => {
    await createVault({ vaultId: 'main', pin: mainPin });
    await createVault({ vaultId: 'decoy', pin: decoyPin });
    await refresh();
  }, [refresh]);

  const unlock = useCallback(async (pin: string) => {
    const opened = await unlockVault({ pin });
    setUnlocked(opened);
  }, []);

  const lock = useCallback(async () => {
    await lockVault();
    setUnlocked(null);
  }, []);

  const markWelcomeSeen = useCallback(async () => {
    await setHasSeenWelcome();
    setWelcomeState({ hasSeenWelcome: true });
  }, []);

  const changePin = useCallback(
    async (params: {
      vaultId: 'main' | 'decoy';
      currentPin: string;
      newPin: string;
      onProgress?: (p: { done: number; total: number }) => void;
    }) => {
      await changeVaultPin(params);
      setUnlocked(null);
    },
    [],
  );

  const requireUnlocked = useCallback((): UnlockedVault => {
    if (!unlocked) {
      throw new Error('Vault is locked');
    }
    return unlocked;
  }, [unlocked]);

  const value = useMemo<VaultContextValue>(
    () => ({
      bootstrapState,
      vaultInfo,
      welcomeState,
      unlocked,
      refresh,
      setup,
      unlock,
      lock,
      markWelcomeSeen,
      changePin,
      requireUnlocked,
    }),
    [
      bootstrapState,
      vaultInfo,
      welcomeState,
      unlocked,
      refresh,
      setup,
      unlock,
      lock,
      markWelcomeSeen,
      changePin,
      requireUnlocked,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVault() {
  const v = useContext(Ctx);
  if (!v) throw new Error('VaultProvider missing');
  return v;
}

