'use client';

import React, { useState } from 'react';
import { AttendanceTrendPoint } from '../types';
import { TrendingUp, Users, Calendar } from '@/components/icons';

interface AttendanceChartProps {
  data: AttendanceTrendPoint[];
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [range, setRange] = useState<14 | 30>(30);

  const displayData = data.slice(-range);
  const maxVal = Math.max(...displayData.map((d) => d.checkIns), 10);
  const chartHeight = 220;
  const chartWidth = 720;
  const paddingX = 20;
  const paddingY = 24;

  const getX = (index: number) => {
    return paddingX + (index / (displayData.length - 1)) * (chartWidth - paddingX * 2);
  };

  const getY = (val: number) => {
    const usableHeight = chartHeight - paddingY * 2;
    return chartHeight - paddingY - (val / (maxVal * 1.15)) * usableHeight;
  };

  const points = displayData.map((d, i) => `${getX(i)},${getY(d.checkIns)}`).join(' ');
  const areaPath = `M ${getX(0)},${chartHeight - paddingY} L ${displayData
    .map((d, i) => `${getX(i)},${getY(d.checkIns)}`)
    .join(' ')} L ${getX(displayData.length - 1)},${chartHeight - paddingY} Z`;

  const totalCheckIns = displayData.reduce((acc, curr) => acc + curr.checkIns, 0);
  const avgDaily = (totalCheckIns / displayData.length).toFixed(1);

  return (
    <div className="bg-surface border border-surface-border rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-3 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-content-primary tracking-tight">
              Attendance Trends
            </h2>
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" /> +14.2% MoM
            </span>
          </div>
          <p className="text-xs text-content-secondary mt-0.5">
            Daily check-in volume to anticipate churn dips before memberships expire.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-surface-border">
          <button
            onClick={() => setRange(14)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all btn-shadow ${
              range === 14
                ? 'bg-surface text-content-primary shadow-xs font-semibold'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            14D
          </button>
          <button
            onClick={() => setRange(30)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all btn-shadow ${
              range === 30
                ? 'bg-surface text-content-primary shadow-xs font-semibold'
                : 'text-content-secondary hover:text-content-primary'
            }`}
          >
            30D
          </button>
        </div>
      </div>

      {/* Quick stats ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
        <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
          <div className="text-[11px] text-content-tertiary font-medium uppercase tracking-wider">Total Check-Ins</div>
          <div className="text-xl font-bold font-mono text-content-primary mt-1">{totalCheckIns}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
          <div className="text-[11px] text-content-tertiary font-medium uppercase tracking-wider">Daily Average Visits</div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{avgDaily} <span className="text-xs font-normal text-content-secondary">/ day</span></div>
        </div>
        <div className="hidden sm:block p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
          <div className="text-[11px] text-content-tertiary font-medium uppercase tracking-wider">Peak Day Volume</div>
          <div className="text-xl font-bold font-mono text-purple-600 dark:text-neon-cyan mt-1">{maxVal} <span className="text-xs font-normal text-content-secondary">visits</span></div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[640px]">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-52 overflow-visible select-none"
          >
            <defs>
              <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.25" />
                <stop offset="70%" stopColor="#7C3AED" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            {[0, 0.33, 0.66, 1].map((pct, idx) => {
              const y = chartHeight - paddingY - pct * (chartHeight - paddingY * 2);
              return (
                <line
                  key={idx}
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="currentColor"
                  className="text-surface-border"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Area Fill */}
            <path d={areaPath} fill="url(#attendanceGradient)" />

            {/* Line Path */}
            <polyline
              fill="none"
              stroke="#7C3AED"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />

            {/* Interactive Data Points */}
            {displayData.map((d, i) => {
              const cx = getX(i);
              const cy = getY(d.checkIns);
              const isHovered = hoveredIndex === i;

              return (
                <g key={i}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5 : 3}
                    fill={isHovered ? '#7C3AED' : '#FFFFFF'}
                    stroke="#7C3AED"
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    className="transition-all duration-150 cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />

                  {/* Vertical hover indicator */}
                  {isHovered && (
                    <line
                      x1={cx}
                      y1={paddingY}
                      x2={cx}
                      y2={chartHeight - paddingY}
                      stroke="rgba(124, 58, 237, 0.4)"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Active Hover Tooltip */}
          {hoveredIndex !== null && (
            <div
              className="absolute pointer-events-none transform -translate-x-1/2 bg-surface border border-surface-border px-3.5 py-2 rounded-xl shadow-xl z-20 text-center"
              style={{
                left: `${(getX(hoveredIndex) / chartWidth) * 100}%`,
                top: `${(getY(displayData[hoveredIndex].checkIns) / chartHeight) * 100 - 15}%`,
              }}
            >
              <div className="text-[10px] text-content-tertiary font-mono">
                {displayData[hoveredIndex].date}
              </div>
              <div className="text-xs font-semibold font-mono text-content-primary">
                {displayData[hoveredIndex].checkIns} Check-Ins
              </div>
            </div>
          )}

          {/* X Axis Labels */}
          <div className="flex justify-between text-[11px] text-content-tertiary px-5 pt-2 font-mono">
            <span>{displayData[0]?.date}</span>
            <span>{displayData[Math.floor(displayData.length / 2)]?.date}</span>
            <span>{displayData[displayData.length - 1]?.date} (Today)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
