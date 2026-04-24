import type { CompendiumRepository } from '@/features/compendium/repositories/CompendiumRepository';
import type { ContentRepository, ItemQueryOptions, SpellQueryOptions } from '@/features/content/repositories/ContentRepository';
import { getDatabase } from '@/shared/db/sqlite.native';
import type { ChoiceGrant, CompendiumEntry, ContentEntity, RulesEdition } from '@/shared/types/domain';

interface ContentEntityRow {
  id: string;
  entity_type: ContentEntity['entityType'];
  parent_entity_id: string | null;
  name: string;
  source_code: string;
  source_name: string;
  rules_edition: RulesEdition;
  is_legacy: number;
  is_primary_2024: number;
  is_selectable_in_builder: number;
  search_text: string;
  summary: string | null;
  category_tags: string;
  metadata: string;
  render_payload: string | null;
  updated_at: string;
}

interface CompendiumEntryRow {
  id: string;
  entry_type: string;
  entity_id: string | null;
  name: string;
  slug: string;
  source_code: string;
  source_name: string;
  rules_edition: RulesEdition;
  is_legacy: number;
  is_primary_2024: number;
  is_selectable_in_builder: number;
  summary: string | null;
  text: string;
  search_text: string;
  scope: 'global';
  metadata: string;
  render_payload: string | null;
  updated_at: string;
}

interface ChoiceGrantRow {
  id: string;
  source_type: ChoiceGrant['sourceType'];
  source_id: string;
  source_name: string;
  at_level: number;
  choose_kind: ChoiceGrant['chooseKind'];
  category_filter: string;
  count: number;
  visibility: ChoiceGrant['visibility'];
}

const SEARCH_RESULT_LIMIT = 100;

