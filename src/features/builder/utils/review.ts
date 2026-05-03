import { builderStepOrder, type BuilderIssue, type BuilderIssueCategory } from '@/features/builder/types';
import type { ContentEntity } from '@/shared/types/domain';

type BuilderEntityIndexInput = {
  classEntitiesById: Record<string, ContentEntity>;
  speciesEntitiesById: Record<string, ContentEntity>;
  backgroundEntitiesById: Record<string, ContentEntity>;
  featEntitiesById: Record<string, ContentEntity>;
  itemEntitiesById: Record<string, ContentEntity>;
  spellEntitiesById: Record<string, ContentEntity>;
  subclassEntitiesById: Record<string, ContentEntity>;
  grantOptionsByGrantId: Record<string, ContentEntity[]>;
};

export type BuilderIssueGroup = {
  key: 'blocker' | 'checklist' | 'notice' | 'override';
  title: string;
  issues: BuilderIssue[];
};

const ISSUE_CATEGORY_ORDER: Record<BuilderIssueCategory, number> = {
  blocker: 0,
  checklist: 1,
  override: 2,
  notice: 3,
};

function getStepOrder(step: BuilderIssue['step']) {
  const index = builderStepOrder.indexOf(step);
  return index === -1 ? 999 : index;
}

export function sortBuilderIssues(issues: readonly BuilderIssue[]) {
  return [...issues].sort((left, right) => {
    return (
      getStepOrder(left.step) - getStepOrder(right.step) ||
      ISSUE_CATEGORY_ORDER[left.category] - ISSUE_CATEGORY_ORDER[right.category] ||
      left.id.localeCompare(right.id) ||
      left.summary.localeCompare(right.summary)
    );
  });
}

export function buildBuilderEntityIndex({
  classEntitiesById,
  speciesEntitiesById,
  backgroundEntitiesById,
  featEntitiesById,
  itemEntitiesById,
  spellEntitiesById,
  subclassEntitiesById,
  grantOptionsByGrantId,
}: BuilderEntityIndexInput) {
  return {
    ...classEntitiesById,
    ...speciesEntitiesById,
    ...backgroundEntitiesById,
    ...featEntitiesById,
    ...itemEntitiesById,
    ...spellEntitiesById,
    ...subclassEntitiesById,
    ...Object.fromEntries(Object.values(grantOptionsByGrantId).flat().map((entity) => [entity.id, entity])),
  } satisfies Record<string, ContentEntity>;
}

export function getBuilderIssueGroups(issues: readonly BuilderIssue[]): BuilderIssueGroup[] {
  const sortedIssues = sortBuilderIssues(issues);
  const groups: BuilderIssueGroup[] = [
    {
      key: 'blocker',
      title: 'Blockers',
      issues: sortedIssues.filter((issue) => issue.category === 'blocker' && !issue.resolvedByOverride),
    },
    {
      key: 'checklist',
      title: 'Checklist',
      issues: sortedIssues.filter((issue) => issue.category === 'checklist' && !issue.resolvedByOverride),
    },
    {
      key: 'notice',
      title: 'Notices',
      issues: sortedIssues.filter((issue) => issue.category === 'notice'),
    },
    {
      key: 'override',
      title: 'Overrides',
      issues: sortedIssues.filter((issue) => issue.category === 'override' || issue.resolvedByOverride),
    },
  ];

  return groups.filter((group) => group.issues.length > 0);
}
