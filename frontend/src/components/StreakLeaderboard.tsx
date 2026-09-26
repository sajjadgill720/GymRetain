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
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <Flame className="w-4 h-4 animate-flame" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Active Streak Champions</h2>
              <p className="text-xs text-slate-400">Members with consecutive workout days</p>
            </div>
          </div>
          <Trophy className="w-5 h-5 text-amber-400/80" />
        </div>

        <div className="space-y-3 pt-2">
          {leaders.map((leader, index) => {
            const isTop = index === 0;

            return (
              <div
                key={leader.memberId}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isTop
                    ? 'bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-orange-500/30 shadow-glow-orange'
                    : 'bg-surface-100/50 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : index === 1
                        ? 'bg-slate-300 text-slate-900 font-bold'
                        : index === 2
                        ? 'bg-amber-700 text-amber-100 font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      {leader.memberName}
                      {leader.currentStreak >= 10 && (
                        <span className="text-[9px] bg-amber-400/15 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/30 font-mono">
                          10D WARRIOR
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {leader.memberCode} • Best: {leader.longestStreak} days
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-black text-orange-300 font-mono">
                    {leader.currentStreak}
                  </span>
                  <span className="text-[10px] text-orange-400/80 font-medium">days</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-5 border-t border-white/5 mt-5">
        <Link
          href="/rewards"
          className="w-full flex items-center justify-between text-xs font-medium text-brand-300 hover:text-brand-200 transition-colors group"
        >
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-brand-400" />
            <span>Manage Gym Reward Milestones</span>
          </span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};
