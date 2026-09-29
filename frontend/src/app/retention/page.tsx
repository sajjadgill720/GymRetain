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
          {/* Immediate Action Overview Banner (Clean, Minimalist SaaS) */}
          <div className="bg-[#161310] border border-[#2A2520] rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#26221E]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-[#D9534F]/15 text-[#D9534F] flex items-center justify-center border border-[#D9534F]/30 shadow-sm shadow-[#D9534F]/10">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <h2 className="text-base font-bold text-[#F7F5F2] tracking-tight">
                    Immediate Action Required
                  </h2>
                </div>
                <p className="text-xs text-[#A39E98] mt-1.5 max-w-2xl leading-relaxed">
                  These members haven&apos;t visited in over 12–16 days or missed renewal payments.
                  Reaching out via WhatsApp re-engages member habits and saves an estimated{' '}
                  <strong className="text-[#4E9F6E] font-semibold">PKR 35,000/mo</strong> in recurring revenue.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-[11px] font-bold text-[#D9534F] bg-[#D9534F]/15 px-3 py-1 rounded-full border border-[#D9534F]/30">
                  {highRisk.length} High Priority
                </span>
              </div>
            </div>

            {/* 3 Clean Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="p-4 rounded-xl bg-[#1C1814] border border-[#2A2520]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A39E98]">
                  High Risk (Critical)
                </span>
                <div className="text-2xl font-extrabold text-[#D9534F] font-mono mt-1">
                  {highRisk.length} <span className="text-xs font-normal text-[#A39E98]">members</span>
                </div>
                <p className="text-[10px] text-[#A39E98] mt-1.5">Absent &gt;14 days or overdue payment</p>
              </div>

              <div className="p-4 rounded-xl bg-[#1C1814] border border-[#2A2520]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A39E98]">
                  Moderate Attention
                </span>
                <div className="text-2xl font-extrabold text-[#E5A13B] font-mono mt-1">
                  {mediumRisk.length} <span className="text-xs font-normal text-[#A39E98]">members</span>
                </div>
                <p className="text-[10px] text-[#A39E98] mt-1.5">Noticeable visit frequency drop</p>
              </div>

              <div className="p-4 rounded-xl bg-[#1C1814] border border-[#2A2520]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A39E98]">
                  Estimated Retrievable Revenue
                </span>
                <div className="text-2xl font-extrabold text-[#4E9F6E] font-mono mt-1">
                  PKR 35,000<span className="text-xs font-normal text-[#A39E98]">/mo</span>
                </div>
                <p className="text-[10px] text-[#A39E98] mt-1.5">Recovered through proactive check-ins</p>
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
