import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BuilderClassCard } from '@/features/builder/components/BuilderClassCard';
import { BuilderClassDetailSheet } from '@/features/builder/components/BuilderClassDetailSheet';
import { BuilderFeatureChoiceGroup } from '@/features/builder/components/BuilderFeatureChoiceGroup';
import { BuilderFeatureOptionDetailSheet } from '@/features/builder/components/BuilderFeatureOptionDetailSheet';
import { BuilderImpactConfirmationSheet } from '@/features/builder/components/BuilderImpactConfirmationSheet';
import { BuilderSubclassCard } from '@/features/builder/components/BuilderSubclassCard';
import { BuilderSubclassDetailSheet } from '@/features/builder/components/BuilderSubclassDetailSheet';
import type { BuilderDraftPayload } from '@/features/builder/types';
import { getClassEditionBadge } from '@/features/builder/utils/classMetadata';
import {
  buildCompendiumReturnQuery,
  type BuilderCompendiumReturnContext,
} from '@/features/builder/utils/compendiumReturn';
import { getFeatAbilityFollowUpText } from '@/features/builder/utils/originAndAbilities';
import { getCompendiumEntryIdFromEntityId } from '@/features/compendium/utils/catalog';
import type { ChoiceGrant, ContentEntity } from '@/shared/types/domain';
import {
  formatSkillLabel,
  getSubclassUnlockLevel,
  type ClassFeatureRequirements,
} from '@/features/builder/utils/classStep';
import { theme, typography } from '@/shared/ui/theme';

interface BuilderStepClassProps {
  characterId: string;
  payload: BuilderDraftPayload;
  classEntitiesById: Record<string, ContentEntity>;
  subclassesByClassId: Record<string, readonly ContentEntity[]>;
  applicableGrants: readonly ChoiceGrant[];
  asiFeatOptions: readonly ContentEntity[];
  grantOptionsByGrantId: Record<string, readonly ContentEntity[]>;
  classFeatureRequirements: ClassFeatureRequirements;
  availableClasses: readonly ContentEntity[];
  totalAllocatedLevel: number;
  classImpactSummary: string | null;
  returnContext: BuilderCompendiumReturnContext | null;
  onConsumeReturnContext: () => void;
  addClassAllocation: (classId: string) => void;
  updateAllocation: (
    allocationId: string,
    updater: (current: BuilderDraftPayload['classStep']['allocations'][number]) => BuilderDraftPayload['classStep']['allocations'][number],
  ) => void;
  removeAllocation: (allocationId: string) => void;
  updateFeatureSelection: (grantId: string, optionId: string, count: number) => void;
  toggleClassSkillProficiency: (requirementId: string, skill: string) => void;
  updateClassAsiFeatMode: (requirementId: string, mode: 'asi' | 'feat') => void;
  updateClassAsiFeatSelection: (requirementId: string, featId: string) => void;
}

type SubclassDetailTarget = {
  allocationId: string;
  subclassId: string;
};

type SubclassChangeTarget = {
  allocationId: string;
  subclassId: string | null;
};

type FeatureOptionDetailTarget = {
  grantId: string;
  optionId: string;
};

type AsiFeatDetailTarget = {
  requirementId: string;
  featId: string;
};

type DecisionItem =
  | { kind: 'skill-proficiency'; level: number; requirementId: string }
  | { kind: 'asi-feat'; level: number; requirementId: string }
  | { kind: 'subclass'; level: number }
  | { kind: 'grant'; level: number; grant: ChoiceGrant };

const DECISION_KIND_ORDER: Record<DecisionItem['kind'], number> = {
  'skill-proficiency': 0,
  subclass: 1,
  grant: 2,
  'asi-feat': 3,
};

const FEAT_TYPE_LABELS: Record<string, string> = {
  EB: 'Boon',
  G: 'General',
  O: 'Origin',
};

function getFeatTypeLabel(feat: ContentEntity) {
  const category = feat.categoryTags.find((tag) => FEAT_TYPE_LABELS[tag]) ??
    (typeof feat.metadata.category === 'string' ? feat.metadata.category : null);

  return category ? FEAT_TYPE_LABELS[category] ?? category : 'Feat';
}

function getFeatOptionMeta(feat: ContentEntity) {
  return [feat.sourceCode, getClassEditionBadge(feat), getFeatTypeLabel(feat)].filter(Boolean).join(' • ');
}

function getAllocationStatusLabel(payload: BuilderDraftPayload, allocation: BuilderDraftPayload['classStep']['allocations'][number]) {
  const allocationIssues = payload.review.issues.filter(
    (issue) =>
      issue.step === 'class' &&
      !issue.resolvedByOverride &&
      (issue.id.includes(allocation.id) || issue.id.includes(allocation.classId) || issue.id === 'duplicate-class-allocations'),
  );

  if (allocationIssues.some((issue) => issue.category === 'blocker' || issue.category === 'checklist')) {
    return 'Fix';
  }

  if (allocationIssues.some((issue) => issue.category === 'notice')) {
    return 'Need';
  }

  return 'OK';
}

function buildRemovalImpacts(allocation: BuilderDraftPayload['classStep']['allocations'][number], classEntity?: ContentEntity) {
  const impacts = [`${classEntity?.name ?? 'This class'} will be removed from the build.`];

  if (allocation.subclassId) {
    impacts.push('Subclass selection will be cleared.');
  }

  impacts.push('Class-owned feature choices and spell selections will be reconciled after removal.');

  return impacts;
}

