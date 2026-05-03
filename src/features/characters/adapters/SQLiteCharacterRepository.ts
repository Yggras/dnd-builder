import { BuilderService } from '@/features/builder/services/BuilderService';
import type { CharacterRepository, CreateCharacterDraftInput } from '@/features/characters/repositories/CharacterRepository';
import type { OwnedCharacterListItem } from '@/features/characters/types';
import { getDatabase } from '@/shared/db/sqlite.native';
import type { BuilderStep, Character, CharacterBuild } from '@/shared/types/domain';

interface CharacterRow {
  id: string;
  owner_user_id: string;
  name: string;
  level: number;
  created_at: string;
  updated_at: string;
}

interface CharacterBuildRow {
  character_id: string;
  build_state: CharacterBuild['buildState'];
  current_step: BuilderStep;
  payload: string;
  revision: number;
  completion_updated_at: string | null;
  updated_at: string;
}

interface CharacterRosterRow extends CharacterRow {
  build_state: CharacterBuild['buildState'];
  current_step: BuilderStep;
  payload: string;
  build_updated_at: string;
}

const builderService = new BuilderService();

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `character-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function parseJson(value: string): Record<string, unknown> {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function mapCharacter(row: CharacterRow): Character {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    level: row.level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCharacterBuild(row: CharacterBuildRow): CharacterBuild {
  return {
    characterId: row.character_id,
    buildState: row.build_state,
    currentStep: row.current_step,
    payload: parseJson(row.payload),
    revision: row.revision,
    completionUpdatedAt: row.completion_updated_at,
    updatedAt: row.updated_at,
  };
}

function deriveCharacterName(build: CharacterBuild, fallbackName: string) {
  const payload = build.payload as Record<string, unknown>;
  const characteristicsStep = payload.characteristicsStep;

  if (characteristicsStep && typeof characteristicsStep === 'object') {
    const name = (characteristicsStep as { name?: unknown }).name;

    if (typeof name === 'string' && name.trim().length > 0) {
      return name.trim();
    }
  }

  return fallbackName;
}

function deriveCharacterLevel(build: CharacterBuild, fallbackLevel: number) {
  const payload = build.payload as Record<string, unknown>;
  const classStep = payload.classStep;

  if (classStep && typeof classStep === 'object') {
    const allocations = (classStep as { allocations?: unknown }).allocations;

    if (Array.isArray(allocations) && allocations.length > 0) {
      const totalLevel = allocations.reduce((sum, allocation) => {
        if (!allocation || typeof allocation !== 'object') {
          return sum;
        }

        const level = (allocation as { level?: unknown }).level;
        return sum + (typeof level === 'number' && Number.isFinite(level) && level > 0 ? level : 0);
      }, 0);

      return totalLevel > 0 ? totalLevel : fallbackLevel;
    }
  }

  return fallbackLevel;
}

function formatEntityLabel(entityId: string | null | undefined, fallback: string) {
  if (!entityId) {
    return fallback;
  }

  const [slug] = entityId.split('|');
  return slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()) : fallback;
}

function mapOwnedCharacterListItem(row: CharacterRosterRow): OwnedCharacterListItem {
  const payload = parseJson(row.payload);
  const classStep = payload.classStep as { allocations?: Array<{ classId?: string; level?: number }> } | undefined;
  const speciesStep = payload.speciesStep as { speciesId?: string | null } | undefined;
  const allocations = Array.isArray(classStep?.allocations) ? classStep.allocations : [];

  return {
    id: row.id,
    name: row.name,
    level: row.level,
    buildState: row.build_state,
    currentStep: row.current_step,
    classLabel: formatEntityLabel(allocations[0]?.classId, 'No class yet'),
    speciesLabel: formatEntityLabel(speciesStep?.speciesId, 'No species yet'),
    updatedAt: row.build_updated_at,
  };
}

export class SQLiteCharacterRepository implements CharacterRepository {
  async listCharacters(ownerUserId: string) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<CharacterRosterRow>(
      `SELECT
         characters.id,
         characters.owner_user_id,
         characters.name,
         characters.level,
         characters.created_at,
         characters.updated_at,
         character_builds.build_state,
         character_builds.current_step,
         character_builds.payload,
         character_builds.updated_at AS build_updated_at
       FROM characters
       INNER JOIN character_builds ON character_builds.character_id = characters.id
       WHERE characters.owner_user_id = ?
       ORDER BY character_builds.updated_at DESC, characters.created_at DESC`,
      ownerUserId,
    );

    return rows.map(mapOwnedCharacterListItem);
  }

  async getCharacter(characterId: string) {
    const database = await getDatabase();
    const row = await database.getFirstAsync<CharacterRow>(
      `SELECT *
       FROM characters
       WHERE id = ?`,
      characterId,
    );

    return row ? mapCharacter(row) : null;
  }

  async getBuild(characterId: string) {
    const database = await getDatabase();
    const row = await database.getFirstAsync<CharacterBuildRow>(
      `SELECT *
       FROM character_builds
       WHERE character_id = ?`,
      characterId,
    );

    return row ? mapCharacterBuild(row) : null;
  }

  async createDraft(input: CreateCharacterDraftInput) {
    const database = await getDatabase();
    const characterId = createId();
    const timestamp = new Date().toISOString();
    const payload = builderService.createEmptyDraftPayload(input.name.trim());

    await database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        `INSERT INTO characters (id, owner_user_id, name, level, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        characterId,
        input.ownerUserId,
        input.name.trim(),
        1,
        timestamp,
        timestamp,
      );

      await transaction.runAsync(
        `INSERT INTO character_builds (
           character_id,
           build_state,
           current_step,
           payload,
           revision,
           completion_updated_at,
           updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        characterId,
        builderService.initialState,
        builderService.initialStep,
        JSON.stringify(payload),
        1,
        null,
        timestamp,
      );
    });

    return {
      character: {
        id: characterId,
        ownerUserId: input.ownerUserId,
        name: input.name.trim(),
        level: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      build: {
        characterId,
        buildState: builderService.initialState,
        currentStep: builderService.initialStep,
        payload,
        revision: 1,
        completionUpdatedAt: null,
        updatedAt: timestamp,
      },
    };
  }

  async saveBuild(build: CharacterBuild) {
    const database = await getDatabase();
    const existingCharacter = await this.getCharacter(build.characterId);

    if (!existingCharacter) {
      throw new Error('Character not found for build save.');
    }

    let savedBuild: CharacterBuild | null = null;

    await database.withExclusiveTransactionAsync(async (transaction) => {
      const currentBuildRow = await transaction.getFirstAsync<CharacterBuildRow>(
        `SELECT *
         FROM character_builds
         WHERE character_id = ?`,
        build.characterId,
      );

      if (!currentBuildRow) {
        throw new Error('Character build not found for save.');
      }

      if (build.revision < currentBuildRow.revision) {
        throw new Error('Stale character build save rejected.');
      }

      const timestamp = new Date().toISOString();
      const characterName = deriveCharacterName(build, existingCharacter.name);
      const characterLevel = deriveCharacterLevel(build, existingCharacter.level);
      const nextRevision = currentBuildRow.revision + 1;
      const completionUpdatedAt = build.buildState === 'complete' ? timestamp : null;

      await transaction.runAsync(
        `UPDATE characters
         SET name = ?, level = ?, updated_at = ?
         WHERE id = ?`,
        characterName,
        characterLevel,
        timestamp,
        build.characterId,
      );

      await transaction.runAsync(
        `UPDATE character_builds
         SET build_state = ?,
             current_step = ?,
             payload = ?,
             revision = ?,
             completion_updated_at = ?,
             updated_at = ?
         WHERE character_id = ?`,
        build.buildState,
        build.currentStep,
        JSON.stringify(build.payload),
        nextRevision,
        completionUpdatedAt,
        timestamp,
        build.characterId,
      );

      savedBuild = {
        ...build,
        revision: nextRevision,
        completionUpdatedAt,
        updatedAt: timestamp,
      };
    });

    if (!savedBuild) {
      throw new Error('Character build save failed.');
    }

    return savedBuild;
  }
}
