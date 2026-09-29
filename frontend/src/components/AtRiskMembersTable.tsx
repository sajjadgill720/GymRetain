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
    <div className="bg-[#161310] border border-[#2A2520] rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 gap-3 border-b border-[#26221E] mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#F7F5F2] tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D9534F]" />
              Member Churn Risk Detection
            </h2>
            <span className="text-[11px] font-bold text-[#D9534F] bg-[#D9534F]/10 px-2.5 py-0.5 rounded-full border border-[#D9534F]/25">
              Rules-Based AI Engine
            </span>
          </div>
          <p className="text-xs text-[#A39E98] mt-1">
            Members exhibiting silent churn indicators: prolonged absence, frequency collapse, or overdue payments.
          </p>
        </div>

        {showFilters && (
          <div className="flex items-center gap-1.5 bg-[#1C1814] p-1 rounded-xl border border-[#2A2520] shadow-inner">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm btn-shadow ${
                selectedFilter === 'ALL'
                  ? 'bg-[#26221E] text-[#F7F5F2] border border-[#38312A]'
                  : 'text-[#A39E98] hover:text-[#F7F5F2]'
              }`}
            >
              All ({members.length})
            </button>
            <button
              onClick={() => setSelectedFilter('HIGH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm btn-shadow ${
                selectedFilter === 'HIGH'
                  ? 'bg-[#D9534F]/20 text-[#D9534F] border border-[#D9534F]/35 shadow-[#D9534F]/20'
                  : 'text-[#A39E98] hover:text-[#D9534F]'
              }`}
            >
              High ({members.filter((m) => m.riskLevel === 'HIGH').length})
            </button>
            <button
              onClick={() => setSelectedFilter('MEDIUM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm btn-shadow ${
                selectedFilter === 'MEDIUM'
                  ? 'bg-[#E5A13B]/20 text-[#E5A13B] border border-[#E5A13B]/35 shadow-[#E5A13B]/20'
                  : 'text-[#A39E98] hover:text-[#E5A13B]'
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
              className="p-4 rounded-xl bg-[#1C1814] border border-[#2A2520] hover:border-[#BFA785]/30 space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-sm text-[#F7F5F2]">{m.fullName}</div>
                  <div className="text-[11px] text-[#A39E98] font-mono mt-0.5">
                    {m.memberCode} • {m.phone}
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                    isHigh
                      ? 'bg-[#D9534F]/20 text-[#D9534F] border border-[#D9534F]/30'
                      : 'bg-[#E5A13B]/20 text-[#E5A13B] border border-[#E5A13B]/30'
                  }`}
                >
                  {m.riskLevel} ({m.riskScore})
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-[#A39E98] pt-2 border-t border-[#26221E]">
                <div className="flex items-center gap-1.5 text-[#D9534F] font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{m.factors.daysSinceLastCheckIn}d inactive</span>
                </div>
                {m.factors.isPaymentOverdue ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D9534F]/20 text-[#D9534F] border border-[#D9534F]/30 font-bold">
                    Payment Overdue
                  </span>
                ) : (
                  <span className="text-[10px] text-[#A39E98]">
                    -{m.factors.frequencyDropPercentage}% visits
                  </span>
                )}
              </div>

              <button
                onClick={() => setActiveNudgeMember(m)}
                className="w-full py-2.5 rounded-xl bg-[#1C1814] hover:bg-[#26221E] text-[#4E9F6E] hover:text-white border border-[#4E9F6E]/40 hover:border-[#4E9F6E] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm btn-shadow"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#4E9F6E]" />
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
            <tr className="border-b border-[#26221E] text-[#A39E98] text-[11px] uppercase tracking-wider font-semibold">
              <th className="pb-3 pl-1">Member</th>
              <th className="pb-3">Risk Score</th>
              <th className="pb-3">Inactivity</th>
              <th className="pb-3">Frequency Drop</th>
              <th className="pb-3">Payment / Streak</th>
              <th className="pb-3 text-right pr-1">Automated Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#26221E]">
            {displayList.map((m) => {
              const isHigh = m.riskLevel === 'HIGH';

              return (
                <tr key={m.memberId} className="hover:bg-[#1C1814]/60 transition-colors group">
                  {/* Member Name & Code */}
                  <td className="py-3.5 pl-1">
                    <div className="font-semibold text-[#F7F5F2] group-hover:text-[#BFA785] transition-colors">
                      {m.fullName}
                    </div>
                    <div className="text-[11px] text-[#A39E98] font-mono flex items-center gap-1.5 mt-0.5">
                      <span>{m.memberCode}</span>
                      <span>•</span>
                      <span>{m.phone}</span>
                    </div>
                  </td>

                  {/* Risk Score Progress */}
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-2 rounded-full bg-[#26221E] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isHigh ? 'bg-[#D9534F]' : 'bg-[#E5A13B]'
                          }`}
                          style={{ width: `${m.riskScore}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-bold font-mono ${
                          isHigh ? 'text-[#D9534F]' : 'text-[#E5A13B]'
                        }`}
                      >
                        {m.riskScore}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                          isHigh
                            ? 'bg-[#D9534F]/20 text-[#D9534F] border border-[#D9534F]/30'
                            : 'bg-[#E5A13B]/20 text-[#E5A13B] border border-[#E5A13B]/30'
                        }`}
                      >
                        {m.riskLevel}
                      </span>
                    </div>
                  </td>

                  {/* Days Inactive */}
                  <td className="py-3.5">
                    <div className="flex items-center gap-1.5 text-[#F7F5F2]">
                      <Clock className="w-3.5 h-3.5 text-[#A39E98]" />
                      <span className="font-medium">
                        {m.factors.daysSinceLastCheckIn} days
                      </span>
                    </div>
                    <div className="text-[10px] text-[#6B6661] mt-0.5">No check-in recorded</div>
                  </td>

                  {/* Frequency Drop */}
                  <td className="py-3.5">
                    <div className="flex items-center gap-1.5 text-[#D9534F]">
                      <ArrowDownRight className="w-3.5 h-3.5 text-[#D9534F]" />
                      <span className="font-semibold text-[#D9534F]">
                        -{m.factors.frequencyDropPercentage}%
                      </span>
                    </div>
                    <div className="text-[10px] text-[#A39E98] mt-0.5">
                      From {m.factors.fourWeekRollingAvg}/wk avg
                    </div>
                  </td>

                  {/* Payment / Streak Flags */}
                  <td className="py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {m.factors.isPaymentOverdue ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9534F]/15 text-[#D9534F] border border-[#D9534F]/30">
                          <CreditCard className="w-3 h-3" /> Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#4E9F6E]/15 text-[#4E9F6E] border border-[#4E9F6E]/30">
                          Paid
                        </span>
                      )}

                      {m.factors.isRecentlyBrokenStreak && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E5A13B]/15 text-[#E5A13B] border border-[#E5A13B]/30">
                          <Flame className="w-3 h-3 text-[#E5A13B]" /> Broken Streak
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Re-engagement Action */}
                  <td className="py-3.5 text-right pr-1">
                    <button
                      onClick={() => setActiveNudgeMember(m)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1814] hover:bg-[#26221E] text-[#4E9F6E] hover:text-white border border-[#4E9F6E]/30 hover:border-[#4E9F6E] text-xs font-semibold transition-all shadow-sm btn-shadow"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[#4E9F6E]" />
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
                <p className="text-xs text-[#A39E98]">Meta WhatsApp Business API Template</p>
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
                Category: UTILITY • Approved Template
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
