import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'highlight' | 'success' | 'warning' | 'danger';
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  variant = 'default',
  className = '',
  ...props
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variantStyles = {
    default: 'glass-card bg-surface border-surface-border shadow-card',
    highlight: 'bg-[var(--accent-brand-light)] border-brand-500/30 dark:border-brass-500/30 shadow-card',
    success: 'bg-status-success-bg border-status-success-border shadow-card',
    warning: 'bg-status-warning-bg border-status-warning-border shadow-card',
    danger: 'bg-status-danger-bg border-status-danger-border shadow-card',
  };

  return (
    <div
      data-tone={variant === 'success' || variant === 'warning' || variant === 'danger' ? variant : undefined}
      className={`rounded-2xl border transition-all duration-200 ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`flex flex-col gap-1 pb-4 border-b border-surface-border ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`text-sm sm:text-base font-bold text-content-primary tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-xs text-content-secondary leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <div className={`pt-4 ${className}`} {...props}>
    {children}
  </div>
);
