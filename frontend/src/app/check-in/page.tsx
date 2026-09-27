'use client';

import React, { useState } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { FrontDeskQrModal } from '../../components/FrontDeskQrModal';
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
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-[#090d16] flex">
      <Sidebar
        onOpenQrModal={() => setIsQrModalOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <main className="flex-1 lg:ml-64 ml-0 flex flex-col min-h-screen w-full overflow-x-hidden">
        <Header
          title="Front-Desk Check-In Kiosk"
          subtitle="Front reception terminal: scan member QR code, barcode, or enter member ID"
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <div className="p-4 sm:p-8 space-y-6 flex-1 max-w-[1400px] w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Check-in Terminal Input */}
            <div className="lg:col-span-7 space-y-6">
              <div className="glass-card rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between pb-6 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30 shadow-glow">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        Reception Terminal
                      </h2>
                      <p className="text-xs text-slate-400">Barcode scanner / Member code entry</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsQrModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 border border-white/10 text-xs font-medium text-slate-300 transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>View QR Placard</span>
                  </button>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 mt-6">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-2">
                      Scan QR or Enter Member ID / Phone:
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
                        placeholder="e.g. GR-1001 or +923001234567"
                        className="w-full bg-[#10141f] border-2 border-white/10 focus:border-brand-500 rounded-2xl px-5 py-4 text-lg text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40 shadow-inner"
                        autoFocus
                      />
                      <Search className="w-5 h-5 text-slate-500 absolute right-4 top-5" />
                    </div>
                  </div>

                  <button
                    onClick={() => handleCheckIn()}
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-glow transition-all flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-5 h-5" />
                    <span>{loading ? 'Validating...' : 'Record Check-In (Enter)'}</span>
                  </button>

                  <div className="pt-2">
                    <div className="text-[11px] text-slate-500 uppercase font-semibold mb-2">
                      Quick Test Members:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { code: 'GR-1001', name: 'Hamza Sheikh (12d streak)' },
                        { code: 'GR-1003', name: 'Zaid Siddiqui (9d streak)' },
                        { code: 'GR-1004', name: 'Fatima Zahra (7d streak)' },
                      ].map((t) => (
                        <button
                          key={t.code}
                          onClick={() => {
                            setIdentifier(t.code);
                            handleCheckIn(t.code);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-brand-500/20 text-xs text-slate-300 hover:text-brand-300 font-mono border border-white/5 transition-colors"
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live result banner */}
              {lastCheckIn && (
                <div className="glass-card rounded-3xl p-6 border border-emerald-500/30 bg-gradient-to-tr from-emerald-500/10 via-surface-100 to-transparent animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                          Verified & Checked In
                        </div>
                        <h3 className="text-lg font-black text-white">{lastCheckIn.member.name}</h3>
                        <p className="text-xs text-slate-400 font-mono">{lastCheckIn.member.code}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-orange-400 font-semibold flex items-center justify-end gap-1">
                        <Flame className="w-4 h-4 animate-flame" />
                        Streak Active
                      </div>
                      <div className="text-3xl font-black text-white font-mono">
                        {lastCheckIn.streak.current}{' '}
                        <span className="text-xs font-normal text-slate-400">Days</span>
                      </div>
                    </div>
                  </div>

                  {lastCheckIn.unlockedRewards && lastCheckIn.unlockedRewards.length > 0 && (
                    <div className="mt-4 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-3 text-amber-200 text-xs">
                      <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <span className="font-bold text-amber-300">Milestone Unlocked!</span>{' '}
                        {lastCheckIn.unlockedRewards[0].title}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Live Attendance Stream */}
            <div className="lg:col-span-5">
              <div className="glass-card rounded-3xl p-6 border border-white/5 h-full flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-brand-400" />
                    <h3 className="text-sm font-bold text-white">Live Attendance Stream</h3>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {recentLog.map((log, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-surface-100/50 border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-50 flex items-center justify-center text-xs font-bold text-slate-300">
                          {log.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">{log.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {log.code} • {log.time}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono font-bold">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{log.streak}d</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FrontDeskQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
