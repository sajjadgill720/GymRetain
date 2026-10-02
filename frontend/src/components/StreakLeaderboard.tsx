'use client';

import React from 'react';
import { Flame, Trophy, Award, ArrowRight } from '@/components/icons';
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
    <div className="bg-surface border border-surface-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm">
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-surface-subtle text-content-primary flex items-center justify-center border border-surface-border">
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-content-primary tracking-tight">Active Streak Leaders</h2>
              <p className="text-xs text-content-secondary">Members with consecutive workout days</p>
            </div>
          </div>
          <Trophy className="w-4 h-4 text-content-tertiary" />
        </div>

        <div className="space-y-2 pt-3">
          {leaders.map((leader, index) => {
            const isTop = index === 0;

            return (
              <div
                key={leader.memberId}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  isTop
                    ? 'bg-surface-subtle border-surface-border shadow-xs'
                    : 'bg-surface border-surface-border hover:bg-surface-subtle/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      index === 0
                        ? 'bg-purple-600 dark:bg-white text-white dark:text-black shadow-xs'
                        : index === 1
                        ? 'bg-surface-subtle text-content-primary border border-surface-border'
                        : index === 2
                        ? 'bg-surface-subtle text-content-secondary border border-surface-border'
                        : 'bg-surface-subtle text-content-tertiary'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-content-primary flex items-center gap-1.5">
                      {leader.memberName}
                      {leader.currentStreak >= 10 && (
                        <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.2 rounded-md font-mono font-medium border border-blue-500/20">
                          10D+
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-content-tertiary font-mono">
                      {leader.memberCode} • Best: {leader.longestStreak}d
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-subtle border border-surface-border text-content-primary">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-content-primary font-mono">
                    {leader.currentStreak}
                  </span>
                  <span className="text-[10px] text-content-tertiary">d</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-surface-border mt-4 flex items-center justify-between text-xs font-medium">
        <Link
          href="/rewards/winners"
          className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:opacity-80 transition-colors py-1 px-2 rounded-lg hover:bg-surface-subtle btn-shadow"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>Streak Winners</span>
          <ArrowRight className="w-3 h-3" />
        </Link>

        <Link
          href="/rewards"
          className="text-content-secondary hover:text-content-primary transition-colors py-1 px-2 rounded-lg hover:bg-surface-subtle btn-shadow"
        >
          <span>Milestone Rules</span>
        </Link>
      </div>
    </div>
  );
};
