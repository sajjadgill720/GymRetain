'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { AtRiskMembersTable } from '../../components/AtRiskMembersTable';
import { api } from '../../lib/api';
import { MemberRiskDetails } from '../../types';
import { ArrowRight, ArrowsClockwise, ShieldCheck, AlertTriangle, Clock, CheckCircle2 } from '@/components/icons';

export default function RetentionPage() {
  const [members, setMembers] = useState<MemberRiskDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchRisk = useCallback(async () => {
    setLoading(true); setError('');
    try { setMembers(await api.getAtRiskMembers()); }
    catch { setError('We couldn’t load the follow-up queue. Please try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { fetchRisk(); }, [fetchRisk]);
  const urgent = members.filter(member => member.riskLevel === 'HIGH').length;
  const slipping = members.filter(member => member.riskLevel === 'MEDIUM').length;
  const overdue = members.filter(member => member.factors.isPaymentOverdue).length;

  return <AppLayout onRefreshData={fetchRisk}>
    <div className="max-w-[1480px] w-full mx-auto p-5 sm:p-8 lg:p-10 space-y-8 lg:space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="premium-eyebrow mb-4">Member experience / Retention</p>
          <h1 className="premium-title">A little attention goes a long way.</h1>
          <p className="text-sm text-content-secondary mt-4 max-w-xl leading-relaxed">Notice the change in a routine. Reach out at the right moment.<br className="hidden sm:block" /> Help your members find their momentum again.</p>
        </div>
        <button onClick={fetchRisk} disabled={loading} className="flex items-center gap-2.5 rounded-lg px-4 py-2.5 border border-surface-border bg-surface text-xs font-medium"><ArrowsClockwise className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />{loading ? 'Refreshing' : 'Refresh queue'}</button>
      </div>

      <div className="premium-panel overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 px-6 sm:px-8 py-6 bg-[var(--accent-brand-light)] border-b border-surface-border">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 shrink-0 rounded-full border border-[var(--border-hover)] flex items-center justify-center text-[var(--accent-brand)]"><ShieldCheck className="w-5 h-5" /></div>
            <div><p className="text-sm font-medium text-content-primary">{loading ? 'Finding the members who need you.' : urgent ? `${urgent} member${urgent === 1 ? '' : 's'} could use a personal check-in.` : 'A good routine starts with staying connected.'}</p><p className="text-xs text-content-secondary mt-1">A thoughtful conversation can make all the difference.</p></div>
          </div>
          <a href="#follow-up-queue" className="flex items-center gap-3 text-xs font-semibold text-[var(--accent-brand)] whitespace-nowrap">Review follow-ups <ArrowRight className="w-4 h-4" /></a>
        </div>
        <div className="retention-metrics grid grid-cols-3">
          {[
            { label: 'Priority follow-ups', value: urgent, detail: 'Members with a high retention risk', tone: 'danger', icon: AlertTriangle },
            { label: 'Changing routines', value: slipping, detail: 'Members whose attendance is slipping', tone: 'warning', icon: Clock },
            { label: 'Payments up to date', value: members.length - overdue, detail: 'Members in this queue without overdue fees', tone: 'success', icon: CheckCircle2 },
          ].map(metric => <div key={metric.label} data-tone={metric.tone} className="status-metric px-4 sm:px-8 py-6 sm:py-8">
            <div className="flex items-center justify-between"><p className="metric-label text-xs font-medium">{metric.label}</p><metric.icon aria-hidden="true" className="hidden sm:block w-4 h-4 shrink-0 status-text" /></div>
            <p className="metric-value text-4xl sm:text-[42px] font-medium tracking-[-0.05em] leading-none mt-5 tabular-nums">{loading ? '—' : String(metric.value).padStart(2, '0')}</p>
            <p className="metric-detail hidden sm:block text-xs mt-4">{metric.detail}</p>
          </div>)}
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-status-danger-text">{error}</p>}
      <section id="follow-up-queue" className="scroll-mt-24">
        <AtRiskMembersTable members={members} showFilters loading={loading} />
      </section>
      <p className="text-[11px] text-content-tertiary flex items-center gap-2 pb-3"><ShieldCheck className="w-3.5 h-3.5" />Built around better relationships. Risk signals are a guide for your team’s judgment.</p>
    </div>
  </AppLayout>;
}
