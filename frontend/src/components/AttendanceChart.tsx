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
    <div className="bg-[#121215] border border-zinc-800 rounded-lg p-4 sm:p-5 shadow-sm relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-3 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
              Attendance Trends
            </h2>
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" /> +14.2% MoM
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Daily check-in volume to anticipate churn dips before memberships expire.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-md border border-zinc-800">
          <button
            onClick={() => setRange(14)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all btn-shadow ${
              range === 14
                ? 'bg-zinc-800 text-white shadow-sm font-semibold border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            14D
          </button>
          <button
            onClick={() => setRange(30)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all btn-shadow ${
              range === 30
                ? 'bg-zinc-800 text-white shadow-sm font-semibold border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            30D
          </button>
        </div>
      </div>

      {/* Quick stats ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
        <div className="p-3 rounded-md bg-zinc-900/60 border border-zinc-800">
          <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Total Check-Ins</div>
          <div className="text-xl font-bold font-mono text-zinc-100 mt-1">{totalCheckIns}</div>
        </div>
        <div className="p-3 rounded-md bg-zinc-900/60 border border-zinc-800">
          <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Daily Average Visits</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{avgDaily} <span className="text-xs font-normal text-zinc-500">/ day</span></div>
        </div>
        <div className="hidden sm:block p-3 rounded-md bg-zinc-900/60 border border-zinc-800">
          <div className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">Peak Day Volume</div>
          <div className="text-xl font-bold font-mono text-blue-400 mt-1">{maxVal} <span className="text-xs font-normal text-zinc-500">visits</span></div>
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
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.20" />
                <stop offset="70%" stopColor="#3B82F6" stopOpacity="0.02" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
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
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Area Fill */}
            <path d={areaPath} fill="url(#attendanceGradient)" />

            {/* Line Path */}
            <polyline
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
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
                    fill={isHovered ? '#3B82F6' : '#121215'}
                    stroke="#3B82F6"
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
                      stroke="rgba(59, 130, 246, 0.4)"
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
              className="absolute pointer-events-none transform -translate-x-1/2 bg-[#18181B] border border-zinc-700 px-3 py-1.5 rounded-md shadow-xl z-20 text-center"
              style={{
                left: `${(getX(hoveredIndex) / chartWidth) * 100}%`,
                top: `${(getY(displayData[hoveredIndex].checkIns) / chartHeight) * 100 - 15}%`,
              }}
            >
              <div className="text-[10px] text-zinc-400 font-mono">
                {displayData[hoveredIndex].date}
              </div>
              <div className="text-xs font-semibold font-mono text-zinc-100">
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
