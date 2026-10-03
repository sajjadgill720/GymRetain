'use client';

import React, { useState } from 'react';
import {
  X,
  Warning,
  PaperPlaneTilt,
  CheckCircle,
  ChatCircleDots,
  Clock,
  User,
  CalendarBlank,
  Sparkle,
  ArrowRight,
  ShieldCheck,
  Phone,
} from '@/components/icons';
import { api } from '../../lib/api';

export interface InterventionMember {
  memberId: string;
  memberCode: string;
  fullName: string;
  phone: string;
  planName: string;
  planPrice: number;
  riskScore: number;
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  daysInactive: number;
  usualCadence: string;
  recentCadence: string;
  disengagementReason: string;
  assignedStaff: string;
  status: 'NEEDS_OUTREACH' | 'CONTACTED' | 'SCHEDULED' | 'RESOLVED';
  lastAction?: string;
}

interface InterventionModalProps {
  member: InterventionMember | null;
  isOpen: boolean;
  onClose: () => void;
  onInterventionComplete: (memberId: string, newStatus: InterventionMember['status'], actionSummary: string) => void;
}

export const InterventionModal: React.FC<InterventionModalProps> = ({
  member,
  isOpen,
  onClose,
  onInterventionComplete,
}) => {
  if (!isOpen || !member) return null;

  const [channel, setChannel] = useState<'WHATSAPP' | 'PHONE' | 'DESK_NOTE'>('WHATSAPP');
  const [assignedStaff, setAssignedStaff] = useState(member.assignedStaff || 'Coach Bilal');
  const [followUpDate, setFollowUpDate] = useState(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<InterventionMember['status']>('CONTACTED');

  // Generate editable message draft based on habit context
  const defaultDraft = `Assalamu Alaikum ${member.fullName.split(' ')[0]}! We noticed you haven't been able to make your usual workouts (${member.usualCadence}) for the last ${member.daysInactive} days. Everything okay? We've reserved a free catch-up session with ${assignedStaff} whenever you're ready to get back on track!`;

  const [messageDraft, setMessageDraft] = useState(defaultDraft);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSend = async () => {
    setIsSubmitting(true);
    try {
      if (channel === 'WHATSAPP') {
        await api.simulateWhatsAppMessage({
          memberId: member.memberId,
          messageType: 'MISSED_VISIT',
        });
      }
      const summaryText = `${channel === 'WHATSAPP' ? 'WhatsApp outreach sent' : channel === 'PHONE' ? 'Phone call logged' : 'Front desk note logged'} by ${assignedStaff}`;
      onInterventionComplete(member.memberId, status, summaryText);
      setIsConfirming(false);
      onClose();
    } catch {
      onInterventionComplete(member.memberId, status, `Follow-up logged by ${assignedStaff}`);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="glass-panel-elevated rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-cyan-500/20 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                <Warning className="w-4 h-4" weight="fill" />
              </span>
              <h3 className="text-lg font-extrabold text-content-primary tracking-tight font-sans">
                Intervention &amp; Outreach Workflow
              </h3>
            </div>
            <p className="text-xs text-content-secondary">
              Review behavioral evidence, customize personalized outreach, and log staff retention follow-up.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-surface-subtle text-content-tertiary hover:text-content-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: Understand the Behavioral Evidence */}
        <div className="p-4 rounded-2xl bg-surface-subtle/80 border border-surface-border space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold text-content-primary">
                {member.fullName} ({member.memberCode})
              </div>
              <div className="text-[11px] text-content-tertiary font-mono">
                {member.phone} · {member.planName} (₨{member.planPrice.toLocaleString()}/mo)
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-red-500/10 text-red-500 border border-red-500/20">
              {member.riskScore}% Churn Risk
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-surface-border text-xs">
            <div className="p-2.5 rounded-xl bg-surface/80 border border-surface-border">
              <span className="text-[10px] text-content-tertiary font-bold uppercase block">
                Absent Period
              </span>
              <span className="font-extrabold text-red-500 text-sm">
                {member.daysInactive} Consecutive Days
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-surface/80 border border-surface-border">
              <span className="text-[10px] text-content-tertiary font-bold uppercase block">
                Usual Routine Cadence
              </span>
              <span className="font-bold text-content-primary">
                {member.usualCadence}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-surface/80 border border-surface-border">
              <span className="text-[10px] text-content-tertiary font-bold uppercase block">
                Recent 14D Velocity
              </span>
              <span className="font-bold text-amber-500">
                {member.recentCadence}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
            <span className="font-bold text-red-600 dark:text-red-400 block mb-0.5">
              Primary Disengagement Signal:
            </span>
            <span className="text-content-secondary leading-snug">
              {member.disengagementReason}
            </span>
          </div>
        </div>

        {/* STEP 2: Configure Outreach Channels & Staff */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-content-tertiary uppercase tracking-wider">
            Step 2: Prepare Outreach Plan
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setChannel('WHATSAPP')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 btn-shadow ${
                channel === 'WHATSAPP'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'bg-surface hover:bg-surface-subtle border-surface-border text-content-secondary'
              }`}
            >
              <ChatCircleDots className="w-4 h-4" weight="duotone" />
              <span>WhatsApp Nudge</span>
            </button>

            <button
              type="button"
              onClick={() => setChannel('PHONE')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 btn-shadow ${
                channel === 'PHONE'
                  ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-cyan-400'
                  : 'bg-surface hover:bg-surface-subtle border-surface-border text-content-secondary'
              }`}
            >
              <Phone className="w-4 h-4" weight="duotone" />
              <span>Staff Phone Call</span>
            </button>

            <button
              type="button"
              onClick={() => setChannel('DESK_NOTE')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 btn-shadow ${
                channel === 'DESK_NOTE'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'bg-surface hover:bg-surface-subtle border-surface-border text-content-secondary'
              }`}
            >
              <User className="w-4 h-4" weight="duotone" />
              <span>Front Desk Flag</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-content-secondary block mb-1">
                Assign Staff Handler
              </label>
              <select
                value={assignedStaff}
                onChange={(e) => setAssignedStaff(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-content-primary outline-none"
              >
                <option value="Coach Bilal">Coach Bilal (Head Trainer)</option>
                <option value="Coach Sarah">Coach Sarah (Retention Lead)</option>
                <option value="Front Desk Team">Front Desk Team</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-content-secondary block mb-1">
                Next Follow-Up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface border border-surface-border text-content-primary outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* STEP 3: Editable Message Draft */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-content-tertiary uppercase tracking-wider">
              Step 3: Tailored Outreach Draft (Editable)
            </label>
            <span className="text-[10px] text-content-tertiary">
              Requires confirmation before sending
            </span>
          </div>

          <textarea
            value={messageDraft}
            onChange={(e) => setMessageDraft(e.target.value)}
            rows={4}
            className="w-full p-3.5 rounded-2xl bg-surface border border-surface-border text-xs text-content-primary outline-none focus:border-cyan-400 leading-relaxed font-sans"
            placeholder="Customize your message..."
          />
        </div>

        {/* STEP 4: Confirmation & Actions */}
        <div className="pt-3 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-content-tertiary">
            Status will update to: <span className="font-bold text-content-primary">Contacted &amp; Tracked</span>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-semibold text-content-primary transition-all btn-shadow"
            >
              Cancel
            </button>

            {!isConfirming ? (
              <button
                type="button"
                onClick={() => setIsConfirming(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all btn-shadow flex items-center gap-2"
              >
                <PaperPlaneTilt className="w-4 h-4" weight="bold" />
                <span>Review &amp; Send Outreach</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  className="px-3 py-2 rounded-xl bg-surface-subtle text-content-tertiary hover:text-content-primary text-xs font-semibold"
                >
                  Edit More
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all btn-shadow flex items-center gap-1.5 shadow-lg shadow-emerald-500/25"
                >
                  <CheckCircle className="w-4 h-4" weight="fill" />
                  <span>{isSubmitting ? 'Sending...' : 'Confirm & Dispatch'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
