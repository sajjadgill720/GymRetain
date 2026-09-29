'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { AtRiskMembersTable } from '../../components/AtRiskMembersTable';
import { api } from '../../lib/api';
import { MemberRiskDetails } from '../../types';
import {
  AlertTriangle,
  TrendingDown,
  Clock,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function RetentionPage() {
  const [atRiskList, setAtRiskList] = useState<MemberRiskDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRisk = async () => {
    try {
      const list = await api.getAtRiskMembers();
      setAtRiskList(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisk();
  }, []);

  const highRisk = atRiskList.filter((m) => m.riskLevel === 'HIGH');
  const mediumRisk = atRiskList.filter((m) => m.riskLevel === 'MEDIUM');

  return (
    <AppLayout onRefreshData={fetchRisk}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* Page Context Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-zinc-800/60">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Churn Prevention & Member Retention
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {highRisk.length} High Risk Priority
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Automated early warning queue detecting silent gym dropouts before memberships expire.
            </p>
          </div>
        </div>

        {/* 3 Clean Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-lg bg-[#121215] border border-zinc-800 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              High Risk (Critical)
            </span>
            <div className="text-2xl font-semibold text-red-400 font-mono mt-1">
              {highRisk.length} <span className="text-xs font-normal text-zinc-400">members</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Absent &gt;14 days or overdue payment</p>
          </div>

          <div className="p-4 rounded-lg bg-[#121215] border border-zinc-800 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              Moderate Attention
            </span>
            <div className="text-2xl font-semibold text-amber-400 font-mono mt-1">
              {mediumRisk.length} <span className="text-xs font-normal text-zinc-400">members</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Noticeable 50%+ visit frequency drop</p>
          </div>

          <div className="p-4 rounded-lg bg-[#121215] border border-zinc-800 shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              Estimated At-Risk Revenue
            </span>
            <div className="text-2xl font-semibold text-emerald-400 font-mono mt-1">
              PKR 35,000<span className="text-xs font-normal text-zinc-400">/mo</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Saved via proactive WhatsApp re-engagement</p>
          </div>
        </div>

        {/* At Risk Table Component */}
        <AtRiskMembersTable members={atRiskList} showFilters={true} />
      </div>
    </AppLayout>
  );
}
