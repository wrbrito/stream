// src/components/ErrorNotification.tsx
import { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { Button } from './Button';

interface ErrorNotificationProps {
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function ErrorNotification({
  message,
  type,
  onClose,
  autoClose = true,
  duration = 5000
}: ErrorNotificationProps) {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose, duration]);

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'error':
        return 'bg-destructive/10 border-destructive/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-[100] max-w-md p-4 rounded-lg border shadow-lg animate-in slide-in-from-right duration-300 ${getBgColor()}`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{message}</p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 rounded-full hover:bg-accent"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}