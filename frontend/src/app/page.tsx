'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '../components/AppLayout';
import { api } from '../lib/api';
import { DashboardSummary, AttendanceTrendPoint, MemberRiskDetails } from '../types';
import { Retention3DRadar, RadarSegment } from '../components/dashboard/Retention3DRadar';
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
  Activity,
  DotsThree,
} from '@/components/icons';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trendData, setTrendData] = useState<AttendanceTrendPoint[]>([]);
  const [timeframe, setTimeframe] = useState<'7D' | '14D' | '30D' | '90D'>('30D');
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; date: string; val: number; x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [nudgedMembers, setNudgedMembers] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Radar interactive segment filter
  const [radarSegment, setRadarSegment] = useState<RadarSegment>('ALL');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      const sum = await api.getDashboardSummary();
      setSummary(sum);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const days = timeframe === '7D' ? 7 : timeframe === '14D' ? 14 : timeframe === '30D' ? 30 : 90;
    api
      .getAttendanceTrends(days)
      .then((data) => {
        if (data && data.length > 0) {
          setTrendData(data);
        }
      })
      .catch(() => {});
  }, [timeframe]);

  // KPIs
  const activeMembers = summary?.kpis?.activeMembers || 142;
  const todayCheckIns = summary?.kpis?.todayCheckIns || 38;
  const highRiskCount = summary?.kpis?.highRiskCount || 6;
  const topStreakLeader = summary?.streakLeaders?.[0] || {
    memberName: 'Hamza Sheikh',
    currentStreak: 12,
    memberCode: 'GR-1001',
  };

  // Recent at-risk preview fallback
  const baseAtRiskMembers: MemberRiskDetails[] =
    summary?.recentAtRiskPreview && summary.recentAtRiskPreview.length > 0
      ? summary.recentAtRiskPreview.slice(0, 6)
      : [
          {
            memberId: 'mem-2',
            memberCode: 'GR-1002',
            fullName: 'Ayesha Malik',
            phone: '+923331122334',
            riskScore: 88,
            riskLevel: 'HIGH',
            factors: { daysSinceLastCheckIn: 16 } as any,
          },
          {
            memberId: 'mem-7',
            memberCode: 'GR-1007',
            fullName: 'Omer Farooq',
            phone: '+923005544332',
            riskScore: 78,
            riskLevel: 'HIGH',
            factors: { daysSinceLastCheckIn: 12 } as any,
          },
          {
            memberId: 'mem-8',
            memberCode: 'GR-1008',
            fullName: 'Sana Tariq',
            phone: '+923219988776',
            riskScore: 68,
            riskLevel: 'HIGH',
            factors: { daysSinceLastCheckIn: 10 } as any,
          },
          {
            memberId: 'mem-9',
            memberCode: 'GR-1009',
            fullName: 'Hamza Tariq',
            phone: '+923341122998',
            riskScore: 62,
            riskLevel: 'HIGH',
            factors: { daysSinceLastCheckIn: 9 } as any,
          },
          {
            memberId: 'mem-3',
            memberCode: 'GR-1003',
            fullName: 'Zaid Siddiqui',
            phone: '+923451122334',
            riskScore: 48,
            riskLevel: 'MEDIUM',
            factors: { daysSinceLastCheckIn: 5 } as any,
          },
          {
            memberId: 'mem-4',
            memberCode: 'GR-1004',
            fullName: 'Fatima Zahra',
            phone: '+923121122334',
            riskScore: 42,
            riskLevel: 'MEDIUM',
            factors: { daysSinceLastCheckIn: 4 } as any,
          },
        ];

  // Filter members based on 3D Retention Radar segment selection
  const atRiskMembers = baseAtRiskMembers.filter((m) => {
    if (radarSegment === 'ALL') return true;
    if (radarSegment === 'URGENT') return m.riskScore >= 70;
    if (radarSegment === 'SLIPPING') return m.riskScore >= 40 && m.riskScore < 70;
    if (radarSegment === 'HABIT_DISRUPTED') return m.riskLevel === 'MEDIUM';
    if (radarSegment === 'HEALTHY') return m.riskScore < 40;
    return true;
  });

  // Handle WhatsApp Nudge simulation
  const handleNudge = async (member: MemberRiskDetails) => {
    try {
      setNudgedMembers((prev) => new Set(prev).add(member.memberId));
      await api.simulateWhatsAppMessage({
        memberId: member.memberId,
        messageType: 'MISSED_VISIT',
      });
      showToast(`Personalized WhatsApp retention nudge sent to ${member.fullName}!`);
    } catch {
      showToast(`Nudge logged for ${member.fullName}.`);
    }
  };

  // Trend Chart Calculation
  const chartPoints = trendData.length > 0 ? trendData : [
    { date: '2026-09-03', checkIns: 28 },
    { date: '2026-09-08', checkIns: 34 },
    { date: '2026-09-13', checkIns: 41 },
    { date: '2026-09-18', checkIns: 31 },
    { date: '2026-09-23', checkIns: 45 },
    { date: '2026-09-28', checkIns: 39 },
    { date: '2026-10-02', checkIns: todayCheckIns },
  ];

  const maxVal = Math.max(...chartPoints.map((p) => p.checkIns), 45);
  const minVal = Math.max(0, Math.min(...chartPoints.map((p) => p.checkIns)) - 5);
  const valRange = maxVal - minVal || 1;

  const svgWidth = 800;
  const svgHeight = 240;
  const paddingX = 35;
  const paddingY = 25;

  const coords = chartPoints.map((pt, idx) => {
    const x = paddingX + (idx / (chartPoints.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - ((pt.checkIns - minVal) / valRange) * (svgHeight - paddingY * 2);
    return { x, y, pt };
  });

  // Quadratic Bezier smoothing for SVG Path
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

  const avgDailyVisits = Math.round(
    chartPoints.reduce((acc, p) => acc + p.checkIns, 0) / chartPoints.length
  );

  return (
    <AppLayout onRefreshData={loadData}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-surface border border-surface-border text-content-primary shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" weight="fill" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* ============================================================
            1. TOP HEADER & KEY ACTIONS
            ============================================================ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-content-primary font-sans">
                Gym Dashboard
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-content-secondary">
              See today&apos;s check-ins, member workout streaks, and members who need a friendly follow-up.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <Link
              href="/insights"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/15 text-purple-600 dark:text-cyan-400 border border-purple-500/20 text-xs font-bold transition-all btn-shadow"
            >
              <Sparkle className="w-4 h-4" weight="fill" />
              <span>Ask AI</span>
            </Link>

            <Link
              href="/retention"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-semibold text-content-primary transition-all btn-shadow"
            >
              <Warning className="w-4 h-4 text-amber-500" weight="fill" />
              <span>Needs Attention</span>
              <span className="px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-mono font-bold">
                {highRiskCount}
              </span>
            </Link>

            <Link
              href="/check-in"
              className="flex items-center gap-2 px-4 py-2 rounded-xl btn-shadow-primary text-xs font-bold transition-all"
            >
              <UserCheck className="w-4 h-4" weight="bold" />
              <span>+ Check In Member</span>
            </Link>
          </div>
        </div>

        {/* ============================================================
            2. 4 KEY GYM METRICS
            ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Members */}
          <div className="p-5 rounded-2xl bg-surface border border-surface-border hover:border-surface-border-hover transition-all duration-200 btn-shadow group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-content-secondary uppercase tracking-wider">
                Active Members
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-cyan-400 flex items-center justify-center">
                <Users className="w-4 h-4" weight="duotone" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight font-sans">
                {activeMembers}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <TrendUp className="w-3.5 h-3.5" weight="bold" />
                +8.2%
              </span>
            </div>
            <p className="text-[11px] text-content-tertiary">
              Members with an active gym pass
            </p>
          </div>

          {/* Card 2: Today's Check-Ins */}
          <div className="p-5 rounded-2xl bg-surface border border-surface-border hover:border-surface-border-hover transition-all duration-200 btn-shadow group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-content-secondary uppercase tracking-wider">
                Today&apos;s Check-Ins
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-4 h-4" weight="duotone" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight font-sans">
                {todayCheckIns}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-cyan-400">
                Peak: 6-8 PM
              </span>
            </div>
            <p className="text-[11px] text-content-tertiary">
              Floor capacity: 54% · Average workout: 62 mins
            </p>
          </div>

          {/* Card 3: At-Risk Members */}
          <div className="p-5 rounded-2xl bg-surface border border-surface-border hover:border-surface-border-hover transition-all duration-200 btn-shadow group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-content-secondary uppercase tracking-wider">
                Needs Attention
              </span>
              <div className="w-8 h-8 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Warning className="w-4 h-4" weight="duotone" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 tracking-tight font-sans">
                {highRiskCount}
              </span>
              <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-0.5">
                <TrendDown className="w-3.5 h-3.5" weight="bold" />
                Follow up
              </span>
            </div>
            <p className="text-[11px] text-content-tertiary">
              Absent over a week · Est. ₨18,800 monthly dues at risk
            </p>
          </div>

          {/* Card 4: Retention Benchmark */}
          <div className="p-5 rounded-2xl bg-surface border border-surface-border hover:border-surface-border-hover transition-all duration-200 btn-shadow group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-content-secondary uppercase tracking-wider">
                Monthly Retention
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Medal className="w-4 h-4" weight="duotone" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-content-primary tracking-tight font-sans">
                91.4%
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                +9.4% vs industry
              </span>
            </div>
            <p className="text-[11px] text-content-tertiary">
              Members who renewed or stayed active this month
            </p>
          </div>
        </div>

        {/* ============================================================
            3. INTERACTIVE RETENTION RADAR
            ============================================================ */}
        <div className="w-full">
          <Retention3DRadar
            activeSegment={radarSegment}
            onSelectSegment={(segment) => {
              setRadarSegment(segment);
              if (segment !== 'ALL') {
                showToast(`Filtered member list to ${segment.toLowerCase().replace('_', ' ')} group`);
              }
            }}
            urgentCount={4}
            slippingCount={2}
            habitDisruptedCount={3}
            healthyCount={133}
            urgentRevenueAtRisk={20000}
            slippingRevenueAtRisk={9000}
          />
        </div>

        {/* ============================================================
            4. ATTENDANCE TRENDS & GYM FLOOR ACTIVITY (8 / 4 COLS)
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Attendance Chart (8 Cols) */}
          <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl bg-surface border border-surface-border flex flex-col justify-between btn-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-content-primary">
                  Daily gym attendance
                </h3>
                <p className="text-xs text-content-tertiary">
                  Number of members checking in each day across all membership tiers
                </p>
              </div>

              {/* Timeframe Toggles */}
              <div className="flex items-center gap-1 p-1 bg-surface-subtle border border-surface-border rounded-xl self-start sm:self-auto">
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
                    {t === '7D' ? '7 Days' : t === '14D' ? '14 Days' : t === '30D' ? '30 Days' : '90 Days'}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive SVG Chart Canvas */}
            <div className="relative w-full h-[240px] select-none my-2">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Grid Lines */}
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

                {/* Shaded Area */}
                {areaD && <path d={areaD} fill="url(#chartGradient)" />}

                {/* Line Path */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#7C3AED"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points & Hover Targets */}
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
                            ? 'fill-purple-600 stroke-surface stroke-2'
                            : 'fill-purple-600 stroke-surface stroke-1'
                        }`}
                      />
                      {/* Invisible wider target for smooth hovering */}
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

              {/* Tooltip Overlay */}
              {hoveredPoint && (
                <div
                  className="absolute pointer-events-none -translate-x-1/2 -translate-y-full px-3 py-1.5 rounded-xl bg-surface border border-surface-border shadow-xl z-20 transition-all text-center"
                  style={{
                    left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                    top: `${(hoveredPoint.y / svgHeight) * 100 - 8}%`,
                  }}
                >
                  <div className="text-[10px] text-content-tertiary font-medium">
                    {hoveredPoint.label}
                  </div>
                  <div className="text-sm font-extrabold text-content-primary font-mono">
                    {hoveredPoint.val} check-ins
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Summary Bar */}
            <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs text-content-tertiary">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                <span className="font-medium text-content-secondary">
                  Daily check-in volume
                </span>
                <span className="text-[11px]">({timeframe === '7D' ? '7 days' : timeframe === '14D' ? '14 days' : timeframe === '30D' ? '30 days' : '90 days'})</span>
              </div>
              <div className="font-mono text-content-primary font-bold">
                Average: {avgDailyVisits} visits/day
              </div>
            </div>
          </div>

          {/* Right: Gym Floor Live Pulse (4 Cols) */}
          <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl bg-surface border border-surface-border flex flex-col justify-between btn-shadow">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-content-primary">
                    Current gym floor activity
                  </h3>
                  <p className="text-xs text-content-tertiary">
                    Live occupancy and today&apos;s busiest workout hours
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live now
                </span>
              </div>

              {/* Occupancy Radial Indicator */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-content-secondary">
                    Gym floor occupancy
                  </span>
                  <span className="text-xs font-mono font-bold text-content-primary">
                    {todayCheckIns} of 70 spots filled
                  </span>
                </div>
                <div className="w-full bg-surface rounded-full h-2 overflow-hidden border border-surface-border">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((todayCheckIns / 70) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-content-tertiary mt-2">
                  <span>Quiet</span>
                  <span className="font-bold text-purple-600 dark:text-cyan-400">Moderate pace</span>
                  <span>Full</span>
                </div>
              </div>

              {/* Peak Hours Forecast */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-content-secondary uppercase tracking-wider">
                  Busiest hours today
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-surface-border/50">
                  <span className="text-content-secondary">5:00 PM – 6:30 PM</span>
                  <span className="font-mono text-content-primary font-bold">~42 members (Busy)</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-surface-border/50">
                  <span className="text-content-secondary">6:30 PM – 8:00 PM</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">~58 members (Peak)</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-content-secondary">8:00 PM – 9:30 PM</span>
                  <span className="font-mono text-content-primary font-bold">~25 members (Quiet)</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-border mt-4">
              <Link
                href="/check-in"
                className="w-full py-2 px-3 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-bold text-content-primary flex items-center justify-center gap-2 transition-all btn-shadow"
              >
                <QrCode className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
                <span>Open front-desk scanner</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================
            5. MEMBERS NEEDING ATTENTION & AUTOMATIC FOLLOW-UPS (7 / 5 COLS)
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Urgent Retention Queue (7 Cols) */}
          <div className="lg:col-span-7 p-5 sm:p-6 rounded-2xl bg-surface border border-surface-border flex flex-col justify-between btn-shadow">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-content-primary">
                      Members who need a follow-up
                    </h3>
                    {radarSegment !== 'ALL' && (
                      <button
                        onClick={() => setRadarSegment('ALL')}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold hover:bg-cyan-500/20 transition-colors"
                      >
                        Filtered group (Show all ✕)
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-content-tertiary">
                    Members who haven&apos;t visited recently. Reach out with a quick message to keep them on track.
                  </p>
                </div>
                <Link
                  href="/retention"
                  className="text-xs font-bold text-purple-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <span>View all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Clean Member List Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-border text-content-tertiary uppercase text-[10px] font-bold">
                      <th className="py-2.5 px-3">Member</th>
                      <th className="py-2.5 px-3">Days absent</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Send message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/50">
                    {atRiskMembers.map((member) => {
                      const isNudged = nudgedMembers.has(member.memberId);
                      const daysAbsent = member.factors?.daysSinceLastCheckIn ?? 12;
                      const isCritical = daysAbsent >= 10;
                      return (
                        <tr key={member.memberId} className="hover:bg-surface-subtle/50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-content-primary">{member.fullName}</div>
                            <div className="text-[10px] text-content-tertiary font-mono">
                              {member.memberCode}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-content-secondary">
                              {daysAbsent} days away
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isCritical
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`} />
                              <span>{isCritical ? 'Needs call or message' : 'Attendance slipping'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleNudge(member)}
                              disabled={isNudged}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all btn-shadow ${
                                isNudged
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-default'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {isNudged ? 'Message sent ✓' : 'Send WhatsApp'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border mt-3 text-right">
              <Link
                href="/retention"
                className="text-xs font-bold text-content-secondary hover:text-content-primary transition-colors"
              >
                View all members who need attention →
              </Link>
            </div>
          </div>

          {/* Right: Retention Loops & Streak Champions (5 Cols) */}
          <div className="lg:col-span-5 p-5 sm:p-6 rounded-2xl bg-surface border border-surface-border flex flex-col justify-between btn-shadow">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-content-primary">
                    Automatic messages &amp; reminders
                  </h3>
                  <p className="text-xs text-content-tertiary">
                    Helpful messages sent automatically to keep members motivated
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" weight="duotone" />
                </div>
              </div>

              {/* Loop Status Items */}
              <div className="space-y-3 mb-5">
                {[
                  {
                    title: 'Missed workout reminder',
                    desc: 'Friendly WhatsApp message sent after 5 days away',
                    stat: '18 sent this week',
                    active: true,
                  },
                  {
                    title: 'Workout streak rewards',
                    desc: 'Congratulates members and awards bonuses at 7, 14, and 30 days',
                    stat: '6 redeemed',
                    active: true,
                  },
                  {
                    title: 'Membership renewal notice',
                    desc: 'Reminds members 3 days before their pass expires',
                    stat: '3 due soon',
                    active: true,
                  },
                ].map((loop, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-content-primary">{loop.title}</span>
                      </div>
                      <p className="text-[10px] text-content-tertiary mt-0.5">{loop.desc}</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-content-secondary px-2 py-0.5 rounded-lg bg-surface border border-surface-border flex-shrink-0">
                      {loop.stat}
                    </span>
                  </div>
                ))}
              </div>

              {/* Top Streak Champion Box */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Fire className="w-5 h-5" weight="fill" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                      Longest active workout streak
                    </span>
                    <div className="text-xs font-extrabold text-content-primary">
                      {topStreakLeader.memberName} ({topStreakLeader.memberCode})
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                    {topStreakLeader.currentStreak} Days
                  </div>
                  <span className="text-[9px] text-content-tertiary font-bold">In a row</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-border mt-4 flex items-center justify-between">
              <Link
                href="/rewards/winners"
                className="text-xs font-bold text-purple-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>View streak leaderboard</span>
                <ArrowRight className="w-3 h-3" />
              </Link>

              <Link
                href="/rewards"
                className="text-xs font-semibold text-content-tertiary hover:text-content-primary transition-colors"
              >
                Reward settings →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
