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
} from 'lucide-react';

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
    <div className="glass-card rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Member Churn Risk Detection
            </h2>
            <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
              Rules-Based AI Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Members exhibiting silent churn indicators: prolonged absence, frequency collapse, or overdue payments.
          </p>
        </div>

        {showFilters && (
          <div className="flex items-center gap-1.5 bg-[#10141f] p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                selectedFilter === 'ALL'
                  ? 'bg-surface-50 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({members.length})
            </button>
            <button
              onClick={() => setSelectedFilter('HIGH')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                selectedFilter === 'HIGH'
                  ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              High ({members.filter((m) => m.riskLevel === 'HIGH').length})
            </button>
            <button
              onClick={() => setSelectedFilter('MEDIUM')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                selectedFilter === 'MEDIUM'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              Medium ({members.filter((m) => m.riskLevel === 'MEDIUM').length})
            </button>
          </div>
        )}
      </div>

      {/* Mobile Card List (Tested for 375px: Zero horizontal scrolling) */}
      <div className="block md:hidden space-y-3">
        {displayList.map((m) => {
          const isHigh = m.riskLevel === 'HIGH';
          return (
            <div
              key={m.memberId}
              className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-sm text-white">{m.fullName}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {m.memberCode} • {m.phone}
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                    isHigh
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {m.riskLevel} ({m.riskScore})
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-rose-300 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{m.factors.daysSinceLastCheckIn}d inactive</span>
                </div>
                {m.factors.isPaymentOverdue ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                    Payment Overdue
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    -{m.factors.frequencyDropPercentage}% visits
                  </span>
                )}
              </div>

              <button
                onClick={() => setActiveNudgeMember(m)}
                className="w-full py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
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
            <tr className="border-b border-white/5 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
              <th className="pb-3 pl-1">Member</th>
              <th className="pb-3">Risk Score</th>
              <th className="pb-3">Inactivity</th>
              <th className="pb-3">Frequency Drop</th>
              <th className="pb-3">Payment / Streak</th>
              <th className="pb-3 text-right pr-1">Automated Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {displayList.map((m) => {
              const isHigh = m.riskLevel === 'HIGH';

              return (
                <tr key={m.memberId} className="hover:bg-white/[0.02] transition-colors group">
                  {/* Member Name & Code */}
                  <td className="py-3.5 pl-1">
                    <div className="font-semibold text-white group-hover:text-brand-300 transition-colors">
                      {m.fullName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <span>{m.memberCode}</span>
                      <span>•</span>
                      <span>{m.phone}</span>
                    </div>
                  </td>

                  {/* Risk Score Progress */}
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isHigh ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${m.riskScore}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-bold font-mono ${
                          isHigh ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      >
                        {m.riskScore}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          isHigh
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {m.riskLevel}
                      </span>
                    </div>
                  </td>

                  {/* Days Inactive */}
                  <td className="py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-medium">
                        {m.factors.daysSinceLastCheckIn} days
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">No check-in recorded</div>
                  </td>

                  {/* Frequency Drop */}
                  <td className="py-3.5">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                      <span className="font-semibold text-rose-400">
                        -{m.factors.frequencyDropPercentage}%
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      From {m.factors.fourWeekRollingAvg}/wk avg
                    </div>
                  </td>

                  {/* Payment / Streak Flags */}
                  <td className="py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {m.factors.isPaymentOverdue ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          <CreditCard className="w-3 h-3" /> Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Paid
                        </span>
                      )}

                      {m.factors.isRecentlyBrokenStreak && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30">
                          <Flame className="w-3 h-3 text-orange-400" /> Broken Streak
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Re-engagement Action */}
                  <td className="py-3.5 text-right pr-1">
                    <button
                      onClick={() => setActiveNudgeMember(m)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/15 hover:bg-brand-500 text-brand-300 hover:text-white border border-brand-500/30 text-xs font-medium transition-all shadow-sm group-hover:border-brand-500"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
                      <span>Send Nudge</span>
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
          <div className="glass-card max-w-md w-full rounded-2xl p-6 border border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveNudgeMember(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">WhatsApp Re-Engagement Nudge</h3>
                <p className="text-xs text-slate-400">Meta WhatsApp Business API Template</p>
              </div>
            </div>

            {/* Recipient info */}
            <div className="p-3 rounded-lg bg-surface-100 border border-white/5 mb-4 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Recipient:</span>
                <span className="font-semibold text-white">{activeNudgeMember.fullName}</span>
              </div>
              <div className="flex justify-between text-slate-400 mt-1">
                <span>Phone:</span>
                <span className="font-mono text-emerald-400">{activeNudgeMember.phone}</span>
              </div>
              <div className="flex justify-between text-slate-400 mt-1">
                <span>Risk Reason:</span>
                <span className="text-rose-400 font-medium">
                  {activeNudgeMember.factors.daysSinceLastCheckIn} days absent (Score: {activeNudgeMember.riskScore})
                </span>
              </div>
            </div>

            {/* WhatsApp Message Preview Bubble */}
            <div className="p-4 rounded-xl bg-[#0b241b] border border-emerald-500/20 text-xs text-emerald-100 leading-relaxed font-sans mb-5 shadow-inner">
              <p className="font-medium text-emerald-300 mb-1">
                Assalam-o-Alaikum {activeNudgeMember.fullName.split(' ')[0]} bhai! 👋
              </p>
              <p>
                We noticed you haven&apos;t visited <strong>Iron House Gym</strong> in the last{' '}
                {activeNudgeMember.factors.daysSinceLastCheckIn} days. Your fitness journey matters
                to us!
              </p>
              <p className="mt-2 text-emerald-200">
                Drop by today or tomorrow, and front desk will set you up with your personalized
                catch-up workout! 💪
              </p>
              <div className="text-[10px] text-emerald-400/60 text-right mt-2 font-mono">
                Category: UTILITY • Approved Template
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setActiveNudgeMember(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNudge}
                disabled={nudgeSent}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-white shadow-glow transition-all disabled:opacity-50"
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
