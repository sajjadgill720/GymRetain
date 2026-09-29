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
    <div className="bg-[#121215] border border-zinc-800 rounded-lg p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-3 border-b border-zinc-800/80 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Member Churn Risk Detection
            </h2>
            <span className="text-[11px] font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
              Follow-Up Queue
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Members exhibiting silent churn indicators: prolonged absence, frequency collapse, or overdue payments.
          </p>
        </div>

        {showFilters && (
          <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-md border border-zinc-800">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all btn-shadow ${
                selectedFilter === 'ALL'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({members.length})
            </button>
            <button
              onClick={() => setSelectedFilter('HIGH')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all btn-shadow ${
                selectedFilter === 'HIGH'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/25 shadow-sm'
                  : 'text-zinc-400 hover:text-red-400'
              }`}
            >
              High ({members.filter((m) => m.riskLevel === 'HIGH').length})
            </button>
            <button
              onClick={() => setSelectedFilter('MEDIUM')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all btn-shadow ${
                selectedFilter === 'MEDIUM'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 shadow-sm'
                  : 'text-zinc-400 hover:text-amber-400'
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
              className="p-3.5 rounded-md bg-zinc-900/60 border border-zinc-800 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-xs text-zinc-100">{m.fullName}</div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    {m.memberCode} • {m.phone}
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-medium uppercase shrink-0 ${
                    isHigh
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {m.riskLevel} ({m.riskScore})
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-1.5 text-red-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{m.factors.daysSinceLastCheckIn}d inactive</span>
                </div>
                {m.factors.isPaymentOverdue ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
                    Payment Overdue
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500 font-mono">
                    -{m.factors.frequencyDropPercentage}% visits
                  </span>
                )}
              </div>

              <button
                onClick={() => setActiveNudgeMember(m)}
                className="w-full py-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 border border-zinc-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-all shadow-sm btn-shadow"
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
            <tr className="border-b border-zinc-800 text-zinc-500 text-[11px] uppercase tracking-wider font-medium">
              <th className="pb-2.5 pl-1">Member</th>
              <th className="pb-2.5">Risk Score</th>
              <th className="pb-2.5">Inactivity</th>
              <th className="pb-2.5">Frequency Drop</th>
              <th className="pb-2.5">Payment / Streak</th>
              <th className="pb-2.5 text-right pr-1">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {displayList.map((m) => {
              const isHigh = m.riskLevel === 'HIGH';

              return (
                <tr key={m.memberId} className="hover:bg-zinc-900/40 transition-colors">
                  {/* Member Name & Code */}
                  <td className="py-2.5 pl-1">
                    <div className="font-medium text-zinc-200">
                      {m.fullName}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5 mt-0.5">
                      <span>{m.memberCode}</span>
                      <span>•</span>
                      <span>{m.phone}</span>
                    </div>
                  </td>

                  {/* Risk Score Progress */}
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isHigh ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${m.riskScore}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-mono font-medium ${
                          isHigh ? 'text-red-400' : 'text-amber-400'
                        }`}
                      >
                        {m.riskScore}
                      </span>
                    </div>
                  </td>

                  {/* Days Inactive */}
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{m.factors.daysSinceLastCheckIn} days</span>
                    </div>
                  </td>

                  {/* Frequency Drop */}
                  <td className="py-2.5">
                    <div className="flex items-center gap-1 text-red-400 font-mono">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      <span>-{m.factors.frequencyDropPercentage}%</span>
                    </div>
                  </td>

                  {/* Payment / Streak Flags */}
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5">
                      {m.factors.isPaymentOverdue ? (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                          Overdue
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Paid
                        </span>
                      )}

                      {m.factors.isRecentlyBrokenStreak && (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Streak Lost
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Re-engagement Action */}
                  <td className="py-2.5 text-right pr-1">
                    <button
                      onClick={() => setActiveNudgeMember(m)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 border border-zinc-800 text-xs font-medium transition-all shadow-sm btn-shadow"
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
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161310] max-w-md w-full rounded-2xl p-6 border border-[#2A2520] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveNudgeMember(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-[#A39E98] hover:text-white hover:bg-[#26221E] shadow-sm btn-shadow"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#4E9F6E]/15 text-[#4E9F6E] flex items-center justify-center border border-[#4E9F6E]/30 shadow-sm shadow-[#4E9F6E]/20">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F7F5F2]">WhatsApp Re-Engagement Nudge</h3>
                <p className="text-xs text-[#A39E98]">Direct WhatsApp Outreach</p>
              </div>
            </div>

            {/* Recipient info */}
            <div className="p-3.5 rounded-xl bg-[#1C1814] border border-[#2A2520] mb-4 text-xs space-y-1.5">
              <div className="flex justify-between text-[#A39E98]">
                <span>Recipient:</span>
                <span className="font-semibold text-[#F7F5F2]">{activeNudgeMember.fullName}</span>
              </div>
              <div className="flex justify-between text-[#A39E98]">
                <span>Phone:</span>
                <span className="font-mono text-[#4E9F6E]">{activeNudgeMember.phone}</span>
              </div>
              <div className="flex justify-between text-[#A39E98]">
                <span>Risk Reason:</span>
                <span className="text-[#D9534F] font-bold">
                  {activeNudgeMember.factors.daysSinceLastCheckIn} days absent (Score: {activeNudgeMember.riskScore})
                </span>
              </div>
            </div>

            {/* WhatsApp Message Preview Bubble */}
            <div className="p-4 rounded-xl bg-[#14241B] border border-[#4E9F6E]/30 text-xs text-[#EAF5EF] leading-relaxed font-sans mb-5 shadow-inner">
              <p className="font-semibold text-[#4E9F6E] mb-1">
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
              <div className="text-[10px] text-[#4E9F6E]/70 text-right mt-2 font-mono">
                Automated Member Retention Message
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setActiveNudgeMember(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A39E98] hover:text-white hover:bg-[#26221E] transition-all btn-shadow"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNudge}
                disabled={nudgeSent}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4E9F6E] hover:bg-[#41885C] text-xs font-bold text-white shadow-md shadow-[#4E9F6E]/30 hover:shadow-lg hover:shadow-[#4E9F6E]/40 btn-shadow transition-all disabled:opacity-50"
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
