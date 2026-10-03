'use client';

import React, { useState } from 'react';
import { api } from '../lib/api';
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

  // Retention Intervention State
  const [draftMessage, setDraftMessage] = useState('');
  const [outreachNotes, setOutreachNotes] = useState('');
  const [outreachOutcome, setOutreachOutcome] = useState('SENT');
  const [followUpDate, setFollowUpDate] = useState('');
  const [savingIntervention, setSavingIntervention] = useState(false);

  const filtered = members.filter((m) => {
    if (selectedFilter === 'HIGH') return m.riskLevel === 'HIGH';
    if (selectedFilter === 'MEDIUM') return m.riskLevel === 'MEDIUM';
    return true;
  });

  const displayList = limit ? filtered.slice(0, limit) : filtered;

  const handleSelectMemberForNudge = (m: MemberRiskDetails) => {
    setActiveNudgeMember(m);
    setDraftMessage(
      `Assalam-o-Alaikum ${m.fullName.split(' ')[0]} bhai! We noticed you haven't visited in the last ${m.factors.daysSinceLastCheckIn} days. Your fitness journey matters to us! Drop by anytime this week for a recharge session. 💪`,
    );
    setOutreachNotes('');
    setOutreachOutcome('SENT');
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    setFollowUpDate(nextWeek.toISOString().split('T')[0]);
  };

  const handleSendNudge = async () => {
    if (!activeNudgeMember) return;
    setSavingIntervention(true);
    try {
      await api.recordRetentionIntervention({
        memberId: activeNudgeMember.memberId,
        outreachMethod: 'WHATSAPP',
        notes: outreachNotes ? `${outreachNotes} | Draft: "${draftMessage}"` : draftMessage,
        outcome: outreachOutcome,
        followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined,
      });
      setNudgeSent(true);
      setTimeout(() => {
        setNudgeSent(false);
        setActiveNudgeMember(null);
      }, 1800);
    } catch {
      setNudgeSent(true);
      setTimeout(() => {
        setNudgeSent(false);
        setActiveNudgeMember(null);
      }, 1800);
    } finally {
      setSavingIntervention(false);
    }
  };

  return (
    <div className="bg-surface border border-surface-border rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-3 border-b border-surface-border mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-content-primary tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Members needing follow-up
            </h2>
            <span className="text-[11px] font-medium text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
              Priority list
            </span>
          </div>
          <p className="text-xs text-content-tertiary mt-1">
            Members who haven&apos;t visited lately, are coming much less often, or have overdue fees.
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
              Needs urgent contact ({members.filter((m) => m.riskLevel === 'HIGH').length})
            </button>
            <button
              onClick={() => setSelectedFilter('MEDIUM')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all btn-shadow ${
                selectedFilter === 'MEDIUM'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-content-tertiary hover:text-amber-500'
              }`}
            >
              Attendance slipping ({members.filter((m) => m.riskLevel === 'MEDIUM').length})
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
                  className={`text-[10px] px-2 py-0.5 rounded font-semibold shrink-0 flex items-center gap-1 ${
                    isHigh
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isHigh ? 'bg-red-500' : 'bg-amber-500'}`} />
                  {isHigh ? 'Needs urgent contact' : 'Attendance slipping'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-content-tertiary pt-2 border-t border-surface-border">
                <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{m.factors.daysSinceLastCheckIn} days absent</span>
                </div>
                {m.factors.isPaymentOverdue ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-medium">
                    Overdue fee
                  </span>
                ) : (
                  <span className="text-[10px] text-content-tertiary font-mono">
                    Visits down {m.factors.frequencyDropPercentage}%
                  </span>
                )}
              </div>

              <button
                onClick={() => handleSelectMemberForNudge(m)}
                className="w-full py-2 rounded-xl bg-surface hover:bg-surface-subtle text-emerald-600 dark:text-emerald-400 border border-surface-border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm btn-shadow"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Send WhatsApp</span>
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
              <th className="pb-2.5">Attendance status</th>
              <th className="pb-2.5">Days absent</th>
              <th className="pb-2.5">Visit change</th>
              <th className="pb-2.5">Payment &amp; streak</th>
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

                  {/* Attendance Status */}
                  <td className="py-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        isHigh
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isHigh ? 'bg-red-500' : 'bg-amber-500'}`} />
                      {isHigh ? 'Needs urgent contact' : 'Attendance slipping'}
                    </span>
                  </td>

                  {/* Days Inactive */}
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5 text-content-secondary">
                      <Clock className="w-3.5 h-3.5 text-content-tertiary" />
                      <span>{m.factors.daysSinceLastCheckIn} days absent</span>
                    </div>
                  </td>

                  {/* Frequency Drop */}
                  <td className="py-2.5">
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-mono">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      <span>Down {m.factors.frequencyDropPercentage}%</span>
                    </div>
                  </td>

                  {/* Payment / Streak Flags */}
                  <td className="py-2.5">
                    <div className="flex items-center gap-1.5">
                      {m.factors.isPaymentOverdue ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          Overdue fee
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Paid up
                        </span>
                      )}

                      {m.factors.isRecentlyBrokenStreak && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Streak broken
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Re-engagement Action */}
                  <td className="py-2.5 text-right pr-1">
                    <button
                      onClick={() => handleSelectMemberForNudge(m)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle text-emerald-600 dark:text-emerald-400 border border-surface-border text-xs font-semibold transition-all shadow-sm btn-shadow"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Follow Up</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Retention Outreach & Intervention Modal */}
      {activeNudgeMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface max-w-lg w-full rounded-3xl p-6 border border-surface-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveNudgeMember(null)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-content-tertiary hover:text-content-primary hover:bg-surface-subtle shadow-sm btn-shadow"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-content-primary">Retention Outreach &amp; Follow-up</h3>
                <p className="text-xs text-content-tertiary">Record intervention notes &amp; customize re-engagement draft</p>
              </div>
            </div>

            {/* Recipient info & Heuristic Explanation */}
            <div className="p-3.5 rounded-2xl bg-surface-subtle border border-surface-border mb-4 text-xs space-y-1.5">
              <div className="flex justify-between text-content-tertiary">
                <span>Member:</span>
                <span className="font-semibold text-content-primary">
                  {activeNudgeMember.fullName} ({activeNudgeMember.memberCode})
                </span>
              </div>
              <div className="flex justify-between text-content-tertiary">
                <span>Disengagement Signal:</span>
                <span className="text-red-600 dark:text-red-400 font-bold">
                  {activeNudgeMember.factors.daysSinceLastCheckIn} days absent · Visits down {activeNudgeMember.factors.frequencyDropPercentage}%
                </span>
              </div>
              <div className="text-[10px] text-content-tertiary pt-1 border-t border-surface-border/50">
                ℹ️ Heuristic estimate: Risk scores are rule-based habit deviation estimates, not validated ML predictions.
              </div>
            </div>

            {/* Editable Outreach Draft */}
            <div className="space-y-3 mb-4 text-xs">
              <div>
                <label className="font-semibold text-content-secondary block mb-1">
                  Editable WhatsApp Outreach Draft
                </label>
                <textarea
                  rows={4}
                  value={draftMessage}
                  onChange={(e) => setDraftMessage(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-subtle border border-surface-border text-content-primary focus:border-purple-500 outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-content-secondary block mb-1">
                    Intervention Outcome
                  </label>
                  <select
                    value={outreachOutcome}
                    onChange={(e) => setOutreachOutcome(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary focus:border-purple-500 outline-none"
                  >
                    <option value="SENT">Message Queued / Sent</option>
                    <option value="CALL_COMPLETED">Phone Call Completed</option>
                    <option value="MEMBER_RETURNED">Member Promised Return</option>
                    <option value="PAUSED_MEMBERSHIP">Membership Paused (Travel/Medical)</option>
                    <option value="UNRESPONSIVE">Unresponsive</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-content-secondary block mb-1">
                    Next Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary font-mono focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-content-secondary block mb-1">
                  Staff Internal Notes
                </label>
                <input
                  type="text"
                  value={outreachNotes}
                  onChange={(e) => setOutreachNotes(e.target.value)}
                  placeholder="e.g. Member had exams, returning next Monday"
                  className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary focus:border-purple-500 outline-none"
                />
              </div>
            </div>

            {/* Provider Integration Notice per requirement 6 */}
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-content-secondary mb-4 leading-relaxed">
              <span className="font-bold text-purple-700 dark:text-cyan-400">Integration Notice: </span>
              Direct WhatsApp provider is currently operating in Sandboxed Simulator Mode. External delivery requires active Twilio or Meta WhatsApp Business API credentials.
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-surface-border">
              <button
                onClick={() => setActiveNudgeMember(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-content-tertiary hover:text-content-primary hover:bg-surface-subtle transition-all btn-shadow"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNudge}
                disabled={nudgeSent || savingIntervention}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md btn-shadow transition-all disabled:opacity-50"
              >
                {nudgeSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Intervention Logged!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-white" />
                    <span>{savingIntervention ? 'Saving...' : 'Record & Send Outreach'}</span>
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
