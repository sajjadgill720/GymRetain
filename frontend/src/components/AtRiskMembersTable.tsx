'use client';

import React, { useState } from 'react';
import { MemberRiskDetails } from '../types';
import { InterventionModal, InterventionMember } from './dashboard/InterventionModal';
import {
  Warning,
  Flame,
  CreditCard,
  ChatCircleDots,
  Clock,
  ArrowDownRight,
  PaperPlaneTilt,
  CheckCircle,
  X,
  Search,
  Funnel,
  User,
  ShieldAlert,
  ArrowRight,
  CalendarBlank,
} from '@/components/icons';

interface AtRiskMembersTableProps {
  members: MemberRiskDetails[];
  limit?: number;
  showFilters?: boolean;
}

export const AtRiskMembersTable: React.FC<AtRiskMembersTableProps> = ({
  members,
  limit,
  showFilters = true,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [factorFilter, setFactorFilter] = useState<'ALL' | 'ABSENCE' | 'ROUTINE' | 'PAYMENT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberForModal, setSelectedMemberForModal] = useState<InterventionMember | null>(null);
  const [memberStatuses, setMemberStatuses] = useState<Record<string, { status: InterventionMember['status']; handler: string }>>({
    'mem-2': { status: 'NEEDS_OUTREACH', handler: 'Coach Bilal' },
    'mem-7': { status: 'NEEDS_OUTREACH', handler: 'Coach Sarah' },
    'mem-8': { status: 'NEEDS_OUTREACH', handler: 'Coach Sarah' },
    'mem-9': { status: 'NEEDS_OUTREACH', handler: 'Coach Bilal' },
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter members
  const filtered = members.filter((m) => {
    if (selectedFilter === 'HIGH' && m.riskLevel !== 'HIGH') return false;
    if (selectedFilter === 'MEDIUM' && m.riskLevel !== 'MEDIUM') return false;

    if (factorFilter === 'ABSENCE' && (m.factors?.daysSinceLastCheckIn ?? 0) < 10) return false;
    if (factorFilter === 'ROUTINE' && (m.factors?.frequencyDropPercentage ?? 0) < 50) return false;
    if (factorFilter === 'PAYMENT' && !m.factors?.isPaymentOverdue) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.fullName.toLowerCase().includes(q);
      const matchCode = m.memberCode.toLowerCase().includes(q);
      if (!matchName && !matchCode) return false;
    }

    return true;
  });

  const displayList = limit ? filtered.slice(0, limit) : filtered;

  // Prepare outreach for a member
  const handleOpenOutreach = (m: MemberRiskDetails) => {
    const statusData = memberStatuses[m.memberId] || { status: 'NEEDS_OUTREACH', handler: 'Coach Bilal' };
    const memberData: InterventionMember = {
      memberId: m.memberId,
      memberCode: m.memberCode,
      fullName: m.fullName,
      phone: m.phone,
      planName: 'Pro Strength & Cardio',
      planPrice: 5500,
      riskScore: m.riskScore,
      riskLevel: m.riskLevel,
      daysInactive: m.factors?.daysSinceLastCheckIn ?? 12,
      usualCadence: 'Mon, Wed, Fri at 7:00 PM (4.0x/wk)',
      recentCadence: `${m.factors?.weeklyVisitsCurrent ?? 0} visits in last 14d (-${m.factors?.frequencyDropPercentage ?? 70}%)`,
      disengagementReason: m.factors?.isPaymentOverdue
        ? 'Membership renewal payment overdue + 12 days absence.'
        : `Frequency collapsed by ${m.factors?.frequencyDropPercentage ?? 70}% relative to 4-week baseline.`,
      assignedStaff: statusData.handler,
      status: statusData.status,
    };
    setSelectedMemberForModal(memberData);
  };

  const handleInterventionDone = (memberId: string, newStatus: InterventionMember['status'], summary: string) => {
    setMemberStatuses((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        status: newStatus,
      },
    }));
    showToast(`Outreach recorded: ${summary}`);
  };

  return (
    <div className="glass-panel-elevated rounded-3xl p-5 sm:p-6 border border-surface-border space-y-4 btn-shadow">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl glass-panel-elevated text-content-primary shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" weight="fill" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Intervention Modal */}
      <InterventionModal
        member={selectedMemberForModal}
        isOpen={!!selectedMemberForModal}
        onClose={() => setSelectedMemberForModal(null)}
        onInterventionComplete={handleInterventionDone}
      />

      {/* Header & Pipeline Context */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-3 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold text-content-primary tracking-tight flex items-center gap-2 font-sans">
              <ShieldAlert className="w-5 h-5 text-red-500" weight="duotone" />
              Member Churn Risk Triage Pipeline
            </h2>
            <span className="text-[10px] font-bold font-mono text-red-600 dark:text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
              {filtered.length} In Queue
            </span>
          </div>
          <p className="text-xs text-content-secondary mt-1">
            Detect silent gym dropouts before memberships lapse. Review diagnosis and dispatch tailored recovery interventions.
          </p>
        </div>

        {/* 4-Step Pipeline Indicator */}
        <div className="hidden xl:flex items-center gap-2 p-2 rounded-2xl bg-surface-subtle/80 border border-surface-border text-[11px] font-semibold text-content-tertiary">
          <span className="text-cyan-400 font-bold">1. Identify</span>
          <span>→</span>
          <span className="text-cyan-400 font-bold">2. Analyze Evidence</span>
          <span>→</span>
          <span className="text-cyan-400 font-bold">3. Prepare Draft</span>
          <span>→</span>
          <span className="text-emerald-400 font-bold">4. Track Recovery</span>
        </div>
      </div>

      {/* Search & Dynamic Filters */}
      {showFilters && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
            <input
              type="text"
              placeholder="Search at-risk members by name, code, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-surface-border text-xs text-content-primary placeholder-content-tertiary outline-none focus:border-cyan-400 transition-all btn-shadow"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Severity Filter */}
            <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-surface-border">
              {(['ALL', 'HIGH', 'MEDIUM'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedFilter === filter
                      ? 'bg-surface text-purple-600 dark:text-cyan-400 shadow-sm border border-surface-border'
                      : 'text-content-tertiary hover:text-content-primary'
                  }`}
                >
                  {filter === 'ALL' ? 'All Risks' : `${filter} Risk`}
                </button>
              ))}
            </div>

            {/* Factor Filter */}
            <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-surface-border">
              {(['ALL', 'ABSENCE', 'ROUTINE', 'PAYMENT'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFactorFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    factorFilter === f
                      ? 'bg-surface text-content-primary shadow-sm border border-surface-border'
                      : 'text-content-tertiary hover:text-content-primary'
                  }`}
                >
                  {f === 'ALL' ? 'All Triggers' : f === 'ABSENCE' ? '>10d Absent' : f === 'ROUTINE' ? 'Routine Drop' : 'Overdue'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Members Table */}
      <div className="rounded-2xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border bg-surface-subtle/50 text-content-tertiary uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Disengagement Evidence</th>
                <th className="py-3 px-4">Usual Routine vs 14D Velocity</th>
                <th className="py-3 px-4">Assigned Handler</th>
                <th className="py-3 px-4">Intervention Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/50">
              {displayList.map((m) => {
                const isHigh = m.riskLevel === 'HIGH';
                const statusInfo = memberStatuses[m.memberId] || { status: 'NEEDS_OUTREACH', handler: 'Coach Bilal' };
                const daysInactive = m.factors?.daysSinceLastCheckIn ?? 12;
                const dropPct = m.factors?.frequencyDropPercentage ?? 70;

                return (
                  <tr key={m.memberId} className="hover:bg-surface-subtle/40 transition-colors">
                    {/* Member */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-content-primary text-sm">{m.fullName}</div>
                      <div className="text-[10px] text-content-tertiary font-mono">
                        {m.memberCode} · {m.phone}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            isHigh
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}
                        >
                          {m.riskScore}% Churn Probability
                        </span>
                      </div>
                    </td>

                    {/* Disengagement Evidence */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{daysInactive} Consecutive Days Absent</span>
                      </div>
                      <p className="text-[11px] text-content-secondary mt-0.5 leading-snug">
                        {m.factors?.isPaymentOverdue
                          ? 'Renewal payment overdue 12 days + absent from training.'
                          : `Frequency dropped ${dropPct}% from 4-week baseline routine.`}
                      </p>
                    </td>

                    {/* Routine Shift */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-semibold text-content-primary">
                        Usual: Mon/Wed/Fri 7pm
                      </div>
                      <div className="text-[11px] font-bold text-red-500 mt-0.5">
                        Current: 0 visits in 14d (-100%)
                      </div>
                    </td>

                    {/* Staff Handler */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-content-primary">
                        <User className="w-3.5 h-3.5 text-content-tertiary" />
                        <span>{statusInfo.handler}</span>
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4">
                      {statusInfo.status === 'NEEDS_OUTREACH' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Needs Outreach
                        </span>
                      )}
                      {statusInfo.status === 'CONTACTED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Contacted ✓
                        </span>
                      )}
                      {statusInfo.status === 'SCHEDULED' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-cyan-400 border border-purple-500/20">
                          Follow-up Scheduled
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenOutreach(m)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all btn-shadow flex items-center gap-1.5 ml-auto ${
                          statusInfo.status === 'CONTACTED'
                            ? 'bg-surface-subtle border border-surface-border text-content-primary'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <ChatCircleDots className="w-3.5 h-3.5" weight="bold" />
                        <span>{statusInfo.status === 'CONTACTED' ? 'View Log' : 'Prepare Outreach'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
