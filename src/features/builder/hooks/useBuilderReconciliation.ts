import { useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';

import { BuilderService } from '@/features/builder/services/BuilderService';
import type { BuilderCharacterBuild, BuilderDraftPayload, BuilderValidationSummary } from '@/features/builder/types';
import { reconcileClassStepPayload } from '@/features/builder/utils/classStep';
import { reconcileInventoryPayload } from '@/features/builder/utils/inventory';
import { reconcileOriginAndAbilitiesPayload } from '@/features/builder/utils/originAndAbilities';
import { deriveSourceSummary, mergeReviewIssues, summarizeSpellcasting } from '@/features/builder/utils/spellReview';
import type { ChoiceGrant, ContentEntity } from '@/shared/types/domain';

const builderService = new BuilderService();

function getBuildStateAfterReconciliation(build: BuilderCharacterBuild, issues: BuilderDraftPayload['review']['issues']) {
  return build.buildState === 'complete' && !builderService.canComplete(issues) ? 'draft' : build.buildState;
}

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

    const { payload: preflightPayload } = reconcileClassStepPayload({
      payload: draftBuild.payload,
      classEntitiesById,
      grantsByClassId,
      grantOptionsByGrantId,
    });
    const preflightBuildState = getBuildStateAfterReconciliation(draftBuild, preflightPayload.review.issues);

    if (
      JSON.stringify(draftBuild.payload.classStep) === JSON.stringify(preflightPayload.classStep) &&
      JSON.stringify(draftBuild.payload.review.issues) === JSON.stringify(preflightPayload.review.issues) &&
      draftBuild.buildState === preflightBuildState
    ) {
      return;
    }

    setDraftBuild((currentBuild) => {
      if (!currentBuild) {
        return currentBuild;
      }

      const { payload: reconciledPayload } = reconcileClassStepPayload({
        payload: currentBuild.payload,
        classEntitiesById,
        grantsByClassId,
        grantOptionsByGrantId,
      });

      const currentClassSnapshot = JSON.stringify(currentBuild.payload.classStep);
      const nextClassSnapshot = JSON.stringify(reconciledPayload.classStep);
      const currentIssuesSnapshot = JSON.stringify(currentBuild.payload.review.issues);
      const nextIssuesSnapshot = JSON.stringify(reconciledPayload.review.issues);

      if (currentClassSnapshot === nextClassSnapshot && currentIssuesSnapshot === nextIssuesSnapshot) {
        return currentBuild;
      }

      return {
        ...currentBuild,
        buildState: getBuildStateAfterReconciliation(currentBuild, reconciledPayload.review.issues),
        payload: reconciledPayload,
      };
    });
  }, [draftBuild, classesLoading, classEntitiesById, grantsByClassId, grantOptionsByGrantId, setDraftBuild]);

  useEffect(() => {
    if (!draftBuild || classesLoading || speciesLoading || backgroundsLoading || featsLoading) {
      return;
    }

    const { payload: preflightPayload } = reconcileOriginAndAbilitiesPayload({
      payload: draftBuild.payload,
      classEntitiesById,
      speciesEntitiesById,
      backgroundEntitiesById,
      featEntitiesById,
    });
    const preflightBuildState = getBuildStateAfterReconciliation(draftBuild, preflightPayload.review.issues);

    if (
      JSON.stringify(draftBuild.payload.review.issues) === JSON.stringify(preflightPayload.review.issues) &&
      JSON.stringify(draftBuild.payload.abilityPointsStep) === JSON.stringify(preflightPayload.abilityPointsStep) &&
      JSON.stringify(draftBuild.payload.speciesStep) === JSON.stringify(preflightPayload.speciesStep) &&
      JSON.stringify(draftBuild.payload.backgroundStep) === JSON.stringify(preflightPayload.backgroundStep) &&
      draftBuild.buildState === preflightBuildState
    ) {
      return;
    }

    setDraftBuild((currentBuild) => {
      if (!currentBuild) {
        return currentBuild;
      }

      const { payload: reconciledPayload } = reconcileOriginAndAbilitiesPayload({
        payload: currentBuild.payload,
        classEntitiesById,
        speciesEntitiesById,
        backgroundEntitiesById,
        featEntitiesById,
      });

      const currentIssuesSnapshot = JSON.stringify(currentBuild.payload.review.issues);
      const nextIssuesSnapshot = JSON.stringify(reconciledPayload.review.issues);
      const currentAbilitySnapshot = JSON.stringify(currentBuild.payload.abilityPointsStep);
      const nextAbilitySnapshot = JSON.stringify(reconciledPayload.abilityPointsStep);
      const currentSpeciesSnapshot = JSON.stringify(currentBuild.payload.speciesStep);
      const nextSpeciesSnapshot = JSON.stringify(reconciledPayload.speciesStep);
      const currentBackgroundSnapshot = JSON.stringify(currentBuild.payload.backgroundStep);
      const nextBackgroundSnapshot = JSON.stringify(reconciledPayload.backgroundStep);

      if (
        currentIssuesSnapshot === nextIssuesSnapshot &&
        currentAbilitySnapshot === nextAbilitySnapshot &&
        currentSpeciesSnapshot === nextSpeciesSnapshot &&
        currentBackgroundSnapshot === nextBackgroundSnapshot
      ) {
        return currentBuild;
      }

      return {
        ...currentBuild,
        buildState: getBuildStateAfterReconciliation(currentBuild, reconciledPayload.review.issues),
        payload: reconciledPayload,
      };
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
    if (!draftBuild || classesLoading || backgroundsLoading) {
      return;
    }

    const preflightPayload = reconcileInventoryPayload({
      payload: draftBuild.payload,
      classEntitiesById,
      backgroundEntitiesById,
    });
    const preflightBuildState = getBuildStateAfterReconciliation(draftBuild, preflightPayload.review.issues);

    if (
      JSON.stringify(draftBuild.payload.inventoryStep) === JSON.stringify(preflightPayload.inventoryStep) &&
      JSON.stringify(draftBuild.payload.review.issues) === JSON.stringify(preflightPayload.review.issues) &&
      draftBuild.buildState === preflightBuildState
    ) {
      return;
    }

    setDraftBuild((currentBuild) => {
      if (!currentBuild) {
        return currentBuild;
      }

      const reconciledPayload = reconcileInventoryPayload({
        payload: currentBuild.payload,
        classEntitiesById,
        backgroundEntitiesById,
      });
      const currentInventorySnapshot = JSON.stringify(currentBuild.payload.inventoryStep);
      const nextInventorySnapshot = JSON.stringify(reconciledPayload.inventoryStep);
      const currentIssuesSnapshot = JSON.stringify(currentBuild.payload.review.issues);
      const nextIssuesSnapshot = JSON.stringify(reconciledPayload.review.issues);

      if (currentInventorySnapshot === nextInventorySnapshot && currentIssuesSnapshot === nextIssuesSnapshot) {
        return currentBuild;
      }

      return {
        ...currentBuild,
        buildState: getBuildStateAfterReconciliation(currentBuild, reconciledPayload.review.issues),
        payload: reconciledPayload,
      };
    });
  }, [
    draftBuild,
    classesLoading,
    backgroundsLoading,
    classEntitiesById,
    backgroundEntitiesById,
    setDraftBuild,
  ]);

  useEffect(() => {
    if (!draftBuild || allSpellsLoading) {
      return;
    }

    const preflightSpellSummary = summarizeSpellcasting(
      draftBuild.payload,
      classEntitiesById,
      subclassEntitiesById,
      spellEntitiesById,
    );
    const preflightIssues = mergeReviewIssues(draftBuild.payload, preflightSpellSummary.issues);
    const preflightSourceSummary = deriveSourceSummary(draftBuild.payload, allEntitiesById);
    const preflightBuildState = draftBuild.buildState === 'complete' && builderService.canComplete(preflightIssues) ? 'complete' : 'draft';

    if (
      JSON.stringify(draftBuild.payload.review.issues) === JSON.stringify(preflightIssues) &&
      JSON.stringify(draftBuild.payload.review.sourceSummary) === JSON.stringify(preflightSourceSummary) &&
      draftBuild.buildState === preflightBuildState
    ) {
      return;
    }

    setDraftBuild((currentBuild) => {
      if (!currentBuild) {
        return currentBuild;
      }

      const spellSummary = summarizeSpellcasting(
        currentBuild.payload,
        classEntitiesById,
        subclassEntitiesById,
        spellEntitiesById,
      );
      const nextIssues = mergeReviewIssues(currentBuild.payload, spellSummary.issues);
      const nextSourceSummary = deriveSourceSummary(currentBuild.payload, allEntitiesById);
      const issuesSnapshot = JSON.stringify(currentBuild.payload.review.issues);
      const nextIssuesSnapshot = JSON.stringify(nextIssues);
      const sourceSummarySnapshot = JSON.stringify(currentBuild.payload.review.sourceSummary);
      const nextSourceSummarySnapshot = JSON.stringify(nextSourceSummary);

      if (issuesSnapshot === nextIssuesSnapshot && sourceSummarySnapshot === nextSourceSummarySnapshot) {
        if (currentBuild.buildState === 'complete' && builderService.canComplete(currentBuild.payload.review.issues) === false) {
          return {
            ...currentBuild,
            buildState: 'draft',
          };
        }

        return currentBuild;
      }

      const nextPayload: BuilderDraftPayload = {
        ...currentBuild.payload,
        review: {
          issues: nextIssues,
          sourceSummary: nextSourceSummary,
        },
      };

      return {
        ...currentBuild,
        buildState: currentBuild.buildState === 'complete' && builderService.canComplete(nextIssues) ? 'complete' : 'draft',
        payload: nextPayload,
      };
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
