import { SOURCE_BASE_URL } from './config.mjs';

export async function fetchJson(relativePath) {
  const response = await fetch(`${SOURCE_BASE_URL}/${relativePath}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${relativePath}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function fetchJsonMap(relativePaths) {
  const entries = await Promise.all(
    relativePaths.map(async (relativePath) => [relativePath, await fetchJson(relativePath)]),
  );

  return Object.fromEntries(entries);
}
