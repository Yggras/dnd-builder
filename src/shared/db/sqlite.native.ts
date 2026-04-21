import * as SQLite from 'expo-sqlite';

import { schemaStatements } from '@/shared/db/schema';

const DATABASE_NAME = 'dnd-builder.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function createDatabase() {
  const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await database.execAsync(schemaStatements.map((statement) => `${statement};`).join('\n'));
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
