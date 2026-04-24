export type CampaignRole = 'dm' | 'player';
export type RulesEdition = '2014' | '2024';
export type PendingMutationType = 'create' | 'update' | 'delete';
export type ContentEntityType = 'species' | 'class' | 'subclass' | 'background' | 'feat' | 'optionalfeature' | 'spell' | 'item';
export type ChoiceGrantSourceType = 'class' | 'subclass' | 'feat' | 'optionalfeature';
export type ChoiceGrantKind = 'feat' | 'optionalfeature';
export type BuilderState = 'draft' | 'complete';
export type BuilderStep =
  | 'class'
  | 'spells'
  | 'species'
  | 'background'
  | 'ability-points'
  | 'inventory'
  | 'characteristics'
  | 'notes'
  | 'review';

export interface Campaign {
  id: string;
  name: string;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignMember {
  id: string;
  campaignId: string;
  userId: string;
  role: CampaignRole;
  createdAt: string;
  updatedAt: string;
}

export interface Character {
  id: string;
  ownerUserId: string;
  name: string;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignCharacter {
  id: string;
  campaignId: string;
  characterId: string;
  addedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterBuild {
  characterId: string;
  buildState: BuilderState;
  currentStep: BuilderStep;
  payload: Record<string, unknown>;
  revision: number;
  completionUpdatedAt: string | null;
  updatedAt: string;
}

export interface CampaignCharacterStatus {
  campaignCharacterId: string;
  currentHp: number;
  maxHp: number;
  temporaryHp: number;
  armorClass: number;
  spellSlots: Record<string, { used: number; total: number }>;
  concentration: boolean;
  exhaustionLevel: number;
  activeConditions: string[];
  deathSaves: {
    successes: number;
    failures: number;
  };
  notes: string | null;
  updatedAt: string;
}

export interface CampaignCharacterSnapshot {
  campaignCharacterId: string;
  campaignId: string;
  characterId: string;
  name: string;
  level: number;
  classLabel: string;
  ancestryLabel: string;
  currentHp: number;
  maxHp: number;
  armorClass: number;
  concentration: boolean;
  updatedAt: string;
}

export interface CompendiumEntry {
  id: string;
  entryType: string;
   entityId: string | null;
  name: string;
  slug: string;
  sourceCode: string;
  sourceName: string;
  rulesEdition: RulesEdition;
  isLegacy: boolean;
   isPrimary2024: boolean;
   isSelectableInBuilder: boolean;
  summary: string | null;
  text: string;
  searchText: string;
  scope: 'global';
  metadata: Record<string, unknown>;
  renderPayload: Record<string, unknown> | null;
  updatedAt: string;
}

export interface PendingMutation {
  id: string;
  mutationType: PendingMutationType;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
}

export interface ContentEntity {
  id: string;
  entityType: ContentEntityType;
  parentEntityId: string | null;
  name: string;
  sourceCode: string;
  sourceName: string;
  rulesEdition: RulesEdition;
  isLegacy: boolean;
  isPrimary2024: boolean;
  isSelectableInBuilder: boolean;
  searchText: string;
  summary: string | null;
  categoryTags: string[];
  metadata: Record<string, unknown>;
  renderPayload: Record<string, unknown> | null;
  updatedAt: string;
}

export interface ChoiceGrant {
  id: string;
  sourceType: ChoiceGrantSourceType;
  sourceId: string;
  sourceName: string;
  atLevel: number;
  chooseKind: ChoiceGrantKind;
  categoryFilter: string[];
  count: number;
  visibility: 'builder' | 'compendium-only';
}

export interface ContentSeedState {
  contentVersion: string;
  seededAt: string;
}
