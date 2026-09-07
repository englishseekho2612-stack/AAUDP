import React from 'react';
import { Button } from './UIControls';

interface EmptyStateProps {
  id?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  id = 'empty-state-view',
  icon,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button
            id={`${id}-action-btn`}
            onClick={onAction}
            icon={actionIcon}
            variant="primary"
            size="md"
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
