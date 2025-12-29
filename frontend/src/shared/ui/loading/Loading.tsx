/**
 * Shared UI Component: Loading
 * Componente centralizado de loading con múltiples variantes
 */

import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export type LoadingVariant = 'spinner' | 'dots' | 'pulse' | 'skeleton';
export type LoadingSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingProps {
  /** Variante del loading */
  variant?: LoadingVariant;
  /** Tamaño del loading */
  size?: LoadingSize;
  /** Mensaje de carga */
  message?: string;
  /** Si es true, ocupa toda la pantalla */
  fullscreen?: boolean;
  /** Clases adicionales */
  className?: string;
}

const sizeClasses: Record<LoadingSize, string> = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const dotSizeClasses: Record<LoadingSize, string> = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
  xl: 'w-5 h-5',
};

const textSizeClasses: Record<LoadingSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

export function Loading({
  variant = 'spinner',
  size = 'md',
  message = 'Cargando...',
  fullscreen = false,
  className,
}: LoadingProps) {
  const renderLoading = () => {
    switch (variant) {
      case 'spinner':
        return (
          <Loader2
            className={clsx(
              sizeClasses[size],
              'animate-spin text-blue-600 dark:text-blue-400'
            )}
          />
        );

      case 'dots':
        return (
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={clsx(
                  dotSizeClasses[size],
                  'bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce'
                )}
                style={{
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div className="relative flex items-center justify-center">
            <div
              className={clsx(
                sizeClasses[size],
                'bg-blue-600/20 dark:bg-blue-400/20 rounded-full animate-ping absolute'
              )}
            />
            <div
              className={clsx(
                sizeClasses[size],
                'bg-blue-600 dark:bg-blue-400 rounded-full'
              )}
              style={{ width: '50%', height: '50%' }}
            />
          </div>
        );

      case 'skeleton':
        return (
          <div className="space-y-4 w-full max-w-md">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
          </div>
        );

      default:
        return null;
    }
  };

  const content = (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-4',
        fullscreen ? 'min-h-screen' : 'min-h-[200px]',
        className
      )}
    >
      {renderLoading()}
      {message && variant !== 'skeleton' && (
        <p
          className={clsx(
            'text-gray-600 dark:text-gray-400 font-medium animate-pulse',
            textSizeClasses[size]
          )}
        >
          {message}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

// Componentes de conveniencia
export const SpinnerLoading = (props: Omit<LoadingProps, 'variant'>) => (
  <Loading {...props} variant="spinner" />
);

export const DotsLoading = (props: Omit<LoadingProps, 'variant'>) => (
  <Loading {...props} variant="dots" />
);

export const PulseLoading = (props: Omit<LoadingProps, 'variant'>) => (
  <Loading {...props} variant="pulse" />
);

export const SkeletonLoading = (props: Omit<LoadingProps, 'variant'>) => (
  <Loading {...props} variant="skeleton" />
);
