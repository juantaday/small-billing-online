/**
 * Componente Stepper
 * Stepper reutilizable para wizards multi-paso
 */

import { Check } from 'lucide-react';
import clsx from 'clsx';

export interface Step {
  id: number;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <li
              key={step.id}
              className={clsx(
                'flex items-center',
                index !== steps.length - 1 && 'flex-1'
              )}
            >
              <div className="flex flex-col items-center flex-1">
                {/* Círculo del paso */}
                <div className="flex items-center">
                  <div
                    className={clsx(
                      'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200',
                      isCompleted &&
                        'bg-success-600 border-success-600 text-white',
                      isCurrent &&
                        'bg-primary-600 border-primary-600 text-white scale-110 shadow-lg',
                      isUpcoming &&
                        'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <span className="text-sm font-semibold">{stepNumber}</span>
                    )}
                  </div>

                  {/* Línea conectora */}
                  {index !== steps.length - 1 && (
                    <div
                      className={clsx(
                        'h-0.5 w-full min-w-[40px] mx-2 transition-colors duration-200',
                        isCompleted
                          ? 'bg-success-600'
                          : 'bg-gray-300 dark:bg-gray-600'
                      )}
                    />
                  )}
                </div>

                {/* Label del paso */}
                <div className="mt-2 text-center">
                  <p
                    className={clsx(
                      'text-xs sm:text-sm font-medium transition-colors',
                      isCurrent && 'text-primary-600 dark:text-primary-400',
                      isCompleted && 'text-success-600 dark:text-success-400',
                      isUpcoming && 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 hidden sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
