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
      <div className="bg-[#121215] max-w-md w-full rounded-lg p-5 border border-zinc-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-100">
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 shadow-sm btn-shadow"
        >
          <X className="w-4 h-4" />
        </button>

        {!successResult ? (
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-md bg-zinc-800 text-zinc-200 flex items-center justify-center border border-zinc-700">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Front-Desk Member Check-In</h3>
                <p className="text-xs text-zinc-400">Record attendance & increment daily streak</p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">
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
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-md px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono transition-colors"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-2.5" />
                </div>
              </div>

              {/* Quick sample pills for instant demo testing */}
              <div>
                <div className="text-[11px] text-zinc-400 mb-1 font-medium">Quick Demo Members:</div>
                <div className="flex flex-wrap gap-1">
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
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition-colors shadow-sm btn-shadow"
                    >
                      {demo.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <button
                  onClick={() => handleCheckIn()}
                  disabled={loading}
                  className="w-full py-2 px-3 rounded-md bg-white hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-medium text-xs shadow-sm btn-shadow-primary transition-all flex items-center justify-center gap-1.5"
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
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-semibold text-zinc-100 tracking-tight">Check-In Successful</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Welcome to the gym, <span className="font-medium text-zinc-200">{successResult.member.name}</span>
            </p>

            {/* Streak Counter Card */}
            <div className="my-4 p-3.5 rounded-md bg-zinc-900/60 border border-zinc-800 flex items-center justify-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-md bg-zinc-800 text-zinc-200 flex items-center justify-center border border-zinc-700">
                <Flame className="w-5 h-5 text-zinc-300" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                  Current Workout Streak
                </div>
                <div className="text-xl font-bold text-zinc-100 font-mono flex items-baseline gap-1.5">
                  {successResult.streak.current} <span className="text-xs font-normal text-zinc-500">Days</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  Personal Best: {successResult.streak.longest} Days
                </div>
              </div>
            </div>

            {/* Reward Unlocked Alert (if milestone reached) */}
            {successResult.unlockedRewards && successResult.unlockedRewards.length > 0 && (
              <div className="p-3 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs mb-3 text-left flex items-start gap-2">
                <Award className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-zinc-100 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                    New Reward Milestone Unlocked!
                  </div>
                  <div className="text-zinc-300 font-medium mt-0.5">
                    {successResult.unlockedRewards[0].title}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    {successResult.unlockedRewards[0].description}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={handleReset}
                className="flex-1 py-1.5 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 border border-zinc-800 transition-colors shadow-sm btn-shadow"
              >
                Check In Another
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-1.5 px-3 rounded-md bg-white hover:bg-zinc-200 text-xs font-medium text-zinc-950 shadow-sm btn-shadow-primary transition-all"
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
