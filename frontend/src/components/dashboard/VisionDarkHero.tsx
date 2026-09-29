'use client';

import React from 'react';
import { Sparkles, TrendingUp, UserCheck, DollarSign, Award } from 'lucide-react';
import { DashboardSummary } from '../../types';

interface VisionDarkHeroProps {
  summary?: DashboardSummary | null;
}

export const VisionDarkHero: React.FC<VisionDarkHeroProps> = ({ summary }) => {
  const activeMembers = summary?.kpis?.activeMembers ?? 142;
  const highRiskCount = summary?.kpis?.highRiskCount ?? 6;
  const todayVisits = summary?.kpis?.todayCheckIns ?? 38;
  const revenue = activeMembers * 3144;

  return (
    <div className="hidden dark:block mb-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Hero Card with 3D Glossy Dark Sphere (Matching Image 2 Vision) */}
        <div className="lg:col-span-8 p-6 sm:p-7 rounded-3xl bg-[#11141C] border border-[#1E2433] relative overflow-hidden flex flex-col justify-between shadow-2xl">
          <div className="relative z-10">
            <span className="text-xs font-semibold text-zinc-400 block mb-1">
              Dashboard Overview
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Hello Bilal
              </h2>
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-md">
              Your member retention loop is active. {highRiskCount} at-risk members require attention before weekend churn.
            </p>
          </div>

          {/* 3D Glossy Dark Orb (Matching Image 2 Vision) */}
          <div className="absolute right-6 -top-4 w-32 h-32 sm:w-44 sm:h-44 rounded-full vision-dark-orb pointer-events-none opacity-90 hidden sm:block animate-pulse-glow" />

          {/* Dual Metrics Row inside Hero Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 relative z-10">
            {/* Metric 1: Total Revenue */}
            <div className="p-4 rounded-2xl bg-[#161B26] border border-[#232B3E] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                  Total Revenue
                </span>
                <div className="text-xl font-extrabold text-white font-sans">₨446,500</div>
                <span className="text-[10px] text-emerald-400 font-bold">+18.4% MoM</span>
              </div>
            </div>

            {/* Metric 2: Total Check-Ins */}
            <div className="p-4 rounded-2xl bg-[#161B26] border border-[#232B3E] flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                  Total Check-Ins
                </span>
                <div className="text-xl font-extrabold text-white font-sans">2,840 Visits</div>
                <span className="text-[10px] text-cyan-400 font-bold">94.6 Day Avg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Circular Retention Goal Ring (Matching Image 2 Vision Circular Progress) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-[#11141C] border border-[#1E2433] flex flex-col justify-between items-center text-center shadow-2xl">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300">Retention Goal</span>
            <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full font-bold">
              TARGET 85%
            </span>
          </div>

          {/* High-Contrast Concentric Ring matching Image 2 */}
          <div className="relative w-36 h-36 flex items-center justify-center my-3">
            <svg viewBox="0 0 100 100" className="w-36 h-36 transform -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-[#1C2333]"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-white"
                strokeWidth="10"
                strokeDasharray="251.2"
                strokeDashoffset="22"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white tracking-tight">91%</span>
              <span className="text-[10px] text-emerald-400 font-bold">+6% over target</span>
            </div>
          </div>

          <div className="w-full">
            <div className="text-xs font-bold text-white mb-0.5">₨446,500 Retained</div>
            <p className="text-[11px] text-zinc-400">142 members active with 0 churn this week</p>
          </div>
        </div>
      </div>
    </div>
  );
};
