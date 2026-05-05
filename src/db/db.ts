import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export type VaultRow = {
  vaultId: 'main' | 'decoy';
  saltB64: string;
  verifierB64: string;
  createdAt: number;
};

export async function ensureDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('wallet.db');
  }
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS vaults (
      vaultId TEXT PRIMARY KEY NOT NULL,
      saltB64 TEXT NOT NULL,
      verifierB64 TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS docs (
      id TEXT PRIMARY KEY NOT NULL,
      vaultId TEXT NOT NULL,
      title TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      encryptedPath TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_docs_vaultId_updatedAt ON docs(vaultId, updatedAt DESC);
  `);
}

function mustDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('DB not ready');
  return db;
}

export async function listVaults(): Promise<VaultRow[]> {
  const rows = await mustDb().getAllAsync<VaultRow>('SELECT * FROM vaults');
  return rows;
}

export async function getVaultRow(vaultId: VaultRow['vaultId']): Promise<VaultRow | null> {
  const row = await mustDb().getFirstAsync<VaultRow>('SELECT * FROM vaults WHERE vaultId = ?', [
    vaultId,
  ]);
  return row ?? null;
}

export async function insertVaultRow(row: VaultRow) {
  await mustDb().runAsync(
    'INSERT INTO vaults (vaultId, saltB64, verifierB64, createdAt) VALUES (?, ?, ?, ?)',
    [row.vaultId, row.saltB64, row.verifierB64, row.createdAt],
  );
}

export async function updateVaultSecrets(params: {
  vaultId: VaultRow['vaultId'];
  saltB64: string;
  verifierB64: string;
}) {
  await mustDb().runAsync('UPDATE vaults SET saltB64 = ?, verifierB64 = ? WHERE vaultId = ?', [
    params.saltB64,
    params.verifierB64,
    params.vaultId,
  ]);
}

export type DocRow = {
  id: string;
  vaultId: 'main' | 'decoy';
  title: string;
  mimeType: string;
  encryptedPath: string;
  createdAt: number;
  updatedAt: number;
};

export async function listDocs(vaultId: DocRow['vaultId']): Promise<DocRow[]> {
  return await mustDb().getAllAsync<DocRow>(
    'SELECT * FROM docs WHERE vaultId = ? ORDER BY updatedAt DESC',
    [vaultId],
  );
}

export async function getDocById(params: { id: string; vaultId: DocRow['vaultId'] }): Promise<DocRow | null> {
  const row = await mustDb().getFirstAsync<DocRow>(
    'SELECT * FROM docs WHERE id = ? AND vaultId = ?',
    [params.id, params.vaultId],
  );
  return row ?? null;
}

export async function insertDoc(row: DocRow) {
  await mustDb().runAsync(
    'INSERT INTO docs (id, vaultId, title, mimeType, encryptedPath, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [row.id, row.vaultId, row.title, row.mimeType, row.encryptedPath, row.createdAt, row.updatedAt],
  );
}

