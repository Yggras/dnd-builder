import type {
  BuilderDraftPayload,
  BuilderInventoryEntry,
  BuilderIssue,
  BuilderStartingEquipmentChoice,
} from '@/features/builder/types';
import { sortBuilderIssues } from '@/features/builder/utils/review';
import type { ContentEntity } from '@/shared/types/domain';

interface StartingEquipmentSource {
  sourceType: 'class' | 'background';
  sourceId: string;
  title: string;
  entries: unknown[];
}

export interface StartingEquipmentOptionGroup {
  sourceType: 'class' | 'background';
  sourceId: string;
  title: string;
  bundleIndex: number;
  choices: Array<{
    optionKey: string;
    label: string;
    items: unknown[];
  }>;
}

interface SeedPreview {
  entries: BuilderInventoryEntry[];
  currency: BuilderDraftPayload['inventoryStep']['startingCurrency'];
  unresolved: string[];
  issues: BuilderIssue[];
}

interface ReconcileInventoryOptions {
  payload: BuilderDraftPayload;
  classEntitiesById: Record<string, ContentEntity>;
  backgroundEntitiesById: Record<string, ContentEntity>;
}

function toTitleCase(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function cpToCurrency(cpTotal: number) {
  const sanitized = Math.max(0, cpTotal);
  const gp = Math.floor(sanitized / 100);
  const remainderAfterGp = sanitized % 100;
  const sp = Math.floor(remainderAfterGp / 10);
  const cp = remainderAfterGp % 10;

  return { cp, sp, gp };
}

function formatCurrencyLabel(cpTotal: number) {
  const currency = cpToCurrency(cpTotal);
  const parts: string[] = [];

  if (currency.gp) {
    parts.push(`${currency.gp} gp`);
  }

  if (currency.sp) {
    parts.push(`${currency.sp} sp`);
  }

  if (currency.cp || parts.length === 0) {
    parts.push(`${currency.cp} cp`);
  }

  return parts.join(', ');
}

function normalizeItemEntries(
  items: unknown[],
  itemEntitiesById: Record<string, ContentEntity>,
  sourceLabel: string,
  preview: SeedPreview,
) {
  for (const entry of items) {
    if (typeof entry === 'string') {
      if (itemEntitiesById[entry]) {
        preview.entries.push({
          itemId: entry,
          quantity: 1,
          equipped: false,
          attuned: false,
          source: 'starting-equipment',
        });
      } else {
        preview.unresolved.push(`${sourceLabel}: ${entry}`);
      }

      continue;
    }

    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const record = entry as {
      item?: unknown;
      quantity?: unknown;
      value?: unknown;
      special?: unknown;
      displayName?: unknown;
      containsValue?: unknown;
    };

    if (typeof record.item === 'string' && itemEntitiesById[record.item]) {
      preview.entries.push({
        itemId: record.item,
        quantity: typeof record.quantity === 'number' && record.quantity > 0 ? record.quantity : 1,
        equipped: false,
        attuned: false,
        source: 'starting-equipment',
      });

      if (typeof record.containsValue === 'number' && record.containsValue > 0) {
        const nextCurrency = cpToCurrency(
          preview.currency.cp + preview.currency.sp * 10 + preview.currency.gp * 100 + record.containsValue,
        );
        preview.currency = nextCurrency;
      }

      continue;
    }

    if (typeof record.value === 'number' && record.value > 0) {
      const nextCurrency = cpToCurrency(
        preview.currency.cp + preview.currency.sp * 10 + preview.currency.gp * 100 + record.value,
      );
      preview.currency = nextCurrency;
      continue;
    }

    if (typeof record.special === 'string') {
      preview.unresolved.push(`${sourceLabel}: ${record.special}`);
      continue;
    }

    if (typeof record.item === 'string') {
      preview.unresolved.push(`${sourceLabel}: ${record.displayName ?? record.item}`);
    }
  }
}

function dedupeInventoryEntries(entries: BuilderInventoryEntry[]) {
  const byItemId = new Map<string, BuilderInventoryEntry>();

  for (const entry of entries) {
    const existing = byItemId.get(entry.itemId);

    if (!existing) {
      byItemId.set(entry.itemId, { ...entry });
      continue;
    }

    byItemId.set(entry.itemId, {
      ...existing,
      quantity: existing.quantity + entry.quantity,
      equipped: existing.equipped || entry.equipped,
      attuned: existing.attuned || entry.attuned,
      source: existing.source === 'manual-selection' || entry.source === 'manual-selection' ? 'manual-selection' : 'starting-equipment',
    });
  }

  return Array.from(byItemId.values()).sort((left, right) => left.itemId.localeCompare(right.itemId));
}

export function getStartingEquipmentSources(payload: BuilderDraftPayload, classEntitiesById: Record<string, ContentEntity>, backgroundEntitiesById: Record<string, ContentEntity>) {
  const sources: StartingEquipmentSource[] = [];
  const primaryClassId = payload.classStep.allocations[0]?.classId;
  const primaryClassEntity = primaryClassId ? classEntitiesById[primaryClassId] : null;
  const backgroundEntity = payload.backgroundStep.backgroundId ? backgroundEntitiesById[payload.backgroundStep.backgroundId] : null;

  if (primaryClassEntity?.metadata.startingEquipment && typeof primaryClassEntity.metadata.startingEquipment === 'object') {
    const defaultData = (primaryClassEntity.metadata.startingEquipment as { defaultData?: unknown }).defaultData;

    if (Array.isArray(defaultData)) {
      sources.push({
        sourceType: 'class',
        sourceId: primaryClassEntity.id,
        title: `${primaryClassEntity.name} starting equipment`,
        entries: defaultData,
      });
    }
  }

  if (backgroundEntity?.metadata.startingEquipment && Array.isArray(backgroundEntity.metadata.startingEquipment)) {
    sources.push({
      sourceType: 'background',
      sourceId: backgroundEntity.id,
      title: `${backgroundEntity.name} starting equipment`,
      entries: backgroundEntity.metadata.startingEquipment,
    });
  }

  return sources;
}

export function getStartingEquipmentReviewKey(
  payload: BuilderDraftPayload,
  classEntitiesById: Record<string, ContentEntity>,
  backgroundEntitiesById: Record<string, ContentEntity>,
) {
  const sources = getStartingEquipmentSources(payload, classEntitiesById, backgroundEntitiesById);

  if (sources.length === 0) {
    return null;
  }

  return sources
    .map((source) => `${source.sourceType}:${source.sourceId}:${source.entries.length}`)
    .sort()
    .join('|');
}

function hasStartingEquipmentState(payload: BuilderDraftPayload) {
  const currency = payload.inventoryStep.startingCurrency;

  return (
    payload.inventoryStep.entries.some((entry) => entry.source === 'starting-equipment') ||
    payload.inventoryStep.selectedStartingEquipment.length > 0 ||
    payload.inventoryStep.unresolvedStartingGear.length > 0 ||
    currency.cp > 0 ||
    currency.sp > 0 ||
    currency.gp > 0
  );
}

function buildStartingEquipmentReviewIssue(currentReviewKey: string | null): BuilderIssue {
  return {
    id: 'inventory-starting-equipment-review',
    category: 'checklist',
    step: 'inventory',
    summary: 'Starting equipment needs review.',
    detail: currentReviewKey
      ? 'Class or background choices changed after starting equipment was last reviewed. Reseed or review inventory before completing the build.'
      : 'Current class or background choices no longer provide the same starting equipment context. Review inventory before completing the build.',
    affectsCompletion: true,
    resolvedByOverride: false,
  };
}

export function reconcileInventoryPayload({
  payload,
  classEntitiesById,
  backgroundEntitiesById,
}: ReconcileInventoryOptions) {
  const currentReviewKey = getStartingEquipmentReviewKey(payload, classEntitiesById, backgroundEntitiesById);
  const previousReviewKey = payload.inventoryStep.startingEquipmentReviewKey ?? null;
  const needsReview =
    currentReviewKey !== previousReviewKey && (currentReviewKey != null || hasStartingEquipmentState(payload));

  const contextDependentIssueIds = [
    'inventory-starting-equipment-review',
    'inventory-unresolved-starting-gear',
    'inventory-multiclass-starting-gear',
  ];

  const preservedIssues = payload.review.issues.filter((issue) => {
    if (issue.step !== 'inventory') {
      return true;
    }
    // Always filter out the review issue so we can re-add it below if needsReview is true
    if (issue.id === 'inventory-starting-equipment-review') {
      return false;
    }
    // If we need review, old unresolved or multiclass notices are stale
    if (needsReview && contextDependentIssueIds.includes(issue.id)) {
      return false;
    }
    return true;
  });

  const nextIssues = sortBuilderIssues(
    needsReview ? [...preservedIssues, buildStartingEquipmentReviewIssue(currentReviewKey)] : preservedIssues,
  );

  return {
    ...payload,
    inventoryStep: {
      ...payload.inventoryStep,
      startingEquipmentReviewKey: previousReviewKey,
    },
    review: {
      ...payload.review,
      issues: nextIssues,
    },
  } satisfies BuilderDraftPayload;
}

export function getStartingEquipmentOptionGroups(
  payload: BuilderDraftPayload,
  classEntitiesById: Record<string, ContentEntity>,
  backgroundEntitiesById: Record<string, ContentEntity>,
) {
  const groups: StartingEquipmentOptionGroup[] = [];

  for (const source of getStartingEquipmentSources(payload, classEntitiesById, backgroundEntitiesById)) {
    source.entries.forEach((entry, bundleIndex) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return;
      }

      const record = entry as Record<string, unknown>;
      const choiceKeys = Object.keys(record).filter((key) => key !== '_');

      if (choiceKeys.length <= 1) {
        return;
      }

      groups.push({
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        title: `${source.title} option ${bundleIndex + 1}`,
        bundleIndex,
        choices: choiceKeys.map((optionKey) => ({
          optionKey,
          label: optionKey.toUpperCase(),
          items: Array.isArray(record[optionKey]) ? (record[optionKey] as unknown[]) : [],
        })),
      });
    });
  }

  return groups;
}

