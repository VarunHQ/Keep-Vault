export type VaultId = 'main' | 'decoy';

export type BootstrapState = 'unknown' | 'needs-setup' | 'ready';

export type UnlockedVault = {
  vaultId: VaultId;
  key: Uint8Array; // in-memory only
};

export type VaultInfo = {
  hasMain: boolean;
  hasDecoy: boolean;
};

export type WelcomeState = {
  hasSeenWelcome: boolean;
};

