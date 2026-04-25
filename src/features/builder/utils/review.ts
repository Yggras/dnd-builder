import type { BuilderIssue } from '@/features/builder/types';
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
  const groups: BuilderIssueGroup[] = [
    {
      key: 'blocker',
      title: 'Blockers',
      issues: issues.filter((issue) => issue.category === 'blocker' && !issue.resolvedByOverride),
    },
    {
      key: 'checklist',
      title: 'Checklist',
      issues: issues.filter((issue) => issue.category === 'checklist' && !issue.resolvedByOverride),
    },
    {
      key: 'notice',
      title: 'Notices',
      issues: issues.filter((issue) => issue.category === 'notice'),
    },
    {
      key: 'override',
      title: 'Overrides',
      issues: issues.filter((issue) => issue.category === 'override' || issue.resolvedByOverride),
    },
  ];

  return groups.filter((group) => group.issues.length > 0);
}
