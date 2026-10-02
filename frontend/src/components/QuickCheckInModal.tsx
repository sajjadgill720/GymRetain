'use client';

import React, { useState } from 'react';
import { api } from '../lib/api';
import {
  UserCheck,
  Flame,
  Award,
  CheckCircle2,
  X,
  Search,
  Sparkles,
  AlertCircle,
} from '@/components/icons';

interface QuickCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckInSuccess?: () => void;
}

export const QuickCheckInModal: React.FC<QuickCheckInModalProps> = ({
  isOpen,
  onClose,
  onCheckInSuccess,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleCheckIn = async (codeToUse?: string) => {
    const target = codeToUse || identifier;
    if (!target.trim()) {
      setError('Please enter a Member Code (e.g. GR-1001) or Phone Number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.recordCheckIn(target.trim(), 'MANUAL_STAFF');
      setSuccessResult(result);
      if (onCheckInSuccess) onCheckInSuccess();
    } catch (err: any) {
      setError(err?.message || 'Check-in failed. Please verify member code.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessResult(null);
    setIdentifier('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface max-w-md w-full rounded-2xl p-5 sm:p-6 border border-surface-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-100">
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-1.5 rounded-xl text-content-tertiary hover:text-content-primary hover:bg-surface-subtle shadow-sm btn-shadow transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {!successResult ? (
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-surface-subtle text-content-primary flex items-center justify-center border border-surface-border">
                <UserCheck className="w-4 h-4 text-purple-600 dark:text-neon-cyan" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-content-primary">Front-Desk Member Check-In</h3>
                <p className="text-xs text-content-secondary">Record attendance & increment daily streak</p>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-content-secondary block mb-1">
                  Member Identifier
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
                    placeholder="Enter Code (GR-1001) or Phone (+92...)"
                    className="w-full bg-surface-subtle border border-surface-border focus:border-purple-500/50 rounded-xl px-3.5 py-2.5 text-xs text-content-primary placeholder-content-tertiary focus:outline-none font-mono transition-colors"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-content-tertiary absolute right-3.5 top-3" />
                </div>
              </div>

              {/* Quick sample pills for instant demo testing */}
              <div>
                <div className="text-[11px] text-content-secondary mb-1.5 font-medium">Quick Demo Members:</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { code: 'GR-1001', name: 'Hamza S. (12d streak)' },
                    { code: 'GR-1003', name: 'Zaid S. (9d streak)' },
                    { code: 'GR-1004', name: 'Fatima Z. (7d streak)' },
                  ].map((demo) => (
                    <button
                      key={demo.code}
                      onClick={() => {
                        setIdentifier(demo.code);
                        handleCheckIn(demo.code);
                      }}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-surface text-content-primary border border-surface-border transition-colors shadow-sm btn-shadow"
                    >
                      {demo.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-surface-border">
                <button
                  onClick={() => handleCheckIn()}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 dark:bg-white dark:hover:bg-zinc-200 disabled:opacity-50 text-white dark:text-black font-semibold text-xs shadow-sm btn-shadow transition-all flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{loading ? 'Verifying & Recording...' : 'Confirm Check-In'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Check-In Success / Streak Celebration View */
          <div className="text-center py-2 animate-in fade-in zoom-in-95 duration-100">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-semibold text-content-primary tracking-tight">Check-In Successful</h3>
            <p className="text-xs text-content-secondary mt-0.5">
              Welcome to the gym, <span className="font-medium text-content-primary">{successResult.member.name}</span>
            </p>

            {/* Streak Counter Card */}
            <div className="my-4 p-4 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-surface text-content-primary flex items-center justify-center border border-surface-border">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-content-tertiary">
                  Current Workout Streak
                </div>
                <div className="text-xl font-bold text-content-primary font-mono flex items-baseline gap-1.5">
                  {successResult.streak.current} <span className="text-xs font-normal text-content-secondary">Days</span>
                </div>
                <div className="text-[10px] text-content-tertiary font-mono">
                  Personal Best: {successResult.streak.longest} Days
                </div>
              </div>
            </div>

            {/* Reward Unlocked Alert (if milestone reached) */}
            {successResult.unlockedRewards && successResult.unlockedRewards.length > 0 && (
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border text-content-primary text-xs mb-3 text-left flex items-start gap-2">
                <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-content-primary flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    New Reward Milestone Unlocked!
                  </div>
                  <div className="text-content-secondary font-medium mt-0.5">
                    {successResult.unlockedRewards[0].title}
                  </div>
                  <div className="text-[10px] text-content-tertiary mt-0.5">
                    {successResult.unlockedRewards[0].description}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-3 border-t border-surface-border">
              <button
                onClick={handleReset}
                className="flex-1 py-2 px-3 rounded-xl bg-surface-subtle hover:bg-surface text-xs font-medium text-content-primary border border-surface-border transition-colors shadow-sm btn-shadow"
              >
                Check In Another
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 dark:bg-white dark:hover:bg-zinc-200 text-xs font-semibold text-white dark:text-black shadow-sm btn-shadow transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
