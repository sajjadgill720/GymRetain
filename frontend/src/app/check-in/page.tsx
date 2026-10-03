'use client';

import React, { useState, useEffect } from 'react';
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
  Users,
  ShieldAlert,
  ArrowRight,
  SignOut,
  X,
  Warning,
} from '@/components/icons';

interface MemberLookupResult {
  id: string;
  memberCode: string;
  fullName: string;
  phone: string;
  status: string;
  hasActivePass: boolean;
  activePlanName?: string;
  currentSession?: {
    id: string;
    checkInTime: string;
    method: string;
    durationMinutesSoFar?: number;
  } | null;
}

export default function CheckInTerminalPage() {
  const [identifier, setIdentifier] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedMember, setConfirmedMember] = useState<MemberLookupResult | null>(null);
  const [lastActionResult, setLastActionResult] = useState<any | null>(null);

  // Capacity state
  const [capacityStatus, setCapacityStatus] = useState<{
    capacity: number;
    capacityPolicy: 'WARNING_ONLY' | 'BLOCK_AT_CAPACITY';
    currentlyCheckedIn: number;
    capacityUsagePercent: number;
    isOverCapacity: boolean;
    remainingCapacity: number;
  }>({
    capacity: 100,
    capacityPolicy: 'WARNING_ONLY',
    currentlyCheckedIn: 0,
    capacityUsagePercent: 0,
    isOverCapacity: false,
    remainingCapacity: 100,
  });

  // Open sessions on floor
  const [openSessions, setOpenSessions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'OPEN_SESSIONS' | 'RECENT_LOG'>('OPEN_SESSIONS');
  const [recentLog, setRecentLog] = useState<any[]>([]);

  // Correct Missed Check-Out Modal
  const [correctionSession, setCorrectionSession] = useState<any | null>(null);
  const [correctionTime, setCorrectionTime] = useState<string>('');
  const [correctionNote, setCorrectionNote] = useState<string>('');
  const [correcting, setCorrecting] = useState(false);

  const loadTerminalData = async () => {
    try {
      const [cap, sessions] = await Promise.all([
        api.getCapacityStatus(),
        api.getOpenAttendanceSessions(),
      ]);
      setCapacityStatus(cap);
      setOpenSessions(sessions);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadTerminalData();
    const interval = setInterval(loadTerminalData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Lookup member by code, phone, or scanned QR credential
  const handleLookup = async (targetId?: string) => {
    const target = (targetId || identifier).trim();
    if (!target) {
      setError('Please enter a Member Code, Phone Number, or scan QR credential');
      return;
    }

    setLookupLoading(true);
    setError(null);
    setLastActionResult(null);

    try {
      const member = await api.lookupMemberForCheckIn(target);
      setConfirmedMember(member);
    } catch (err: any) {
      setError(err?.message || 'Member lookup failed');
      setConfirmedMember(null);
    } finally {
      setLookupLoading(false);
    }
  };

  // Explicit Check-In
  const handleConfirmCheckIn = async () => {
    if (!confirmedMember) return;
    setActionLoading(true);
    setError(null);

    try {
      const result = await api.recordCheckIn(
        confirmedMember.memberCode || confirmedMember.id,
        'MANUAL_STAFF',
      );
      setLastActionResult({
        type: 'CHECK_IN',
        ...result,
      });

      // Update recent log
      setRecentLog((prev) => [
        {
          type: 'CHECK_IN',
          time: 'Just now',
          name: confirmedMember.fullName,
          code: confirmedMember.memberCode,
          streak: result?.streak?.current || 1,
        },
        ...prev.slice(0, 9),
      ]);

      setConfirmedMember(null);
      setIdentifier('');
      await loadTerminalData();
    } catch (err: any) {
      setError(err?.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Explicit Check-Out
  const handleConfirmCheckOut = async (memberIdentifier?: string) => {
    const target = memberIdentifier || confirmedMember?.memberCode || confirmedMember?.id;
    if (!target) return;

    setActionLoading(true);
    setError(null);

    try {
      const result = await api.recordCheckOut(target, 'MANUAL_STAFF');
      setLastActionResult({
        type: 'CHECK_OUT',
        ...result,
      });

      setRecentLog((prev) => [
        {
          type: 'CHECK_OUT',
          time: 'Just now',
          name: result?.member?.name || confirmedMember?.fullName || 'Member',
          code: result?.member?.code || confirmedMember?.memberCode || '',
          duration: result?.durationMinutes ? `${result.durationMinutes} mins` : 'Completed',
        },
        ...prev.slice(0, 9),
      ]);

      setConfirmedMember(null);
      setIdentifier('');
      await loadTerminalData();
    } catch (err: any) {
      setError(err?.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Missed Check-Out Correction
  const handleSaveCorrection = async () => {
    if (!correctionSession || !correctionTime) return;
    setCorrecting(true);
    try {
      await api.correctMissedCheckOut(
        correctionSession.id,
        new Date(correctionTime).toISOString(),
        correctionNote || 'Staff manual correction',
      );
      setCorrectionSession(null);
      setCorrectionTime('');
      setCorrectionNote('');
      await loadTerminalData();
    } catch (err: any) {
      setError(err?.message || 'Correction failed');
    } finally {
      setCorrecting(false);
    }
  };

  const isBlockedByCapacity =
    capacityStatus.capacityPolicy === 'BLOCK_AT_CAPACITY' &&
    capacityStatus.currentlyCheckedIn >= capacityStatus.capacity;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1500px] w-full mx-auto">
        {/* Terminal Header & Live Capacity Status Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-surface-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-600 dark:text-cyan-400" />
              Front Desk Attendance Terminal
            </h1>
            <p className="text-xs text-content-secondary mt-1">
              Verify member credentials, record discrete arrival sessions, and manage live floor occupancy.
            </p>
          </div>

          {/* Floor Capacity Pill */}
          <div className="flex items-center gap-3 bg-surface border border-surface-border p-3 rounded-2xl shadow-sm btn-shadow">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-content-primary">
                  {capacityStatus.currentlyCheckedIn} / {capacityStatus.capacity} on Floor
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    capacityStatus.currentlyCheckedIn >= capacityStatus.capacity
                      ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                      : capacityStatus.capacityUsagePercent >= 80
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {capacityStatus.capacityUsagePercent}% Capacity
                </span>
              </div>
              <div className="text-[10px] text-content-tertiary">
                Policy:{' '}
                {capacityStatus.capacityPolicy === 'BLOCK_AT_CAPACITY'
                  ? 'Strict blocking at capacity'
                  : 'Warning-only policy'}
              </div>
            </div>
          </div>
        </div>

        {/* Over-Capacity Warning Banner */}
        {capacityStatus.currentlyCheckedIn >= capacityStatus.capacity && (
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
              capacityStatus.capacityPolicy === 'BLOCK_AT_CAPACITY'
                ? 'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400'
            }`}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              {capacityStatus.capacityPolicy === 'BLOCK_AT_CAPACITY'
                ? `Gym floor has reached its configured limit (${capacityStatus.currentlyCheckedIn}/${capacityStatus.capacity}). Further check-ins are temporarily blocked until members check out.`
                : `Gym floor is currently at or over limit (${capacityStatus.currentlyCheckedIn}/${capacityStatus.capacity}). Warning-only policy permits admission, but floor is crowded.`}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Member Lookup & Confirmation (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Member Lookup Box */}
            <div className="bg-surface border border-surface-border rounded-2xl p-5 sm:p-6 shadow-sm btn-shadow">
              <h2 className="text-sm font-bold text-content-primary mb-1">
                Scan or Enter Member Identifier
              </h2>
              <p className="text-xs text-content-secondary mb-4">
                Enter Member Code (e.g. GR-1001), phone number, or scan an opaque member QR credential.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookup();
                }}
                className="space-y-3"
              >
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter GR-1001, +923... or scan QR"
                    autoFocus
                    className="w-full bg-surface-subtle border-2 border-surface-border focus:border-purple-500 rounded-xl px-4 py-3.5 text-base sm:text-lg font-mono text-content-primary placeholder-content-tertiary outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={lookupLoading}
                    className="absolute right-2 top-2 bottom-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-xs shadow-sm btn-shadow disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    <Search className="w-4 h-4" />
                    <span>{lookupLoading ? 'Looking up...' : 'Lookup Member'}</span>
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </form>

              {/* Demo Quick Presets */}
              <div className="pt-4 border-t border-surface-border mt-5">
                <span className="text-[11px] font-semibold text-content-tertiary uppercase tracking-wider block mb-2">
                  Quick Front-Desk Test Shortcuts:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { code: 'GR-1001', name: 'Hamza S.' },
                    { code: 'GR-1002', name: 'Ayesha M.' },
                    { code: 'GR-1003', name: 'Zaid S.' },
                    { code: 'GR-1004', name: 'Fatima Z.' },
                    { code: 'GR-1005', name: 'Bilal A.' },
                  ].map((m) => (
                    <button
                      key={m.code}
                      type="button"
                      onClick={() => handleLookup(m.code)}
                      className="px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface border border-surface-border text-xs text-content-primary transition-all shadow-sm btn-shadow flex items-center gap-1.5"
                    >
                      <span className="font-mono font-medium">{m.code}</span>
                      <span className="text-content-secondary">({m.name})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Staff Member Confirmation Card */}
            {confirmedMember && (
              <div className="bg-surface border-2 border-purple-500/40 rounded-2xl p-5 sm:p-6 shadow-xl relative animate-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between pb-4 border-b border-surface-border">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-cyan-400 font-extrabold text-base flex items-center justify-center border border-purple-500/20">
                      {confirmedMember.fullName[0]}
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-purple-600 dark:text-cyan-400">
                        Staff Verification Required
                      </div>
                      <h3 className="text-lg font-bold text-content-primary">
                        {confirmedMember.fullName}
                      </h3>
                      <div className="text-xs text-content-secondary font-mono flex items-center gap-2 mt-0.5">
                        <span>{confirmedMember.memberCode}</span>
                        <span>•</span>
                        <span>{confirmedMember.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        confirmedMember.hasActivePass
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/15 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {confirmedMember.hasActivePass ? 'Pass Active' : 'Pass Expired'}
                    </span>
                    {confirmedMember.activePlanName && (
                      <div className="text-[11px] text-content-tertiary mt-1">
                        {confirmedMember.activePlanName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Status Display */}
                <div className="py-4">
                  {confirmedMember.currentSession ? (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>Currently Checked In On Gym Floor</span>
                      </div>
                      <div className="text-[11px] text-content-secondary">
                        Arrived:{' '}
                        {new Date(confirmedMember.currentSession.checkInTime).toLocaleTimeString(
                          [],
                          { hour: '2-digit', minute: '2-digit' },
                        )}
                        {confirmedMember.currentSession.durationMinutesSoFar !== undefined &&
                          ` (${confirmedMember.currentSession.durationMinutesSoFar} mins ago)`}
                      </div>
                      <p className="text-[11px] text-content-tertiary">
                        Member already has an open session. Repeated check-in is prevented until this visit is checked out.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border text-xs text-content-secondary space-y-1">
                      <div className="font-semibold text-content-primary flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Ready For New Visit Check-In</span>
                      </div>
                      <p className="text-[11px] text-content-tertiary">
                        Member has no open session. Staff confirmation will create a discrete attendance record.
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={() => setConfirmedMember(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-content-tertiary hover:text-content-primary hover:bg-surface-subtle transition-all btn-shadow"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2">
                    {confirmedMember.currentSession ? (
                      <button
                        type="button"
                        onClick={() => handleConfirmCheckOut()}
                        disabled={actionLoading}
                        className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow-md btn-shadow transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <SignOut className="w-4 h-4" />
                        <span>{actionLoading ? 'Recording Check-Out...' : 'Confirm Check-Out'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleConfirmCheckIn}
                        disabled={actionLoading || isBlockedByCapacity}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md btn-shadow transition-all flex items-center gap-1.5 ${
                          isBlockedByCapacity
                            ? 'bg-zinc-600 cursor-not-allowed opacity-60'
                            : 'bg-emerald-600 hover:bg-emerald-500'
                        }`}
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>
                          {actionLoading
                            ? 'Recording Check-In...'
                            : isBlockedByCapacity
                            ? 'Blocked: Floor At Capacity'
                            : 'Confirm Check-In'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Action Feedback Result Card */}
            {lastActionResult && (
              <div className="bg-surface border-2 border-emerald-500/40 rounded-2xl p-5 sm:p-6 relative shadow-lg animate-in zoom-in-95 duration-150">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {lastActionResult.type === 'CHECK_IN'
                          ? 'Attendance Session Started'
                          : 'Visit Check-Out Recorded'}
                      </span>
                      <h3 className="text-base font-bold text-content-primary">
                        {lastActionResult.member?.name || 'Member Session Recorded'}
                      </h3>
                      <p className="text-xs text-content-secondary font-mono">
                        {lastActionResult.member?.code}
                        {lastActionResult.durationMinutes !== undefined &&
                          ` • Duration: ${lastActionResult.durationMinutes} minutes`}
                      </p>
                    </div>
                  </div>

                  {lastActionResult.streak && (
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>{lastActionResult.streak.current} Days</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Open Sessions & Live Terminal Feed (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-surface border border-surface-border rounded-2xl p-5 shadow-sm space-y-4 btn-shadow">
              {/* Tabs */}
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('OPEN_SESSIONS')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all btn-shadow ${
                      activeTab === 'OPEN_SESSIONS'
                        ? 'bg-purple-500/15 text-purple-700 dark:text-cyan-400 shadow-sm'
                        : 'text-content-tertiary hover:text-content-primary'
                    }`}
                  >
                    On Floor Now ({openSessions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('RECENT_LOG')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all btn-shadow ${
                      activeTab === 'RECENT_LOG'
                        ? 'bg-purple-500/15 text-purple-700 dark:text-cyan-400 shadow-sm'
                        : 'text-content-tertiary hover:text-content-primary'
                    }`}
                  >
                    Recent Activity
                  </button>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-medium border border-emerald-500/20">
                  Live
                </span>
              </div>

              {/* Tab 1: Members On Floor Right Now */}
              {activeTab === 'OPEN_SESSIONS' && (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {openSessions.length === 0 ? (
                    <div className="text-center py-10 text-xs text-content-tertiary">
                      No members currently checked in on floor.
                    </div>
                  ) : (
                    openSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-3 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs font-bold text-content-primary">
                            {session.member?.firstName} {session.member?.lastName}
                          </div>
                          <div className="text-[10px] text-content-tertiary font-mono">
                            {session.member?.memberCode} • In at{' '}
                            {new Date(session.checkInTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setCorrectionSession(session);
                              setCorrectionTime(new Date().toISOString().slice(0, 16));
                            }}
                            className="text-[10px] px-2 py-1 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface border border-surface-border transition-all btn-shadow"
                            title="Correct departure time"
                          >
                            Correct
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmCheckOut(session.member?.memberCode)}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition-all btn-shadow"
                          >
                            Check Out
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Recent Activity Log */}
              {activeTab === 'RECENT_LOG' && (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {recentLog.length === 0 ? (
                    <div className="text-center py-10 text-xs text-content-tertiary">
                      No terminal activity recorded yet today.
                    </div>
                  ) : (
                    recentLog.map((log, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              log.type === 'CHECK_IN' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          <div>
                            <div className="font-semibold text-content-primary">{log.name}</div>
                            <div className="text-[10px] text-content-tertiary font-mono">
                              {log.code} • {log.time}
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-content-secondary">
                          {log.type === 'CHECK_IN' ? `Streak: ${log.streak}d` : log.duration}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Correct Missed Check-Out */}
        {correctionSession && (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-surface max-w-md w-full rounded-2xl p-6 border border-surface-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-4">
                <h3 className="text-base font-bold text-content-primary">
                  Correct Missed Check-Out
                </h3>
                <button
                  type="button"
                  onClick={() => setCorrectionSession(null)}
                  className="p-1 rounded-lg text-content-tertiary hover:text-content-primary btn-shadow"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border">
                  <div className="font-bold text-content-primary">
                    {correctionSession.member?.firstName} {correctionSession.member?.lastName} (
                    {correctionSession.member?.memberCode})
                  </div>
                  <div className="text-[11px] text-content-tertiary font-mono mt-0.5">
                    Check-in was:{' '}
                    {new Date(correctionSession.checkInTime).toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-content-secondary block mb-1">
                    Actual Departure Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={correctionTime}
                    onChange={(e) => setCorrectionTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary font-mono focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-content-secondary block mb-1">
                    Correction Reason / Audit Note
                  </label>
                  <input
                    type="text"
                    value={correctionNote}
                    onChange={(e) => setCorrectionNote(e.target.value)}
                    placeholder="e.g. Member forgot to scan at front desk"
                    className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-surface-border text-content-primary focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-surface-border mt-5">
                <button
                  type="button"
                  onClick={() => setCorrectionSession(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-content-tertiary hover:text-content-primary hover:bg-surface-subtle btn-shadow"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCorrection}
                  disabled={correcting || !correctionTime}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md btn-shadow transition-all disabled:opacity-50"
                >
                  {correcting ? 'Saving...' : 'Save Correction'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
