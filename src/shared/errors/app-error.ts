import { errorCodes } from '@/shared/errors/error-codes';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, errorCodes.configuration);
    this.name = 'ConfigurationError';
  }
}

export class StorageError extends AppError {
  constructor(message: string) {
    super(message, errorCodes.storage);
    this.name = 'StorageError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed.') {
    super(message, errorCodes.authentication);
    this.name = 'AuthenticationError';
  }
}
