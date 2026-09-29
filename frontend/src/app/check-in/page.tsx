'use client';

import React, { useState } from 'react';
import { TopNavbar } from '../../components/TopNavbar';
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
    <div className="min-h-screen bg-[#111111] flex flex-col">
      <TopNavbar
        onOpenQrModal={() => setIsQrModalOpen(true)}
      />

      <main className="flex-1 flex flex-col min-h-screen w-full overflow-x-hidden">
        {/* Page Context Ribbon */}
        <div className="border-b border-[#26221E] bg-[#161310]/50 py-4 px-4 sm:px-8">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F7F5F2]">Front-Desk Check-In Kiosk</h1>
              <p className="text-xs text-[#A39E98] mt-0.5">Front reception terminal: scan member QR code, barcode, or enter member ID</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-8 space-y-6 flex-1 max-w-[1400px] w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Check-in Terminal Input */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-[#161310] rounded-2xl p-6 sm:p-8 border border-[#2A2520] shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between pb-6 border-b border-[#26221E]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#BFA785]/15 text-[#BFA785] flex items-center justify-center border border-[#BFA785]/30 shadow-sm shadow-[#BFA785]/10">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#F7F5F2] tracking-tight">
                        Reception Terminal
                      </h2>
                      <p className="text-xs text-[#A39E98]">Barcode scanner / Member code entry</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsQrModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1814] hover:bg-[#26221E] border border-[#2A2520] hover:border-[#BFA785]/40 text-xs font-semibold text-[#F7F5F2] hover:text-[#BFA785] transition-colors shadow-sm btn-shadow"
                  >
                    <QrCode className="w-4 h-4 text-[#4E9F6E]" />
                    <span>View QR Placard</span>
                  </button>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-[#D9534F]/15 border border-[#D9534F]/30 text-[#D9534F] text-xs flex items-center gap-2 mt-6">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#A39E98] block mb-2">
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
                        className="w-full bg-[#1C1814] border-2 border-[#2A2520] focus:border-[#BFA785] rounded-2xl px-5 py-4 text-lg text-[#F7F5F2] font-mono placeholder-[#6B6661] focus:outline-none transition-colors shadow-inner"
                        autoFocus
                      />
                      <Search className="w-5 h-5 text-[#6B6661] absolute right-4 top-5" />
                    </div>
                  </div>

                  <button
                    onClick={() => handleCheckIn()}
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-[#BFA785] hover:bg-[#B29976] disabled:opacity-50 text-[#111111] font-bold text-sm tracking-wide shadow-md shadow-[#BFA785]/25 hover:shadow-lg hover:shadow-[#BFA785]/35 btn-shadow-primary transition-all flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-5 h-5" />
                    <span>{loading ? 'Validating...' : 'Record Check-In (Enter)'}</span>
                  </button>

                  <div className="pt-2">
                    <div className="text-[11px] text-[#A39E98] uppercase font-semibold mb-2">
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
                          className="px-3 py-1.5 rounded-xl bg-[#1C1814] hover:bg-[#26221E] text-xs text-[#A39E98] hover:text-[#BFA785] font-mono border border-[#2A2520] hover:border-[#BFA785]/40 transition-colors shadow-sm btn-shadow"
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
                <div className="bg-[#161310] rounded-2xl p-6 border border-[#4E9F6E]/40 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#4E9F6E]/15 text-[#4E9F6E] flex items-center justify-center border border-[#4E9F6E]/30">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs uppercase font-bold tracking-wider text-[#4E9F6E]">
                          Verified & Checked In
                        </div>
                        <h3 className="text-lg font-black text-[#F7F5F2]">{lastCheckIn.member.name}</h3>
                        <p className="text-xs text-[#A39E98] font-mono">{lastCheckIn.member.code}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-[#BFA785] font-bold flex items-center justify-end gap-1">
                        <Flame className="w-4 h-4 animate-flame" />
                        Streak Active
                      </div>
                      <div className="text-3xl font-black text-[#F7F5F2] font-mono">
                        {lastCheckIn.streak.current}{' '}
                        <span className="text-xs font-normal text-[#A39E98]">Days</span>
                      </div>
                    </div>
                  </div>

                  {lastCheckIn.unlockedRewards && lastCheckIn.unlockedRewards.length > 0 && (
                    <div className="mt-4 p-3.5 rounded-xl bg-[#BFA785]/15 border border-[#BFA785]/30 flex items-center gap-3 text-[#F7F5F2] text-xs">
                      <Sparkles className="w-5 h-5 text-[#BFA785] shrink-0" />
                      <div>
                        <span className="font-bold text-[#BFA785]">Milestone Unlocked!</span>{' '}
                        {lastCheckIn.unlockedRewards[0].title}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Live Attendance Stream */}
            <div className="lg:col-span-5">
              <div className="bg-[#161310] rounded-2xl p-6 border border-[#2A2520] h-full flex flex-col shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-[#26221E] mb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#BFA785]" />
                    <h3 className="text-sm font-bold text-[#F7F5F2]">Live Attendance Stream</h3>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4E9F6E] animate-ping" />
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {recentLog.map((log, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-[#1C1814] border border-[#2A2520] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#26221E] flex items-center justify-center text-xs font-bold text-[#F7F5F2]">
                          {log.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#F7F5F2]">{log.name}</div>
                          <div className="text-[10px] text-[#A39E98] font-mono">
                            {log.code} • {log.time}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#BFA785]/15 border border-[#BFA785]/30 text-[#BFA785] text-xs font-mono font-bold">
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
