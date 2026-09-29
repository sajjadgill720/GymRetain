import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      className={`animate-pulse bg-[#24201C] ${variantStyles[variant]} ${className}`}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="p-4 rounded-xl bg-[#1A1816] border border-[#292522] flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 flex-1">
          <Skeleton variant="circular" className="w-9 h-9 shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-1/4 h-3" />
          </div>
        </div>
        <Skeleton variant="rectangular" className="w-24 h-8 shrink-0" />
      </div>
    ))}
  </div>
);
