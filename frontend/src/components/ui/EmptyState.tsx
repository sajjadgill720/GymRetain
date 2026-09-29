import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-dashed border-[#38332E] bg-[#161412] p-8 sm:p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-[#24201C] border border-[#38332E] text-[#D96A38] flex items-center justify-center mb-4 shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="text-base sm:text-lg font-bold text-[#F7F5F2] tracking-tight mb-1.5">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#A39E98] max-w-sm leading-relaxed mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
