import { useCallback, useEffect, useRef, useState } from 'react';

import { isBuilderDraftPayload, type BuilderCharacterBuild } from '@/features/builder/types';
import { BuilderService } from '@/features/builder/services/BuilderService';
import type { Character, CharacterBuild } from '@/shared/types/domain';

const builderService = new BuilderService();

type SaveBuildMutation = {
  isPending: boolean;
  mutateAsync: (build: CharacterBuild) => Promise<CharacterBuild>;
};

export type BuilderSaveStatus = 'saved' | 'dirty' | 'saving' | 'error';

type CharacterRecordData = {
  character: Character | null;
  build: CharacterBuild | null;
} | undefined;

type UseBuilderDraftStateOptions = {
  data: CharacterRecordData;
  saveBuildMutation: SaveBuildMutation;
};

export function useBuilderDraftState({
  data,
  saveBuildMutation,
}: UseBuilderDraftStateOptions) {
  const { mutateAsync } = saveBuildMutation;
  const [draftBuild, setDraftBuild] = useState<BuilderCharacterBuild | null>(null);
  const lastSavedSnapshot = useRef<string | null>(null);
  const latestDraftRef = useRef<BuilderCharacterBuild | null>(null);
  const queuedSaveRef = useRef<BuilderCharacterBuild | null>(null);
  const saveInFlightRef = useRef(false);
  const initializedCharacterIdRef = useRef<string | null>(null);
  const lastFailedSnapshotRef = useRef<string | null>(null);
  const [isCompletingBuild, setIsCompletingBuild] = useState(false);
  const [saveStatus, setSaveStatus] = useState<BuilderSaveStatus>('saved');
  const saveStatusRef = useRef<BuilderSaveStatus>('saved');
  const [saveError, setSaveError] = useState<Error | null>(null);

  const setSaveStatusIfChanged = useCallback((status: BuilderSaveStatus) => {
    if (saveStatusRef.current === status) {
      return;
    }

    saveStatusRef.current = status;
    setSaveStatus(status);
  }, []);

  const buildSnapshot = useCallback((build: CharacterBuild) => JSON.stringify({
    buildState: build.buildState,
    characterId: build.characterId,
    currentStep: build.currentStep,
    payload: build.payload,
  }), []);

  const withSavedMetadata = useCallback((currentBuild: BuilderCharacterBuild, savedBuild: CharacterBuild): BuilderCharacterBuild => ({
    ...currentBuild,
    completionUpdatedAt: savedBuild.completionUpdatedAt,
    revision: savedBuild.revision,
    updatedAt: savedBuild.updatedAt,
  }), []);

  const toBuilderBuild = useCallback((build: CharacterBuild, fallbackPayload: BuilderCharacterBuild['payload']): BuilderCharacterBuild => ({
    ...build,
    payload: isBuilderDraftPayload(build.payload) ? build.payload : fallbackPayload,
  }), []);

  useEffect(() => {
    latestDraftRef.current = draftBuild;
  }, [draftBuild]);

  const saveDraft = useCallback(async (buildToSave: BuilderCharacterBuild): Promise<CharacterBuild> => {
    if (saveInFlightRef.current) {
      queuedSaveRef.current = buildToSave;
      setSaveStatusIfChanged('dirty');
      throw new Error('A builder save is already in progress.');
    }

    const attemptedSnapshot = buildSnapshot(buildToSave);
    saveInFlightRef.current = true;
    setSaveStatusIfChanged('saving');
    setSaveError(null);
    lastFailedSnapshotRef.current = null;
    let savedBuildForQueue: CharacterBuild | null = null;
    let saveFailed = false;

    try {
      const savedBuild = await mutateAsync(buildToSave);
      savedBuildForQueue = savedBuild;
      const savedSnapshot = buildSnapshot(savedBuild);
      lastSavedSnapshot.current = savedSnapshot;
      lastFailedSnapshotRef.current = null;

      setDraftBuild((currentBuild) => {
        if (!currentBuild || currentBuild.characterId !== savedBuild.characterId) {
          return currentBuild;
        }

        const currentSnapshot = buildSnapshot(currentBuild);
        const savedBuilderBuild = toBuilderBuild(savedBuild, currentBuild.payload);

        if (currentSnapshot === attemptedSnapshot || currentSnapshot === savedSnapshot) {
          return savedBuilderBuild;
        }

        return withSavedMetadata(currentBuild, savedBuild);
      });

      return savedBuild;
    } catch (error) {
      saveFailed = true;
      const normalizedError = error instanceof Error ? error : new Error('Unable to save builder draft.');
      setSaveError(normalizedError);
      setSaveStatusIfChanged('error');
      lastSavedSnapshot.current = null;
      lastFailedSnapshotRef.current = attemptedSnapshot;
      throw normalizedError;
    } finally {
      saveInFlightRef.current = false;

      const queuedBuild = queuedSaveRef.current;
      queuedSaveRef.current = null;

      if (queuedBuild && buildSnapshot(queuedBuild) !== lastSavedSnapshot.current) {
        const queuedBuildWithMetadata = savedBuildForQueue ? withSavedMetadata(queuedBuild, savedBuildForQueue) : queuedBuild;

        void saveDraft(queuedBuildWithMetadata).catch(() => {
          // Error state is already captured by saveDraft.
        });
      } else if (!saveFailed) {
        const latestDraft = latestDraftRef.current;
        setSaveStatusIfChanged(
          latestDraft && buildSnapshot(latestDraft) !== lastSavedSnapshot.current
            ? 'dirty'
            : 'saved',
        );
      }
    }
  }, [buildSnapshot, mutateAsync, setSaveStatusIfChanged, toBuilderBuild, withSavedMetadata]);

  useEffect(() => {
    if (!data?.character || !data.build) {
      return;
    }

    const incomingBuild = data.build;
    const syncedBuild: BuilderCharacterBuild = {
      ...incomingBuild,
      payload: isBuilderDraftPayload(incomingBuild.payload)
        ? incomingBuild.payload
        : builderService.createEmptyDraftPayload(data.character.name),
    };

    const syncedSnapshot = buildSnapshot(syncedBuild);

    setDraftBuild((currentBuild) => {
      if (!currentBuild || initializedCharacterIdRef.current !== syncedBuild.characterId) {
        initializedCharacterIdRef.current = syncedBuild.characterId;
        lastSavedSnapshot.current = syncedSnapshot;
        lastFailedSnapshotRef.current = null;
        setSaveStatusIfChanged('saved');
        setSaveError(null);
        return syncedBuild;
      }

      const currentSnapshot = buildSnapshot(currentBuild);
      const hasLocalChanges = currentSnapshot !== lastSavedSnapshot.current;

      if (hasLocalChanges) {
        return incomingBuild.revision > currentBuild.revision
          ? withSavedMetadata(currentBuild, incomingBuild)
          : currentBuild;
      }

      lastSavedSnapshot.current = syncedSnapshot;
      lastFailedSnapshotRef.current = null;
      setSaveStatusIfChanged('saved');
      setSaveError(null);
      return syncedBuild;
    });
  }, [buildSnapshot, data, setSaveStatusIfChanged, withSavedMetadata]);

  useEffect(() => {
    if (!draftBuild || isCompletingBuild) {
      return;
    }

    const nextSnapshot = buildSnapshot(draftBuild);

    if (nextSnapshot === lastSavedSnapshot.current) {
      if (!saveInFlightRef.current) {
        setSaveStatusIfChanged('saved');
      }
      return;
    }

    if (!saveInFlightRef.current && saveStatusRef.current !== 'error') {
      setSaveStatusIfChanged('dirty');
    }

    if (saveStatusRef.current === 'error' && nextSnapshot === lastFailedSnapshotRef.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (saveInFlightRef.current) {
        queuedSaveRef.current = latestDraftRef.current;
        return;
      }

      void saveDraft(draftBuild).catch(() => {
        // Error state is already captured by saveDraft.
      });
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [buildSnapshot, draftBuild, isCompletingBuild, saveDraft, setSaveStatusIfChanged]);

  return {
    draftBuild,
    isCompletingBuild,
    lastSavedSnapshot,
    saveBuildNow: saveDraft,
    saveError,
    saveStatus,
    setDraftBuild,
    setIsCompletingBuild,
  };
}
