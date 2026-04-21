import { QueryClient } from '@tanstack/react-query';

import { logger } from '@/shared/logging/logger';
import { getErrorMessage } from '@/shared/errors/map-error';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
    mutations: {
      onError: (error) => {
        logger.error('mutation_failed', { message: getErrorMessage(error) });
      },
    },
  },
});
