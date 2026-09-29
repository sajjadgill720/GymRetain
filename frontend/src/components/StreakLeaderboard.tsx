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
    <div className="bg-[#121215] border border-zinc-800 rounded-lg p-4 sm:p-5 flex flex-col justify-between shadow-sm">
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-zinc-800 text-zinc-300 flex items-center justify-center border border-zinc-700">
              <Flame className="w-3.5 h-3.5 text-zinc-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">Active Streak Leaders</h2>
              <p className="text-xs text-zinc-400">Members with consecutive workout days</p>
            </div>
          </div>
          <Trophy className="w-4 h-4 text-zinc-500" />
        </div>

        <div className="space-y-2 pt-3">
          {leaders.map((leader, index) => {
            const isTop = index === 0;

            return (
              <div
                key={leader.memberId}
                className={`p-2.5 rounded-md border flex items-center justify-between transition-all ${
                  isTop
                    ? 'bg-zinc-800/40 border-zinc-700/80'
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      index === 0
                        ? 'bg-zinc-200 text-zinc-950'
                        : index === 1
                        ? 'bg-zinc-700 text-zinc-200'
                        : index === 2
                        ? 'bg-zinc-800 text-zinc-300'
                        : 'bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                      {leader.memberName}
                      {leader.currentStreak >= 10 && (
                        <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.2 rounded font-mono font-medium border border-blue-500/20">
                          10D+
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {leader.memberCode} • Best: {leader.longestStreak}d
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                  <Flame className="w-3 h-3 text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-100 font-mono">
                    {leader.currentStreak}
                  </span>
                  <span className="text-[10px] text-zinc-400">d</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-800/80 mt-4 flex items-center justify-between text-xs font-medium">
        <Link
          href="/rewards/winners"
          className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors py-1 px-2 rounded-md hover:bg-zinc-800/50 btn-shadow"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Streak Winners</span>
          <ArrowRight className="w-3 h-3" />
        </Link>

        <Link
          href="/rewards"
          className="text-zinc-500 hover:text-zinc-300 transition-colors py-1 px-2 rounded-md hover:bg-zinc-800/50 btn-shadow"
        >
          <span>Milestone Rules</span>
        </Link>
      </div>
    </div>
  );
};
