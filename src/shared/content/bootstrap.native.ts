import type * as SQLite from 'expo-sqlite';

import type { BundledContentBootstrapResult } from '@/shared/content/bootstrap.types';
import { bundledContentChunks, bundledContentManifest } from '@/shared/content/generated/5etoolsRegistry';
import type { BundledContentChunk } from '@/shared/content/types';
import { getDatabase } from '@/shared/db/sqlite.native';
import { logger } from '@/shared/logging/logger';

type SqlExecutor = Pick<SQLite.SQLiteDatabase, 'execAsync' | 'getFirstAsync' | 'runAsync'>;
const chunkRegistry = bundledContentChunks as Record<string, BundledContentChunk>;

type GeneratedRulesEdition = '2014' | '2024' | 'legacy';

interface SeedMetadataRow {
  value: string;
}

interface GeneratedContentEntityRecord {
  id: string;
  kind: string;
  name: string;
  sourceCode: string;
  sourceName: string;
  rulesEdition: GeneratedRulesEdition;
  isPrimary2024: boolean;
  isLegacy: boolean;
  isSelectableInBuilder: boolean;
  summary: string | null;
  searchText: string;
  renderPayload: Record<string, unknown> | null;
  categoryTags?: string[];
  metadata?: Record<string, unknown>;
  classId?: string;
}

interface GeneratedCompendiumEntryRecord {
  id: string;
  entityId: string;
  entityType: string;
  name: string;
  sourceCode: string;
  sourceName: string;
  rulesEdition: GeneratedRulesEdition;
  isLegacy: boolean;
  isPrimary2024: boolean;
  isSelectableInBuilder: boolean;
  summary: string | null;
  text: string;
  searchText: string;
  metadata?: Record<string, unknown>;
  renderPayload: Record<string, unknown> | null;
}

interface GeneratedChoiceGrantRecord {
  id: string;
  sourceType: string;
  sourceId: string;
  sourceName: string;
  atLevel: number;
  chooseKind: string;
  categoryFilter: string[];
  count: number;
  visibility: 'builder' | 'compendium-only';
}

const CONTENT_VERSION_KEY = 'bundled_content_version';
const SEEDED_AT_KEY = 'bundled_content_seeded_at';

function normalizeRulesEdition(rulesEdition: GeneratedRulesEdition) {
  return rulesEdition === 'legacy' ? '2014' : rulesEdition;
}

