'use client';

import React, { useState, useEffect } from 'react';
import { TopNavbar } from '../../components/TopNavbar';
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
    <div className="min-h-screen bg-[#111111] flex flex-col">
      <TopNavbar
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenCheckInModal={() => setIsCheckInOpen(true)}
      />

      <main className="flex-1 w-full min-h-screen flex flex-col overflow-x-hidden">
        {/* Page Context Ribbon */}
        <div className="border-b border-[#26221E] bg-[#161310]/50 py-4 px-4 sm:px-8">
          <div className="max-w-[1600px] mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F7F5F2]">
              Churn Prevention & Member Retention
            </h1>
            <p className="text-xs text-[#A39E98] mt-0.5">
              Proactive early warning system to stop silent gym dropouts before they stop paying
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
          {/* Rules Configuration & Weight Breakdown Card */}
          <div className="bg-[#161310] border border-[#2A2520] rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-6 border-b border-[#26221E] gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-[#BFA785]/15 text-[#BFA785] flex items-center justify-center border border-[#BFA785]/30 shadow-sm shadow-[#BFA785]/10">
                    <Sliders className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-[#F7F5F2] tracking-tight">
                    Rules-Based Churn Risk Weight Model
                  </h2>
                </div>
                <p className="text-xs text-[#A39E98] mt-1.5">
                  Tunable weighting formula from <code className="text-[#BFA785] font-mono bg-[#1C1814] px-1.5 py-0.5 rounded border border-[#2A2520]">risk-score.config.ts</code> calculating member engagement health.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[11px] text-[#A39E98] font-semibold uppercase tracking-wider">Scoring Scale</div>
                  <div className="text-xs font-bold text-[#F7F5F2] font-mono mt-0.5">0 (Safe) to 100 (Critical)</div>
                </div>
              </div>
            </div>

            {/* 4 Weights Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
              {/* Weight 1 */}
              <div className="p-4 rounded-xl bg-[#1C1814] border border-[#2A2520]">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#F7F5F2]">Days Since Last Visit</span>
                  <span className="font-mono text-[#4E9F6E] font-bold">35% Weight</span>
                </div>
                <div className="w-full bg-[#26221E] h-2 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-[#4E9F6E] h-full rounded-full" style={{ width: '35%' }} />
                </div>
                <p className="text-[10px] text-[#A39E98] mt-2">
                  Thresholds: &gt;3d (low), &gt;7d (moderate), &gt;14d (high), &gt;21d (critical)
                </p>
              </div>

              {/* Weight 2 */}
              <div className="p-4 rounded-xl bg-[#1C1814] border border-[#2A2520]">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#F7F5F2]">4-Week Frequency Drop</span>
                  <span className="font-mono text-[#4E9F6E] font-bold">35% Weight</span>
                </div>
                <div className="w-full bg-[#26221E] h-2 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-[#4E9F6E] h-full rounded-full" style={{ width: '35%' }} />
                </div>
                <p className="text-[10px] text-[#A39E98] mt-2">
                  Detects weekly visits falling &gt;30% (moderate), &gt;60% (severe), or 100% drop
                </p>
              </div>

              {/* Weight 3 */}
              <div className="p-4 rounded-xl bg-[#1C1814] border border-[#2A2520]">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#F7F5F2]">Payment Overdue Flag</span>
                  <span className="font-mono text-[#E5A13B] font-bold">15% Weight</span>
                </div>
                <div className="w-full bg-[#26221E] h-2 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-[#E5A13B] h-full rounded-full" style={{ width: '15%' }} />
                </div>
                <p className="text-[10px] text-[#A39E98] mt-2">
                  Triggers instant penalty when membership expires or payment is uncollected
                </p>
              </div>

              {/* Weight 4 */}
              <div className="p-4 rounded-xl bg-[#1C1814] border border-[#2A2520]">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-[#F7F5F2]">Recently Broken Streak</span>
                  <span className="font-mono text-[#BFA785] font-bold">15% Weight</span>
                </div>
                <div className="w-full bg-[#26221E] h-2 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-[#BFA785] h-full rounded-full" style={{ width: '15%' }} />
                </div>
                <p className="text-[10px] text-[#A39E98] mt-2">
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
