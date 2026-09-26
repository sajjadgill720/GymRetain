'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { AttendanceChart } from '../components/AttendanceChart';
import { AtRiskMembersTable } from '../components/AtRiskMembersTable';
import { StreakLeaderboard } from '../components/StreakLeaderboard';
import { QuickCheckInModal } from '../components/QuickCheckInModal';
import { FrontDeskQrModal } from '../components/FrontDeskQrModal';
import { api } from '../lib/api';
import { DashboardSummary, AttendanceTrendPoint } from '../types';
import {
  Users,
  UserCheck,
  AlertTriangle,
  Flame,
  TrendingUp,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<AttendanceTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#090d16] flex">
      {/* Sidebar */}
      <Sidebar
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenCheckInModal={() => setIsCheckInOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header
          title="Retention & Attendance Dashboard"
          subtitle="Real-time visibility into attendance patterns, consecutive streaks, and member churn risk"
          onOpenCheckInModal={() => setIsCheckInOpen(true)}
        />

        <div className="p-8 space-y-8 flex-1 max-w-[1600px] w-full mx-auto">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* KPI 1: Active Members */}
            <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-brand-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Active Members
                </span>
                <div className="w-9 h-9 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center border border-brand-500/20">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-mono">
                  {summary?.kpis.activeMembers ?? '--'}
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +8 this month
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Total active memberships scoped to gym</p>
            </div>

            {/* KPI 2: Today's Check-Ins */}
            <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Today&apos;s Check-Ins
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white font-mono">
                  {summary?.kpis.todayCheckIns ?? '--'}
                </span>
                <span className="text-xs font-medium text-slate-400">visits</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Front-desk QR & manual entries today</p>
            </div>

            {/* KPI 3: At-Risk Members */}
            <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-rose-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  At-Risk of Churn
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center border border-rose-500/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-400 font-mono">
                  {summary?.kpis.atRiskMembersTotal ?? '--'}
                </span>
                <span className="text-[11px] font-semibold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                  {summary?.kpis.highRiskCount ?? 0} High Risk
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Silent churn detected via rules engine</p>
            </div>

            {/* KPI 4: Active Streak Champions */}
            <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-orange-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Top Active Streak
                </span>
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center border border-orange-500/20">
                  <Flame className="w-5 h-5 animate-flame" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-orange-400 font-mono">
                  {summary?.streakLeaders[0]?.currentStreak ?? '--'}
                </span>
                <span className="text-xs font-semibold text-orange-300">Days Consecutive</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Leader: {summary?.streakLeaders[0]?.memberName ?? 'N/A'}
              </p>
            </div>
          </div>

          {/* Middle Section: Attendance Chart + Active Streak Champions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AttendanceChart data={trends} />
            </div>
            <div>
              <StreakLeaderboard leaders={summary?.streakLeaders || []} />
            </div>
          </div>

          {/* Bottom Section: At-Risk Members Table */}
          <div className="space-y-4">
            <AtRiskMembersTable
              members={summary?.recentAtRiskPreview || []}
              showFilters={true}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <QuickCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onCheckInSuccess={() => loadData()}
      />

      <FrontDeskQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
