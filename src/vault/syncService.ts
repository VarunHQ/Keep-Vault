import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { decryptFromB64, encryptToB64 } from '../crypto/secretbox';
import { bytesToUtf8, utf8ToBytes } from '../crypto/utf8';
import { ensureDb, insertDoc, listDocs as listDocsDb, type DocRow } from '../db/db';

type SyncManifest = {
  version: 1;
  createdAt: number;
  vaultId: 'main' | 'decoy';
  docs: Array<Pick<DocRow, 'id' | 'title' | 'mimeType' | 'createdAt' | 'updatedAt'> & { fileB64: string }>;
};

function syncDir() {
  return `${FileSystem.documentDirectory}sync`;
}

export async function exportSyncPackage(params: { vaultId: 'main' | 'decoy'; vaultKey: Uint8Array }) {
  await ensureDb();
  await FileSystem.makeDirectoryAsync(syncDir(), { intermediates: true });

  const docs = await listDocsDb(params.vaultId);
  const enriched = await Promise.all(
    docs.map(async (d) => {
      const fileB64 = await FileSystem.readAsStringAsync(d.encryptedPath, { encoding: FileSystem.EncodingType.UTF8 });
      return { id: d.id, title: d.title, mimeType: d.mimeType, createdAt: d.createdAt, updatedAt: d.updatedAt, fileB64 };
    }),
  );

  const manifest: SyncManifest = {
    version: 1,
    createdAt: Date.now(),
    vaultId: params.vaultId,
    docs: enriched,
  };

  const plaintext = utf8ToBytes(JSON.stringify(manifest));
  const encryptedB64 = await encryptToB64({ key: params.vaultKey, plaintext });

  const outPath = `${syncDir()}/wallet-sync-${params.vaultId}-${Date.now()}.dwallet`;
  await FileSystem.writeAsStringAsync(outPath, encryptedB64, { encoding: FileSystem.EncodingType.UTF8 });

  if (!(await Sharing.isAvailableAsync())) {
    return;
  }
  await Sharing.shareAsync(outPath, { dialogTitle: 'Share sync package' });
}

export async function importSyncPackage(params: { vaultId: 'main' | 'decoy'; vaultKey: Uint8Array }) {
  await ensureDb();
  const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
  if (picked.canceled) return;
  const asset = picked.assets?.[0];
  if (!asset?.uri) throw new Error('No file selected');

  const encryptedB64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
  const plaintextBytes = decryptFromB64({ key: params.vaultKey, ciphertextB64: encryptedB64 });
  const json = bytesToUtf8(plaintextBytes);
  const manifest = JSON.parse(json) as SyncManifest;

  if (manifest.version !== 1) throw new Error('Unsupported sync package version');
  if (manifest.vaultId !== params.vaultId) {
    throw new Error('This package is for a different vault (main vs decoy)');
  }

  // Write encrypted files and upsert metadata.
  const baseDir = `${FileSystem.documentDirectory}vault/${params.vaultId}`;
  await FileSystem.makeDirectoryAsync(`${baseDir}/files`, { intermediates: true });

  for (const d of manifest.docs) {
    const path = `${baseDir}/files/${d.id}.bin`;
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      await FileSystem.writeAsStringAsync(path, d.fileB64, { encoding: FileSystem.EncodingType.UTF8 });
      await insertDoc({
        id: d.id,
        vaultId: params.vaultId,
        title: d.title,
        mimeType: d.mimeType,
        encryptedPath: path,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      });
    }
  }
}

