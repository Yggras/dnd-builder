export type CampaignRole = 'dm' | 'player';
export type RulesEdition = '2014' | '2024';
export type PendingMutationType = 'create' | 'update' | 'delete';

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
  campaignId: string;
  ownerUserId: string;
  name: string;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterBuild {
  characterId: string;
  classId: string | null;
  subclassId: string | null;
  speciesId: string | null;
  backgroundId: string | null;
  abilityScores: Record<string, number>;
  selectedProficiencies: string[];
  selectedLanguages: string[];
  selectedFeatIds: string[];
  preparedSpellIds: string[];
  inventoryItemIds: string[];
  notes: string | null;
  overrides: Record<string, unknown>;
  updatedAt: string;
}

export interface CharacterStatus {
  characterId: string;
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

export interface CharacterSnapshot {
  characterId: string;
  campaignId: string;
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
  name: string;
  slug: string;
  sourceCode: string;
  sourceName: string;
  rulesEdition: RulesEdition;
  isLegacy: boolean;
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