export function seedStartingEquipment(
  payload: BuilderDraftPayload,
  classEntitiesById: Record<string, ContentEntity>,
  backgroundEntitiesById: Record<string, ContentEntity>,
  itemEntitiesById: Record<string, ContentEntity>,
) {
  const sources = getStartingEquipmentSources(payload, classEntitiesById, backgroundEntitiesById);
  const startingEquipmentReviewKey = getStartingEquipmentReviewKey(payload, classEntitiesById, backgroundEntitiesById);
  const preview: SeedPreview = {
    entries: [],
    currency: { cp: 0, sp: 0, gp: 0 },
    unresolved: [],
    issues: [],
  };

  const normalizedSelections: BuilderStartingEquipmentChoice[] = [];

  for (const source of sources) {
    source.entries.forEach((entry, bundleIndex) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return;
      }

      const record = entry as Record<string, unknown>;

      if (Array.isArray(record._)) {
        normalizeItemEntries(record._, itemEntitiesById, source.title, preview);
      }

      const choiceKeys = Object.keys(record).filter((key) => key !== '_');

      if (choiceKeys.length === 0) {
        return;
      }

      if (choiceKeys.length === 1) {
        const optionKey = choiceKeys[0];
        normalizedSelections.push({
          sourceType: source.sourceType,
          sourceId: source.sourceId,
          bundleIndex,
          optionKey,
        });
        normalizeItemEntries(Array.isArray(record[optionKey]) ? (record[optionKey] as unknown[]) : [], itemEntitiesById, source.title, preview);
        return;
      }

      const existingSelection = payload.inventoryStep.selectedStartingEquipment.find(
        (selection) =>
          selection.sourceType === source.sourceType && selection.sourceId === source.sourceId && selection.bundleIndex === bundleIndex,
      );
      const selectedOptionKey = existingSelection?.optionKey && choiceKeys.includes(existingSelection.optionKey)
        ? existingSelection.optionKey
        : choiceKeys[0];

      normalizedSelections.push({
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        bundleIndex,
        optionKey: selectedOptionKey,
      });

      normalizeItemEntries(
        Array.isArray(record[selectedOptionKey]) ? (record[selectedOptionKey] as unknown[]) : [],
        itemEntitiesById,
        `${source.title} ${selectedOptionKey.toUpperCase()}`,
        preview,
      );
    });
  }

  const seededEntries = dedupeInventoryEntries(preview.entries);
  const manualEntries = payload.inventoryStep.entries.filter((entry) => entry.source === 'manual-selection');
  const mergedEntries = dedupeInventoryEntries([...seededEntries, ...manualEntries]);

  if (preview.unresolved.length > 0) {
    preview.issues.push({
      id: 'inventory-unresolved-starting-gear',
      category: 'checklist',
      step: 'inventory',
      summary: 'Some starting equipment could not be represented as canonical inventory.',
      detail: preview.unresolved.join(' | '),
      affectsCompletion: true,
      resolvedByOverride: false,
    });
  }

  if (payload.classStep.allocations.length > 1) {
    preview.issues.push({
      id: 'inventory-multiclass-starting-gear',
      category: 'notice',
      step: 'inventory',
      summary: 'Starting equipment currently seeds from the first class allocation for multiclass drafts.',
      detail: 'Review inventory manually if your starting gear should differ for this multiclass build.',
      affectsCompletion: false,
      resolvedByOverride: false,
    });
  }

  const preservedIssues = payload.review.issues.filter((issue) => issue.step !== 'inventory');

  return {
    payload: {
      ...payload,
      inventoryStep: {
        ...payload.inventoryStep,
        entries: mergedEntries,
        selectedStartingEquipment: normalizedSelections,
        startingEquipmentReviewKey,
        startingCurrency: preview.currency,
        unresolvedStartingGear: preview.unresolved,
      },
      review: {
        ...payload.review,
        issues: sortBuilderIssues([...preservedIssues, ...preview.issues]),
      },
    } satisfies BuilderDraftPayload,
    summary:
      seededEntries.length > 0 || preview.currency.cp || preview.currency.sp || preview.currency.gp
        ? `Seeded ${seededEntries.length} canonical item${seededEntries.length === 1 ? '' : 's'} and ${formatCurrencyLabel(
            preview.currency.gp * 100 + preview.currency.sp * 10 + preview.currency.cp,
          )}.`
        : 'No starting equipment could be seeded yet.',
  };
}
