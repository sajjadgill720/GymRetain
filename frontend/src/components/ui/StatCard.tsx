import React from 'react';
import { Card } from './Card';

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: 'default' | 'highlight' | 'warning' | 'danger';
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className = '',
  onClick,
}) => {
  return (
    <Card
      variant={variant}
      padding="md"
      className={`relative overflow-hidden transition-all ${
        onClick ? 'cursor-pointer hover:border-[#BFA785]/40 active:scale-[0.99]' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A39E98] block">
            {label}
          </span>
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#F7F5F2] font-mono tracking-tight">
              {value}
            </span>
            {unit && <span className="text-xs text-[#A39E98] font-medium">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-[#6B6661] pt-0.5 leading-snug">{subtitle}</p>}
        </div>

        {icon && (
          <div className="w-10 h-10 rounded-xl bg-[#24201C] border border-[#38332E] text-[#BFA785] flex items-center justify-center shrink-0 shadow-sm">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-[#292522] flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold font-mono ${
              trend.isPositive ? 'text-[#4E9F6E]' : 'text-[#D9534F]'
            }`}
          >
            {trend.value}
          </span>
          <span className="text-[#6B6661]">vs last week</span>
        </div>
      )}
    </Card>
  );
};
