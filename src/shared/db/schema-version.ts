import type * as SQLite from 'expo-sqlite';

const LOCAL_SCHEMA_VERSION_KEY = 'local_schema_version';

export const LATEST_LOCAL_SCHEMA_VERSION = 3;

interface MetadataRow {
  value: string;
}

type SqlExecutor = Pick<SQLite.SQLiteDatabase, 'getFirstAsync' | 'runAsync'>;

export async function readLocalSchemaVersion(database: SqlExecutor) {
  const row = await database.getFirstAsync<MetadataRow>(
    'SELECT value FROM seed_metadata WHERE key = ?',
    LOCAL_SCHEMA_VERSION_KEY,
  );

  return row ? Number.parseInt(row.value, 10) || 0 : 0;
}

export async function writeLocalSchemaVersion(database: SqlExecutor, version: number) {
  await database.runAsync(
    `INSERT INTO seed_metadata (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    LOCAL_SCHEMA_VERSION_KEY,
    String(version),
    new Date().toISOString(),
  );
}
