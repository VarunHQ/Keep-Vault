import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { ensureDb, getDocById, insertDoc, listDocs as listDocsDb, type DocRow } from '../db/db';
import { bytesToB64 } from '../crypto/base64';
import { decryptFromB64, encryptToB64 } from '../crypto/secretbox';
import type { DocListItem } from './docsTypes';

function vaultDir(vaultId: 'main' | 'decoy') {
  return `${FileSystem.documentDirectory}vault/${vaultId}`;
}

async function ensureVaultDirs(vaultId: 'main' | 'decoy') {
  const dir = vaultDir(vaultId);
  await FileSystem.makeDirectoryAsync(`${dir}/files`, { intermediates: true });
}

export async function importDocument(params: { vaultId: 'main' | 'decoy'; vaultKey: Uint8Array }) {
  await ensureDb();
  await ensureVaultDirs(params.vaultId);

  const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
  if (picked.canceled) return;

  const asset = picked.assets?.[0];
  if (!asset?.uri) throw new Error('No file selected');

  const base64 = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const binary = atobBinary(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const encryptedB64 = await encryptToB64({ key: params.vaultKey, plaintext: bytes });
  const id = Crypto.randomUUID();

  const outPath = `${vaultDir(params.vaultId)}/files/${id}.bin`;
  await FileSystem.writeAsStringAsync(outPath, encryptedB64, { encoding: FileSystem.EncodingType.UTF8 });

  const now = Date.now();
  const title = asset.name ?? 'Untitled';
  const mimeType = asset.mimeType ?? 'application/octet-stream';

  const row: DocRow = {
    id,
    vaultId: params.vaultId,
    title,
    mimeType,
    encryptedPath: outPath,
    createdAt: now,
    updatedAt: now,
  };
  await insertDoc(row);
}

export async function listDocs(params: { vaultId: 'main' | 'decoy' }): Promise<DocListItem[]> {
  await ensureDb();
  const rows = await listDocsDb(params.vaultId);
  return rows.map((r) => ({ id: r.id, title: r.title, mimeType: r.mimeType, updatedAt: r.updatedAt }));
}

export async function getDoc(params: { id: string; vaultId: 'main' | 'decoy' }): Promise<DocRow | null> {
  await ensureDb();
  return await getDocById({ id: params.id, vaultId: params.vaultId });
}

export async function openDoc(params: { id: string; vaultId: 'main' | 'decoy'; vaultKey: Uint8Array }) {
  await ensureDb();
  const doc = await getDocById({ id: params.id, vaultId: params.vaultId });
  if (!doc) throw new Error('Document not found');

  const encryptedB64 = await FileSystem.readAsStringAsync(doc.encryptedPath, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  const plaintext = decryptFromB64({ key: params.vaultKey, ciphertextB64: encryptedB64 });

  const ext = safeExtensionFromName(doc.title) ?? guessExtensionFromMime(doc.mimeType) ?? 'bin';
  const outPath = `${FileSystem.cacheDirectory}open/${doc.id}.${ext}`;
  await FileSystem.makeDirectoryAsync(`${FileSystem.cacheDirectory}open`, { intermediates: true });

  const base64 = bytesToB64(plaintext);
  await FileSystem.writeAsStringAsync(outPath, base64, { encoding: FileSystem.EncodingType.Base64 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(outPath, { dialogTitle: doc.title });
  }
}

function atobBinary(b64: string) {
  // base-64 is used elsewhere; FileSystem base64 read is standard base64 without newlines.
  // Use global atob if present (web), else fallback to base-64 package via require.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g: any = globalThis as any;
  if (typeof g.atob === 'function') return g.atob(b64);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { decode } = require('base-64') as typeof import('base-64');
  return decode(b64);
}

function safeExtensionFromName(name: string): string | null {
  const m = /\.([a-zA-Z0-9]{1,8})$/.exec(name);
  if (!m) return null;
  return m[1]!.toLowerCase();
}

function guessExtensionFromMime(mime: string): string | null {
  if (mime === 'application/pdf') return 'pdf';
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'text/plain') return 'txt';
  return null;
}

