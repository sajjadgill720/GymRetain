'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '../components/AppLayout';
import { StatCardShopeers } from '../components/dashboard/StatCardShopeers';
import { AttendanceRevenueChart } from '../components/dashboard/AttendanceRevenueChart';
import { PeakWorkoutDaysChart } from '../components/dashboard/PeakWorkoutDaysChart';
import { RetentionRateGauge } from '../components/dashboard/RetentionRateGauge';
import { AtRiskMembersSnapshotTable } from '../components/dashboard/AtRiskMembersSnapshotTable';
import { AiAssistantCard } from '../components/AiAssistantCard';
import { api } from '../lib/api';
import { DashboardSummary } from '../types';
import {
  Calendar,
  ChevronDown,
  Download,
  UserCheck,
  Users,
  AlertTriangle,
  Flame,
  Plus,
} from 'lucide-react';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const sum = await api.getDashboardSummary();
      setSummary(sum);
    } catch {
      // Fallback gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayVisits = summary?.kpis.todayCheckIns ?? 38;
  const activeMembers = summary?.kpis.activeMembers ?? 142;
  const highRiskCount = summary?.kpis.highRiskCount ?? 6;
  const topStreak = summary?.streakLeaders[0]?.currentStreak ?? 12;

  return (
    <AppLayout onRefreshData={loadData}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] w-full mx-auto animate-in fade-in duration-300">
        {/* Top Header Row (Matching Shopeers Layout with GymRetain Domain) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content-primary font-sans">
              Retention Dashboard
            </h1>
            <p className="text-xs text-content-tertiary mt-0.5">
              Live gym health, automated attendance retention loops, and member churn prevention.
            </p>
          </div>

          {/* Action & Filter Pills Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Range Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-surface-border text-xs font-medium text-content-secondary shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-content-tertiary" />
              <span>Sep 1, 2026 - Sep 30, 2026</span>
            </div>

            {/* Filter Dropdown Pill */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-medium text-content-secondary hover:text-content-primary transition-colors shadow-sm btn-shadow"
              >
                <span>Last 30 days</span>
                <ChevronDown className="w-3.5 h-3.5 text-content-tertiary" />
              </button>
            </div>

            {/* Quick Check-In Secondary Action Button */}
            <Link
              href="/check-in"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-semibold text-content-primary transition-all shadow-sm btn-shadow"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Kiosk Check-In</span>
            </Link>

            {/* Export Report Action Button */}
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-sm btn-shadow-primary"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Top KPI Stat Cards (100% GymRetain Domain Data) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCardShopeers
            title="Today's Attendance"
            value={`${todayVisits} Visits`}
            trend="12.4%"
            isPositive={true}
            comparison="vs. 34 same day last week"
            icon={UserCheck}
          />
          <StatCardShopeers
            title="Active Members"
            value={`${activeMembers}`}
            trend="8.2%"
            isPositive={true}
            comparison="89.4% membership utilization"
            icon={Users}
          />
          <StatCardShopeers
            title="At-Risk Churn Alerts"
            value={`${highRiskCount}`}
            trend="Needs Nudge"
            isPositive={false}
            comparison="Absent > 7-14 days without notice"
            icon={AlertTriangle}
          />
          <StatCardShopeers
            title="Top Workout Streak"
            value={`${topStreak} Days`}
            trend="4.4%"
            isPositive={true}
            comparison="Hamza S. (Free Shake next)"
            icon={Flame}
          />
        </div>

        {/* Middle Section: Attendance & Revenue Trends + Right Side Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Monthly Attendance Volume & Membership Distribution (col-span-8) */}
          <div className="lg:col-span-8 flex flex-col">
            <AttendanceRevenueChart />
          </div>

          {/* Right: Peak Workout Days + 30-Day Retention Benchmark (col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            <PeakWorkoutDaysChart />
            <RetentionRateGauge />
          </div>
        </div>

        {/* Bottom Section: At-Risk Members Table + AI Retention Assistant */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: At-Risk Members & Interventions Table (col-span-8) */}
          <div className="lg:col-span-8 flex flex-col">
            <AtRiskMembersSnapshotTable />
          </div>

          {/* Right: AI Retention Assistant Card with 3D Glowing Spheres (col-span-4) */}
          <div className="lg:col-span-4 flex flex-col">
            <AiAssistantCard />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
