export const queryKeys = {
  auth: ['auth'] as const,
  campaigns: ['campaigns'] as const,
  characters: ['characters'] as const,
  compendium: ['compendium'] as const,
  compendiumSearch: (query: string, entryType: string) => ['compendium', 'search', query, entryType] as const,
  compendiumEntry: (entryId: string) => ['compendium', 'entry', entryId] as const,
  pendingMutations: ['pending-mutations'] as const,
} as const;
