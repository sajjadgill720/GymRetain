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
      container: 'bg-[#24201C] text-[#A39E98] border-[#38332E]',
      dot: 'bg-[#A39E98]',
    },
    brand: {
      container: 'bg-[#D96A38]/15 text-[#E68758] border-[#D96A38]/30',
      dot: 'bg-[#D96A38]',
    },
    success: {
      container: 'bg-[#4E9F6E]/15 text-[#6EBE8E] border-[#4E9F6E]/30',
      dot: 'bg-[#4E9F6E]',
    },
    warning: {
      container: 'bg-[#E5A13B]/15 text-[#F0B865] border-[#E5A13B]/30',
      dot: 'bg-[#E5A13B]',
    },
    danger: {
      container: 'bg-[#D9534F]/15 text-[#E87875] border-[#D9534F]/30',
      dot: 'bg-[#D9534F]',
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
