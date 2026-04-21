import * as SQLite from 'expo-sqlite';

import { schemaStatements } from '@/shared/db/schema';

const DATABASE_NAME = 'dnd-builder.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

interface TableColumnInfo {
  name: string;
}

async function ensureColumn(
  database: SQLite.SQLiteDatabase,
  tableName: string,
  columnName: string,
  columnDefinition: string,
) {
  const columns = await database.getAllAsync<TableColumnInfo>(`PRAGMA table_info(${tableName})`);

  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  await database.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition};`);
}

async function ensureSchemaCompatibility(database: SQLite.SQLiteDatabase) {
  await ensureColumn(database, 'compendium_entries', 'entity_id', 'entity_id TEXT');
  await ensureColumn(
    database,
    'compendium_entries',
    'is_primary_2024',
    'is_primary_2024 INTEGER NOT NULL DEFAULT 0',
  );
  await ensureColumn(
    database,
    'compendium_entries',
    'is_selectable_in_builder',
    'is_selectable_in_builder INTEGER NOT NULL DEFAULT 0',
  );
}

async function createDatabase() {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await database.execAsync(schemaStatements.map((statement) => `${statement};`).join('\n'));
  await ensureSchemaCompatibility(database);
  return database;
}

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = createDatabase();
  }

  return databasePromise;
}

export async function initializeDatabase() {
  await getDatabase();
}
