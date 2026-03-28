/**
 * Shared UI - Button Component
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Variants
        variant === 'primary' && 'bg-primary-600 hover:bg-primary-700 text-white',
        variant === 'secondary' && 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
        variant === 'ghost' && 'bg-transparent interactive-hover text-gray-700 dark:text-gray-300',
        variant === 'danger' && 'badge-danger hover:bg-danger-200',
        variant === 'outline' && 'border-2 border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
        // Sizes
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-base',
        size === 'lg' && 'px-6 py-3 text-lg',
        // Width
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
