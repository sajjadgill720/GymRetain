'use client';
import { CountUp } from './CountUp';
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
  variant?: 'default' | 'highlight' | 'success' | 'warning' | 'danger';
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
        onClick ? 'cursor-pointer hover:border-surface-border-hover active:scale-[0.99]' : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick(); } } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-content-secondary block">
            {label}
          </span>
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-content-primary font-mono tracking-tight">
              {value}
            </span>
            {unit && <span className="text-xs text-content-secondary font-medium">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-content-tertiary pt-0.5 leading-snug">{subtitle}</p>}
        </div>

        {icon && (
          <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-surface-border text-brand-600 dark:text-brass-400 flex items-center justify-center shrink-0 shadow-sm">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-surface-border flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold font-mono ${
              trend.isPositive ? 'text-status-success-text' : 'text-status-danger-text'
            }`}
          >
            {trend.value}
          </span>
          <span className="text-content-tertiary">vs last week</span>
        </div>
      )}
    </Card>
  );
};
