import clsx from 'clsx';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export const Card = ({ children, className, hoverable, onClick }: CardProps) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        hoverable && 'hover:shadow-lg transition-shadow cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};
