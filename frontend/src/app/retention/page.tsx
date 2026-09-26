'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { AtRiskMembersTable } from '../../components/AtRiskMembersTable';
import { QuickCheckInModal } from '../../components/QuickCheckInModal';
import { FrontDeskQrModal } from '../../components/FrontDeskQrModal';
import { api } from '../../lib/api';
import { MemberRiskDetails } from '../../types';
import {
  AlertTriangle,
  Flame,
  ShieldCheck,
  TrendingDown,
  Clock,
  Sparkles,
  Sliders,
  CheckCircle,
} from 'lucide-react';

export default function RetentionPage() {
  const [atRiskList, setAtRiskList] = useState<MemberRiskDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        const list = await api.getAtRiskMembers();
        setAtRiskList(list);
      } finally {
        setLoading(false);
      }
    };
    fetchRisk();
  }, []);

  const highRisk = atRiskList.filter((m) => m.riskLevel === 'HIGH');
  const mediumRisk = atRiskList.filter((m) => m.riskLevel === 'MEDIUM');

  return (
    <div className="min-h-screen bg-[#090d16] flex">
      <Sidebar
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenCheckInModal={() => setIsCheckInOpen(true)}
      />

      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header
          title="Churn Prevention & Member Retention"
          subtitle="Proactive early warning system to stop silent gym dropouts before they stop paying"
          onOpenCheckInModal={() => setIsCheckInOpen(true)}
        />

        <div className="p-8 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
          {/* Rules Configuration & Weight Breakdown Card */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-6 border-b border-white/5 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
                    <Sliders className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Rules-Based Churn Risk Weight Model
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Tunable weighting formula from <code className="text-emerald-400 font-mono">risk-score.config.ts</code> calculating member engagement health.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[11px] text-slate-400 font-medium">Scoring Scale</div>
                  <div className="text-xs font-bold text-white font-mono">0 (Safe) to 100 (Critical)</div>
                </div>
              </div>
            </div>

            {/* 4 Weights Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
              {/* Weight 1 */}
              <div className="p-4 rounded-xl bg-surface-100/60 border border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Days Since Last Visit</span>
                  <span className="font-mono text-emerald-400 font-bold">35% Weight</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '35%' }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Thresholds: &gt;3d (low), &gt;7d (moderate), &gt;14d (high), &gt;21d (critical)
                </p>
              </div>

              {/* Weight 2 */}
              <div className="p-4 rounded-xl bg-surface-100/60 border border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">4-Week Frequency Drop</span>
                  <span className="font-mono text-emerald-400 font-bold">35% Weight</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '35%' }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Detects weekly visits falling &gt;30% (moderate), &gt;60% (severe), or 100% drop
                </p>
              </div>

              {/* Weight 3 */}
              <div className="p-4 rounded-xl bg-surface-100/60 border border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Payment Overdue Flag</span>
                  <span className="font-mono text-amber-400 font-bold">15% Weight</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '15%' }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Triggers instant penalty when membership expires or payment is uncollected
                </p>
              </div>

              {/* Weight 4 */}
              <div className="p-4 rounded-xl bg-surface-100/60 border border-white/5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Recently Broken Streak</span>
                  <span className="font-mono text-orange-400 font-bold">15% Weight</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-orange-500 h-full rounded-full" style={{ width: '15%' }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Flags psychological momentum loss when a streak breaks within past 7 days
                </p>
              </div>
            </div>
          </div>

          {/* At Risk Table Component */}
          <AtRiskMembersTable members={atRiskList} showFilters={true} />
        </div>
      </main>

      <QuickCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
      />

      <FrontDeskQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