function deriveSlug(record: Pick<GeneratedCompendiumEntryRecord, 'entityId' | 'id' | 'name' | 'sourceCode'>) {
  const baseValue = record.entityId || `${record.name}-${record.sourceCode}-${record.id}`;
  return baseValue.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function readSeedMetadata(database: SqlExecutor, key: string) {
  const row = await database.getFirstAsync<SeedMetadataRow>('SELECT value FROM seed_metadata WHERE key = ?', key);
  return row?.value ?? null;
}

async function writeSeedMetadata(database: SqlExecutor, key: string, value: string, updatedAt: string) {
  await database.runAsync(
    `INSERT INTO seed_metadata (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    key,
    value,
    updatedAt,
  );
}

async function clearSeedTables(database: SqlExecutor) {
  await database.execAsync([
    'DELETE FROM content_entities',
    'DELETE FROM choice_grants',
    'DELETE FROM compendium_entries',
  ].map((statement) => `${statement};`).join('\n'));
}

async function insertContentEntity(
  database: SqlExecutor,
  record: GeneratedContentEntityRecord,
  updatedAt: string,
  parentEntityId: string | null = null,
) {
  await database.runAsync(
    `INSERT OR REPLACE INTO content_entities (
       id,
       entity_type,
       parent_entity_id,
       name,
       source_code,
       source_name,
       rules_edition,
       is_legacy,
       is_primary_2024,
       is_selectable_in_builder,
       search_text,
       summary,
       category_tags,
       metadata,
       render_payload,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    record.id,
    record.kind,
    parentEntityId,
    record.name,
    record.sourceCode,
    record.sourceName,
    normalizeRulesEdition(record.rulesEdition),
    record.isLegacy ? 1 : 0,
    record.isPrimary2024 ? 1 : 0,
    record.isSelectableInBuilder ? 1 : 0,
    record.searchText,
    record.summary,
    JSON.stringify(record.categoryTags ?? []),
    JSON.stringify(record.metadata ?? {}),
    JSON.stringify(record.renderPayload ?? null),
    updatedAt,
  );
}

async function insertCompendiumEntry(
  database: SqlExecutor,
  record: GeneratedCompendiumEntryRecord,
  updatedAt: string,
) {
  await database.runAsync(
    `INSERT OR REPLACE INTO compendium_entries (
       id,
       entry_type,
       entity_id,
       name,
       slug,
       source_code,
       source_name,
       rules_edition,
       is_legacy,
       is_primary_2024,
       is_selectable_in_builder,
       summary,
       text,
       search_text,
       scope,
       metadata,
       render_payload,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    record.id,
    record.entityType,
    record.entityId,
    record.name,
    deriveSlug(record),
    record.sourceCode,
    record.sourceName,
    normalizeRulesEdition(record.rulesEdition),
    record.isLegacy ? 1 : 0,
    record.isPrimary2024 ? 1 : 0,
    record.isSelectableInBuilder ? 1 : 0,
    record.summary,
    record.text,
    record.searchText,
    'global',
    JSON.stringify(record.metadata ?? {}),
    JSON.stringify(record.renderPayload ?? null),
    updatedAt,
  );
}

async function insertChoiceGrant(database: SqlExecutor, record: GeneratedChoiceGrantRecord) {
  await database.runAsync(
    `INSERT OR REPLACE INTO choice_grants (
       id,
       source_type,
       source_id,
       source_name,
       at_level,
       choose_kind,
       category_filter,
       count,
       visibility
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    record.id,
    record.sourceType,
    record.sourceId,
    record.sourceName,
    record.atLevel,
    record.chooseKind,
    JSON.stringify(record.categoryFilter),
    record.count,
    record.visibility,
  );
}

async function importChunk(database: SqlExecutor, chunk: BundledContentChunk) {
  const updatedAt = chunk.generatedAt;

  if (chunk.entityType === 'classes') {
    const records = chunk.records as {
      class: GeneratedContentEntityRecord;
      subclasses: GeneratedContentEntityRecord[];
    };

    await insertContentEntity(database, records.class, updatedAt);

    for (const subclass of records.subclasses) {
      await insertContentEntity(database, subclass, updatedAt, subclass.classId ?? records.class.id);
    }

    return;
  }

  if (chunk.entityType === 'grants') {
    const records = chunk.records as GeneratedChoiceGrantRecord[];

    for (const record of records) {
      await insertChoiceGrant(database, record);
    }

    return;
  }

  if (chunk.entityType === 'compendium') {
    const records = chunk.records as GeneratedCompendiumEntryRecord[];

    for (const record of records) {
      await insertCompendiumEntry(database, record, updatedAt);
    }

    return;
  }

  const records = chunk.records as GeneratedContentEntityRecord[];

  for (const record of records) {
    await insertContentEntity(database, record, updatedAt);
  }
}

export async function ensureBundledContentReady(): Promise<BundledContentBootstrapResult> {
  const database = await getDatabase();
  const currentVersion = await readSeedMetadata(database, CONTENT_VERSION_KEY);

  if (currentVersion === bundledContentManifest.contentVersion) {
    logger.info('bundled_content_seed_skipped', {
      contentVersion: bundledContentManifest.contentVersion,
    });

    return {
      seeded: false,
      contentVersion: currentVersion,
    };
  }

  const seededAt = new Date().toISOString();

  await database.withExclusiveTransactionAsync(async (transaction) => {
    await clearSeedTables(transaction);

    for (const manifestChunk of bundledContentManifest.chunks) {
      const chunk = chunkRegistry[manifestChunk.filePath];

      if (!chunk) {
        throw new Error(`Missing bundled content chunk: ${manifestChunk.filePath}`);
      }

      await importChunk(transaction, chunk);
    }

    await writeSeedMetadata(transaction, CONTENT_VERSION_KEY, bundledContentManifest.contentVersion, seededAt);
    await writeSeedMetadata(transaction, SEEDED_AT_KEY, seededAt, seededAt);
  });

  logger.info('bundled_content_seed_completed', {
    contentVersion: bundledContentManifest.contentVersion,
    chunkCount: bundledContentManifest.chunkCount,
  });

  return {
    seeded: true,
    contentVersion: bundledContentManifest.contentVersion,
  };
}
