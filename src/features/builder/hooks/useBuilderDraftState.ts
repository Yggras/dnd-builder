import { useEffect, useRef, useState } from 'react';

import { isBuilderDraftPayload, type BuilderCharacterBuild } from '@/features/builder/types';
import { BuilderService } from '@/features/builder/services/BuilderService';
import type { Character, CharacterBuild } from '@/shared/types/domain';

const builderService = new BuilderService();

type SaveBuildMutation = {
  isPending: boolean;
  mutate: (build: CharacterBuild, options?: { onError?: () => void }) => void;
};

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
  const [draftBuild, setDraftBuild] = useState<BuilderCharacterBuild | null>(null);
  const lastSavedSnapshot = useRef<string | null>(null);
  const [isCompletingBuild, setIsCompletingBuild] = useState(false);

  useEffect(() => {
    if (!data?.character || !data.build) {
      return;
    }

    const syncedBuild: BuilderCharacterBuild = {
      ...data.build,
      payload: isBuilderDraftPayload(data.build.payload)
        ? data.build.payload
        : builderService.createEmptyDraftPayload(data.character.name),
    };

    setDraftBuild(syncedBuild);
    lastSavedSnapshot.current = JSON.stringify(syncedBuild);
  }, [data]);

  useEffect(() => {
    if (!draftBuild || isCompletingBuild) {
      return;
    }

    const nextSnapshot = JSON.stringify(draftBuild);

    if (nextSnapshot === lastSavedSnapshot.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      lastSavedSnapshot.current = nextSnapshot;
      saveBuildMutation.mutate(draftBuild, {
        onError: () => {
          lastSavedSnapshot.current = null;
        },
      });
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [draftBuild, isCompletingBuild, saveBuildMutation]);

  return {
    draftBuild,
    isCompletingBuild,
    lastSavedSnapshot,
    setDraftBuild,
    setIsCompletingBuild,
  };
}
