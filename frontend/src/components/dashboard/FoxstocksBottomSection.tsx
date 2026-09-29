'use client';

import React, { useState } from 'react';
import { Plus, MessageCircle, AlertTriangle, CheckCircle2, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';
import { AiAssistantCard } from '../AiAssistantCard';

export const FoxstocksBottomSection: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'1D' | '5D' | '1M' | '6M' | '1Y' | 'Max'>('1M');

  // At-risk members for the Watchlist (Matching Image 1 right bottom list)
  const atRiskWatchlist = [
    {
      id: 'mem-2',
      code: 'GR-1002',
      name: 'Ayesha Malik',
      plan: 'Monthly Standard',
      status: '16d absent',
      riskScore: 88,
      riskLevel: 'HIGH',
      badgeClass: 'text-red-600 dark:text-red-400 bg-red-500/10',
      initials: 'AM',
      avatarBg: 'bg-red-500/15 text-red-600 dark:text-red-400',
    },
    {
      id: 'mem-7',
      code: 'GR-1007',
      name: 'Omer Farooq',
      plan: 'Quarterly VIP',
      status: '12d absent',
      riskScore: 78,
      riskLevel: 'HIGH',
      badgeClass: 'text-red-600 dark:text-red-400 bg-red-500/10',
      initials: 'OF',
      avatarBg: 'bg-red-500/15 text-red-600 dark:text-red-400',
    },
    {
      id: 'mem-5',
      code: 'GR-1005',
      name: 'Bilal Ahmed',
      plan: 'Monthly Gold',
      status: '9d absent',
      riskScore: 68,
      riskLevel: 'MEDIUM',
      badgeClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
      initials: 'BA',
      avatarBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'mem-8',
      code: 'GR-1008',
      name: 'Zainab Ali',
      plan: 'Monthly Standard',
      status: '8d absent',
      riskScore: 64,
      riskLevel: 'MEDIUM',
      badgeClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
      initials: 'ZA',
      avatarBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'mem-1',
      code: 'GR-1001',
      name: 'Hamza Sheikh',
      plan: 'Monthly Gold',
      status: '12d streak',
      riskScore: 12,
      riskLevel: 'HEALTHY',
      badgeClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
      initials: 'HS',
      avatarBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    },
  ];

  // 30-Day Detailed Analytics Chart Points
  const areaPoints = [
    { x: 0, y: 15 },
    { x: 30, y: 40 },
    { x: 60, y: 35 },
    { x: 90, y: 70 },
    { x: 120, y: 60 },
    { x: 150, y: 95 },
    { x: 180, y: 80 },
    { x: 210, y: 110 },
    { x: 240, y: 125 },
    { x: 270, y: 105 },
    { x: 300, y: 140 },
    { x: 330, y: 130 },
    { x: 360, y: 160 },
    { x: 390, y: 145 },
    { x: 420, y: 175 },
  ];

  const svgW = 440;
  const svgH = 170;

  const pathD = areaPoints.reduce((acc, curr, idx) => {
    const px = (curr.x / 420) * (svgW - 40) + 20;
    const py = svgH - 20 - (curr.y / 200) * (svgH - 40);
    return idx === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
  }, '');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Left Area Chart: Retention & Revenue Analytics (Matching Image 1 bottom-left) */}
      <div className="lg:col-span-7 app-card p-5 flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-xs font-bold text-content-primary">Retention &amp; Check-In Analytics</h3>
              <p className="text-[11px] text-content-tertiary">30-day cumulative workout engagement curve</p>
            </div>

            {/* Range Selector */}
            <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl text-xs font-medium">
              {(['1D', '5D', '1M', '6M', '1Y', 'Max'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeFilter === tab
                      ? 'bg-purple-600 text-white dark:bg-white dark:text-black shadow-sm'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Detailed Area Chart with Tooltip Pin */}
          <div className="relative w-full py-2">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-48 overflow-visible">
              <defs>
                <linearGradient id="detailedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Dotted horizontal guidelines */}
              {[0.2, 0.45, 0.7, 0.95].map((ratio, i) => (
                <line
                  key={i}
                  x1="20"
                  y1={svgH * ratio}
                  x2={svgW - 20}
                  y2={svgH * ratio}
                  stroke="currentColor"
                  className="text-surface-border"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              ))}

              {/* Area */}
              <path
                d={`${pathD} L ${svgW - 20} ${svgH - 20} L 20 ${svgH - 20} Z`}
                fill="url(#detailedAreaGrad)"
              />

              {/* Stroke */}
              <path
                d={pathD}
                fill="none"
                stroke="#7C3AED"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Tooltip Pin (Matching Foxstocks Image 1 purple pin) */}
              <line
                x1={svgW * 0.65}
                y1="10"
                x2={svgW * 0.65}
                y2={svgH - 20}
                stroke="#7C3AED"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
              <circle
                cx={svgW * 0.65}
                cy={svgH * 0.35}
                r="5"
                className="fill-purple-600 dark:fill-cyan-400 stroke-white dark:stroke-surface stroke-2"
              />
            </svg>

            {/* Pinned Tooltip Overlay */}
            <div
              className="absolute bg-purple-700 text-white dark:bg-white dark:text-black rounded-xl px-3 py-1.5 shadow-xl text-center pointer-events-none transform -translate-x-1/2 -translate-y-4"
              style={{ left: '65%', top: '25%' }}
            >
              <div className="text-[10px] font-medium opacity-90">Peak Day (136 Visits)</div>
              <div className="text-xs font-extrabold font-mono">₨14,032 Revenue</div>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between text-[11px] text-content-tertiary font-medium pt-2 px-4">
              <span>10 am</span>
              <span>11 am</span>
              <span>12 pm</span>
              <span>12 pm</span>
              <span>12 pm</span>
              <span>12 pm</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Right Column: Watchlist of At-Risk Members (Matching Image 1 bottom-right) */}
      <div className="lg:col-span-5 app-card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-content-primary">At-Risk Priority Queue</h3>
              <span className="text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded-full">
                6 High
              </span>
            </div>
            <Link
              href="/retention"
              className="w-6 h-6 rounded-lg bg-purple-600 dark:bg-white text-white dark:text-black flex items-center justify-center btn-shadow"
              title="Add follow-up intervention"
            >
              <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* List items matching Image 1 */}
          <div className="divide-y divide-surface-border/60">
            {atRiskWatchlist.map((m) => (
              <div
                key={m.id}
                className="py-2.5 flex items-center justify-between hover:bg-surface-subtle/50 px-1 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${m.avatarBg}`}
                  >
                    {m.initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-content-primary leading-tight">
                      {m.name}
                    </div>
                    <div className="text-[10px] text-content-tertiary">
                      {m.code} • {m.plan}
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center gap-3">
                  <div>
                    <div className="text-xs font-extrabold text-content-primary font-mono">
                      Risk: {m.riskScore}
                    </div>
                    <div className={`text-[10px] font-bold ${m.badgeClass} px-1.5 py-0.2 rounded-full inline-block mt-0.5`}>
                      {m.status}
                    </div>
                  </div>
                  <Link
                    href="/retention"
                    className="p-1 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-subtle opacity-0 group-hover:opacity-100 transition-all"
                    title="View details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-surface-border">
          <Link
            href="/retention"
            className="w-full py-2 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-bold text-content-primary flex items-center justify-center gap-1.5 transition-all btn-shadow"
          >
            <span>Open Retention Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
