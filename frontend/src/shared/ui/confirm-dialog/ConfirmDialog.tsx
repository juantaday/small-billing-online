import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../button/Button';
import { SpinnerLoading } from '../loading/Loading';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Limpiar error cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  // Cerrar con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onClose]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const variantConfig = {
    danger: {
      icon: XCircle,
      iconColor: 'text-danger-600 dark:text-danger-400',
      iconBg: 'bg-danger-100 dark:bg-danger-900/20',
      confirmButton: 'bg-danger-600 hover:bg-danger-700 focus:ring-danger-500',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-warning-600 dark:text-warning-400',
      iconBg: 'bg-warning-100 dark:bg-warning-900/20',
      confirmButton: 'bg-warning-600 hover:bg-warning-700 focus:ring-warning-500',
    },
    info: {
      icon: Info,
      iconColor: 'text-info-600 dark:text-info-400',
      iconBg: 'bg-info-100 dark:bg-info-900/20',
      confirmButton: 'bg-info-600 hover:bg-info-700 focus:ring-info-500',
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-success-600 dark:text-success-400',
      iconBg: 'bg-success-100 dark:bg-success-900/20',
      confirmButton: 'bg-success-600 hover:bg-success-700 focus:ring-success-500',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    try {
      setError(null);
      await onConfirm();
      // Si no hay error, el padre cerrará el modal
    } catch (err: any) {
      // Mostrar error inline en el modal
      const errorMessage = err?.response?.data?.userMessage 
        || err?.message 
        || 'Ocurrió un error inesperado';
      setError(errorMessage);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-[201] flex min-h-full items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className={`${config.iconBg} w-12 h-12 rounded-full flex items-center justify-center mb-4`}>
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 badge-danger border rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-danger-900 dark:text-danger-100">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              fullWidth
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              fullWidth
              autoFocus={variant === 'danger'}
              className={config.confirmButton}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <SpinnerLoading size="sm" message="" className="min-h-0" />
                  Procesando...
                </span>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
