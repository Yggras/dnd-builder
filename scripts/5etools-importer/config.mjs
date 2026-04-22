export const IMPORTER_SCHEMA_VERSION = 1;
export const CONTENT_VERSION = '2026-04-21-step-3';
export const SOURCE_REPOSITORY = '5etools-mirror-3/5etools-src';
export const SOURCE_REF = 'main';
export const SOURCE_BASE_URL = `https://raw.githubusercontent.com/${SOURCE_REPOSITORY}/${SOURCE_REF}`;

export const OUTPUT_ROOT = 'generated/5etools';

export const SOURCE_FILES = {
  races: 'data/races.json',
  classIndex: 'data/class/index.json',
  feats: 'data/feats.json',
  optionalFeatures: 'data/optionalfeatures.json',
  spellsIndex: 'data/spells/index.json',
  itemsBase: 'data/items-base.json',
  items: 'data/items.json',
};

export const PRIMARY_2024_SOURCES = new Set(['XPHB']);

export const COMPATIBLE_2024_SOURCES = new Set(['FRHoF', 'XGE', 'TCE', 'FTD', 'BMT', 'AAG', 'SCC', 'EGW']);

export const COMPENDIUM_ENTITY_ORDER = [
  'species',
  'class',
  'subclass',
  'feat',
  'optionalfeature',
  'spell',
  'item',
];
