/**
 * Shared UI - Card Component
 * Componente reutilizable de tarjeta con variantes de estilo
 */
import clsx from 'clsx';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
}

export const Card = ({ 
  children, 
  className, 
  hoverable, 
  onClick,
  variant = 'default' 
}: CardProps) => {
  
  const variantStyles = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm',
    elevated: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50',
    outlined: 'bg-transparent border-2 border-gray-300 dark:border-gray-600',
    flat: 'bg-white dark:bg-gray-800',
  };
  
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-lg',
        variantStyles[variant],
        hoverable && 'hover:shadow-xl transition-all duration-200 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};
