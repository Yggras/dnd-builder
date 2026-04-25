import { useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';

import { BuilderService } from '@/features/builder/services/BuilderService';
import type { BuilderCharacterBuild, BuilderDraftPayload, BuilderValidationSummary } from '@/features/builder/types';
import { reconcileClassStepPayload } from '@/features/builder/utils/classStep';
import { reconcileOriginAndAbilitiesPayload } from '@/features/builder/utils/originAndAbilities';
import { deriveSourceSummary, mergeReviewIssues, summarizeSpellcasting } from '@/features/builder/utils/spellReview';
import type { ChoiceGrant, ContentEntity } from '@/shared/types/domain';

const builderService = new BuilderService();

type UseBuilderReconciliationOptions = {
  allEntitiesById: Record<string, ContentEntity>;
  allSpellsLoading: boolean;
  backgroundEntitiesById: Record<string, ContentEntity>;
  backgroundsLoading: boolean;
  classEntitiesById: Record<string, ContentEntity>;
  classesLoading: boolean;
  draftBuild: BuilderCharacterBuild | null;
  featEntitiesById: Record<string, ContentEntity>;
  featsLoading: boolean;
  grantOptionsByGrantId: Record<string, ContentEntity[]>;
  grantsByClassId: Record<string, ChoiceGrant[]>;
  setDraftBuild: Dispatch<SetStateAction<BuilderCharacterBuild | null>>;
  speciesEntitiesById: Record<string, ContentEntity>;
  speciesLoading: boolean;
  spellEntitiesById: Record<string, ContentEntity>;
  subclassEntitiesById: Record<string, ContentEntity>;
};

export function useBuilderReconciliation({
  allEntitiesById,
  allSpellsLoading,
  backgroundEntitiesById,
  backgroundsLoading,
  classEntitiesById,
  classesLoading,
  draftBuild,
  featEntitiesById,
  featsLoading,
  grantOptionsByGrantId,
  grantsByClassId,
  setDraftBuild,
  speciesEntitiesById,
  speciesLoading,
  spellEntitiesById,
  subclassEntitiesById,
}: UseBuilderReconciliationOptions) {
  useEffect(() => {
    if (!draftBuild || classesLoading) {
      return;
    }

    const { payload: reconciledPayload } = reconcileClassStepPayload({
      payload: draftBuild.payload,
      classEntitiesById,
      grantsByClassId,
      grantOptionsByGrantId,
    });

    const currentIssuesSnapshot = JSON.stringify(draftBuild.payload.review.issues);
    const nextIssuesSnapshot = JSON.stringify(reconciledPayload.review.issues);

    if (currentIssuesSnapshot === nextIssuesSnapshot) {
      return;
    }

    setDraftBuild({
      ...draftBuild,
      payload: reconciledPayload,
    });
  }, [draftBuild, classesLoading, classEntitiesById, grantsByClassId, grantOptionsByGrantId, setDraftBuild]);

  useEffect(() => {
    if (!draftBuild || classesLoading || speciesLoading || backgroundsLoading || featsLoading) {
      return;
    }

    const { payload: reconciledPayload } = reconcileOriginAndAbilitiesPayload({
      payload: draftBuild.payload,
      classEntitiesById,
      speciesEntitiesById,
      backgroundEntitiesById,
      featEntitiesById,
    });

    const currentIssuesSnapshot = JSON.stringify(draftBuild.payload.review.issues);
    const nextIssuesSnapshot = JSON.stringify(reconciledPayload.review.issues);
    const currentAbilitySnapshot = JSON.stringify(draftBuild.payload.abilityPointsStep);
    const nextAbilitySnapshot = JSON.stringify(reconciledPayload.abilityPointsStep);
    const currentSpeciesSnapshot = JSON.stringify(draftBuild.payload.speciesStep);
    const nextSpeciesSnapshot = JSON.stringify(reconciledPayload.speciesStep);
    const currentBackgroundSnapshot = JSON.stringify(draftBuild.payload.backgroundStep);
    const nextBackgroundSnapshot = JSON.stringify(reconciledPayload.backgroundStep);

    if (
      currentIssuesSnapshot === nextIssuesSnapshot &&
      currentAbilitySnapshot === nextAbilitySnapshot &&
      currentSpeciesSnapshot === nextSpeciesSnapshot &&
      currentBackgroundSnapshot === nextBackgroundSnapshot
    ) {
      return;
    }

    setDraftBuild({
      ...draftBuild,
      payload: reconciledPayload,
    });
  }, [
    draftBuild,
    classesLoading,
    speciesLoading,
    backgroundsLoading,
    featsLoading,
    classEntitiesById,
    speciesEntitiesById,
    backgroundEntitiesById,
    featEntitiesById,
    setDraftBuild,
  ]);

  useEffect(() => {
    if (!draftBuild || allSpellsLoading) {
      return;
    }

    const spellSummary = summarizeSpellcasting(
      draftBuild.payload,
      classEntitiesById,
      subclassEntitiesById,
      spellEntitiesById,
    );
    const nextIssues = mergeReviewIssues(draftBuild.payload, spellSummary.issues);
    const nextSourceSummary = deriveSourceSummary(draftBuild.payload, allEntitiesById);
    const issuesSnapshot = JSON.stringify(draftBuild.payload.review.issues);
    const nextIssuesSnapshot = JSON.stringify(nextIssues);
    const sourceSummarySnapshot = JSON.stringify(draftBuild.payload.review.sourceSummary);
    const nextSourceSummarySnapshot = JSON.stringify(nextSourceSummary);

    if (issuesSnapshot === nextIssuesSnapshot && sourceSummarySnapshot === nextSourceSummarySnapshot) {
      if (draftBuild.buildState === 'complete' && builderService.canComplete(draftBuild.payload.review.issues) === false) {
        setDraftBuild({
          ...draftBuild,
          buildState: 'draft',
        });
      }

      return;
    }

    const nextPayload: BuilderDraftPayload = {
      ...draftBuild.payload,
      review: {
        issues: nextIssues,
        sourceSummary: nextSourceSummary,
      },
    };

    setDraftBuild({
      ...draftBuild,
      buildState: draftBuild.buildState === 'complete' && builderService.canComplete(nextIssues) ? 'complete' : 'draft',
      payload: nextPayload,
    });
  }, [
    allSpellsLoading,
    allEntitiesById,
    draftBuild,
    classEntitiesById,
    spellEntitiesById,
    subclassEntitiesById,
    setDraftBuild,
  ]);

  return useMemo<BuilderValidationSummary | null>(() => {
    if (!draftBuild) {
      return null;
    }

    return builderService.summarizeIssues(draftBuild.payload.review.issues);
  }, [draftBuild]);
}
