import * as Crypto from 'expo-crypto';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';

import { b64ToBytes, bytesToB64 } from './base64';

const PIN_KEY_LEN = 32;
const PBKDF2_ITERS = 210_000;

export async function makeSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return bytesToB64(bytes);
}

export async function deriveKey(params: { pin: string; salt: string }): Promise<Uint8Array> {
  const saltBytes = b64ToBytes(params.salt);
  const key = pbkdf2(sha256, params.pin, saltBytes, { c: PBKDF2_ITERS, dkLen: PIN_KEY_LEN });
  return key;
}

export async function makeVerifier(params: { key: Uint8Array }): Promise<string> {
  // Verifier is H(key) so we can check PIN without storing it.
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    bytesToB64(params.key),
  );
  return digest;
}

export async function verifyPin(params: { key: Uint8Array; verifierB64: string }): Promise<boolean> {
  const candidate = await makeVerifier({ key: params.key });
  return timingSafeEqual(candidate, params.verifierB64);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

