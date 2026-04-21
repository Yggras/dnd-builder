import { AuthApiError } from '@supabase/supabase-js';

import { AppError, AuthenticationError, StorageError } from '@/shared/errors/app-error';
import { errorCodes } from '@/shared/errors/error-codes';

export function mapError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof AuthApiError) {
    return new AuthenticationError(error.message);
  }

  if (error instanceof TypeError) {
    return new AppError('Network request failed.', errorCodes.network);
  }

  if (error instanceof Error) {
    return new StorageError(error.message);
  }

  return new AppError('An unexpected error occurred.', errorCodes.unknown);
}

export function getErrorMessage(error: unknown) {
  return mapError(error).message;
}
