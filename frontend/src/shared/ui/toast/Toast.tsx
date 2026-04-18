/**
 * Component: Toast
 * Sistema de notificaciones tipo toast para feedback al usuario
 */

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  success: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800',
  error: 'bg-danger-50 dark:bg-danger-900/60 border-danger-200 dark:border-danger-800',
  warning: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800',
  info: 'bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800',
};

const ICON_STYLES = {
  success: 'text-success-600 dark:text-success-400',
  error: 'text-danger-600 dark:text-danger-400',
  warning: 'text-warning-600 dark:text-warning-400',
  info: 'text-info-600 dark:text-info-400',
};

const TEXT_STYLES = {
  success: 'text-success-900 dark:text-success-100',
  error: 'text-danger-900 dark:text-danger-100',
  warning: 'text-warning-900 dark:text-warning-100',
  info: 'text-info-900 dark:text-info-100',
};

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const Icon = ICONS[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md w-full',
        'animate-in slide-in-from-top-5 fade-in duration-300',
        STYLES[type]
      )}
    >
      <Icon className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', ICON_STYLES[type])} />
      
      <div className="flex-1 min-w-0">
        <h4 className={clsx('font-semibold text-sm', TEXT_STYLES[type])}>
          {title}
        </h4>
        {message && (
          <p className={clsx('text-sm mt-1 opacity-90', TEXT_STYLES[type])}>
            {message}
          </p>
        )}
      </div>

      <button
        onClick={() => onClose(id)}
        className={clsx(
          'flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
          TEXT_STYLES[type]
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
