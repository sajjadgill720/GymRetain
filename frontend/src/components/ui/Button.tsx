import React from 'react';
import { Loader2 } from '@/components/icons';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  // Base styling: tactile shadow on all clickable buttons, smooth transition, thumb-friendly touch target
  const baseStyles =
    'ui-button inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  // mynext9to5-inspired luxury styling with champagne bronze primary and dedicated button shadows
  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'btn-shadow-primary focus:ring-brand-500 dark:focus:ring-brass-400',
    secondary: 'bg-surface text-content-primary border border-surface-border hover:bg-surface-subtle btn-shadow',
    ghost: 'bg-transparent text-content-secondary hover:text-content-primary hover:bg-surface-subtle btn-shadow',
    destructive: 'bg-status-danger-bg text-status-danger-text border border-status-danger-border btn-shadow focus:ring-red-500',
    success: 'bg-status-success-bg text-status-success-text border border-status-success-border btn-shadow focus:ring-emerald-500',
  };

  // Size styles ensuring thumb-friendly touch targets on mobile (min 38-46px)
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[44px]',
    md: 'text-xs sm:text-sm px-4 py-2.5 gap-2 min-h-[44px]',
    lg: 'text-sm sm:text-base px-6 py-3 gap-2.5 min-h-[48px]',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
    </button>
  );
};
