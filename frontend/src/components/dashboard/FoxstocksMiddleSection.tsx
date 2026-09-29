'use client';

import React, { useState } from 'react';
import { ArrowRight, TrendingUp, UserCheck, Flame, Calendar, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const FoxstocksMiddleSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'1D' | '5D' | '1M' | '6M' | '1Y'>('1M');

  // Chart data
  const chartPoints = [
    { time: '10 am', val: 32 },
    { time: '11 am', val: 48 },
    { time: '12 pm', val: 64 },
    { time: '1 pm', val: 52 },
    { time: '2 pm', val: 58 },
    { time: '3 pm', val: 78 },
    { time: '4 pm', val: 96 },
    { time: '5 pm', val: 124 },
    { time: '6 pm', val: 136 },
    { time: '7 pm', val: 128 },
    { time: '8 pm', val: 110 },
  ];

  const width = 450;
  const height = 150;
  const minVal = 20;
  const maxVal = 150;

  const coords = chartPoints.map((p, idx) => {
    const x = 15 + (idx / (chartPoints.length - 1)) * (width - 30);
    const y = height - 15 - ((p.val - minVal) / (maxVal - minVal)) * (height - 30);
    return { x, y, ...p };
  });

  const pathD = coords.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Left Column: Revenue / Visits / Top Streak (Matching Image 1 left panel) */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        {/* Active Revenue Violet Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#6D28D9] to-[#5B21B6] dark:from-[#131722] dark:to-[#171E2D] dark:border dark:border-surface-border text-white shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-purple-200 dark:text-cyan-400 font-medium mb-1">
            <span>Membership Revenue</span>
            <span className="bg-emerald-400/20 text-emerald-300 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
              +18.4%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans my-1">
            ₨446,500
          </div>
          <div className="text-[11px] text-purple-200/80 dark:text-content-tertiary">
            Active monthly recurring retainers
          </div>
        </div>

        {/* Workout Sessions / Check-In Action Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface text-content-primary border border-surface-border shadow-md flex items-center justify-between">
          <div>
            <div className="text-[11px] text-content-tertiary font-medium">Monthly Workouts</div>
            <div className="text-xl font-extrabold text-content-primary mt-0.5">2,840 Visits</div>
          </div>
          <Link
            href="/check-in"
            className="w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-500 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black flex items-center justify-center transition-all btn-shadow"
            title="Open Kiosk Check-In"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Top Active Streak Card */}
        <div className="p-4 rounded-2xl bg-surface border border-surface-border app-card flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-content-primary">Hamza Sheikh</div>
              <div className="text-[10px] text-content-tertiary">12-Day Active Streak</div>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
            🔥 Top
          </span>
        </div>
      </div>

      {/* 2. Center Column: Attendance Volume Chart (Matching Image 1 center panel) */}
      <div className="lg:col-span-5 app-card p-5 flex flex-col justify-between">
        <div>
          {/* Header & Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-content-primary">Workout Trends</span>
              <span className="text-[10px] bg-purple-600/10 dark:bg-cyan-500/15 text-purple-700 dark:text-cyan-400 font-bold px-2 py-0.5 rounded-full">
                LIVE
              </span>
            </div>

            {/* Timeframe Tabs */}
            <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl text-xs font-medium">
              {(['1D', '5D', '1M', '6M', '1Y'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tab
                      ? 'bg-purple-600 text-white dark:bg-white dark:text-black shadow-sm'
                      : 'text-content-secondary hover:text-content-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full relative py-2">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 overflow-visible">
              <defs>
                <linearGradient id="foxstocksLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Dotted horizontal guidelines */}
              {[0.2, 0.5, 0.8].map((ratio, i) => (
                <line
                  key={i}
                  x1="15"
                  y1={height * ratio}
                  x2={width - 15}
                  y2={height * ratio}
                  stroke="currentColor"
                  className="text-surface-border"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              ))}

              {/* Area Fill */}
              <path
                d={`${pathD} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`}
                fill="url(#foxstocksLineGrad)"
              />

              {/* Smooth Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#7C3AED"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* End Point Glow */}
              <circle
                cx={coords[coords.length - 1].x}
                cy={coords[coords.length - 1].y}
                r="5"
                className="fill-purple-600 dark:fill-cyan-400 stroke-white dark:stroke-surface stroke-2 shadow-sm"
              />
            </svg>
          </div>
        </div>

        {/* Stats Row at bottom of chart */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-surface-border text-center">
          <div>
            <div className="text-[10px] text-content-tertiary">Peak Check-Ins</div>
            <div className="text-xs font-extrabold text-content-primary">136 Visits</div>
          </div>
          <div>
            <div className="text-[10px] text-content-tertiary">Morning Avg</div>
            <div className="text-xs font-extrabold text-content-primary">64 Visits</div>
          </div>
          <div>
            <div className="text-[10px] text-content-tertiary">Evening Avg</div>
            <div className="text-xs font-extrabold text-content-primary">92 Visits</div>
          </div>
          <div>
            <div className="text-[10px] text-content-tertiary">Capacity</div>
            <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">82% Peak</div>
          </div>
        </div>
      </div>

      {/* 3. Right Column: Retention & Check-In Snapshot (Matching Image 1 right panel) */}
      <div className="lg:col-span-4 app-card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-content-primary">Retention Snapshot</span>
            <span className="text-[10px] font-mono text-content-tertiary">SEP 2026</span>
          </div>

          {/* Key Comparisons */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <span className="text-[10px] text-content-tertiary block">Previous Month</span>
              <span className="text-base font-extrabold text-content-primary">88.2%</span>
            </div>
            <div>
              <span className="text-[10px] text-content-tertiary block">Current Retention</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                91.4%
              </span>
            </div>
          </div>

          {/* Slider Range 1: Today Attendance Range */}
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-[11px] font-semibold text-content-secondary">
              <span>Day Low (34)</span>
              <span>Day High (84)</span>
            </div>
            <div className="relative h-2 rounded-full bg-surface-subtle overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 bg-purple-500 dark:bg-cyan-400 rounded-full"
                style={{ width: '74%' }}
              />
            </div>
            <div className="text-center text-xs font-extrabold text-purple-700 dark:text-cyan-400 pt-0.5">
              Current: 38 Visits
            </div>
          </div>

          {/* Slider Range 2: 30-Day Attendance Range */}
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-[11px] font-semibold text-content-secondary">
              <span>30D Low (68)</span>
              <span>30D High (136)</span>
            </div>
            <div className="relative h-2 rounded-full bg-surface-subtle overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 bg-emerald-500 rounded-full"
                style={{ width: '82%' }}
              />
            </div>
            <div className="text-center text-xs font-extrabold text-emerald-700 dark:text-emerald-400 pt-0.5">
              Monthly Avg: 94.6 Visits
            </div>
          </div>
        </div>

        {/* Timestamp Footer */}
        <div className="pt-3 border-t border-surface-border flex items-center justify-between text-[11px] text-content-tertiary">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>05:16 PM (Peak Rush)</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <Calendar className="w-3.5 h-3.5" />
            <span>09/29/26</span>
          </div>
        </div>
      </div>
    </div>
  );
};
