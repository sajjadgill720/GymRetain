'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '../components/AppLayout';
import { api } from '../lib/api';
import { DashboardSummary, AttendanceTrendPoint } from '../types';
import { Retention3DRadar, RadarSegment } from '../components/dashboard/Retention3DRadar';
import { InterventionModal, InterventionMember } from '../components/dashboard/InterventionModal';
import {
  Users,
  UserCheck,
  Warning,
  Medal,
  Fire,
  Sparkle,
  TrendUp,
  TrendDown,
  CalendarBlank,
  Clock,
  ChatCircleDots,
  ArrowRight,
  ShieldCheck,
  QrCode,
  CheckCircle,
  CurrencyDollar,
  Phone,
  User,
  CreditCard,
  Plus,
  Funnel,
  ArrowsClockwise,
} from '@/components/icons';

const INITIAL_PRIORITY_MEMBERS: InterventionMember[] = [
  {
    memberId: 'mem-2',
    memberCode: 'GR-1002',
    fullName: 'Ayesha Malik',
    phone: '+923331122334',
    planName: 'Standard Monthly Pass',
    planPrice: 4500,
    riskScore: 88,
    riskLevel: 'HIGH',
    daysInactive: 16,
    usualCadence: 'Mon, Wed, Fri at 7:00 PM (4.5x/wk)',
    recentCadence: '0 visits in last 14 days (-100%)',
    disengagementReason: 'Routine collapsed: Missed 6 consecutive evening sessions after 5-month consistent habit.',
    assignedStaff: 'Coach Bilal',
    status: 'NEEDS_OUTREACH',
  },
  {
    memberId: 'mem-7',
    memberCode: 'GR-1007',
    fullName: 'Omer Farooq',
    phone: '+923005544332',
    planName: 'Pro Strength Pass',
    planPrice: 6500,
    riskScore: 78,
    riskLevel: 'HIGH',
    daysInactive: 12,
    usualCadence: 'Tue, Thu, Sat at 6:30 AM (3.8x/wk)',
    recentCadence: '1 visit in last 14 days (-74%)',
    disengagementReason: 'Early morning habit broken; membership expired 4 days ago without renewal.',
    assignedStaff: 'Coach Sarah',
    status: 'NEEDS_OUTREACH',
  },
  {
    memberId: 'mem-8',
    memberCode: 'GR-1008',
    fullName: 'Sana Tariq',
    phone: '+923219988776',
    planName: 'Standard Monthly Pass',
    planPrice: 4500,
    riskScore: 68,
    riskLevel: 'HIGH',
    daysInactive: 10,
    usualCadence: 'Mon & Thu at 5:00 PM (2.5x/wk)',
    recentCadence: '1 visit in last 14 days (-60%)',
    disengagementReason: 'Slipping frequency: Missed 3 consecutive weeks of leg-day routine.',
    assignedStaff: 'Coach Sarah',
    status: 'NEEDS_OUTREACH',
  },
  {
    memberId: 'mem-9',
    memberCode: 'GR-1009',
    fullName: 'Hamza Tariq',
    phone: '+923341122998',
    planName: 'Pro Strength & Cardio',
    planPrice: 6500,
    riskScore: 62,
    riskLevel: 'HIGH',
    daysInactive: 9,
    usualCadence: 'Daily Lunch Session at 1:30 PM (5.0x/wk)',
    recentCadence: '2 visits in last 14 days (-60%)',
    disengagementReason: 'Streak broken at 18 days; card payment renewal pending.',
    assignedStaff: 'Coach Bilal',
    status: 'NEEDS_OUTREACH',
  },
  {
    memberId: 'mem-12',
    memberCode: 'GR-1012',
    fullName: 'Mustafa Khan',
    phone: '+923004455881',
    planName: 'Standard Monthly Pass',
    planPrice: 4500,
    riskScore: 54,
    riskLevel: 'MEDIUM',
    daysInactive: 8,
    usualCadence: 'Weekends at 10:00 AM (2.0x/wk)',
    recentCadence: '1 visit in last 14 days (-50%)',
    disengagementReason: 'Weekend morning habit disruption; missed 2 consecutive Saturdays.',
    assignedStaff: 'Front Desk Team',
    status: 'NEEDS_OUTREACH',
  },
];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trendData, setTrendData] = useState<AttendanceTrendPoint[]>([]);
  const [timeframe, setTimeframe] = useState<'7D' | '14D' | '30D' | '90D'>('30D');
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; date: string; val: number; x: number; y: number } | null>(null);
  const [priorityMembers, setPriorityMembers] = useState<InterventionMember[]>(INITIAL_PRIORITY_MEMBERS);
  const [radarSegment, setRadarSegment] = useState<RadarSegment>('ALL');
  const [selectedInterventionMember, setSelectedInterventionMember] = useState<InterventionMember | null>(null);
  const [recentActions, setRecentActions] = useState<Array<{ id: string; time: string; text: string; memberCode: string }>>([
    { id: 'act-1', time: '25m ago', text: 'Coach Bilal dispatched personalized WhatsApp recovery check-in', memberCode: 'GR-1002' },
    { id: 'act-2', time: '1h ago', text: 'Front desk recorded renewal payment and restored habit streak', memberCode: 'GR-1005' },
    { id: 'act-3', time: '3h ago', text: 'Coach Sarah scheduled retention catch-up consultation', memberCode: 'GR-1007' },
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      const sum = await api.getDashboardSummary();
      setSummary(sum);
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const days = timeframe === '7D' ? 7 : timeframe === '14D' ? 14 : timeframe === '30D' ? 30 : 90;
    api
      .getAttendanceTrends(days)
      .then((data) => {
        if (data && data.length > 0) setTrendData(data);
      })
      .catch(() => {});
  }, [timeframe]);

  // Handle completed intervention
  const handleInterventionComplete = (memberId: string, newStatus: InterventionMember['status'], actionSummary: string) => {
    setPriorityMembers((prev) =>
      prev.map((m) => (m.memberId === memberId ? { ...m, status: newStatus } : m))
    );
    const target = priorityMembers.find((m) => m.memberId === memberId);
    setRecentActions((prev) => [
      {
        id: `act-${Date.now()}`,
        time: 'Just now',
        text: actionSummary,
        memberCode: target?.memberCode || 'GR-MEM',
      },
      ...prev,
    ]);
    showToast(`Action recorded: ${actionSummary}`);
  };

  // Filter members based on radar segment
  const filteredPriorityMembers = priorityMembers.filter((m) => {
    if (radarSegment === 'ALL') return true;
    if (radarSegment === 'URGENT') return m.riskScore >= 70;
    if (radarSegment === 'SLIPPING') return m.riskScore >= 40 && m.riskScore < 70;
    if (radarSegment === 'HABIT_DISRUPTED') return m.disengagementReason.toLowerCase().includes('routine') || m.disengagementReason.toLowerCase().includes('habit');
    if (radarSegment === 'HEALTHY') return m.riskScore < 40;
    return true;
  });

  // KPIs
  const activeMembers = summary?.kpis?.activeMembers || 142;
  const todayCheckIns = summary?.kpis?.todayCheckIns || 38;
  const highRiskCount = priorityMembers.filter((m) => m.riskScore >= 70).length;
  const urgentRevenueAtRisk = priorityMembers.filter((m) => m.riskScore >= 70).reduce((acc, m) => acc + m.planPrice, 0);
  const slippingRevenueAtRisk = priorityMembers.filter((m) => m.riskScore >= 40 && m.riskScore < 70).reduce((acc, m) => acc + m.planPrice, 0);
  const totalRevenueAtRisk = urgentRevenueAtRisk + slippingRevenueAtRisk;

  // Chart Points & Bezier Smoothing
  const chartPoints = trendData.length > 0 ? trendData : [
    { date: '2026-09-03', checkIns: 28 },
    { date: '2026-09-08', checkIns: 34 },
    { date: '2026-09-13', checkIns: 41 },
    { date: '2026-09-18', checkIns: 31 },
    { date: '2026-09-23', checkIns: 45 },
    { date: '2026-09-28', checkIns: 39 },
    { date: '2026-10-03', checkIns: todayCheckIns },
  ];

  const maxVal = Math.max(...chartPoints.map((p) => p.checkIns), 45);
  const minVal = Math.max(0, Math.min(...chartPoints.map((p) => p.checkIns)) - 5);
  const valRange = maxVal - minVal || 1;

  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 35;
  const paddingY = 25;

  const coords = chartPoints.map((pt, idx) => {
    const x = paddingX + (idx / (chartPoints.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - ((pt.checkIns - minVal) / valRange) * (svgHeight - paddingY * 2);
    return { x, y, pt };
  });

  let pathD = '';
  if (coords.length > 0) {
    pathD = `M ${coords[0].x},${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const mx = (p0.x + p1.x) / 2;
      pathD += ` C ${mx},${p0.y} ${mx},${p1.y} ${p1.x},${p1.y}`;
    }
  }

  const areaD = coords.length > 0
    ? `${pathD} L ${coords[coords.length - 1].x},${svgHeight - paddingY} L ${coords[0].x},${svgHeight - paddingY} Z`
    : '';

  return (
    <AppLayout onRefreshData={loadData}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl glass-panel-elevated text-content-primary shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" weight="fill" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Intervention & Outreach Modal */}
      <InterventionModal
        member={selectedInterventionMember}
        isOpen={!!selectedInterventionMember}
        onClose={() => setSelectedInterventionMember(null)}
        onInterventionComplete={handleInterventionComplete}
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* ============================================================
            1. TOP HEADER & WHO NEEDS ATTENTION TODAY ALERT
            ============================================================ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content-primary font-sans">
                Silent Churn Command Center
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-content-secondary">
              Identify members disengaging before they churn, analyze routine disruptions, and execute tailored retention outreach.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <Link
              href="/insights"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/15 text-purple-600 dark:text-cyan-400 border border-purple-500/20 text-xs font-bold transition-all btn-shadow"
            >
              <Sparkle className="w-4 h-4" weight="fill" />
              <span>AI Copilot Insights</span>
            </Link>

            <Link
              href="/retention"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-semibold text-content-primary transition-all btn-shadow"
            >
              <Warning className="w-4 h-4 text-red-500" weight="fill" />
              <span>Full At-Risk Queue</span>
              <span className="px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-mono font-bold">
                {highRiskCount}
              </span>
            </Link>

            <Link
              href="/check-in"
              className="flex items-center gap-2 px-4 py-2 rounded-xl btn-shadow-primary text-xs font-bold transition-all"
            >
              <UserCheck className="w-4 h-4" weight="bold" />
              <span>+ Quick Check-In</span>
            </Link>
          </div>
        </div>

        {/* ============================================================
            2. HIGH-IMPACT ATTENTION & REVENUE AT RISK BANNER
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Attention Today Callout (7 Cols) */}
          <div className="lg:col-span-7 p-5 rounded-3xl glass-panel-elevated border border-red-500/30 flex flex-col justify-between glow-red">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Who Needs Your Attention Today?
                </span>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                  {highRiskCount} Members Urgent
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-content-primary tracking-tight font-sans mb-1">
                4 Members Exhibiting Severe Habit Dropouts
              </h2>
              <p className="text-xs text-content-secondary leading-relaxed">
                Members with prolonged absence (&gt;10 days) and collapsed routine velocity. Taking proactive action within 48 hours restores 74% of disengaged gym members.
              </p>
            </div>

            <div className="pt-4 border-t border-surface-border/80 mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-content-tertiary">Quick Priority Triage:</span>
                <span className="font-bold text-content-primary">Ayesha Malik (16d)</span>
                <span className="text-content-tertiary">·</span>
                <span className="font-bold text-content-primary">Omer Farooq (12d)</span>
              </div>
              <button
                onClick={() => setSelectedInterventionMember(priorityMembers[0])}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all btn-shadow flex items-center gap-1.5"
              >
                <span>Intervene Top Risk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Revenue at Risk Calculation Card (5 Cols) */}
          <div className="lg:col-span-5 p-5 rounded-3xl glass-panel border border-surface-border flex flex-col justify-between btn-shadow">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-content-tertiary uppercase tracking-wider">
                  Estimated Revenue at Risk
                </span>
                <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <CurrencyDollar className="w-4 h-4" weight="duotone" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono tracking-tight mb-1">
                ₨{totalRevenueAtRisk.toLocaleString()}/mo
              </div>
              <div className="p-2.5 rounded-xl bg-surface-subtle border border-surface-border text-[11px] text-content-secondary leading-snug">
                <span className="font-bold text-content-primary block mb-0.5">How this is calculated:</span>
                Sum of monthly plan fees for 4 High-Risk members (₨{urgentRevenueAtRisk.toLocaleString()}) + 1 Slipping member (₨{slippingRevenueAtRisk.toLocaleString()}).
                <span className="text-red-500 font-semibold block mt-1">
                  Projected 6-month churn LTV loss: ₨{(totalRevenueAtRisk * 6).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border mt-3 flex items-center justify-between text-[11px]">
              <span className="text-content-tertiary">Protection Target:</span>
              <span className="font-extrabold text-emerald-500">85% Recoverable with Nudges</span>
            </div>
          </div>
        </div>

        {/* ============================================================
            3. DISTINCTIVE INTERACTIVE 3D RETENTION RADAR
            ============================================================ */}
        <Retention3DRadar
          activeSegment={radarSegment}
          onSelectSegment={setRadarSegment}
          urgentCount={highRiskCount}
          slippingCount={priorityMembers.filter((m) => m.riskScore >= 40 && m.riskScore < 70).length}
          habitDisruptedCount={2}
          healthyCount={activeMembers - 6}
          urgentRevenueAtRisk={urgentRevenueAtRisk}
          slippingRevenueAtRisk={slippingRevenueAtRisk}
        />

        {/* ============================================================
            4. PRIORITIZED DISENGAGEMENT LIST WITH EVIDENCE & OUTREACH
            ============================================================ */}
        <div className="p-5 sm:p-6 rounded-3xl glass-panel-elevated border border-surface-border space-y-4 btn-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-content-primary tracking-tight font-sans">
                  Prioritized Member Interventions ({filteredPriorityMembers.length})
                </h3>
                {radarSegment !== 'ALL' && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    FILTERED: {radarSegment}
                  </span>
                )}
              </div>
              <p className="text-xs text-content-secondary">
                Ranked by disengagement velocity, broken routine signals, and revenue exposure. Click Prepare Outreach to customize recovery action.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/retention"
                className="text-xs font-bold text-purple-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Full Retention Pipeline →</span>
              </Link>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-content-tertiary uppercase text-[10px] font-bold">
                  <th className="py-3 px-3">Member &amp; Plan</th>
                  <th className="py-3 px-3">Disengagement Diagnosis</th>
                  <th className="py-3 px-3">Routine Shift</th>
                  <th className="py-3 px-3">Handler &amp; Status</th>
                  <th className="py-3 px-3 text-right">Intervention Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border/50">
                {filteredPriorityMembers.map((member) => {
                  const isHigh = member.riskScore >= 70;
                  const isSlipping = member.riskScore >= 40 && member.riskScore < 70;

                  return (
                    <tr key={member.memberId} className="hover:bg-surface-subtle/50 transition-colors">
                      {/* Member Info */}
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-content-primary">
                          {member.fullName}
                        </div>
                        <div className="text-[10px] text-content-tertiary font-mono">
                          {member.memberCode} · ₨{member.planPrice.toLocaleString()}/mo
                        </div>
                        <div className="mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                              isHigh
                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                : isSlipping
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            }`}
                          >
                            {member.riskScore}% Churn Risk
                          </span>
                        </div>
                      </td>

                      {/* Disengagement Diagnosis */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <div className="font-bold text-red-600 dark:text-red-400 text-xs">
                          {member.daysInactive} Days Absent
                        </div>
                        <p className="text-[11px] text-content-secondary mt-0.5 leading-snug">
                          {member.disengagementReason}
                        </p>
                      </td>

                      {/* Routine vs Velocity */}
                      <td className="py-3.5 px-3">
                        <div className="text-[11px] font-semibold text-content-primary">
                          {member.usualCadence}
                        </div>
                        <div className="text-[10px] font-bold text-red-500 mt-0.5">
                          {member.recentCadence}
                        </div>
                      </td>

                      {/* Staff Handler & Status */}
                      <td className="py-3.5 px-3">
                        <div className="text-xs font-semibold text-content-primary flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-content-tertiary" />
                          <span>{member.assignedStaff}</span>
                        </div>
                        <div className="mt-1">
                          {member.status === 'NEEDS_OUTREACH' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Needs Outreach
                            </span>
                          )}
                          {member.status === 'CONTACTED' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Contacted ✓
                            </span>
                          )}
                          {member.status === 'SCHEDULED' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-cyan-400 border border-purple-500/20">
                              Call Scheduled
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedInterventionMember(member)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all btn-shadow flex items-center gap-1.5 ml-auto ${
                            member.status === 'CONTACTED'
                              ? 'bg-surface-subtle border border-surface-border text-content-primary'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <ChatCircleDots className="w-3.5 h-3.5" weight="bold" />
                          <span>{member.status === 'CONTACTED' ? 'Follow Up' : 'Prepare Outreach'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================
            5. ATTENDANCE TRAJECTORY & RECENT STAFF ACTIONS (8 / 4 COLS)
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Attendance Trajectory (8 Cols) */}
          <div className="lg:col-span-8 p-5 sm:p-6 rounded-3xl glass-panel border border-surface-border flex flex-col justify-between btn-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-content-primary">
                  Attendance Dynamics &amp; Churn Correlation
                </h3>
                <p className="text-xs text-content-tertiary">
                  Overall gym check-in volume against expected baseline routine
                </p>
              </div>

              {/* Timeframe Toggles */}
              <div className="flex items-center gap-1 p-1 bg-surface-subtle border border-surface-border rounded-xl">
                {(['7D', '14D', '30D', '90D'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      timeframe === t
                        ? 'bg-surface text-purple-600 dark:text-cyan-400 shadow-sm border border-surface-border'
                        : 'text-content-tertiary hover:text-content-primary'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Trajectory Chart */}
            <div className="relative w-full h-[220px] select-none my-2">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00F2FE" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {[0.25, 0.5, 0.75].map((ratio, idx) => {
                  const y = paddingY + ratio * (svgHeight - paddingY * 2);
                  return (
                    <line
                      key={idx}
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity="0.08"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {areaD && <path d={areaD} fill="url(#chartGradient)" />}

                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#00F2FE"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {coords.map((c, i) => {
                  const isHovered = hoveredPoint?.date === c.pt.date;
                  return (
                    <g key={i}>
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={isHovered ? 6 : 3.5}
                        className={`transition-all duration-150 ${
                          isHovered
                            ? 'fill-cyan-400 stroke-surface stroke-2'
                            : 'fill-cyan-400 stroke-surface stroke-1'
                        }`}
                      />
                      <rect
                        x={c.x - 18}
                        y={0}
                        width={36}
                        height={svgHeight}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredPoint({
                            label: new Date(c.pt.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            }),
                            date: c.pt.date,
                            val: c.pt.checkIns,
                            x: c.x,
                            y: c.y,
                          })
                        }
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  );
                })}
              </svg>

              {hoveredPoint && (
                <div
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-full px-3 py-1.5 rounded-xl glass-panel-elevated border border-cyan-500/30 shadow-xl z-20 text-center"
                  style={{
                    left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                    top: `${(hoveredPoint.y / svgHeight) * 100 - 8}%`,
                  }}
                >
                  <div className="text-[10px] text-content-tertiary">{hoveredPoint.label}</div>
                  <div className="text-xs font-extrabold text-cyan-400 font-mono">
                    {hoveredPoint.val} Check-Ins
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-surface-border text-center">
              <div>
                <span className="text-[10px] text-content-tertiary uppercase font-bold block">
                  Daily Check-in Avg
                </span>
                <span className="text-sm font-extrabold text-content-primary font-mono">
                  34.4 visits/day
                </span>
              </div>
              <div>
                <span className="text-[10px] text-content-tertiary uppercase font-bold block">
                  Peak Floor Volume
                </span>
                <span className="text-sm font-extrabold text-cyan-400 font-mono">
                  Friday (42 visits)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-content-tertiary uppercase font-bold block">
                  Routine Adherence
                </span>
                <span className="text-sm font-extrabold text-emerald-500 font-mono">
                  88.2% on schedule
                </span>
              </div>
            </div>
          </div>

          {/* Right: Recent Staff Actions Feed (4 Cols) */}
          <div className="lg:col-span-4 p-5 sm:p-6 rounded-3xl glass-panel border border-surface-border flex flex-col justify-between btn-shadow">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-content-primary">
                    Recent Staff Actions
                  </h3>
                  <p className="text-xs text-content-tertiary">
                    Live audit trail of retention interventions
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" weight="duotone" />
                </div>
              </div>

              <div className="space-y-3">
                {recentActions.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-2xl bg-surface-subtle/80 border border-surface-border/70 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/10">
                        {act.memberCode}
                      </span>
                      <span className="text-[10px] text-content-tertiary">{act.time}</span>
                    </div>
                    <p className="text-xs text-content-secondary leading-snug">
                      {act.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-surface-border mt-4">
              <Link
                href="/retention"
                className="w-full py-2 text-center rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-bold text-content-primary transition-all btn-shadow block"
              >
                View Complete Activity History
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
