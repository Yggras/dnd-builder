import { useEffect, useState } from 'react';

import { initializeDatabase } from '@/shared/db/sqlite';
import { mapError } from '@/shared/errors/map-error';
import { logger } from '@/shared/logging/logger';

export function useAppBootstrap() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    void initializeDatabase()
      .then(() => {
        if (isMounted) {
          setIsReady(true);
        }
      })
      .catch((bootstrapError) => {
        const mappedError = mapError(bootstrapError);
        logger.error('app_bootstrap_failed', { code: mappedError.code, message: mappedError.message });

        if (isMounted) {
          setError(mappedError);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    isReady,
    error,
  };
}
