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
  AlertTriangle,
  Flame,
  PhoneCall,
  UserCheck,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<AttendanceTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-[#090d16] flex">
      {/* Sidebar (Desktop fixed + Mobile slide-over) */}
      <Sidebar
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenCheckInModal={() => setIsCheckInOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen w-full overflow-x-hidden">
        <Header
          title="Owner Retention Hub"
          subtitle="30-Second Glance: Who to call today & member habit momentum"
          onOpenCheckInModal={() => setIsCheckInOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <div className="p-4 sm:p-8 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
          {/* 1. ONE HEADLINE METRIC HERO (Built for 30-second glance) */}
          <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-rose-950/40 via-[#151a26] to-[#0f1420] border border-rose-500/30 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase tracking-wider border border-rose-500/30">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span>Immediate Action Required</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-baseline gap-2">
                  <span className="text-rose-400 font-mono">{highRiskCount} Members</span>
                  <span className="text-base sm:text-xl font-bold text-slate-200">
                    at risk of silent drop-out
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  These members haven&apos;t visited in over 12–16 days or missed renewal payments.
                  Reaching out today via WhatsApp saves an estimated{' '}
                  <strong className="text-emerald-400">PKR 35,000/mo</strong> in recurring revenue.
                </p>
              </div>

              {/* Headline Call-To-Action */}
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/retention"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/30 hover:shadow-lg hover:shadow-rose-500/40 transition-all flex items-center justify-center gap-2 btn-shadow btn-shadow-rose"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Review At-Risk Call List</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* 2. THREE COMPACT COMPANION METRICS (Mobile-friendly grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Metric 1: Today's Front-Desk Check-Ins */}
            <div className="glass-card rounded-xl p-4 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400">
                  Today&apos;s Attendance
                </span>
                <div className="text-2xl font-black text-white font-mono mt-0.5">
                  {todayVisits} <span className="text-xs font-normal text-slate-400">visits</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 2: Top Active Streak */}
            <div className="glass-card rounded-xl p-4 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400">
                  Top Workout Streak
                </span>
                <div className="text-2xl font-black text-orange-400 font-mono mt-0.5">
                  {topStreak} <span className="text-xs font-normal text-orange-300">Days</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center border border-orange-500/20">
                <Flame className="w-5 h-5 animate-flame" />
              </div>
            </div>

            {/* Metric 3: Active Members */}
            <div className="glass-card rounded-xl p-4 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400">
                  Total Active Members
                </span>
                <div className="text-2xl font-black text-white font-mono mt-0.5">
                  {activeMembers}
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center border border-brand-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* 3. LEAD WITH AT-RISK MEMBERS CALL LIST (Owner priority) */}
          <div className="space-y-2">
            <AtRiskMembersTable
              members={summary?.recentAtRiskPreview || []}
              limit={5}
              showFilters={true}
            />
          </div>

          {/* 4. SECONDARY SECTION: Attendance Trend & Streak Champions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            <div className="lg:col-span-2">
              <AttendanceChart data={trends} />
            </div>
            <div>
              <StreakLeaderboard leaders={summary?.streakLeaders || []} />
            </div>
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
