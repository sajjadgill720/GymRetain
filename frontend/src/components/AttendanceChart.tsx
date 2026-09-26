'use client';

import React, { useState } from 'react';
import { AttendanceTrendPoint } from '../types';
import { TrendingUp, Users, Calendar } from 'lucide-react';

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
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Attendance Trends & Member Traffic
            </h2>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" /> +14.2% MoM
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking daily check-in volume to anticipate churn dips before memberships expire.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="bg-[#10141f] rounded-lg p-1 border border-white/5 flex items-center gap-1">
            <button
              onClick={() => setRange(14)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                range === 14
                  ? 'bg-brand-500 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              14D
            </button>
            <button
              onClick={() => setRange(30)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                range === 30
                  ? 'bg-brand-500 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              30D
            </button>
          </div>
        </div>
      </div>

      {/* Quick stats ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-surface-100/60 border border-white/5">
          <div className="text-[11px] text-slate-400 font-medium">Period Total Check-Ins</div>
          <div className="text-lg font-bold text-white mt-0.5">{totalCheckIns}</div>
        </div>
        <div className="p-3 rounded-xl bg-surface-100/60 border border-white/5">
          <div className="text-[11px] text-slate-400 font-medium">Daily Average Visits</div>
          <div className="text-lg font-bold text-emerald-400 mt-0.5">{avgDaily} / day</div>
        </div>
        <div className="hidden sm:block p-3 rounded-xl bg-surface-100/60 border border-white/5">
          <div className="text-[11px] text-slate-400 font-medium">Peak Day Volume</div>
          <div className="text-lg font-bold text-amber-400 mt-0.5">{maxVal} visits</div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[640px]">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-56 overflow-visible select-none"
          >
            <defs>
              <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#10b981" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
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
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Area Fill */}
            <path d={areaPath} fill="url(#attendanceGradient)" />

            {/* Line Path */}
            <polyline
              fill="none"
              stroke="#10b981"
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
                    r={isHovered ? 6 : 3}
                    fill={isHovered ? '#10b981' : '#090d16'}
                    stroke="#10b981"
                    strokeWidth={isHovered ? 3 : 2}
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
                      stroke="rgba(16, 185, 129, 0.4)"
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
              className="absolute pointer-events-none transform -translate-x-1/2 bg-[#171d2b] border border-brand-500/40 px-3 py-1.5 rounded-lg shadow-2xl z-20 text-center"
              style={{
                left: `${(getX(hoveredIndex) / chartWidth) * 100}%`,
                top: `${(getY(displayData[hoveredIndex].checkIns) / chartHeight) * 100 - 15}%`,
              }}
            >
              <div className="text-[10px] text-slate-400 font-mono">
                {displayData[hoveredIndex].date}
              </div>
              <div className="text-xs font-bold text-emerald-400">
                {displayData[hoveredIndex].checkIns} Check-Ins
              </div>
            </div>
          )}

          {/* X Axis Labels */}
          <div className="flex justify-between text-[11px] text-slate-500 px-5 pt-2 font-mono">
            <span>{displayData[0]?.date}</span>
            <span>{displayData[Math.floor(displayData.length / 2)]?.date}</span>
            <span>{displayData[displayData.length - 1]?.date} (Today)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
