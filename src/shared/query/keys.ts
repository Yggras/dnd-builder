export const queryKeys = {
  auth: ['auth'] as const,
  campaigns: ['campaigns'] as const,
  characters: ['characters'] as const,
  charactersRoster: (ownerUserId: string) => ['characters', 'roster', ownerUserId] as const,
  character: (characterId: string) => ['characters', 'detail', characterId] as const,
  characterBuild: (characterId: string) => ['characters', 'build', characterId] as const,
  compendium: ['compendium'] as const,
  compendiumSearch: (query: string, entryType: string) => ['compendium', 'search', query, entryType] as const,
  compendiumEntry: (entryId: string) => ['compendium', 'entry', entryId] as const,
  pendingMutations: ['pending-mutations'] as const,
} as const;
