'use client';

import React from 'react';
import { UserCheck, Users, AlertTriangle, Flame, Award, ChevronRight } from '@/components/icons';
import Link from 'next/link';
import { DashboardSummary } from '../../types';

interface RetentionSparklineRowProps {
  summary?: DashboardSummary | null;
}

export const RetentionSparklineRow: React.FC<RetentionSparklineRowProps> = ({ summary }) => {
  const activeMembers = summary?.kpis?.activeMembers ?? 142;
  const todayCheckIns = summary?.kpis?.todayCheckIns ?? 38;
  const highRiskCount = summary?.kpis?.highRiskCount ?? 6;
  const topStreak = summary?.streakLeaders?.[0]?.currentStreak ?? 12;

  const cards = [
    {
      id: 'checkins',
      title: 'Today Check-Ins',
      code: 'ATTENDANCE',
      value: `${todayCheckIns} Visits`,
      change: '+12.4%',
      isPositive: true,
      cardClass: 'pastel-card-mint',
      strokeColor: '#059669',
      points: [12, 18, 14, 24, 22, todayCheckIns],
      icon: UserCheck,
    },
    {
      id: 'members',
      title: 'Active Members',
      code: 'UTILIZATION',
      value: `${activeMembers} Enrolled`,
      change: '+8.2%',
      isPositive: true,
      cardClass: 'pastel-card-purple',
      strokeColor: '#7C3AED',
      points: [120, 128, 134, 130, 138, activeMembers],
      icon: Users,
    },
    {
      id: 'atrisk',
      title: 'At-Risk Alerts',
      code: 'CHURN RISK',
      value: `${highRiskCount} High Risk`,
      change: 'Needs Nudge',
      isPositive: false,
      cardClass: 'pastel-card-gold',
      strokeColor: '#D97706',
      points: [14, 11, 9, 8, 7, highRiskCount],
      icon: AlertTriangle,
    },
    {
      id: 'streak',
      title: 'Top Streak',
      code: 'CHAMPIONS',
      value: `${topStreak} Days`,
      change: '+4.4%',
      isPositive: true,
      cardClass: 'pastel-card-lime',
      strokeColor: '#16A34A',
      points: [5, 7, 8, 10, 11, topStreak],
      icon: Flame,
    },
    {
      id: 'retention',
      title: '30D Retention',
      code: 'BENCHMARK',
      value: '91.4% Rate',
      change: '+5.4%',
      isPositive: true,
      cardClass: 'pastel-card-magenta',
      strokeColor: '#DB2777',
      points: [84, 86, 88, 87, 90, 91.4],
      icon: Award,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-content-primary">Retention &amp; Attendance Highlights</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 relative">
        {cards.map((c) => {
          // Calculate mini sparkline path
          const min = Math.min(...c.points);
          const max = Math.max(...c.points);
          const range = max - min || 1;
          const svgCoords = c.points.map((p, idx) => {
            const x = (idx / (c.points.length - 1)) * 70;
            const y = 24 - ((p - min) / range) * 18;
            return `${x},${y}`;
          });
          const pathD = `M ${svgCoords.join(' L ')}`;

          return (
            <div
              key={c.id}
              className={`p-3.5 rounded-2xl flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${c.cardClass}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center">
                    <c.icon className="w-3 h-3 text-content-primary" />
                  </div>
                  <span className="text-[11px] font-bold text-content-primary truncate max-w-[90px]">
                    {c.title}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-bold tracking-wider text-content-tertiary font-mono">
                    {c.code}
                  </div>
                  <div
                    className={`text-[10px] font-bold ${
                      c.isPositive
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {c.change}
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-between mt-1">
                <div>
                  <span className="text-[10px] text-content-tertiary block leading-none mb-0.5">
                    Metric Value
                  </span>
                  <span className="text-base font-extrabold text-content-primary tracking-tight font-sans">
                    {c.value}
                  </span>
                </div>

                {/* Mini Sparkline Graph */}
                <div className="w-16 h-7 flex items-center justify-end">
                  <svg viewBox="0 0 70 28" className="w-16 h-6 overflow-visible">
                    <path
                      d={pathD}
                      fill="none"
                      stroke={c.strokeColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