function getSubclassIssues(payload: BuilderDraftPayload, allocationId: string) {
  return payload.review.issues.filter((issue) => issue.step === 'class' && !issue.resolvedByOverride && issue.id === `subclass-required-${allocationId}`);
}

function getGrantIssues(payload: BuilderDraftPayload, grantId: string) {
  return payload.review.issues.filter(
    (issue) => issue.step === 'class' && !issue.resolvedByOverride && (issue.id === `grant-options-${grantId}` || issue.id === `grant-selection-${grantId}`),
  );
}

function getSkillRequirementIssues(payload: BuilderDraftPayload, requirementId: string) {
  return payload.review.issues.filter((issue) => issue.step === 'class' && !issue.resolvedByOverride && issue.id === `class-skill-proficiency-${requirementId}`);
}

function getAsiFeatRequirementIssues(payload: BuilderDraftPayload, requirementId: string) {
  return payload.review.issues.filter(
    (issue) =>
      issue.step === 'class' &&
      !issue.resolvedByOverride &&
      (issue.id === `class-asi-feat-mode-${requirementId}` || issue.id === `class-asi-feat-selection-${requirementId}`),
  );
}

function getDecisionStatus(issues: readonly { category: string }[]) {
  if (issues.some((issue) => issue.category === 'blocker' || issue.category === 'checklist')) {
    return 'Fix';
  }

  if (issues.some((issue) => issue.category === 'notice')) {
    return 'Need';
  }

  return 'OK';
}

function hasSubclassDependentSelections(payload: BuilderDraftPayload) {
  return Array.isArray(payload.spellsStep.selections) && payload.spellsStep.selections.length > 0;
}

function buildSubclassChangeImpacts() {
  return ['Existing spell selections may need review after this subclass change.'];
}

