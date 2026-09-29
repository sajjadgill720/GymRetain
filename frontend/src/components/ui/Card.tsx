import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'highlight' | 'warning' | 'danger';
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
    default:
      'bg-[#161310] border-[#2A2520] shadow-sm shadow-black/30 hover:border-[#38312A]',
    highlight:
      'bg-gradient-to-br from-[#221C16] via-[#1A1612] to-[#14110E] border-[#BFA785]/35 shadow-md shadow-black/40',
    warning:
      'bg-gradient-to-br from-[#241C12] via-[#1A1611] to-[#14110E] border-[#E5A13B]/30 shadow-md shadow-black/40',
    danger:
      'bg-gradient-to-br from-[#261515] via-[#1A1313] to-[#141010] border-[#D9534F]/30 shadow-md shadow-black/40',
  };

  return (
    <div
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
  <div className={`flex flex-col gap-1 pb-4 border-b border-[#2A2520] ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`text-sm sm:text-base font-bold text-[#F7F5F2] tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-xs text-[#A39E98] leading-relaxed ${className}`} {...props}>
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
