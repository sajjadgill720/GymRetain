'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/AppLayout';
import { AtRiskMembersTable } from '../components/AtRiskMembersTable';
import { AttendanceChart } from '../components/AttendanceChart';
import { StreakLeaderboard } from '../components/StreakLeaderboard';
import { api } from '../lib/api';
import { DashboardSummary, AttendanceTrendPoint } from '../types';
import {
  UserCheck,
  Users,
  Flame,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<AttendanceTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [sum, tr] = await Promise.all([
        api.getDashboardSummary(),
        api.getAttendanceTrends(30),
      ]);
      setSummary(sum);
      setTrends(tr);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const highRiskCount = summary?.kpis.highRiskCount ?? 6;
  const activeMembers = summary?.kpis.activeMembers ?? 142;
  const todayVisits = summary?.kpis.todayCheckIns ?? 38;
  const topStreak = summary?.streakLeaders[0]?.currentStreak ?? 12;

  return (
    <AppLayout onRefreshData={loadData}>
      {/* Main SaaS Dashboard Surface */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* 2. Top Status Bar & Headline Metric */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-zinc-800/60">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
                Retention Dashboard
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {highRiskCount} members require follow-up
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Active gym health, daily check-in volume, and automated member retention workflows.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/retention"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#121215] hover:bg-[#18181B] border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors btn-shadow"
            >
              <span>Full Risk Queue</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </Link>
          </div>
        </div>

        {/* 3. Primary Data Above the Fold: At-Risk Members Follow-Up Queue */}
        <section aria-label="At-Risk Members Queue">
          <AtRiskMembersTable
            members={summary?.recentAtRiskPreview || []}
            limit={5}
            showFilters={true}
          />
        </section>

        {/* 4. Compact Secondary Stat Cards Row (Information-Dense SaaS Tiles) */}
        <section aria-label="Key Performance Metrics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Stat 1: Today's Attendance */}
            <div className="bg-[#121215] border border-zinc-800 rounded-lg p-3.5 sm:p-4 shadow-sm hover:border-zinc-700/80 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium">Today&apos;s Attendance</span>
                <UserCheck className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100 font-mono">
                  {todayVisits}
                </span>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +12%
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">vs same day last week</p>
            </div>

            {/* Stat 2: Active Members */}
            <div className="bg-[#121215] border border-zinc-800 rounded-lg p-3.5 sm:p-4 shadow-sm hover:border-zinc-700/80 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium">Active Members</span>
                <Users className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100 font-mono">
                  {activeMembers}
                </span>
                <span className="text-xs text-zinc-400 font-normal">enrolled</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Total active gym memberships</p>
            </div>

            {/* Stat 3: Top Active Streak */}
            <div className="bg-[#121215] border border-zinc-800 rounded-lg p-3.5 sm:p-4 shadow-sm hover:border-zinc-700/80 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium">Top Active Streak</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100 font-mono">
                  {topStreak}d
                </span>
                <span className="text-xs text-amber-400/90 font-medium">record</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Consecutive workout record</p>
            </div>

            {/* Stat 4: 30-Day Retention Benchmark */}
            <div className="bg-[#121215] border border-zinc-800 rounded-lg p-3.5 sm:p-4 shadow-sm hover:border-zinc-700/80 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium">30-Day Retention</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100 font-mono">
                  91.4%
                </span>
                <span className="text-xs text-emerald-400 font-medium">Healthy</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Target benchmark &gt;85%</p>
            </div>
          </div>
        </section>

        {/* 5. Performance Insights: 30-Day Attendance Trends & Habit Champions */}
        <section aria-label="Performance Trends and Streaks" className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
          <div className="lg:col-span-2">
            <AttendanceChart data={trends} />
          </div>
          <div>
            <StreakLeaderboard leaders={summary?.streakLeaders || []} />
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