export function BuilderStepClass({
  characterId,
  payload,
  classEntitiesById,
  subclassesByClassId,
  applicableGrants,
  asiFeatOptions,
  grantOptionsByGrantId,
  classFeatureRequirements,
  availableClasses,
  totalAllocatedLevel,
  classImpactSummary,
  returnContext,
  onConsumeReturnContext,
  addClassAllocation,
  updateAllocation,
  removeAllocation,
  updateFeatureSelection,
  toggleClassSkillProficiency,
  updateClassAsiFeatMode,
  updateClassAsiFeatSelection,
}: BuilderStepClassProps) {
  const router = useRouter();
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [detailClassId, setDetailClassId] = useState<string | null>(null);
  const [detailSubclass, setDetailSubclass] = useState<SubclassDetailTarget | null>(null);
  const [detailFeatureOption, setDetailFeatureOption] = useState<FeatureOptionDetailTarget | null>(null);
  const [detailAsiFeat, setDetailAsiFeat] = useState<AsiFeatDetailTarget | null>(null);
  const [pendingRemoveAllocationId, setPendingRemoveAllocationId] = useState<string | null>(null);
  const [pendingSubclassChange, setPendingSubclassChange] = useState<SubclassChangeTarget | null>(null);
  const [sectionExpandedByKey, setSectionExpandedByKey] = useState<Record<string, boolean>>({});
  const hasSelectedClass = payload.classStep.allocations.length > 0;
  const detailClass = detailClassId ? classEntitiesById[detailClassId] ?? availableClasses.find((entry) => entry.id === detailClassId) ?? null : null;
  const detailClassIsSelected = Boolean(detailClassId && payload.classStep.allocations.some((allocation) => allocation.classId === detailClassId));
  const detailSubclassAllocation = detailSubclass ? payload.classStep.allocations.find((allocation) => allocation.id === detailSubclass.allocationId) ?? null : null;
  const detailSubclassEntity = detailSubclassAllocation && detailSubclass ? (subclassesByClassId[detailSubclassAllocation.classId] ?? []).find((subclass) => subclass.id === detailSubclass.subclassId) ?? null : null;
  const detailSubclassUnlockLevel = detailSubclassAllocation ? getSubclassUnlockLevel(classEntitiesById[detailSubclassAllocation.classId]) : null;
  const detailSubclassIsLocked = detailSubclassAllocation ? detailSubclassUnlockLevel != null && detailSubclassAllocation.level < detailSubclassUnlockLevel : false;
  const detailSubclassIsSelected = Boolean(detailSubclassAllocation && detailSubclassEntity && detailSubclassAllocation.subclassId === detailSubclassEntity.id);
  const detailGrant = detailFeatureOption ? applicableGrants.find((grant) => grant.id === detailFeatureOption.grantId) ?? null : null;
  const detailGrantOptions = detailGrant ? grantOptionsByGrantId[detailGrant.id] ?? [] : [];
  const detailFeatureOptionEntity = detailFeatureOption ? detailGrantOptions.find((option) => option.id === detailFeatureOption.optionId) ?? null : null;
  const detailSelectedOptionIds = detailGrant ? payload.classStep.featureChoices.find((selection) => selection.grantId === detailGrant.id)?.selectedOptionIds ?? [] : [];
  const detailFeatureIsSelected = detailFeatureOptionEntity ? detailSelectedOptionIds.includes(detailFeatureOptionEntity.id) : false;
  const detailFeatureIsFull = detailGrant ? detailSelectedOptionIds.length >= detailGrant.count : false;
  const detailSelectedOptionNames = detailSelectedOptionIds.map((optionId) => detailGrantOptions.find((option) => option.id === optionId)?.name ?? optionId);
  const detailAsiFeatRequirement = detailAsiFeat ? classFeatureRequirements.asiFeatChoices.find((requirement) => requirement.id === detailAsiFeat.requirementId) ?? null : null;
  const detailAsiFeatEntity = detailAsiFeat ? asiFeatOptions.find((feat) => feat.id === detailAsiFeat.featId) ?? null : null;
  const detailAsiFeatSelection = detailAsiFeat ? payload.classStep.asiFeatChoices.find((selection) => selection.requirementId === detailAsiFeat.requirementId) ?? null : null;
  const detailAsiFeatIsSelected = Boolean(detailAsiFeatEntity && detailAsiFeatSelection?.selectedFeatId === detailAsiFeatEntity.id);
  const pendingRemoveAllocation = payload.classStep.allocations.find((allocation) => allocation.id === pendingRemoveAllocationId) ?? null;
  const pendingRemoveClass = pendingRemoveAllocation ? classEntitiesById[pendingRemoveAllocation.classId] : undefined;

  useEffect(() => {
    if (!returnContext || returnContext.phaseId !== 'class') {
      return;
    }

    if (returnContext.sheet === 'class' && returnContext.classId) {
      setDetailClassId(returnContext.classId);
      onConsumeReturnContext();
      return;
    }

    if (returnContext.sheet === 'subclass' && returnContext.allocationId && returnContext.subclassId) {
      setDetailSubclass({ allocationId: returnContext.allocationId, subclassId: returnContext.subclassId });
      onConsumeReturnContext();
      return;
    }

    if (returnContext.sheet === 'feature' && returnContext.grantId && returnContext.optionId) {
      setDetailFeatureOption({ grantId: returnContext.grantId, optionId: returnContext.optionId });
      onConsumeReturnContext();
      return;
    }

    if (returnContext.sheet === 'asi-feat' && returnContext.requirementId && returnContext.featId) {
      setDetailAsiFeat({ requirementId: returnContext.requirementId, featId: returnContext.featId });
      onConsumeReturnContext();
    }
  }, [onConsumeReturnContext, returnContext]);

  useEffect(() => {
    const validSectionKeys = new Set<string>();

    for (const allocation of payload.classStep.allocations) {
      const subclassOptions = allocation.classId ? subclassesByClassId[allocation.classId] ?? [] : [];
      if (subclassOptions.length > 0) {
        validSectionKeys.add(`subclass:${allocation.id}`);
      }

      for (const requirement of classFeatureRequirements.skillProficiencies.filter((entry) => entry.classAllocationId === allocation.id)) {
        validSectionKeys.add(`skill:${requirement.id}`);
      }

      for (const requirement of classFeatureRequirements.asiFeatChoices.filter((entry) => entry.classAllocationId === allocation.id)) {
        validSectionKeys.add(`asi:${requirement.id}`);
      }

      for (const grant of applicableGrants.filter((entry) => entry.sourceId === allocation.classId)) {
        validSectionKeys.add(`grant:${grant.id}`);
      }
    }

    setSectionExpandedByKey((currentState) => {
      const nextEntries = Object.entries(currentState).filter(([key]) => validSectionKeys.has(key));
      if (nextEntries.length === Object.keys(currentState).length) {
        return currentState;
      }

      return Object.fromEntries(nextEntries);
    });
  }, [applicableGrants, classFeatureRequirements, payload.classStep.allocations, subclassesByClassId]);

  const toggleSectionExpanded = (sectionKey: string, defaultExpanded: boolean) => {
    setSectionExpandedByKey((currentState) => ({
      ...currentState,
      [sectionKey]: !(currentState[sectionKey] ?? defaultExpanded),
    }));
  };

  const openCompendiumForClass = (classEntity: ContentEntity) => {
    router.push(`/(app)/compendium/class/${encodeURIComponent(classEntity.id)}${buildCompendiumReturnQuery({
      characterId,
      phaseId: 'class',
      sheet: 'class',
      classId: classEntity.id,
    })}` as never);
  };

  const openCompendiumForEntity = (entity: ContentEntity, context: BuilderCompendiumReturnContext) => {
    router.push(`/(app)/compendium/${encodeURIComponent(getCompendiumEntryIdFromEntityId(entity.id))}${buildCompendiumReturnQuery(context)}` as never);
  };

  const renderClassPicker = (classes: readonly ContentEntity[]) => (
    <View style={styles.classCardList}>
      {classes.map((classEntity) => (
        <BuilderClassCard key={classEntity.id} classEntity={classEntity} onPress={() => setDetailClassId(classEntity.id)} />
      ))}
      {classes.length === 0 ? <Text style={styles.emptyHint}>No additional builder-selectable classes are available.</Text> : null}
    </View>
  );

  const confirmClassChoice = () => {
    if (!detailClass || detailClassIsSelected) {
      setDetailClassId(null);
      return;
    }

    addClassAllocation(detailClass.id);
    setShowClassPicker(false);
    setDetailClassId(null);
  };

  const confirmRemoveClass = () => {
    if (!pendingRemoveAllocation) {
      setPendingRemoveAllocationId(null);
      return;
    }

    removeAllocation(pendingRemoveAllocation.id);
    setPendingRemoveAllocationId(null);
    setShowClassPicker(false);
  };

  const applySubclassChange = (change: SubclassChangeTarget) => {
    updateAllocation(change.allocationId, (current) => ({ ...current, subclassId: change.subclassId }));
    setDetailSubclass(null);
  };

  const requestSubclassChange = (change: SubclassChangeTarget) => {
    const allocation = payload.classStep.allocations.find((entry) => entry.id === change.allocationId);
    const changesExistingSubclass = Boolean(allocation?.subclassId && allocation.subclassId !== change.subclassId);

    if (changesExistingSubclass && hasSubclassDependentSelections(payload)) {
      setPendingSubclassChange(change);
      return;
    }

    applySubclassChange(change);
  };

  const confirmSubclassChange = () => {
    if (pendingSubclassChange) {
      applySubclassChange(pendingSubclassChange);
    }

    setPendingSubclassChange(null);
  };

  const chooseFeatureOption = () => {
    if (!detailGrant || !detailFeatureOptionEntity || (!detailFeatureIsSelected && detailFeatureIsFull)) {
      return;
    }

    updateFeatureSelection(detailGrant.id, detailFeatureOptionEntity.id, detailGrant.count);
    setDetailFeatureOption(null);
  };

  const chooseAsiFeatOption = () => {
    if (!detailAsiFeatRequirement || !detailAsiFeatEntity) {
      return;
    }

    updateClassAsiFeatSelection(detailAsiFeatRequirement.id, detailAsiFeatEntity.id);
    setDetailAsiFeat(null);
  };

  return (
    <View style={styles.section}>
      {!hasSelectedClass ? renderClassPicker(availableClasses) : null}

      {hasSelectedClass ? (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Selected classes</Text>
            <Text style={styles.sectionMeta}>Total level {totalAllocatedLevel}</Text>
          </View>

          {classImpactSummary ? <Text style={styles.impactBanner}>{classImpactSummary}</Text> : null}

          <View style={styles.allocationList}>
            {payload.classStep.allocations.map((allocation) => {
              const classEntity = classEntitiesById[allocation.classId];
              const subclassOptions = allocation.classId ? subclassesByClassId[allocation.classId] ?? [] : [];
              const subclassUnlockLevel = classEntity ? getSubclassUnlockLevel(classEntity) : null;
              const subclassDecisionLevel = subclassUnlockLevel ?? 3;
              const statusLabel = getAllocationStatusLabel(payload, allocation);
              const classGrants = applicableGrants.filter((grant) => grant.sourceId === allocation.classId);
              const skillRequirements = classFeatureRequirements.skillProficiencies.filter((requirement) => requirement.classAllocationId === allocation.id);
              const asiFeatRequirements = classFeatureRequirements.asiFeatChoices.filter((requirement) => requirement.classAllocationId === allocation.id);
              const skillSelections = Array.isArray(payload.classStep.skillProficiencies) ? payload.classStep.skillProficiencies : [];
              const asiFeatSelections = Array.isArray(payload.classStep.asiFeatChoices) ? payload.classStep.asiFeatChoices : [];
              const decisionItems: DecisionItem[] = [
                ...skillRequirements.map((requirement): DecisionItem => ({ kind: 'skill-proficiency', level: requirement.level, requirementId: requirement.id })),
                ...classGrants.map((grant): DecisionItem => ({ kind: 'grant', level: grant.atLevel, grant })),
                ...(subclassOptions.length > 0 ? [{ kind: 'subclass' as const, level: subclassDecisionLevel }] : []),
                ...asiFeatRequirements.map((requirement): DecisionItem => ({ kind: 'asi-feat', level: requirement.level, requirementId: requirement.id })),
              ].sort((left, right) => left.level - right.level || DECISION_KIND_ORDER[left.kind] - DECISION_KIND_ORDER[right.kind]);

              return (
                <View key={allocation.id} style={styles.allocationCard}>
                  <View style={styles.allocationHeader}>
                    <View style={styles.allocationHeading}>
                      <View style={styles.allocationTitleRow}>
                        <Text style={styles.allocationTitle}>{classEntity?.name ?? 'Unknown class'}</Text>
                        <View style={[styles.statusBadge, statusLabel === 'Fix' && styles.statusBadgeFix, statusLabel === 'Need' && styles.statusBadgeNeed]}>
                          <Text style={[styles.statusBadgeLabel, statusLabel === 'Fix' && styles.statusBadgeLabelFix]}>{statusLabel}</Text>
                        </View>
                      </View>
                      {classEntity ? (
                        <View style={styles.badgeRow}>
                          <View style={[styles.editionBadge, classEntity.isLegacy && styles.legacyBadge]}>
                            <Text style={[styles.editionBadgeLabel, classEntity.isLegacy && styles.legacyBadgeLabel]}>{getClassEditionBadge(classEntity)}</Text>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.levelControlBlock}>
                    <View style={styles.levelControls}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={allocation.level <= 1}
                        onPress={() => updateAllocation(allocation.id, (current) => ({ ...current, level: Math.max(1, current.level - 1) }))}
                        style={({ pressed }) => [styles.levelButton, pressed && styles.levelButtonPressed, allocation.level <= 1 && styles.levelButtonDisabled]}
                      >
                        <Text style={styles.levelButtonLabel}>-</Text>
                      </Pressable>
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelBadgeLabel}>Level {allocation.level}</Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        disabled={totalAllocatedLevel >= 20}
                        onPress={() => updateAllocation(allocation.id, (current) => ({ ...current, level: current.level + 1 }))}
                        style={({ pressed }) => [styles.levelButton, pressed && styles.levelButtonPressed, totalAllocatedLevel >= 20 && styles.levelButtonDisabled]}
                      >
                        <Text style={styles.levelButtonLabel}>+</Text>
                      </Pressable>
                    </View>
                    <Text style={styles.levelHelp}>Combined class levels cannot exceed 20. Level changes can unlock or clear class decisions.</Text>
                  </View>

                  <View style={styles.summaryActionRow}>
                    {classEntity ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setDetailClassId(classEntity.id)}
                        style={({ pressed }) => [styles.secondaryActionButton, pressed && styles.secondaryActionButtonPressed]}
                      >
                        <Text style={styles.secondaryActionLabel}>Details</Text>
                      </Pressable>
                    ) : null}
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setPendingRemoveAllocationId(allocation.id)}
                      style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
                    >
                      <Text style={styles.removeButtonLabel}>Remove</Text>
                    </Pressable>
                  </View>

                  {decisionItems.length > 0 ? (
                    <View style={styles.decisionList}>
                      {decisionItems.map((decision) => {
                        if (decision.kind === 'skill-proficiency') {
                          const requirement = skillRequirements.find((entry) => entry.id === decision.requirementId);
                          if (!requirement) return null;

                          const selection = skillSelections.find((candidate) => candidate.requirementId === requirement.id);
                          const selectedSkills = selection?.selectedSkills ?? [];
                          const issues = getSkillRequirementIssues(payload, requirement.id);
                          const status = getDecisionStatus(issues);
                          const sectionKey = `skill:${requirement.id}`;
                          const isExpanded = sectionExpandedByKey[sectionKey] ?? (status === 'Fix');

                          return (
                            <View key={requirement.id} style={styles.decisionBlock}>
                              <View style={styles.decisionHeader}>
                                <View style={styles.decisionHeaderCopy}>
                                  <Text style={styles.decisionTitle}>Skill Proficiencies</Text>
                                  <Text style={styles.decisionMeta}>Level {requirement.level} • {selectedSkills.length}/{requirement.count} selected</Text>
                                </View>
                                <View style={[styles.statusBadge, status === 'Fix' && styles.statusBadgeFix, status === 'Need' && styles.statusBadgeNeed]}>
                                  <Text style={[styles.statusBadgeLabel, status === 'Fix' && styles.statusBadgeLabelFix]}>{status}</Text>
                                </View>
                              </View>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => toggleSectionExpanded(sectionKey, status === 'Fix')}
                                style={({ pressed }) => [styles.expandButton, pressed && styles.expandButtonPressed]}
                              >
                                <Text style={styles.expandButtonLabel}>{isExpanded ? 'Hide details' : 'Show details'}</Text>
                              </Pressable>
                              {isExpanded && issues.length > 0 ? (
                                <View style={styles.issueList}>
                                  {issues.map((issue) => <Text key={issue.id} style={styles.issueText}>{issue.summary}</Text>)}
                                </View>
                              ) : null}
                              {isExpanded ? (
                                <View style={styles.optionChipWrap}>
                                {requirement.options.map((skill) => {
                                  const isSelected = selectedSkills.includes(skill);
                                  const isFull = selectedSkills.length >= requirement.count;
                                  return (
                                    <Pressable
                                      accessibilityRole="button"
                                      disabled={!isSelected && isFull}
                                      key={skill}
                                      onPress={() => toggleClassSkillProficiency(requirement.id, skill)}
                                      style={({ pressed }) => [
                                        styles.optionChip,
                                        isSelected && styles.optionChipActive,
                                        !isSelected && isFull && styles.optionChipDisabled,
                                        pressed && styles.optionChipPressed,
                                      ]}
                                    >
                                      <Text style={[styles.optionChipLabel, isSelected && styles.optionChipLabelActive]}>{formatSkillLabel(skill)}</Text>
                                    </Pressable>
                                  );
                                })}
                                </View>
                              ) : null}
                            </View>
                          );
                        }

                        if (decision.kind === 'subclass') {
                          const subclassIssues = getSubclassIssues(payload, allocation.id);
                          const isLocked = allocation.level < decision.level;
                          const status = getDecisionStatus(subclassIssues);
                          const selectedSubclass = allocation.subclassId ? subclassesByClassId[allocation.classId]?.find((subclass) => subclass.id === allocation.subclassId) ?? null : null;
                          const sectionKey = `subclass:${allocation.id}`;
                          const isExpanded = sectionExpandedByKey[sectionKey] ?? (status === 'Fix');

                          return (
                            <View key={`subclass-${allocation.id}`} style={styles.decisionBlock}>
                              <View style={styles.decisionHeader}>
                                <View style={styles.decisionHeaderCopy}>
                                  <Text style={styles.decisionTitle}>Subclass</Text>
                                  <Text style={styles.decisionMeta}>Level {decision.level} • {selectedSubclass ? selectedSubclass.name : isLocked ? 'Locked' : 'Not selected'}</Text>
                                </View>
                                <View style={[styles.statusBadge, status === 'Fix' && styles.statusBadgeFix, status === 'Need' && styles.statusBadgeNeed]}>
                                  <Text style={[styles.statusBadgeLabel, status === 'Fix' && styles.statusBadgeLabelFix]}>{status}</Text>
                                </View>
                              </View>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => toggleSectionExpanded(sectionKey, status === 'Fix')}
                                style={({ pressed }) => [styles.expandButton, pressed && styles.expandButtonPressed]}
                              >
                                <Text style={styles.expandButtonLabel}>{isExpanded ? 'Hide details' : 'Show details'}</Text>
                              </Pressable>
                              {isExpanded && subclassIssues.length > 0 ? (
                                <View style={styles.issueList}>
                                  {subclassIssues.map((issue) => <Text key={issue.id} style={styles.issueText}>{issue.summary}</Text>)}
                                </View>
                              ) : null}
                              {isExpanded ? (
                                <View style={styles.subclassCardList}>
                                {subclassOptions.map((subclass) => (
                                  <BuilderSubclassCard
                                    key={subclass.id}
                                    subclass={subclass}
                                    isLocked={isLocked}
                                    isSelected={allocation.subclassId === subclass.id}
                                    unlockLevel={decision.level}
                                    onPress={() => setDetailSubclass({ allocationId: allocation.id, subclassId: subclass.id })}
                                  />
                                ))}
                                </View>
                              ) : null}
                            </View>
                          );
                        }

                        if (decision.kind === 'asi-feat') {
                          const requirement = asiFeatRequirements.find((entry) => entry.id === decision.requirementId);
                          if (!requirement) return null;

                          const selection = asiFeatSelections.find((candidate) => candidate.requirementId === requirement.id);
                          const selectedFeat = selection?.selectedFeatId ? asiFeatOptions.find((feat) => feat.id === selection.selectedFeatId) ?? null : null;
                          const selectedFeatFollowUpText = selectedFeat ? getFeatAbilityFollowUpText(selectedFeat) : null;
                          const issues = getAsiFeatRequirementIssues(payload, requirement.id);
                          const status = getDecisionStatus(issues);
                          const sectionKey = `asi:${requirement.id}`;
                          const isExpanded = sectionExpandedByKey[sectionKey] ?? (status === 'Fix');
                          const modeSummary = selection?.mode === 'asi'
                            ? 'Ability Increase'
                            : selection?.mode === 'feat'
                              ? selectedFeat ? `Feat: ${selectedFeat.name}` : 'Feat choice required'
                              : 'Choice required';

                          return (
                            <View key={requirement.id} style={styles.decisionBlock}>
                              <View style={styles.decisionHeader}>
                                <View style={styles.decisionHeaderCopy}>
                                  <Text style={styles.decisionTitle}>Ability Score Improvement</Text>
                                  <Text style={styles.decisionMeta}>Level {requirement.level} • {modeSummary}</Text>
                                </View>
                                <View style={[styles.statusBadge, status === 'Fix' && styles.statusBadgeFix, status === 'Need' && styles.statusBadgeNeed]}>
                                  <Text style={[styles.statusBadgeLabel, status === 'Fix' && styles.statusBadgeLabelFix]}>{status}</Text>
                                </View>
                              </View>
                              <Pressable
                                accessibilityRole="button"
                                onPress={() => toggleSectionExpanded(sectionKey, status === 'Fix')}
                                style={({ pressed }) => [styles.expandButton, pressed && styles.expandButtonPressed]}
                              >
                                <Text style={styles.expandButtonLabel}>{isExpanded ? 'Hide details' : 'Show details'}</Text>
                              </Pressable>
                              {isExpanded && issues.length > 0 ? (
                                <View style={styles.issueList}>
                                  {issues.map((issue) => <Text key={issue.id} style={styles.issueText}>{issue.summary}</Text>)}
                                </View>
                              ) : null}
                              {isExpanded ? (
                                <>
                              <View style={styles.optionChipWrap}>
                                <Pressable
                                  accessibilityRole="button"
                                  onPress={() => updateClassAsiFeatMode(requirement.id, 'asi')}
                                  style={({ pressed }) => [styles.optionChip, selection?.mode === 'asi' && styles.optionChipActive, pressed && styles.optionChipPressed]}
                                >
                                  <Text style={[styles.optionChipLabel, selection?.mode === 'asi' && styles.optionChipLabelActive]}>Ability Increase</Text>
                                </Pressable>
                                <Pressable
                                  accessibilityRole="button"
                                  onPress={() => updateClassAsiFeatMode(requirement.id, 'feat')}
                                  style={({ pressed }) => [styles.optionChip, selection?.mode === 'feat' && styles.optionChipActive, pressed && styles.optionChipPressed]}
                                >
                                  <Text style={[styles.optionChipLabel, selection?.mode === 'feat' && styles.optionChipLabelActive]}>Feat</Text>
                                </Pressable>
                              </View>
                              {selection?.mode === 'asi' ? (
                                <Text style={styles.decisionHelp}>This feature contributes 2 points in the Ability Points phase.</Text>
                              ) : null}
                              {selection?.mode === 'feat' ? (
                                <View style={styles.featOptionList}>
                                  {selectedFeat ? <Text style={styles.decisionHelp}>Selected feat: {selectedFeat.name}</Text> : null}
                                  {selectedFeatFollowUpText ? <Text style={styles.decisionHelp}>{selectedFeatFollowUpText}</Text> : null}
                                  {asiFeatOptions.map((feat) => {
                                    const isSelected = selection.selectedFeatId === feat.id;
                                    return (
                                      <Pressable
                                        accessibilityRole="button"
                                        key={feat.id}
                                        onPress={() => setDetailAsiFeat({ requirementId: requirement.id, featId: feat.id })}
                                        style={({ pressed }) => [styles.featOptionRow, isSelected && styles.featOptionRowActive, pressed && styles.featOptionRowPressed]}
                                      >
                                        <Text style={[styles.featOptionTitle, isSelected && styles.featOptionTitleActive]}>{feat.name}</Text>
                                        <Text style={styles.featOptionMeta}>{getFeatOptionMeta(feat)}</Text>
                                      </Pressable>
                                    );
                                  })}
                                </View>
                              ) : null}
                                </>
                              ) : null}
                            </View>
                          );
                        }

                        const selectedOptionIds = payload.classStep.featureChoices.find((selection) => selection.grantId === decision.grant.id)?.selectedOptionIds ?? [];
                        const options = grantOptionsByGrantId[decision.grant.id] ?? [];
                        const grantIssues = getGrantIssues(payload, decision.grant.id);
                        const featureStatus = getDecisionStatus(grantIssues);
                        const sectionKey = `grant:${decision.grant.id}`;
                        const isExpanded = sectionExpandedByKey[sectionKey] ?? (featureStatus === 'Fix');

                        return (
                          <BuilderFeatureChoiceGroup
                            collapsed={!isExpanded}
                            key={decision.grant.id}
                            grant={decision.grant}
                            options={options}
                            onToggleCollapsed={() => toggleSectionExpanded(sectionKey, featureStatus === 'Fix')}
                            selectedOptionIds={selectedOptionIds}
                            issues={grantIssues}
                            onOpenOption={(option) => setDetailFeatureOption({ grantId: decision.grant.id, optionId: option.id })}
                            onOpenClassCompendium={() => classEntity ? openCompendiumForClass(classEntity) : undefined}
                          />
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          <View style={styles.addClassArea}>
            <Pressable
              accessibilityRole="button"
              disabled={totalAllocatedLevel >= 20}
              onPress={() => setShowClassPicker((current) => !current)}
              style={({ pressed }) => [
                styles.addClassButton,
                pressed && styles.addClassButtonPressed,
                totalAllocatedLevel >= 20 && styles.addClassButtonDisabled,
              ]}
            >
              <Text style={styles.addClassButtonLabel}>{showClassPicker ? 'Hide class options' : 'Add another class'}</Text>
            </Pressable>

            {showClassPicker ? renderClassPicker(availableClasses) : null}
          </View>
        </>
      ) : null}

      <BuilderClassDetailSheet
        classEntity={detailClass}
        isSelected={detailClassIsSelected}
        onChoose={confirmClassChoice}
        onClose={() => setDetailClassId(null)}
        onOpenCompendium={() => detailClass ? openCompendiumForClass(detailClass) : undefined}
        visible={Boolean(detailClass)}
      />

      <BuilderSubclassDetailSheet
        subclass={detailSubclassEntity}
        isLocked={detailSubclassIsLocked}
        isSelected={detailSubclassIsSelected}
        unlockLevel={detailSubclassUnlockLevel}
        onChoose={() => detailSubclassAllocation && detailSubclassEntity ? requestSubclassChange({ allocationId: detailSubclassAllocation.id, subclassId: detailSubclassEntity.id }) : undefined}
        onRemove={() => detailSubclassAllocation ? requestSubclassChange({ allocationId: detailSubclassAllocation.id, subclassId: null }) : undefined}
        onClose={() => setDetailSubclass(null)}
        onOpenCompendium={() => detailSubclassEntity && detailSubclassAllocation ? openCompendiumForEntity(detailSubclassEntity, {
          characterId,
          phaseId: 'class',
          sheet: 'subclass',
          allocationId: detailSubclassAllocation.id,
          subclassId: detailSubclassEntity.id,
        }) : undefined}
        visible={Boolean(detailSubclassEntity)}
      />

      <BuilderFeatureOptionDetailSheet
        grant={detailGrant}
        option={detailFeatureOptionEntity}
        isSelected={detailFeatureIsSelected}
        isFull={detailFeatureIsFull}
        selectedOptionNames={detailSelectedOptionNames}
        onChoose={chooseFeatureOption}
        onRemove={chooseFeatureOption}
        onClose={() => setDetailFeatureOption(null)}
        onOpenCompendium={() => detailFeatureOptionEntity && detailGrant ? openCompendiumForEntity(detailFeatureOptionEntity, {
          characterId,
          phaseId: 'class',
          sheet: 'feature',
          grantId: detailGrant.id,
          optionId: detailFeatureOptionEntity.id,
        }) : undefined}
        visible={Boolean(detailFeatureOptionEntity && detailGrant)}
      />

      <BuilderFeatureOptionDetailSheet
        contextLabel={detailAsiFeatRequirement ? `Ability Score Improvement level ${detailAsiFeatRequirement.level}` : 'Ability Score Improvement'}
        option={detailAsiFeatEntity}
        isSelected={detailAsiFeatIsSelected}
        isFull={false}
        primaryChooseLabel="Choose feat"
        selectedOptionNames={detailAsiFeatEntity ? [detailAsiFeatEntity.name] : []}
        onChoose={chooseAsiFeatOption}
        onRemove={chooseAsiFeatOption}
        onClose={() => setDetailAsiFeat(null)}
        onOpenCompendium={() => detailAsiFeatEntity && detailAsiFeatRequirement ? openCompendiumForEntity(detailAsiFeatEntity, {
          characterId,
          phaseId: 'class',
          sheet: 'asi-feat',
          requirementId: detailAsiFeatRequirement.id,
          featId: detailAsiFeatEntity.id,
        }) : undefined}
        visible={Boolean(detailAsiFeatEntity && detailAsiFeatRequirement)}
      />

      <BuilderImpactConfirmationSheet
        confirmLabel="Remove class"
        impacts={pendingRemoveAllocation ? buildRemovalImpacts(pendingRemoveAllocation, pendingRemoveClass) : []}
        message="Removing a class can change level totals and invalidate related choices. You can add classes again afterward."
        onCancel={() => setPendingRemoveAllocationId(null)}
        onConfirm={confirmRemoveClass}
        title="Remove class?"
        visible={Boolean(pendingRemoveAllocation)}
      />

      <BuilderImpactConfirmationSheet
        confirmLabel="Confirm subclass change"
        impacts={buildSubclassChangeImpacts()}
        message="Changing this subclass may affect spell options tied to the current build."
        onCancel={() => setPendingSubclassChange(null)}
        onConfirm={confirmSubclassChange}
        title="Change subclass?"
        visible={Boolean(pendingSubclassChange)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  classCardList: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    ...typography.sectionTitle,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  sectionMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  impactBanner: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderAccent,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    color: theme.colors.accentLegacySoft,
    fontSize: 14,
    lineHeight: 20,
    padding: theme.spacing.sm,
  },
  allocationList: {
    gap: theme.spacing.md,
  },
  allocationCard: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  allocationHeader: {
    gap: theme.spacing.md,
  },
  allocationHeading: {
    gap: theme.spacing.sm,
  },
  allocationTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  allocationTitle: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  editionBadge: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  editionBadgeLabel: {
    color: theme.colors.accentPrimarySoft,
    fontSize: 12,
    fontWeight: '800',
  },
  legacyBadge: {
    backgroundColor: theme.colors.accentLegacy,
  },
  legacyBadgeLabel: {
    color: theme.colors.accentLegacySoft,
  },
  statusBadge: {
    backgroundColor: theme.colors.surfaceSuccess,
    borderColor: theme.colors.accentSuccess,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusBadgeFix: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.danger,
  },
  statusBadgeNeed: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.accentLegacy,
  },
  statusBadgeLabel: {
    color: theme.colors.accentSuccessSoft,
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadgeLabelFix: {
    color: theme.colors.danger,
  },
  levelControlBlock: {
    gap: theme.spacing.xs,
  },
  levelControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  levelHelp: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  levelButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  levelButtonPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  levelButtonDisabled: {
    opacity: 0.5,
  },
  levelButtonLabel: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  levelBadge: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  levelBadgeLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  secondaryActionButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  secondaryActionButtonPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  secondaryActionLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '800',
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
  },
  removeButtonPressed: {
    borderColor: theme.colors.danger,
  },
  removeButtonLabel: {
    color: theme.colors.danger,
    ...typography.meta,
    fontWeight: '700',
  },
  decisionList: {
    gap: theme.spacing.md,
  },
  decisionBlock: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  decisionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  decisionHeaderCopy: {
    flex: 1,
    gap: 3,
  },
  decisionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  decisionMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  decisionHelp: {
    color: theme.colors.textSecondary,
    ...typography.bodySm,
  },
  issueList: {
    gap: theme.spacing.xs,
  },
  issueText: {
    color: theme.colors.accentLegacySoft,
    ...typography.meta,
    fontWeight: '700',
  },
  expandButton: {
    alignSelf: 'flex-start',
  },
  expandButtonPressed: {
    opacity: 0.85,
  },
  expandButtonLabel: {
    color: theme.colors.accentPrimarySoft,
    ...typography.meta,
    fontWeight: '800',
  },
  subclassCardList: {
    gap: theme.spacing.sm,
  },
  optionChipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  optionChip: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
  },
  optionChipActive: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
  },
  optionChipDisabled: {
    opacity: 0.45,
  },
  optionChipPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  optionChipLabel: {
    color: theme.colors.textSecondary,
    ...typography.meta,
    fontWeight: '800',
  },
  optionChipLabelActive: {
    color: theme.colors.accentPrimarySoft,
  },
  featOptionList: {
    gap: theme.spacing.sm,
  },
  featOptionRow: {
    backgroundColor: theme.colors.surfaceAccent,
    borderColor: theme.colors.borderSubtle,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    gap: 4,
    padding: theme.spacing.sm,
  },
  featOptionRowActive: {
    backgroundColor: theme.colors.accentPrimaryDeep,
    borderColor: theme.colors.accentPrimary,
  },
  featOptionRowPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  featOptionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  featOptionTitleActive: {
    color: theme.colors.accentPrimarySoft,
  },
  featOptionMeta: {
    color: theme.colors.textMuted,
    ...typography.meta,
  },
  addClassArea: {
    gap: theme.spacing.sm,
  },
  addClassButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
  },
  addClassButtonPressed: {
    borderColor: theme.colors.accentPrimary,
  },
  addClassButtonDisabled: {
    opacity: 0.5,
  },
  addClassButtonLabel: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyHint: {
    color: theme.colors.accentLegacySoft,
    fontSize: 13,
    lineHeight: 18,
  },
});
