/**
 * Component: ToastContainer
 * Contenedor para mostrar múltiples toasts
 */

import { Toast, ToastProps } from './Toast';

interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[300] flex flex-col gap-3 pointer-events-none">
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <div key={toast.id} className="mb-3">
            <Toast {...toast} onClose={onClose} />
          </div>
        ))}
      </div>
    </div>
  );
}
