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
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#161310] max-w-md w-full rounded-2xl p-6 border border-[#2A2520] shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-[#A39E98] hover:text-white hover:bg-[#26221E] shadow-sm btn-shadow"
        >
          <X className="w-5 h-5" />
        </button>

        {!successResult ? (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#BFA785]/15 text-[#BFA785] flex items-center justify-center border border-[#BFA785]/30 shadow-sm shadow-[#BFA785]/10">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F7F5F2]">Front-Desk Member Check-In</h3>
                <p className="text-xs text-[#A39E98]">Record attendance & increment daily streak</p>
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-[#D9534F]/15 border border-[#D9534F]/30 text-[#D9534F] text-xs flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#A39E98] block mb-1.5">
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
                    className="w-full bg-[#1C1814] border border-[#2A2520] focus:border-[#BFA785] rounded-xl px-4 py-2.5 text-sm text-[#F7F5F2] placeholder-[#6B6661] focus:outline-none font-mono transition-colors"
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-[#6B6661] absolute right-3.5 top-3" />
                </div>
              </div>

              {/* Quick sample pills for instant demo testing */}
              <div>
                <div className="text-[11px] text-[#A39E98] mb-1.5 font-medium">Quick Demo Members:</div>
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
                      className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-[#1C1814] hover:bg-[#26221E] text-[#A39E98] hover:text-[#BFA785] border border-[#2A2520] hover:border-[#BFA785]/40 transition-colors shadow-sm btn-shadow"
                    >
                      {demo.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#26221E]">
                <button
                  onClick={() => handleCheckIn()}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#BFA785] hover:bg-[#B29976] disabled:opacity-50 text-[#111111] font-bold text-xs tracking-wide shadow-md shadow-[#BFA785]/25 hover:shadow-lg hover:shadow-[#BFA785]/35 btn-shadow-primary transition-all flex items-center justify-center gap-2"
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
            <div className="w-14 h-14 rounded-2xl bg-[#4E9F6E]/15 text-[#4E9F6E] flex items-center justify-center mx-auto mb-3 border border-[#4E9F6E]/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-[#F7F5F2] tracking-tight">Check-In Successful!</h3>
            <p className="text-xs text-[#A39E98] mt-1">
              Welcome to the gym, <span className="font-bold text-[#F7F5F2]">{successResult.member.name}</span>
            </p>

            {/* Streak Counter Card */}
            <div className="my-5 p-4 rounded-2xl bg-[#1C1814] border border-[#BFA785]/35 flex items-center justify-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#BFA785]/15 text-[#BFA785] flex items-center justify-center border border-[#BFA785]/30">
                <Flame className="w-7 h-7 animate-flame text-[#BFA785]" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#BFA785]">
                  Current Workout Streak
                </div>
                <div className="text-2xl font-black text-[#F7F5F2] font-mono flex items-baseline gap-1.5">
                  {successResult.streak.current} <span className="text-xs font-normal text-[#A39E98]">Days</span>
                </div>
                <div className="text-[10px] text-[#A39E98] font-mono">
                  Personal Best: {successResult.streak.longest} Days
                </div>
              </div>
            </div>

            {/* Reward Unlocked Alert (if milestone reached) */}
            {successResult.unlockedRewards && successResult.unlockedRewards.length > 0 && (
              <div className="p-3.5 rounded-xl bg-[#BFA785]/15 border border-[#BFA785]/30 text-[#F7F5F2] text-xs mb-4 text-left flex items-start gap-2.5">
                <Award className="w-5 h-5 text-[#BFA785] shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#BFA785] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#BFA785]" />
                    New Reward Milestone Unlocked!
                  </div>
                  <div className="text-[#F7F5F2] font-semibold mt-0.5">
                    {successResult.unlockedRewards[0].title}
                  </div>
                  <div className="text-[10px] text-[#A39E98] mt-0.5">
                    {successResult.unlockedRewards[0].description}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-3 border-t border-[#26221E]">
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#1C1814] hover:bg-[#26221E] text-xs font-semibold text-[#F7F5F2] border border-[#2A2520] transition-colors shadow-sm btn-shadow"
              >
                Check In Another
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#BFA785] hover:bg-[#B29976] text-xs font-bold text-[#111111] shadow-md shadow-[#BFA785]/25 hover:shadow-lg hover:shadow-[#BFA785]/35 btn-shadow-primary transition-all"
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
