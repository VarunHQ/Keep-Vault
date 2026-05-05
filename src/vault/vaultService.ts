import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

import { ensureDb, getVaultRow, insertVaultRow, listDocs, listVaults, updateVaultSecrets } from '../db/db';
import { deriveKey, makeSalt, verifyPin, makeVerifier } from '../crypto/pin';
import { decryptFromB64, encryptToB64 } from '../crypto/secretbox';
import type { BootstrapState, UnlockedVault, VaultId, VaultInfo, WelcomeState } from './types';

const MEM = {
  unlocked: null as UnlockedVault | null,
};

export async function bootstrap(): Promise<{ state: BootstrapState; info: VaultInfo }> {
  await ensureDb();
  const rows = await listVaults();
  const info: VaultInfo = {
    hasMain: rows.some((r) => r.vaultId === 'main'),
    hasDecoy: rows.some((r) => r.vaultId === 'decoy'),
  };
  const state: BootstrapState = info.hasMain && info.hasDecoy ? 'ready' : 'needs-setup';
  return { state, info };
}

export async function getWelcomeState(): Promise<WelcomeState> {
  const flag = await SecureStore.getItemAsync('hasSeenWelcome');
  return { hasSeenWelcome: flag === '1' };
}

export async function setHasSeenWelcome() {
  await SecureStore.setItemAsync('hasSeenWelcome', '1');
}

export async function createVault(params: { vaultId: VaultId; pin: string }) {
  await ensureDb();
  const existing = await getVaultRow(params.vaultId);
  if (existing) return;

  const salt = await makeSalt();
  const key = await deriveKey({ pin: params.pin, salt });
  const verifier = await makeVerifier({ key });

  await insertVaultRow({
    vaultId: params.vaultId,
    saltB64: salt,
    verifierB64: verifier,
    createdAt: Date.now(),
  });
}

export async function unlockVault(params: { pin: string }): Promise<UnlockedVault> {
  await ensureDb();
  const rows = await listVaults();

  // Try main first, then decoy. If pin matches decoy, we open decoy: that's panic mode.
  for (const candidate of ['main', 'decoy'] as const) {
    const row = rows.find((r) => r.vaultId === candidate);
    if (!row) continue;
    const key = await deriveKey({ pin: params.pin, salt: row.saltB64 });
    const ok = await verifyPin({ key, verifierB64: row.verifierB64 });
    if (ok) {
      const unlocked: UnlockedVault = { vaultId: candidate, key };
      MEM.unlocked = unlocked;
      await SecureStore.setItemAsync('lastUnlockedVaultId', candidate);
      return unlocked;
    }
  }

  throw new Error('Incorrect PIN');
}

export async function lockVault() {
  MEM.unlocked = null;
}

export function getUnlocked(): UnlockedVault | null {
  return MEM.unlocked;
}

export async function changeVaultPin(params: {
  vaultId: VaultId;
  currentPin: string;
  newPin: string;
  onProgress?: (p: { done: number; total: number }) => void;
}) {
  await ensureDb();
  const row = await getVaultRow(params.vaultId);
  if (!row) throw new Error('Vault not found');

  const oldKey = await deriveKey({ pin: params.currentPin, salt: row.saltB64 });
  const ok = await verifyPin({ key: oldKey, verifierB64: row.verifierB64 });
  if (!ok) throw new Error('Current PIN is incorrect');

  const docs = await listDocs(params.vaultId);
  const total = docs.length;
  let done = 0;
  params.onProgress?.({ done, total });

  // Derive new key + verifier with a fresh salt.
  const newSalt = await makeSalt();
  const newKey = await deriveKey({ pin: params.newPin, salt: newSalt });
  const newVerifier = await makeVerifier({ key: newKey });

  for (const d of docs) {
    const encryptedB64 = await FileSystem.readAsStringAsync(d.encryptedPath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const plaintext = decryptFromB64({ key: oldKey, ciphertextB64: encryptedB64 });
    const reencryptedB64 = await encryptToB64({ key: newKey, plaintext });
    await FileSystem.writeAsStringAsync(d.encryptedPath, reencryptedB64, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    done += 1;
    params.onProgress?.({ done, total });
  }

  await updateVaultSecrets({ vaultId: params.vaultId, saltB64: newSalt, verifierB64: newVerifier });

  // Force re-unlock with new PIN if we were unlocked.
  MEM.unlocked = null;
}

