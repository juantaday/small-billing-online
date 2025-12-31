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
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
};

const ICON_STYLES = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info: 'text-blue-600 dark:text-blue-400',
};

const TEXT_STYLES = {
  success: 'text-green-900 dark:text-green-100',
  error: 'text-red-900 dark:text-red-100',
  warning: 'text-yellow-900 dark:text-yellow-100',
  info: 'text-blue-900 dark:text-blue-100',
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
