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
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111111] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  // mynext9to5-inspired luxury styling with champagne bronze primary and dedicated button shadows
  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-[#BFA785] hover:bg-[#B29976] active:bg-[#9B8361] text-[#111111] font-bold shadow-md shadow-[#BFA785]/25 hover:shadow-lg hover:shadow-[#BFA785]/35 active:translate-y-0 hover:-translate-y-0.5 focus:ring-[#BFA785]',
    secondary:
      'bg-[#1C1814] hover:bg-[#26221E] active:bg-[#161310] text-[#F7F5F2] border border-[#332C26] shadow-sm shadow-black/40 hover:shadow-md hover:border-[#4D433A] active:translate-y-0 hover:-translate-y-0.5 focus:ring-[#BFA785]',
    ghost:
      'bg-transparent hover:bg-[#1C1814] text-[#A39E98] hover:text-[#F7F5F2] shadow-none hover:shadow-sm focus:ring-[#332C26]',
    destructive:
      'bg-[#D9534F] hover:bg-[#C4433F] active:bg-[#B33734] text-white shadow-md shadow-[#D9534F]/30 hover:shadow-lg hover:shadow-[#D9534F]/40 active:translate-y-0 hover:-translate-y-0.5 focus:ring-[#D9534F]',
    success:
      'bg-[#4E9F6E] hover:bg-[#41885C] active:bg-[#35734D] text-white shadow-md shadow-[#4E9F6E]/30 hover:shadow-lg hover:shadow-[#4E9F6E]/40 active:translate-y-0 hover:-translate-y-0.5 focus:ring-[#4E9F6E]',
  };

  // Size styles ensuring thumb-friendly touch targets on mobile (min 38-46px)
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[36px]',
    md: 'text-xs sm:text-sm px-4 py-2.5 gap-2 min-h-[42px]',
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
