'use client';

import React, { useState } from 'react';
import { MoreHorizontal, TrendingUp, Dumbbell, Award, Flame } from '@/components/icons';

export const AttendanceRevenueChart: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 30-Day Workout Check-In volume points
  const points = [
    { date: '1 Sep', value: 68, label: '68 Check-Ins' },
    { date: '4 Sep', value: 74, label: '74 Check-Ins' },
    { date: '8 Sep', value: 112, label: '112 Check-Ins (Peak)' },
    { date: '12 Sep', value: 92, label: '92 Check-Ins' },
    { date: '15 Sep', value: 104, label: '104 Check-Ins' },
    { date: '19 Sep', value: 128, label: '128 Check-Ins (Record)' },
    { date: '22 Sep', value: 115, label: '115 Check-Ins' },
    { date: '26 Sep', value: 136, label: '136 Check-Ins' },
    { date: '29 Sep', value: 124, label: '124 Check-Ins' },
  ];

  const width = 600;
  const height = 180;
  const paddingX = 20;
  const paddingY = 20;

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / (points.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - (val / 160) * (height - paddingY * 2);
    return { x, y };
  };

  const coords = points.map((p, i) => getCoordinates(i, p.value));
  let pathD = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const mx = (p0.x + p1.x) / 2;
    pathD += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

  return (
    <div className="shopeers-card p-6 flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-content-secondary tracking-tight">
            Monthly Attendance &amp; Check-In Trends
          </span>
          <button
            className="p-1 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-subtle transition-colors"
            title="Chart options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-content-primary font-sans">
            2,840 Visits
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            +18.4%
          </span>
          <span className="text-xs text-content-tertiary">vs. last month (₨446.5K Revenue)</span>
        </div>

        {/* SVG Area Chart */}
        <div className="relative w-full overflow-hidden">
          {/* Subtle Y-Axis Gridlines */}
          <div className="absolute right-0 inset-y-0 flex flex-col justify-between pointer-events-none text-[10px] text-content-tertiary font-mono pr-1">
            <span>150</span>
            <span>100</span>
            <span>50</span>
            <span>0</span>
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-44 sm:h-52 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Dotted horizontal guidelines */}
            {[0.2, 0.45, 0.7, 0.95].map((ratio, i) => (
              <line
                key={i}
                x1={paddingX}
                y1={height * ratio}
                x2={width - paddingX}
                y2={height * ratio}
                stroke="currentColor"
                className="text-surface-border"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            ))}

            {/* Area Fill */}
            <path d={areaD} fill="url(#attendanceGradient)" />

            {/* Stroke Line */}
            <path
              d={pathD}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              className="drop-shadow-sm transition-all duration-300"
            />

            {/* Interactive Points */}
            {coords.map((c, i) => (
              <g
                key={i}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={hoveredIndex === i ? 6 : 4}
                  className={`transition-all duration-200 fill-white dark:fill-surface stroke-blue-600 dark:stroke-blue-400 stroke-2 ${
                    hoveredIndex === i ? 'stroke-[3]' : ''
                  }`}
                />
              </g>
            ))}
          </svg>

          {/* Tooltip Overlay */}
          {hoveredIndex !== null && (
            <div
              className="absolute bg-surface border border-surface-border rounded-xl px-2.5 py-1 text-xs shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-8 transition-all font-medium text-content-primary"
              style={{
                left: `${(coords[hoveredIndex].x / width) * 100}%`,
                top: `${(coords[hoveredIndex].y / height) * 100}%`,
              }}
            >
              <div className="font-bold text-blue-600 dark:text-blue-400">
                {points[hoveredIndex].label}
              </div>
              <div className="text-[10px] text-content-tertiary">
                {points[hoveredIndex].date}
              </div>
            </div>
          )}

          {/* X-Axis Dates */}
          <div className="flex justify-between text-[11px] text-content-tertiary font-medium pt-2 px-3">
            <span>1 Sep</span>
            <span>8 Sep</span>
            <span>15 Sep</span>
            <span>22 Sep</span>
            <span>29 Sep</span>
          </div>
        </div>
      </div>

      {/* Bottom Breakdown: Active Membership Plans (GymRetain Domain) */}
      <div className="mt-6 pt-5 border-t border-surface-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-content-secondary">Active Membership Distribution</span>
          <button className="text-content-tertiary hover:text-content-primary">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Segment 1: Monthly Gold */}
          <div className="p-3 rounded-2xl bg-surface-subtle/70 border border-surface-border relative overflow-hidden group hover:border-blue-500/30 transition-colors">
            <div className="absolute top-0 inset-x-0 h-1 bg-blue-600 dark:bg-blue-500 rounded-t-full" />
            <div className="flex items-center gap-1.5 text-xs text-content-secondary mb-1">
              <Dumbbell className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="font-extrabold text-content-primary text-sm">84 Members</span>
            </div>
            <span className="text-[11px] text-content-tertiary font-medium">Monthly Gold (₨6.5K)</span>
          </div>

          {/* Segment 2: Annual VIP Elite */}
          <div className="p-3 rounded-2xl bg-surface-subtle/70 border border-surface-border relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500 rounded-t-full" />
            <div className="flex items-center gap-1.5 text-xs text-content-secondary mb-1">
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-extrabold text-content-primary text-sm">42 Members</span>
            </div>
            <span className="text-[11px] text-content-tertiary font-medium">VIP Annual (Zero Churn)</span>
          </div>

          {/* Segment 3: Quarterly Flex */}
          <div className="p-3 rounded-2xl bg-surface-subtle/70 border border-surface-border relative overflow-hidden group hover:border-amber-500/30 transition-colors">
            <div className="absolute top-0 inset-x-0 h-1 bg-amber-500 rounded-t-full" />
            <div className="flex items-center gap-1.5 text-xs text-content-secondary mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-extrabold text-content-primary text-sm">16 Members</span>
            </div>
            <span className="text-[11px] text-content-tertiary font-medium">Quarterly Flex (Renew Soon)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
