// src/hooks/useErrorHandler.ts
import { useState, useCallback } from 'react';
import { tratarErroApi } from '../services/api';

export interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
}

export function useErrorHandler() {
  const [error, setError] = useState<ErrorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((error: unknown, type: ErrorState['type'] = 'error') => {
    const message = tratarErroApi(error);
    setError({ message, type });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: unknown) => void;
      showError?: boolean;
    }
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      clearError();
      const result = await operation();
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      if (options?.showError !== false) {
        handleError(error);
      }
      options?.onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  return {
    error,
    isLoading,
    handleError,
    clearError,
    withErrorHandling,
  };
}