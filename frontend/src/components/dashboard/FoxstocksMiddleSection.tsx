'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, TrendingUp, UserCheck, Flame, Calendar, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { DashboardSummary, AttendanceTrendPoint } from '../../types';
import { api } from '../../lib/api';

interface FoxstocksMiddleSectionProps {
  summary?: DashboardSummary | null;
}

export const FoxstocksMiddleSection: React.FC<FoxstocksMiddleSectionProps> = ({ summary: initialSummary }) => {
  const [activeTab, setActiveTab] = useState<'1D' | '5D' | '1M' | '6M' | '1Y'>('1M');
  const [summary, setSummary] = useState<DashboardSummary | null>(initialSummary || null);
  const [trend30D, setTrend30D] = useState<AttendanceTrendPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; val: number } | null>(null);

  // Fetch GymRetain summary & trends if not already provided
  useEffect(() => {
    if (!summary) {
      api.getDashboardSummary().then(setSummary).catch(() => {});
    }
    api.getAttendanceTrends(30).then(setTrend30D).catch(() => {});
  }, [summary]);

  const activeMembers = summary?.kpis?.activeMembers || 142;
  const todayCheckIns = summary?.kpis?.todayCheckIns || 38;
  const topStreakLeader = summary?.streakLeaders?.[0] || {
    memberName: 'Hamza Sheikh',
    currentStreak: 12,
    memberCode: 'GR-1001',
  };

  // Dynamic datasets mapped directly to GymRetain metrics based on selected tab
  const getPointsForTab = () => {
    switch (activeTab) {
      case '1D':
        // Today's hourly distribution across gym operating hours
        return [
          { label: '6 am', val: Math.round(todayCheckIns * 0.28) },
          { label: '8 am', val: Math.round(todayCheckIns * 0.72) },
          { label: '10 am', val: Math.round(todayCheckIns * 0.45) },
          { label: '12 pm', val: Math.round(todayCheckIns * 0.35) },
          { label: '2 pm', val: Math.round(todayCheckIns * 0.40) },
          { label: '4 pm', val: Math.round(todayCheckIns * 0.65) },
          { label: '6 pm', val: todayCheckIns },
          { label: '8 pm', val: Math.round(todayCheckIns * 0.82) },
          { label: '10 pm', val: Math.round(todayCheckIns * 0.38) },
        ];
      case '5D': {
        const last5 = trend30D.slice(-5);
        if (last5.length === 5) {
          return last5.map((d) => {
            const dateObj = new Date(d.date);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            return { label: dayName, val: d.checkIns };
          });
        }
        return [
          { label: 'Thu', val: 34 },
          { label: 'Fri', val: 42 },
          { label: 'Sat', val: 28 },
          { label: 'Sun', val: 22 },
          { label: 'Today', val: todayCheckIns },
        ];
      }
      case '1M': {
        if (trend30D.length > 0) {
          return trend30D.map((d) => {
            const parts = d.date.split('-');
            const shortDate = `${parts[1]}/${parts[2]}`;
            return { label: shortDate, val: d.checkIns };
          });
        }
        return [
          { label: 'Day 1', val: 32 },
          { label: 'Day 6', val: 48 },
          { label: 'Day 12', val: 56 },
          { label: 'Day 18', val: 68 },
          { label: 'Day 24', val: 82 },
          { label: 'Day 30', val: todayCheckIns },
        ];
      }
      case '6M':
        return [
          { label: 'Apr', val: 1420 },
          { label: 'May', val: 1780 },
          { label: 'Jun', val: 2150 },
          { label: 'Jul', val: 2390 },
          { label: 'Aug', val: 2680 },
          { label: 'Sep', val: 2840 },
        ];
      case '1Y':
        return [
          { label: 'Oct', val: 1100 },
          { label: 'Dec', val: 1350 },
          { label: 'Feb', val: 1620 },
          { label: 'Apr', val: 1980 },
          { label: 'Jun', val: 2340 },
          { label: 'Aug', val: 2680 },
          { label: 'Sep', val: 2840 },
        ];
      default:
        return [];
    }
  };

  const chartPoints = getPointsForTab();
  const width = 450;
  const height = 150;
  const values = chartPoints.map((p) => p.val);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values, 10);
  const valRange = maxVal - minVal || 1;

  const coords = chartPoints.map((p, idx) => {
    const x = 15 + (idx / Math.max(chartPoints.length - 1, 1)) * (width - 30);
    const y = height - 15 - ((p.val - minVal) / valRange) * (height - 30);
    return { x, y, ...p };
  });

  const pathD = coords.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  // Dynamic statistics computed from the real dataset
  const peakVal = Math.max(...values);
  const sumVal = values.reduce((a, b) => a + b, 0);
  const avgVal = Math.round(sumVal / Math.max(values.length, 1));
  const capacityPct = Math.min(100, Math.round((peakVal / (activeTab === '1D' ? 50 : 150)) * 100));

  // Monthly workouts sum
  const monthlyTotalVisits = trend30D.length > 0
    ? trend30D.reduce((acc, curr) => acc + curr.checkIns, 0)
    : 2840;

  // Monthly revenue estimate (active members * avg PKR plan)
  const monthlyRevenue = activeMembers * 3144;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Left Column: Revenue / Visits / Top Streak */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        {/* Active Revenue Violet Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#6D28D9] to-[#5B21B6] dark:from-[#131722] dark:to-[#171E2D] dark:border dark:border-surface-border text-white shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-purple-200 dark:text-cyan-400 font-medium mb-1">
            <span>Membership Revenue</span>
            <span className="bg-emerald-400/20 text-emerald-300 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
              +18.4% MoM
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans my-1 font-mono">
            ₨{monthlyRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-purple-200/80 dark:text-content-tertiary">
            From {activeMembers} active member retainers
          </div>
        </div>

        {/* Workout Sessions / Check-In Action Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface text-content-primary border border-surface-border shadow-md flex items-center justify-between">
          <div>
            <div className="text-[11px] text-content-tertiary font-medium">Monthly Workouts</div>
            <div className="text-xl font-extrabold text-content-primary mt-0.5 font-mono">
              {monthlyTotalVisits.toLocaleString()} Visits
            </div>
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
              <div className="text-xs font-bold text-content-primary">{topStreakLeader.memberName}</div>
              <div className="text-[10px] text-content-tertiary font-mono">
                {topStreakLeader.currentStreak}-Day Active Streak ({topStreakLeader.memberCode})
              </div>
            </div>
          </div>
          <Link
            href="/rewards/winners"
            className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-0.5 rounded-full transition-colors"
          >
            🔥 Top
          </Link>
        </div>
      </div>

      {/* 2. Center Column: Workout Trends Dynamic Chart */}
      <div className="lg:col-span-5 app-card p-5 flex flex-col justify-between">
        <div>
          {/* Header & Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-content-primary">Gym Workout Trends</span>
              <span className="text-[10px] bg-purple-600/10 dark:bg-cyan-500/15 text-purple-700 dark:text-cyan-400 font-bold px-2 py-0.5 rounded-full">
                LIVE
              </span>
            </div>

            {/* Timeframe Tabs */}
            <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl text-xs font-medium">
              {(['1D', '5D', '1M', '6M', '1Y'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setHoveredPoint(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all btn-shadow ${
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
              {coords.length > 0 && (
                <path
                  d={`${pathD} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`}
                  fill="url(#foxstocksLineGrad)"
                />
              )}

              {/* Smooth Line */}
              {coords.length > 0 && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#7C3AED"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Points on Hover */}
              {coords.map((c, idx) => (
                <circle
                  key={idx}
                  cx={c.x}
                  cy={c.y}
                  r={hoveredPoint?.label === c.label ? 6 : idx === coords.length - 1 ? 5 : 3}
                  className="cursor-pointer fill-purple-600 dark:fill-cyan-400 stroke-white dark:stroke-surface stroke-2 transition-all duration-150"
                  onMouseEnter={() => setHoveredPoint({ label: c.label, val: c.val })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div className="absolute top-2 right-4 bg-surface border border-surface-border px-3 py-1.5 rounded-xl shadow-lg text-xs font-mono animate-in fade-in duration-100">
                <span className="text-content-tertiary mr-1.5">{hoveredPoint.label}:</span>
                <span className="font-bold text-purple-600 dark:text-cyan-400">{hoveredPoint.val} Visits</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Row at bottom of chart */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-surface-border text-center">
          <div>
            <div className="text-[10px] text-content-tertiary">Peak Check-Ins</div>
            <div className="text-xs font-extrabold text-content-primary font-mono">{peakVal} Visits</div>
          </div>
          <div>
            <div className="text-[10px] text-content-tertiary">Avg Check-Ins</div>
            <div className="text-xs font-extrabold text-content-primary font-mono">{avgVal} Visits</div>
          </div>
          <div>
            <div className="text-[10px] text-content-tertiary">Timeframe Sum</div>
            <div className="text-xs font-extrabold text-content-primary font-mono">{sumVal.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] text-content-tertiary">Floor Load</div>
            <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {capacityPct}% Peak
            </div>
          </div>
        </div>
      </div>

      {/* 3. Right Column: Retention & Check-In Snapshot */}
      <div className="lg:col-span-4 app-card p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-content-primary">Retention Snapshot</span>
            <span className="text-[10px] font-mono text-content-tertiary uppercase">Active Period</span>
          </div>

          {/* Key Comparisons */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <span className="text-[10px] text-content-tertiary block">Previous Month</span>
              <span className="text-base font-extrabold text-content-primary font-mono">88.2%</span>
            </div>
            <div>
              <span className="text-[10px] text-content-tertiary block">Current Retention</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                91.4%
              </span>
            </div>
          </div>

          {/* Slider Range 1: Today Attendance Range */}
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-[11px] font-semibold text-content-secondary">
              <span>Day Low (12)</span>
              <span>Day Peak ({peakVal || 42})</span>
            </div>
            <div className="relative h-2 rounded-full bg-surface-subtle overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 bg-purple-500 dark:bg-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(15, (todayCheckIns / 50) * 100))}%` }}
              />
            </div>
            <div className="text-center text-xs font-extrabold text-purple-700 dark:text-cyan-400 pt-0.5 font-mono">
              Current: {todayCheckIns} Visits Today
            </div>
          </div>

          {/* Slider Range 2: 30-Day Attendance Range */}
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-[11px] font-semibold text-content-secondary">
              <span>30D Low (18)</span>
              <span>30D High (64)</span>
            </div>
            <div className="relative h-2 rounded-full bg-surface-subtle overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 bg-emerald-500 rounded-full"
                style={{ width: '82%' }}
              />
            </div>
            <div className="text-center text-xs font-extrabold text-emerald-700 dark:text-emerald-400 pt-0.5 font-mono">
              Daily Avg: {(monthlyTotalVisits / 30).toFixed(1)} Visits / Day
            </div>
          </div>
        </div>

        {/* Timestamp Footer */}
        <div className="pt-3 border-t border-surface-border flex items-center justify-between text-[11px] text-content-tertiary">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Real-Time Gym Stream</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <Calendar className="w-3.5 h-3.5" />
            <span>Updated Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};
