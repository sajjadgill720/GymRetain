import React from 'react';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    neutral: {
      container: 'bg-surface-subtle text-content-secondary border-surface-border',
      dot: 'bg-[#A39E98]',
    },
    brand: {
      container: 'bg-brand-500/10 text-brand-700 border-brand-500/20 dark:bg-brass-400/10 dark:text-brass-400 dark:border-brass-400/20',
      dot: 'bg-brand-600 dark:bg-brass-400',
    },
    success: {
      container: 'bg-status-success-bg text-status-success-text border-status-success-border',
      dot: 'bg-status-success',
    },
    warning: {
      container: 'bg-status-warning-bg text-status-warning-text border-status-warning-border',
      dot: 'bg-status-warning',
    },
    danger: {
      container: 'bg-status-danger-bg text-status-danger-text border-status-danger-border',
      dot: 'bg-status-danger',
    },
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-[11px] px-2.5 py-0.5 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${variantStyles[variant].container} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${variantStyles[variant].dot}`} />}
      <span>{children}</span>
    </span>
  );
};
