'use client';

import React, { useState } from 'react';
import { MemberRiskDetails } from '../types';
import {
  AlertTriangle,
  Flame,
  CreditCard,
  MessageCircle,
  Clock,
  ArrowDownRight,
  Send,
  CheckCircle2,
  X,
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
  const [activeNudgeMember, setActiveNudgeMember] = useState<MemberRiskDetails | null>(null);
  const [nudgeSent, setNudgeSent] = useState(false);

  const filtered = members.filter((m) => {
    if (selectedFilter === 'HIGH') return m.riskLevel === 'HIGH';
    if (selectedFilter === 'MEDIUM') return m.riskLevel === 'MEDIUM';
    return true;
  });

  const displayList = limit ? filtered.slice(0, limit) : filtered;

  const handleSendNudge = () => {
    setNudgeSent(true);
    setTimeout(() => {
      setNudgeSent(false);
      setActiveNudgeMember(null);
    }, 1800);
  };

  return (
    <div className="bg-surface border border-surface-border rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-3 border-b border-surface-border mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-content-primary tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Member Churn Risk Detection
            </h2>
            <span className="text-[11px] font-medium text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
              Follow-Up Queue
            </span>
          </div>
          <p className="text-xs text-content-tertiary mt-1">
            Members exhibiting silent churn indicators: prolonged absence, frequency collapse, or overdue payments.
          </p>
        </div>

        {showFilters && (
          <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-surface-border">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all btn-shadow ${
                selectedFilter === 'ALL'
                  ? 'bg-surface text-content-primary shadow-sm'
                  : 'text-content-tertiary hover:text-content-primary'
              }`}
            >
              All ({members.length})
            </button>
            <button
              onClick={() => setSelectedFilter('HIGH')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all btn-shadow ${
                selectedFilter === 'HIGH'
                  ? 'bg-red-500/15 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-content-tertiary hover:text-red-500'
              }`}
            >
              High ({members.filter((m) => m.riskLevel === 'HIGH').length})
            </button>
            <button
              onClick={() => setSelectedFilter('MEDIUM')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all btn-shadow ${
                selectedFilter === 'MEDIUM'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-content-tertiary hover:text-amber-500'
              }`}
            >
              Medium ({members.filter((m) => m.riskLevel === 'MEDIUM').length})
            </button>
          </div>
        )}
      </div>

      {/* Mobile Card List (Tested for 375px: Zero horizontal scrolling) */}
      <div className="block md:hidden space-y-2.5">
        {displayList.map((m) => {
          const isHigh = m.riskLevel === 'HIGH';
          return (
            <div
              key={m.memberId}
              className="p-3.5 rounded-2xl bg-surface-subtle/50 border border-surface-border space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-xs text-content-primary">{m.fullName}</div>
                  <div className="text-[11px] text-content-tertiary font-mono mt-0.5">
                    {m.memberCode} • {m.phone}
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-medium uppercase shrink-0 ${
                    isHigh
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {m.riskLevel} ({m.riskScore})
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-content-tertiary pt-2 border-t border-surface-border">
                <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{m.factors.daysSinceLastCheckIn}d inactive</span>
                </div>
                {m.factors.isPaymentOverdue ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-medium">
                    Payment Overdue
                  </span>
                ) : (
                  <span className="text-[10px] text-content-tertiary font-mono">
                    -{m.factors.frequencyDropPercentage}% visits
                  </span>
                )}
              </div>

              <button
                onClick={() => setActiveNudgeMember(m)}
                className="w-full py-2 rounded-xl bg-surface hover:bg-surface-subtle text-emerald-600 dark:text-emerald-400 border border-surface-border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm btn-shadow"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Send WhatsApp Nudge</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Desktop Table (Visible md and above) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-surface-border text-content-tertiary text-[11px] uppercase tracking-wider font-semibold">
              <th className="pb-2.5 pl-1">Member</th>
              <th className="pb-2.5">Risk Score</th>
              <th className="pb-2.5">Inactivity</th>
              <th className="pb-2.5">Frequency Drop</th>
              <th className="pb-2.5">Payment / Streak</th>
              <th className="pb-2.5 text-right pr-1">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {displayList.map((m) => {
              const isHigh = m.riskLevel === 'HIGH';

              return (
                <tr key={m.memberId} className="hover:bg-surface-subtle/50 transition-colors">
                  {/* Member Name & Code */}
                  <td className="py-2.5 pl-1">
                    <div className="font-semibold text-content-primary">
                      {m.fullName}
                    </div>
                    <div className="text-[11px] text-content-tertiary font-mono flex items-center gap-1.5 mt-0.5">
                      <span>{m.memberCode}</span>
                      <span>•</span>
                      <span>{m.phone}</span>
                    </div>
                  </td>

                  {/* Risk Score Progress */}
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-surface-subtle overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isHigh ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${m.riskScore}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-mono font-medium ${
                          isHigh ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {m.riskScore}
                      </span>
                    </div>
                  </td>

                  {/* Days Inactive */}
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5 text-content-secondary">
                      <Clock className="w-3.5 h-3.5 text-content-tertiary" />
                      <span>{m.factors.daysSinceLastCheckIn} days</span>
                    </div>
                  </td>

                  {/* Frequency Drop */}
                  <td className="py-2.5">
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-mono">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      <span>-{m.factors.frequencyDropPercentage}%</span>
                    </div>
                  </td>

                  {/* Payment / Streak Flags */}
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5">
                      {m.factors.isPaymentOverdue ? (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          Overdue
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Paid
                        </span>
                      )}

                      {m.factors.isRecentlyBrokenStreak && (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Streak Lost
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Re-engagement Action */}
                  <td className="py-2.5 text-right pr-1">
                    <button
                      onClick={() => setActiveNudgeMember(m)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle text-emerald-600 dark:text-emerald-400 border border-surface-border text-xs font-semibold transition-all shadow-sm btn-shadow"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Nudge</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* WhatsApp Nudge Preview Modal (Phase 2 Preview) */}
      {activeNudgeMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface max-w-md w-full rounded-3xl p-6 border border-surface-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveNudgeMember(null)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-content-tertiary hover:text-content-primary hover:bg-surface-subtle shadow-sm btn-shadow"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-content-primary">WhatsApp Re-Engagement Nudge</h3>
                <p className="text-xs text-content-tertiary">Direct WhatsApp Outreach</p>
              </div>
            </div>

            {/* Recipient info */}
            <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border mb-4 text-xs space-y-1.5">
              <div className="flex justify-between text-content-tertiary">
                <span>Recipient:</span>
                <span className="font-semibold text-content-primary">{activeNudgeMember.fullName}</span>
              </div>
              <div className="flex justify-between text-content-tertiary">
                <span>Phone:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{activeNudgeMember.phone}</span>
              </div>
              <div className="flex justify-between text-content-tertiary">
                <span>Risk Reason:</span>
                <span className="text-red-600 dark:text-red-400 font-bold">
                  {activeNudgeMember.factors.daysSinceLastCheckIn} days absent (Score: {activeNudgeMember.riskScore})
                </span>
              </div>
            </div>

            {/* WhatsApp Message Preview Bubble */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-content-primary leading-relaxed font-sans mb-5 shadow-inner">
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                Assalam-o-Alaikum {activeNudgeMember.fullName.split(' ')[0]} bhai! 👋
              </p>
              <p>
                We noticed you haven&apos;t visited <strong>Iron House Gym</strong> in the last{' '}
                {activeNudgeMember.factors.daysSinceLastCheckIn} days. Your fitness journey matters
                to us!
              </p>
              <p className="mt-2 text-emerald-700 dark:text-emerald-300 font-medium">
                Drop by today or tomorrow, and front desk will set you up with your personalized
                catch-up workout! 💪
              </p>
              <div className="text-[10px] text-content-tertiary text-right mt-2 font-mono">
                Automated Member Retention Message
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setActiveNudgeMember(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-content-tertiary hover:text-content-primary hover:bg-surface-subtle transition-all btn-shadow"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNudge}
                disabled={nudgeSent}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md btn-shadow transition-all disabled:opacity-50"
              >
                {nudgeSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Nudge Dispatched!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-white" />
                    <span>Send Automated Nudge</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
