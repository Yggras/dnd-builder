import type * as SQLite from 'expo-sqlite';

import { logger } from '@/shared/logging/logger';

import { LATEST_LOCAL_SCHEMA_VERSION, readLocalSchemaVersion, writeLocalSchemaVersion } from '@/shared/db/schema-version';

type Migration = {
  version: number;
  name: string;
  migrate: (database: SQLite.SQLiteDatabase) => Promise<void>;
};

const createCanonicalCompendiumEntriesTable = `CREATE TABLE IF NOT EXISTS compendium_entries (
  id TEXT PRIMARY KEY NOT NULL,
  entry_type TEXT NOT NULL,
  entity_id TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  source_code TEXT NOT NULL,
  source_name TEXT NOT NULL,
  rules_edition TEXT NOT NULL,
  is_legacy INTEGER NOT NULL DEFAULT 0,
  is_primary_2024 INTEGER NOT NULL DEFAULT 0,
  is_selectable_in_builder INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  text TEXT NOT NULL,
  search_text TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'global',
  metadata TEXT NOT NULL,
  render_payload TEXT,
  updated_at TEXT NOT NULL
)`;

const migrations: Migration[] = [
  {
    version: 1,
    name: 'canonicalize_compendium_entries',
    migrate: async (database) => {
      await database.withExclusiveTransactionAsync(async (transaction) => {
        await transaction.execAsync('DROP TABLE IF EXISTS compendium_entries;');
        await transaction.execAsync(`${createCanonicalCompendiumEntriesTable};`);
        await transaction.execAsync(
          'CREATE INDEX IF NOT EXISTS idx_compendium_entries_type ON compendium_entries(entry_type);',
        );
      });
    },
  },
];

export async function runLocalMigrations(database: SQLite.SQLiteDatabase) {
  const currentVersion = await readLocalSchemaVersion(database);

  if (currentVersion >= LATEST_LOCAL_SCHEMA_VERSION) {
    return;
  }

  for (const migration of migrations) {
    if (migration.version <= currentVersion) {
      continue;
    }

    logger.info('local_schema_migration_started', {
      version: migration.version,
      name: migration.name,
    });

    await migration.migrate(database);
    await writeLocalSchemaVersion(database, migration.version);

    logger.info('local_schema_migration_completed', {
      version: migration.version,
      name: migration.name,
    });
  }
}
