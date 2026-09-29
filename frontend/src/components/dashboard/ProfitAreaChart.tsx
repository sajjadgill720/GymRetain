'use client';

import React, { useState } from 'react';
import { MoreHorizontal, TrendingUp, Store, Users, Building } from 'lucide-react';

export const ProfitAreaChart: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const points = [
    { date: '1 Jan', value: 120, label: '$120.4K' },
    { date: '4 Jan', value: 115, label: '$115.2K' },
    { date: '8 Jan', value: 240, label: '$240.8K' },
    { date: '12 Jan', value: 190, label: '$190.5K' },
    { date: '15 Jan', value: 205, label: '$205.1K' },
    { date: '19 Jan', value: 310, label: '$310.6K' },
    { date: '22 Jan', value: 295, label: '$295.3K' },
    { date: '26 Jan', value: 360, label: '$360.7K' },
    { date: '29 Jan', value: 345, label: '$345.9K' },
  ];

  // SVG viewBox coordinates
  // Width 600, Height 180
  const width = 600;
  const height = 180;
  const paddingX = 20;
  const paddingY = 20;

  const getCoordinates = (index: number, val: number) => {
    const x = paddingX + (index / (points.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - (val / 400) * (height - paddingY * 2);
    return { x, y };
  };

  // Generate cubic spline path
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
            Total Profit
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
            $446.7K
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            +24.4%
          </span>
          <span className="text-xs text-content-tertiary">vs. last period</span>
        </div>

        {/* SVG Area Chart */}
        <div className="relative w-full overflow-hidden">
          {/* Subtle Y-Axis Gridlines */}
          <div className="absolute right-0 inset-y-0 flex flex-col justify-between pointer-events-none text-[10px] text-content-tertiary font-mono pr-1">
            <span>15K</span>
            <span>10K</span>
            <span>5K</span>
            <span>0</span>
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-44 sm:h-52 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
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
            <path d={areaD} fill="url(#chartGradient)" />

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

          {/* X-Axis Dates matching Image 1 */}
          <div className="flex justify-between text-[11px] text-content-tertiary font-medium pt-2 px-3">
            <span>1 Jan</span>
            <span>8 Jan</span>
            <span>15 Jan</span>
            <span>22 Jan</span>
            <span>29 Jan</span>
          </div>
        </div>
      </div>

      {/* Bottom Breakdown Segment (Matching Image 1: Customers breakdown) */}
      <div className="mt-6 pt-5 border-t border-surface-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-content-secondary">Memberships &amp; Customers</span>
          <button className="text-content-tertiary hover:text-content-primary">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Segment 1: Retailers / Monthly */}
          <div className="p-3 rounded-2xl bg-surface-subtle/70 border border-surface-border relative overflow-hidden group hover:border-blue-500/30 transition-colors">
            <div className="absolute top-0 inset-x-0 h-1 bg-blue-600 dark:bg-blue-500 rounded-t-full" />
            <div className="flex items-center gap-1.5 text-xs text-content-secondary mb-1">
              <Store className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="font-extrabold text-content-primary text-sm">2.884</span>
            </div>
            <span className="text-[11px] text-content-tertiary font-medium">Monthly Active</span>
          </div>

          {/* Segment 2: Distributors / VIP */}
          <div className="p-3 rounded-2xl bg-surface-subtle/70 border border-surface-border relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
            <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500 rounded-t-full" />
            <div className="flex items-center gap-1.5 text-xs text-content-secondary mb-1">
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-extrabold text-content-primary text-sm">1.432</span>
            </div>
            <span className="text-[11px] text-content-tertiary font-medium">VIP Annual</span>
          </div>

          {/* Segment 3: Wholesalers / Quarterly */}
          <div className="p-3 rounded-2xl bg-surface-subtle/70 border border-surface-border relative overflow-hidden group hover:border-amber-500/30 transition-colors">
            <div className="absolute top-0 inset-x-0 h-1 bg-amber-500 rounded-t-full" />
            <div className="flex items-center gap-1.5 text-xs text-content-secondary mb-1">
              <Building className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-extrabold text-content-primary text-sm">562</span>
            </div>
            <span className="text-[11px] text-content-tertiary font-medium">Quarterly Flex</span>
          </div>
        </div>
      </div>
    </div>
  );
};
