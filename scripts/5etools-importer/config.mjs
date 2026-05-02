export const IMPORTER_SCHEMA_VERSION = 1;
export const SOURCE_REPOSITORY = '5etools-mirror-3/5etools-src';
export const SOURCE_REF = 'main';
export const SOURCE_BASE_URL = `https://raw.githubusercontent.com/${SOURCE_REPOSITORY}/${SOURCE_REF}`;

export const OUTPUT_ROOT = 'generated/5etools';

export const SOURCE_FILES = {
  races: 'data/races.json',
  classIndex: 'data/class/index.json',
  backgrounds: 'data/backgrounds.json',
  backgroundFluff: 'data/fluff-backgrounds.json',
  feats: 'data/feats.json',
  optionalFeatures: 'data/optionalfeatures.json',
  spellsIndex: 'data/spells/index.json',
  spellSourceLookup: 'data/generated/gendata-spell-source-lookup.json',
  itemsBase: 'data/items-base.json',
  items: 'data/items.json',
  conditionsDiseases: 'data/conditionsdiseases.json',
  actions: 'data/actions.json',
  variantRules: 'data/variantrules.json',
};

export const PRIMARY_2024_SOURCES = new Set(['XPHB', 'EFA']);

export const COMPATIBLE_2024_SOURCES = new Set(['FRHoF', 'XGE', 'TCE', 'FTD', 'BMT', 'AAG', 'SCC', 'EGW']);

export const COMPENDIUM_ENTITY_ORDER = [
  'species',
  'class',
  'subclass',
  'background',
  'feat',
  'optionalfeature',
  'spell',
  'item',
  'condition',
  'action',
  'variantrule',
];
