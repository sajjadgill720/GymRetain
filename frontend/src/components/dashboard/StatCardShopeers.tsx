import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardShopeersProps {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  comparison: string;
  icon: LucideIcon;
}

export const StatCardShopeers: React.FC<StatCardShopeersProps> = ({
  title,
  value,
  trend,
  isPositive,
  comparison,
  icon: Icon,
}) => {
  return (
    <div className="shopeers-card p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-content-secondary tracking-tight">
          {title}
        </span>
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content-primary font-sans">
            {value}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend}
          </span>
        </div>
        <p className="text-[11px] text-content-tertiary">{comparison}</p>
      </div>
    </div>
  );
};
