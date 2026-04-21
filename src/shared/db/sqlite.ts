type WebDatabase = {
  kind: 'web-memory';
};

let databasePromise: Promise<WebDatabase> | null = null;

async function createDatabase(): Promise<WebDatabase> {
  return { kind: 'web-memory' };
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
