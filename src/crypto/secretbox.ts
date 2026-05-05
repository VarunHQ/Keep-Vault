import * as Crypto from 'expo-crypto';
import nacl from 'tweetnacl';

import { b64ToBytes, bytesToB64 } from './base64';

export async function encryptToB64(params: { key: Uint8Array; plaintext: Uint8Array }): Promise<string> {
  const nonce = await Crypto.getRandomBytesAsync(nacl.secretbox.nonceLength);
  const boxed = nacl.secretbox(params.plaintext, nonce, params.key);
  const out = new Uint8Array(nonce.length + boxed.length);
  out.set(nonce, 0);
  out.set(boxed, nonce.length);
  return bytesToB64(out);
}

export function decryptFromB64(params: { key: Uint8Array; ciphertextB64: string }): Uint8Array {
  const all = b64ToBytes(params.ciphertextB64);
  const nonce = all.slice(0, nacl.secretbox.nonceLength);
  const boxed = all.slice(nacl.secretbox.nonceLength);
  const opened = nacl.secretbox.open(boxed, nonce, params.key);
  if (!opened) throw new Error('Decrypt failed');
  return opened;
}

