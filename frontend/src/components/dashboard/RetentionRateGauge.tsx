'use client';

import React from 'react';
import { MoreHorizontal } from '@/components/icons';
import Link from 'next/link';

export const RetentionRateGauge: React.FC = () => {
  const percentage = 91.4;

  const radius = 75;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <div className="shopeers-card p-5 flex flex-col justify-between items-center text-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-content-secondary tracking-tight">
          30-Day Member Retention
        </span>
        <button
          className="p-1 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-subtle transition-colors"
          title="Options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Semicircular Speedometer Arc */}
      <div className="relative w-48 h-28 flex items-end justify-center my-1 overflow-hidden">
        <svg viewBox="0 0 180 100" className="w-44 h-24 overflow-visible">
          {/* Background Arc */}
          <path
            d="M 15 90 A 75 75 0 0 1 165 90"
            fill="none"
            stroke="currentColor"
            className="text-surface-border"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="4 6"
          />

          {/* Active Segmented Green Gradient Arc */}
          <path
            d="M 15 90 A 75 75 0 0 1 165 90"
            fill="none"
            stroke="url(#retentionGreenGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="4 6"
            style={{
              strokeDashoffset: `${strokeDashoffset}`,
              transition: 'stroke-dashoffset 1s ease-in-out',
            }}
          />

          <defs>
            <linearGradient id="retentionGreenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="text-3xl font-extrabold text-content-primary tracking-tight font-sans">
            {percentage}%
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Exceeding 85% industry benchmark
          </span>
        </div>
      </div>

      {/* Action Button: "View At-Risk Queue" with shadow */}
      <div className="mt-4 w-full">
        <Link
          href="/retention"
          className="inline-flex items-center justify-center w-full py-1.5 px-4 rounded-xl text-xs font-semibold text-content-primary bg-surface hover:bg-surface-subtle border border-surface-border transition-all btn-shadow"
        >
          View At-Risk Queue (6 High)
        </Link>
      </div>
    </div>
  );
};
