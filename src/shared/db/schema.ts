export const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    owner_user_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS campaign_members (
    id TEXT PRIMARY KEY NOT NULL,
    campaign_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS characters (
     id TEXT PRIMARY KEY NOT NULL,
     owner_user_id TEXT NOT NULL,
     name TEXT NOT NULL,
     level INTEGER NOT NULL,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS character_builds (
    character_id TEXT PRIMARY KEY NOT NULL,
    payload TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS campaign_characters (
     id TEXT PRIMARY KEY NOT NULL,
     campaign_id TEXT NOT NULL,
     character_id TEXT NOT NULL,
     added_by_user_id TEXT NOT NULL,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL,
     UNIQUE(campaign_id, character_id)
   )`,
  `CREATE TABLE IF NOT EXISTS campaign_character_statuses (
     campaign_character_id TEXT PRIMARY KEY NOT NULL,
     payload TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS campaign_character_snapshots (
     campaign_character_id TEXT PRIMARY KEY NOT NULL,
     payload TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS compendium_entries (
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
   )`,
  `CREATE TABLE IF NOT EXISTS content_entities (
     id TEXT PRIMARY KEY NOT NULL,
     entity_type TEXT NOT NULL,
     parent_entity_id TEXT,
     name TEXT NOT NULL,
     source_code TEXT NOT NULL,
     source_name TEXT NOT NULL,
     rules_edition TEXT NOT NULL,
     is_legacy INTEGER NOT NULL DEFAULT 0,
     is_primary_2024 INTEGER NOT NULL DEFAULT 0,
     is_selectable_in_builder INTEGER NOT NULL DEFAULT 0,
     search_text TEXT NOT NULL,
     summary TEXT,
     category_tags TEXT NOT NULL,
     metadata TEXT NOT NULL,
     render_payload TEXT,
     updated_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS choice_grants (
     id TEXT PRIMARY KEY NOT NULL,
     source_type TEXT NOT NULL,
     source_id TEXT NOT NULL,
     source_name TEXT NOT NULL,
     at_level INTEGER NOT NULL,
     choose_kind TEXT NOT NULL,
     category_filter TEXT NOT NULL,
     count INTEGER NOT NULL,
     visibility TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS seed_metadata (
     key TEXT PRIMARY KEY NOT NULL,
     value TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS pending_mutations (
     id TEXT PRIMARY KEY NOT NULL,
     mutation_type TEXT NOT NULL,
     entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS sync_metadata (
     key TEXT PRIMARY KEY NOT NULL,
     value TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_content_entities_type ON content_entities(entity_type)`,
  `CREATE INDEX IF NOT EXISTS idx_content_entities_parent ON content_entities(parent_entity_id)`,
  `CREATE INDEX IF NOT EXISTS idx_content_entities_builder ON content_entities(entity_type, is_selectable_in_builder, is_primary_2024)`,
  `CREATE INDEX IF NOT EXISTS idx_campaign_characters_campaign ON campaign_characters(campaign_id)`,
  `CREATE INDEX IF NOT EXISTS idx_campaign_characters_character ON campaign_characters(character_id)`,
  `CREATE INDEX IF NOT EXISTS idx_choice_grants_source ON choice_grants(source_id, at_level)`,
  `CREATE INDEX IF NOT EXISTS idx_compendium_entries_type ON compendium_entries(entry_type)`,
];
