'use client';

import React from 'react';
import { MoreHorizontal, AlertTriangle, CheckCircle2, MessageCircle, ArrowRight, User } from '@/components/icons';
import Link from 'next/link';

export const AtRiskMembersSnapshotTable: React.FC = () => {
  const members = [
    {
      code: 'GR-1002',
      name: 'Ayesha Malik',
      phone: '+92 333 1122334',
      inactive: '16 days absent',
      plan: 'Monthly Standard (₨5K)',
      score: 88,
      level: 'HIGH',
      badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
      initials: 'AM',
      avatarBg: 'bg-red-500/10 text-red-600 dark:text-red-400',
    },
    {
      code: 'GR-1007',
      name: 'Omer Farooq',
      phone: '+92 300 5544332',
      inactive: '12 days absent',
      plan: 'Quarterly VIP (₨16K)',
      score: 78,
      level: 'HIGH',
      badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
      initials: 'OF',
      avatarBg: 'bg-red-500/10 text-red-600 dark:text-red-400',
    },
    {
      code: 'GR-1005',
      name: 'Bilal Ahmed',
      phone: '+92 345 6677889',
      inactive: '9 days absent',
      plan: 'Monthly Gold (₨6.5K)',
      score: 68,
      level: 'MEDIUM',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      initials: 'BA',
      avatarBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      code: 'GR-1001',
      name: 'Hamza Sheikh',
      phone: '+92 300 9876543',
      inactive: 'Today (12d Streak)',
      plan: 'Monthly Gold (₨6.5K)',
      score: 12,
      level: 'HEALTHY',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      initials: 'HS',
      avatarBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="shopeers-card p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-content-primary tracking-tight">
            At-Risk Members &amp; Silent Churn Follow-Up
          </h3>
          <p className="text-[11px] text-content-tertiary">
            Automated WhatsApp retention interventions recommended
          </p>
        </div>
        <Link
          href="/retention"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          <span>Full Queue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table matching Shopeers style */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-surface-border text-[11px] font-semibold text-content-tertiary uppercase tracking-wider">
              <th className="pb-3 pl-1 font-mono">CODE</th>
              <th className="pb-3 pl-2">MEMBER</th>
              <th className="pb-3 text-right pr-4">INACTIVITY</th>
              <th className="pb-3 text-right pr-4">MEMBERSHIP</th>
              <th className="pb-3 text-right pr-1">CHURN RISK</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/60">
            {members.map((row) => (
              <tr key={row.code} className="hover:bg-surface-subtle/50 transition-colors group">
                {/* Code */}
                <td className="py-3 pl-1 font-mono text-content-tertiary text-[11px]">
                  {row.code}
                </td>

                {/* Name & Avatar */}
                <td className="py-3 pl-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${row.avatarBg}`}
                    >
                      {row.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-content-primary truncate">
                        {row.name}
                      </div>
                      <div className="text-[10px] text-content-tertiary font-mono">{row.phone}</div>
                    </div>
                  </div>
                </td>

                {/* Inactivity */}
                <td className="py-3 text-right pr-4 text-content-secondary font-medium">
                  {row.inactive}
                </td>

                {/* Plan */}
                <td className="py-3 text-right pr-4 font-medium text-content-primary">
                  {row.plan}
                </td>

                {/* Risk Level Badge */}
                <td className="py-3 text-right pr-1">
                  <span
                    className={`inline-flex items-center gap-1 font-semibold text-[10px] px-2 py-0.5 rounded-full ${row.badgeClass}`}
                  >
                    {row.level === 'HIGH' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                    {row.level === 'HEALTHY' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                    <span>Risk: {row.score}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
