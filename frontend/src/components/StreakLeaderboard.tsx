'use client';

import React from 'react';
import { Flame, Trophy, Award, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface StreakLeaderboardProps {
  leaders: Array<{
    memberId: string;
    memberName: string;
    memberCode: string;
    currentStreak: number;
    longestStreak: number;
  }>;
}

export const StreakLeaderboard: React.FC<StreakLeaderboardProps> = ({ leaders }) => {
  return (
    <div className="bg-[#161310] border border-[#2A2520] rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-sm">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-[#26221E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#BFA785]/15 text-[#BFA785] flex items-center justify-center border border-[#BFA785]/30 shadow-sm shadow-[#BFA785]/10">
              <Flame className="w-4 h-4 animate-flame" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F7F5F2] tracking-tight">Active Streak Champions</h2>
              <p className="text-xs text-[#A39E98]">Members with consecutive workout days</p>
            </div>
          </div>
          <Trophy className="w-5 h-5 text-[#BFA785]" />
        </div>

        <div className="space-y-3 pt-4">
          {leaders.map((leader, index) => {
            const isTop = index === 0;

            return (
              <div
                key={leader.memberId}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  isTop
                    ? 'bg-gradient-to-r from-[#2A231C] to-[#1C1814] border-[#BFA785]/40 shadow-sm shadow-[#BFA785]/10'
                    : 'bg-[#1C1814] border-[#2A2520] hover:border-[#38312A]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? 'bg-[#BFA785] text-[#111111] font-black'
                        : index === 1
                        ? 'bg-[#D4C2A7] text-[#111111] font-bold'
                        : index === 2
                        ? 'bg-[#8B7454] text-white font-bold'
                        : 'bg-[#26221E] text-[#A39E98]'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#F7F5F2] flex items-center gap-1.5">
                      {leader.memberName}
                      {leader.currentStreak >= 10 && (
                        <span className="text-[9px] bg-[#BFA785]/15 text-[#BFA785] px-1.5 py-0.5 rounded-full border border-[#BFA785]/30 font-mono font-bold">
                          10D WARRIOR
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#A39E98] font-mono">
                      {leader.memberCode} • Best: {leader.longestStreak} days
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#BFA785]/15 border border-[#BFA785]/30">
                  <Flame className="w-3.5 h-3.5 text-[#BFA785]" />
                  <span className="text-sm font-bold text-[#F7F5F2] font-mono">
                    {leader.currentStreak}
                  </span>
                  <span className="text-[10px] text-[#BFA785] font-medium">days</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-[#26221E] mt-5">
        <Link
          href="/rewards"
          className="w-full flex items-center justify-between text-xs font-bold text-[#BFA785] hover:text-[#D4C2A7] transition-colors group p-2 rounded-xl hover:bg-[#1C1814] btn-shadow"
        >
          <span className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#BFA785]" />
            <span>Manage Gym Reward Milestones</span>
          </span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