function isEquipmentMetadata(metadata: Record<string, unknown>) {
  const category = typeof metadata.category === 'string' ? metadata.category.toLowerCase() : null;
  const rarity = typeof metadata.rarity === 'string' ? metadata.rarity.toLowerCase() : null;

  return category === 'basic' || rarity == null || rarity === 'none';
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function mapContentEntity(row: ContentEntityRow): ContentEntity {
  return {
    id: row.id,
    entityType: row.entity_type,
    parentEntityId: row.parent_entity_id,
    name: row.name,
    sourceCode: row.source_code,
    sourceName: row.source_name,
    rulesEdition: row.rules_edition,
    isLegacy: Boolean(row.is_legacy),
    isPrimary2024: Boolean(row.is_primary_2024),
    isSelectableInBuilder: Boolean(row.is_selectable_in_builder),
    searchText: row.search_text,
    summary: row.summary,
    categoryTags: parseJson<string[]>(row.category_tags, []),
    metadata: parseJson<Record<string, unknown>>(row.metadata, {}),
    renderPayload: parseJson<Record<string, unknown> | null>(row.render_payload, null),
    updatedAt: row.updated_at,
  };
}

function mapCompendiumEntry(row: CompendiumEntryRow): CompendiumEntry {
  return {
    id: row.id,
    entryType: row.entry_type,
    entityId: row.entity_id,
    name: row.name,
    slug: row.slug,
    sourceCode: row.source_code,
    sourceName: row.source_name,
    rulesEdition: row.rules_edition,
    isLegacy: Boolean(row.is_legacy),
    isPrimary2024: Boolean(row.is_primary_2024),
    isSelectableInBuilder: Boolean(row.is_selectable_in_builder),
    summary: row.summary,
    text: row.text,
    searchText: row.search_text,
    scope: row.scope,
    metadata: parseJson<Record<string, unknown>>(row.metadata, {}),
    renderPayload: parseJson<Record<string, unknown> | null>(row.render_payload, null),
    updatedAt: row.updated_at,
  };
}

function mapChoiceGrant(row: ChoiceGrantRow): ChoiceGrant {
  return {
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    sourceName: row.source_name,
    atLevel: row.at_level,
    chooseKind: row.choose_kind,
    categoryFilter: parseJson<string[]>(row.category_filter, []),
    count: row.count,
    visibility: row.visibility,
  };
}

function matchesSelectableFilter(entity: ContentEntity, onlySelectableInBuilder: boolean) {
  return !onlySelectableInBuilder || entity.isSelectableInBuilder;
}

function spellMatchesClassFilter(entity: ContentEntity, classId?: string) {
  if (!classId) {
    return true;
  }

  const metadataValue = JSON.stringify(entity.metadata).toLowerCase();
  const className = classId.split('|')[0]?.replace(/-/g, ' ').toLowerCase();
  return className ? metadataValue.includes(className) : true;
}

export class SQLiteContentRepository implements ContentRepository, CompendiumRepository {
  private async getContentRows(entityType: ContentEntity['entityType']) {
    const database = await getDatabase();
    return database.getAllAsync<ContentEntityRow>(
      `SELECT *
       FROM content_entities
       WHERE entity_type = ?
       ORDER BY is_primary_2024 DESC, is_selectable_in_builder DESC, name ASC, source_code ASC`,
      entityType,
    );
  }

  async listSpecies(onlySelectableInBuilder: boolean = true) {
    const rows = await this.getContentRows('species');
    return rows.map(mapContentEntity).filter((entity) => matchesSelectableFilter(entity, onlySelectableInBuilder));
  }

  async listBackgrounds(onlySelectableInBuilder: boolean = true) {
    const rows = await this.getContentRows('background');
    return rows.map(mapContentEntity).filter((entity) => matchesSelectableFilter(entity, onlySelectableInBuilder));
  }

  async listClasses(onlySelectableInBuilder: boolean = true) {
    const rows = await this.getContentRows('class');
    return rows.map(mapContentEntity).filter((entity) => matchesSelectableFilter(entity, onlySelectableInBuilder));
  }

  async listSubclasses(classId: string, onlySelectableInBuilder: boolean = true) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<ContentEntityRow>(
      `SELECT *
       FROM content_entities
       WHERE entity_type = 'subclass' AND parent_entity_id = ?
       ORDER BY is_primary_2024 DESC, is_selectable_in_builder DESC, name ASC, source_code ASC`,
      classId,
    );

    return rows.map(mapContentEntity).filter((entity) => matchesSelectableFilter(entity, onlySelectableInBuilder));
  }

  async listFeats(categoryTag?: string, onlySelectableInBuilder: boolean = true) {
    const rows = await this.getContentRows('feat');

    return rows
      .map(mapContentEntity)
      .filter((entity) => matchesSelectableFilter(entity, onlySelectableInBuilder))
      .filter((entity) => !categoryTag || entity.categoryTags.includes(categoryTag));
  }

  async listOptionalFeatures(featureType?: string, onlySelectableInBuilder: boolean = true) {
    const rows = await this.getContentRows('optionalfeature');

    return rows
      .map(mapContentEntity)
      .filter((entity) => matchesSelectableFilter(entity, onlySelectableInBuilder))
      .filter((entity) => !featureType || entity.categoryTags.includes(featureType));
  }

  async listSpells(options: SpellQueryOptions = {}) {
    const rows = await this.getContentRows('spell');

    return rows
      .map(mapContentEntity)
      .filter((entity) => matchesSelectableFilter(entity, options.onlySelectableInBuilder ?? true))
      .filter((entity) => (options.level == null ? true : Number(entity.metadata.level ?? -1) === options.level))
      .filter((entity) => spellMatchesClassFilter(entity, options.classId))
      .filter((entity) =>
        options.query ? entity.searchText.toLowerCase().includes(options.query.trim().toLowerCase()) : true,
      );
  }

  async listItems(options: ItemQueryOptions = {}) {
    const rows = await this.getContentRows('item');

    return rows
      .map(mapContentEntity)
      .filter((entity) => matchesSelectableFilter(entity, options.onlySelectableInBuilder ?? true))
      .filter((entity) =>
        options.query ? entity.searchText.toLowerCase().includes(options.query.trim().toLowerCase()) : true,
      );
  }

  async listChoiceGrants(sourceId: string) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<ChoiceGrantRow>(
      `SELECT *
       FROM choice_grants
       WHERE source_id = ?
       ORDER BY at_level ASC, choose_kind ASC, id ASC`,
      sourceId,
    );

    return rows.map(mapChoiceGrant);
  }

  async searchCompendiumEntries(query: string, entryType?: string) {
    const database = await getDatabase();
    const normalizedQuery = `%${query.trim().toLowerCase()}%`;
    let rows: CompendiumEntryRow[];

    if (entryType === 'equipment') {
      rows = await database.getAllAsync<CompendiumEntryRow>(
        `SELECT *
         FROM compendium_entries
         WHERE entry_type = 'item'
           AND LOWER(search_text) LIKE ?
           AND (
             LOWER(COALESCE(json_extract(metadata, '$.category'), '')) = 'basic'
             OR json_extract(metadata, '$.rarity') IS NULL
             OR LOWER(COALESCE(json_extract(metadata, '$.rarity'), '')) = 'none'
           )
         ORDER BY is_primary_2024 DESC, is_selectable_in_builder DESC, name ASC, source_code ASC
         LIMIT ${SEARCH_RESULT_LIMIT}`,
        normalizedQuery,
      );
    } else if (entryType === 'magicitem') {
      rows = await database.getAllAsync<CompendiumEntryRow>(
        `SELECT *
         FROM compendium_entries
         WHERE entry_type = 'item'
           AND LOWER(search_text) LIKE ?
           AND NOT (
             LOWER(COALESCE(json_extract(metadata, '$.category'), '')) = 'basic'
             OR json_extract(metadata, '$.rarity') IS NULL
             OR LOWER(COALESCE(json_extract(metadata, '$.rarity'), '')) = 'none'
           )
         ORDER BY is_primary_2024 DESC, is_selectable_in_builder DESC, name ASC, source_code ASC
         LIMIT ${SEARCH_RESULT_LIMIT}`,
        normalizedQuery,
      );
    } else {
      rows = await database.getAllAsync<CompendiumEntryRow>(
        entryType
          ? `SELECT *
             FROM compendium_entries
             WHERE entry_type = ? AND LOWER(search_text) LIKE ?
             ORDER BY is_primary_2024 DESC, is_selectable_in_builder DESC, name ASC, source_code ASC
             LIMIT ${SEARCH_RESULT_LIMIT}`
          : `SELECT *
             FROM compendium_entries
             WHERE LOWER(search_text) LIKE ?
             ORDER BY is_primary_2024 DESC, is_selectable_in_builder DESC, name ASC, source_code ASC
             LIMIT ${SEARCH_RESULT_LIMIT}`,
        ...(entryType ? [entryType, normalizedQuery] : [normalizedQuery]),
      );
    }

    return rows
      .map(mapCompendiumEntry)
      .filter((entry) => {
        if (entryType === 'equipment') {
          return entry.entryType === 'item' && isEquipmentMetadata(entry.metadata);
        }

        if (entryType === 'magicitem') {
          return entry.entryType === 'item' && !isEquipmentMetadata(entry.metadata);
        }

        return true;
      });
  }

  searchEntries(query: string, entryType?: string) {
    return this.searchCompendiumEntries(query, entryType);
  }

  async getEntryById(id: string) {
    const database = await getDatabase();
    const row = await database.getFirstAsync<CompendiumEntryRow>(
      `SELECT *
       FROM compendium_entries
       WHERE id = ?`,
      id,
    );

    return row ? mapCompendiumEntry(row) : null;
  }
}
