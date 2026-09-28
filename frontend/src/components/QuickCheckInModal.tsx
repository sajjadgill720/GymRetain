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
} from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full rounded-2xl p-6 border border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {!successResult ? (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30 shadow-glow">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Front-Desk Member Check-In</h3>
                <p className="text-xs text-slate-400">Record attendance & increment daily streak</p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
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
                    className="w-full bg-[#11151f] border border-white/10 focus:border-brand-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                </div>
              </div>

              {/* Quick sample pills for instant demo testing */}
              <div>
                <div className="text-[11px] text-slate-400 mb-1.5 font-medium">Quick Demo Members:</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { code: 'GR-1001', name: 'Hamza S. (12-Day Streak)' },
                    { code: 'GR-1003', name: 'Zaid S. (9-Day Streak)' },
                    { code: 'GR-1004', name: 'Fatima Z. (7-Day Streak)' },
                  ].map((demo) => (
                    <button
                      key={demo.code}
                      onClick={() => {
                        setIdentifier(demo.code);
                        handleCheckIn(demo.code);
                      }}
                      className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-white/5 hover:bg-brand-500/20 text-slate-300 hover:text-brand-300 border border-white/10 transition-colors shadow-sm shadow-black/20 hover:shadow-brand-500/20 btn-shadow"
                    >
                      {demo.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleCheckIn()}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold text-xs tracking-wide shadow-md shadow-brand-500/30 hover:shadow-lg hover:shadow-brand-500/40 btn-shadow-primary transition-all flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{loading ? 'Verifying & Recording...' : 'Confirm Check-In'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Check-In Success / Streak Celebration View */
          <div className="text-center py-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/30 shadow-glow">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">Check-In Successful!</h3>
            <p className="text-xs text-slate-300 mt-1">
              Welcome to the gym, <span className="font-bold text-white">{successResult.member.name}</span>
            </p>

            {/* Streak Counter Card */}
            <div className="my-5 p-4 rounded-2xl bg-gradient-to-tr from-orange-500/15 via-surface-100 to-amber-500/10 border border-orange-500/30 flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/40">
                <Flame className="w-7 h-7 animate-flame text-orange-400" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-400">
                  Current Workout Streak
                </div>
                <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
                  {successResult.streak.current} <span className="text-xs font-normal text-slate-400">Days</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Personal Best: {successResult.streak.longest} Days
                </div>
              </div>
            </div>

            {/* Reward Unlocked Alert (if milestone reached) */}
            {successResult.unlockedRewards && successResult.unlockedRewards.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs mb-4 text-left flex items-start gap-2.5">
                <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    New Reward Milestone Unlocked!
                  </div>
                  <div className="text-white font-medium mt-0.5">
                    {successResult.unlockedRewards[0].title}
                  </div>
                  <div className="text-[10px] text-amber-300/80 mt-0.5">
                    {successResult.unlockedRewards[0].description}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleReset}
                className="flex-1 py-2 px-3 rounded-lg bg-surface-100 hover:bg-surface-50 text-xs font-medium text-slate-300 transition-colors shadow-sm shadow-black/40 hover:shadow-md btn-shadow"
              >
                Check In Another
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white shadow-md shadow-brand-500/30 hover:shadow-lg hover:shadow-brand-500/40 btn-shadow-primary transition-all"
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
