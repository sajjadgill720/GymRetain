'use client';

import React, { useState } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { api } from '../../lib/api';
import {
  UserCheck,
  Flame,
  Award,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  QrCode,
  Clock,
  History,
} from 'lucide-react';

export default function CheckInKioskPage() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckIn, setLastCheckIn] = useState<any | null>(null);
  const [recentLog, setRecentLog] = useState<any[]>([
    {
      time: 'Just now',
      name: 'Hamza Sheikh',
      code: 'GR-1001',
      streak: 12,
      isMilestone: true,
    },
    {
      time: '14 mins ago',
      name: 'Zaid Siddiqui',
      code: 'GR-1003',
      streak: 9,
      isMilestone: false,
    },
    {
      time: '32 mins ago',
      name: 'Fatima Zahra',
      code: 'GR-1004',
      streak: 7,
      isMilestone: false,
    },
  ]);

  const handleCheckIn = async (codeToUse?: string) => {
    const target = codeToUse || identifier;
    if (!target.trim()) {
      setError('Please enter a Member Code or Phone Number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.recordCheckIn(target.trim(), 'KIOSK');
      setLastCheckIn(result);

      // Add to recent log
      setRecentLog((prev) => [
        {
          time: 'Just now',
          name: result.member.name,
          code: result.member.code,
          streak: result.streak.current,
          isMilestone: result.unlockedRewards && result.unlockedRewards.length > 0,
        },
        ...prev.slice(0, 9),
      ]);

      setIdentifier('');
    } catch (err: any) {
      setError(err?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] w-full mx-auto">
        {/* Page Context Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-zinc-800/60">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-zinc-300" />
              Front-Desk Check-In Kiosk
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Front reception terminal: scan member QR code, barcode, or enter member ID.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Check-In Terminal (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#121215] border border-zinc-800 rounded-lg p-5 sm:p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-100 mb-1">
                Record Member Attendance
              </h2>
              <p className="text-xs text-zinc-400 mb-5">
                Type Member Code (e.g. GR-1001) or WhatsApp Phone Number (+923001234567)
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCheckIn();
                }}
                className="space-y-4"
              >
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter GR-1001 or +923..."
                    autoFocus
                    className="w-full bg-[#18181B] border-2 border-zinc-700 focus:border-zinc-400 rounded-lg px-4 py-3.5 text-base sm:text-lg font-mono text-zinc-100 placeholder-zinc-500 tracking-wider shadow-inner outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-2 top-2 bottom-2 px-5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs shadow-sm btn-shadow-primary disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{loading ? 'Logging...' : 'Check In'}</span>
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/25 text-red-400 text-xs animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </form>

              {/* Quick Preset Buttons for Front-Desk Demo */}
              <div className="pt-5 border-t border-zinc-800/80 mt-6">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-2.5">
                  Demo Quick Taps:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { code: 'GR-1001', name: 'Hamza S.', streak: '12d' },
                    { code: 'GR-1003', name: 'Zaid S.', streak: '9d' },
                    { code: 'GR-1004', name: 'Fatima Z.', streak: '7d' },
                    { code: 'GR-1005', name: 'Bilal A.', streak: '6d' },
                  ].map((m) => (
                    <button
                      key={m.code}
                      type="button"
                      onClick={() => handleCheckIn(m.code)}
                      className="px-3 py-1.5 rounded-md bg-[#18181B] hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 hover:text-white transition-all shadow-sm btn-shadow flex items-center gap-2"
                    >
                      <span className="font-mono text-zinc-200">{m.code}</span>
                      <span className="text-zinc-500">({m.name})</span>
                      <span className="text-[10px] text-amber-400 font-mono flex items-center gap-0.5">
                        <Flame className="w-3 h-3 text-amber-400" />
                        {m.streak}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Success Feedback Card */}
            {lastCheckIn && (
              <div className="bg-[#121215] border-2 border-emerald-500/40 rounded-lg p-5 sm:p-6 relative shadow-lg animate-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">
                        Check-In Recorded Successfully
                      </span>
                      <h3 className="text-lg font-bold text-zinc-100">
                        {lastCheckIn.member.name}
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono">
                        {lastCheckIn.member.code} • {lastCheckIn.member.phone}
                      </p>
                    </div>
                  </div>

                  {/* Streak Increment Pill */}
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-400 text-sm font-mono font-bold">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span>{lastCheckIn.streak.current} Days</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1">
                      Longest: {lastCheckIn.streak.longest}d
                    </div>
                  </div>
                </div>

                {/* Milestone Reward Announcement */}
                {lastCheckIn.unlockedRewards && lastCheckIn.unlockedRewards.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <Award className="w-5 h-5 shrink-0 text-amber-400" />
                    <div className="text-xs">
                      <span className="font-bold">Milestone Reward Unlocked! </span>
                      <span>{lastCheckIn.unlockedRewards[0].title} — {lastCheckIn.unlockedRewards[0].description}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Today's Live Attendance Feed (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-[#121215] border border-zinc-800 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                    Recent Check-Ins
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-medium border border-emerald-500/20">
                  Live Terminal
                </span>
              </div>

              <div className="space-y-2">
                {recentLog.map((log, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-md bg-[#18181B] border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300">
                        {log.name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-zinc-200">{log.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {log.code} • {log.time}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>{log.streak}d</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
