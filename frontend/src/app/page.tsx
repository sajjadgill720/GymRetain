'use client';

import React, { useState, useEffect } from 'react';
import { TopNavbar } from '../components/TopNavbar';
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
    <div className="min-h-screen bg-[#111111] flex flex-col">
      {/* Top Navigation Bar (Amazon / SaaS Style) */}
      <TopNavbar
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenCheckInModal={() => setIsCheckInOpen(true)}
      />

      {/* Main Content Area — Full Width */}
      <main className="flex-1 flex flex-col w-full overflow-x-hidden">
        {/* Page Context Ribbon */}
        <div className="border-b border-[#26221E] bg-[#161310]/50 py-4 px-4 sm:px-8">
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F7F5F2]">Owner Retention Hub</h1>
              <p className="text-xs text-[#A39E98] mt-0.5">30-Second Glance: Who to call today & member habit momentum</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
          {/* 1. ONE HEADLINE METRIC HERO (Built for 30-second glance on mobile & desktop) */}
          <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-[#261515] via-[#1A1313] to-[#141010] border border-[#D9534F]/35 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9534F]/15 text-[#D9534F] text-[10px] font-bold uppercase tracking-wider border border-[#D9534F]/30 shadow-sm">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#D9534F]" />
                  <span>Immediate Action Required</span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#F7F5F2] tracking-tight flex flex-wrap items-baseline gap-2">
                  <span className="text-[#D9534F] font-mono">{highRiskCount} Members</span>
                  <span className="text-base sm:text-xl font-bold text-[#F7F5F2]">
                    at risk of silent drop-out
                  </span>
                </div>
                <p className="text-xs text-[#A39E98] max-w-2xl leading-relaxed">
                  These members haven&apos;t visited in over 12–16 days or missed renewal payments.
                  Reaching out today via WhatsApp saves an estimated{' '}
                  <strong className="text-[#4E9F6E] font-semibold">PKR 35,000/mo</strong> in recurring revenue.
                </p>
              </div>

              {/* Headline Call-To-Action */}
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/retention"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#BFA785] hover:bg-[#B29976] text-[#111111] font-bold text-xs sm:text-sm shadow-md shadow-[#BFA785]/25 hover:shadow-lg hover:shadow-[#BFA785]/35 transition-all flex items-center justify-center gap-2 btn-shadow btn-shadow-primary"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Review At-Risk Call List</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* 2. THREE COMPACT COMPANION METRICS (Bento Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Metric 1: Today's Front-Desk Check-Ins */}
            <div className="bg-[#161310] rounded-2xl p-4 sm:p-5 border border-[#2A2520] hover:border-[#38312A] flex items-center justify-between shadow-sm transition-all">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A39E98]">
                  Today&apos;s Attendance
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#F7F5F2] font-mono mt-1">
                  {todayVisits} <span className="text-xs font-normal text-[#A39E98]">visits</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#4E9F6E]/15 text-[#4E9F6E] flex items-center justify-center border border-[#4E9F6E]/30 shadow-sm shadow-[#4E9F6E]/10">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>

            {/* Metric 2: Top Active Streak */}
            <div className="bg-[#161310] rounded-2xl p-4 sm:p-5 border border-[#2A2520] hover:border-[#38312A] flex items-center justify-between shadow-sm transition-all">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A39E98]">
                  Top Workout Streak
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#BFA785] font-mono mt-1">
                  {topStreak} <span className="text-xs font-normal text-[#A39E98]">Days</span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#BFA785]/15 text-[#BFA785] flex items-center justify-center border border-[#BFA785]/30 shadow-sm shadow-[#BFA785]/10">
                <Flame className="w-5 h-5 animate-flame" />
              </div>
            </div>

            {/* Metric 3: Active Members */}
            <div className="bg-[#161310] rounded-2xl p-4 sm:p-5 border border-[#2A2520] hover:border-[#38312A] flex items-center justify-between shadow-sm transition-all">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A39E98]">
                  Total Active Members
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#F7F5F2] font-mono mt-1">
                  {activeMembers}
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#26221E] text-[#BFA785] flex items-center justify-center border border-[#38312A] shadow-sm">
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
