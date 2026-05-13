// src/contexts/ErrorContext.tsx
import { createContext, ReactNode, useContext, useState } from 'react';
import { ErrorNotification } from '../app/components/ErrorNotification';

interface ErrorContextType {
  showError: (message: string, type?: 'error' | 'warning' | 'info' | 'success') => void;
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorItem {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
}

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<ErrorItem[]>([]);

  const showError = (message: string, type: 'error' | 'warning' | 'info' | 'success' = 'error') => {
    const id = Date.now().toString();
    setErrors(prev => [...prev, { id, message, type }]);
  };

  const clearError = (id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  return (
    <ErrorContext.Provider value={{ showError, clearErrors }}>
      {children}
      {errors.map(error => (
        <ErrorNotification
          key={error.id}
          message={error.message}
          type={error.type}
          onClose={() => clearError(error.id)}
        />
      ))}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError precisa estar dentro de ErrorProvider');
  }
  return context;
}