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
  {
    version: 2,
    name: 'globalize_characters_and_assignment_state',
    migrate: async (database) => {
      await database.withExclusiveTransactionAsync(async (transaction) => {
        await transaction.execAsync('DROP TABLE IF EXISTS campaign_character_snapshots;');
        await transaction.execAsync('DROP TABLE IF EXISTS campaign_character_statuses;');
        await transaction.execAsync('DROP TABLE IF EXISTS campaign_characters;');
        await transaction.execAsync('DROP TABLE IF EXISTS character_snapshots;');
        await transaction.execAsync('DROP TABLE IF EXISTS character_statuses;');
        await transaction.execAsync('DROP TABLE IF EXISTS characters;');
        await transaction.execAsync(`CREATE TABLE IF NOT EXISTS characters (
          id TEXT PRIMARY KEY NOT NULL,
          owner_user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          level INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`);
        await transaction.execAsync(`CREATE TABLE IF NOT EXISTS campaign_characters (
          id TEXT PRIMARY KEY NOT NULL,
          campaign_id TEXT NOT NULL,
          character_id TEXT NOT NULL,
          added_by_user_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(campaign_id, character_id)
        );`);
        await transaction.execAsync(`CREATE TABLE IF NOT EXISTS campaign_character_statuses (
          campaign_character_id TEXT PRIMARY KEY NOT NULL,
          payload TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`);
        await transaction.execAsync(`CREATE TABLE IF NOT EXISTS campaign_character_snapshots (
          campaign_character_id TEXT PRIMARY KEY NOT NULL,
          payload TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );`);
        await transaction.execAsync(
          'CREATE INDEX IF NOT EXISTS idx_campaign_characters_campaign ON campaign_characters(campaign_id);',
        );
        await transaction.execAsync(
          'CREATE INDEX IF NOT EXISTS idx_campaign_characters_character ON campaign_characters(character_id);',
        );
      });
    },
  },
  {
    version: 3,
    name: 'add_builder_progress_columns',
    migrate: async (database) => {
      await database.withExclusiveTransactionAsync(async (transaction) => {
        await transaction.execAsync('DROP TABLE IF EXISTS character_builds;');
        await transaction.execAsync(`CREATE TABLE IF NOT EXISTS character_builds (
          character_id TEXT PRIMARY KEY NOT NULL,
          build_state TEXT NOT NULL DEFAULT 'draft',
          current_step TEXT NOT NULL DEFAULT 'class',
          payload TEXT NOT NULL,
          revision INTEGER NOT NULL DEFAULT 1,
          completion_updated_at TEXT,
          updated_at TEXT NOT NULL
        );`);
        await transaction.execAsync(
          'CREATE INDEX IF NOT EXISTS idx_character_builds_progress ON character_builds(build_state, current_step);',
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
