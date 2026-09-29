'use client';

import React, { useState, useEffect } from 'react';
import { TopNavbar } from '../../../components/TopNavbar';
import { QuickCheckInModal } from '../../../components/QuickCheckInModal';
import { FrontDeskQrModal } from '../../../components/FrontDeskQrModal';
import { api, MOCK_WINNERS } from '../../../lib/api';
import { RewardRedemption } from '../../../types';
import {
  Trophy,
  Flame,
  Award,
  CheckCircle2,
  Clock,
  Search,
  Check,
  Gift,
  Tag,
  ArrowRight,
  Filter,
  X,
  User,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

const DEFAULT_WINNERS: RewardRedemption[] = [
  {
    id: 'red-1',
    rewardId: 'rew-1',
    memberId: 'mem-1',
    status: 'REDEEMED',
    unlockedAt: '2026-09-25T10:30:00Z',
    redeemedAt: '2026-09-27T11:15:00Z',
    reward: {
      id: 'rew-1',
      gymId: 'gym-1',
      title: '10-Day Streak Warrior',
      description: 'Awarded for checking in 10 consecutive days without missing a day!',
      rewardType: 'BADGE',
      triggerType: 'STREAK_MILESTONE',
      triggerThreshold: 10,
      badgeIcon: 'flame-gold',
      isActive: true,
    },
    member: {
      id: 'mem-1',
      gymId: 'gym-1',
      memberCode: 'GR-1001',
      firstName: 'Hamza',
      lastName: 'Sheikh',
      phone: '+923001234567',
      joinDate: '2026-07-28',
      status: 'ACTIVE',
      streak: {
        id: 'st-1',
        currentStreak: 12,
        longestStreak: 12,
      },
    },
  },
  {
    id: 'red-2',
    rewardId: 'rew-2',
    memberId: 'mem-1',
    status: 'UNLOCKED',
    unlockedAt: '2026-09-28T09:12:00Z',
    reward: {
      id: 'rew-2',
      gymId: 'gym-1',
      title: 'Free Whey Protein Shake',
      description: 'Redeemable at the reception juice bar for hitting a 15-day streak.',
      rewardType: 'FREE_ITEM',
      triggerType: 'STREAK_MILESTONE',
      triggerThreshold: 15,
      badgeIcon: 'cup-shake',
      isActive: true,
    },
    member: {
      id: 'mem-1',
      gymId: 'gym-1',
      memberCode: 'GR-1001',
      firstName: 'Hamza',
      lastName: 'Sheikh',
      phone: '+923001234567',
      joinDate: '2026-07-28',
      status: 'ACTIVE',
      streak: {
        id: 'st-1',
        currentStreak: 12,
        longestStreak: 12,
      },
    },
  },
  {
    id: 'red-3',
    rewardId: 'rew-1',
    memberId: 'mem-3',
    status: 'REDEEMED',
    unlockedAt: '2026-09-20T14:40:00Z',
    redeemedAt: '2026-09-21T08:00:00Z',
    reward: {
      id: 'rew-1',
      gymId: 'gym-1',
      title: '10-Day Streak Warrior',
      description: 'Awarded for checking in 10 consecutive days without missing a day!',
      rewardType: 'BADGE',
      triggerType: 'STREAK_MILESTONE',
      triggerThreshold: 10,
      badgeIcon: 'flame-gold',
      isActive: true,
    },
    member: {
      id: 'mem-3',
      gymId: 'gym-1',
      memberCode: 'GR-1003',
      firstName: 'Zaid',
      lastName: 'Siddiqui',
      phone: '+923129988776',
      joinDate: '2026-08-15',
      status: 'ACTIVE',
      streak: {
        id: 'st-3',
        currentStreak: 9,
        longestStreak: 14,
      },
    },
  },
  {
    id: 'red-4',
    rewardId: 'rew-1',
    memberId: 'mem-4',
    status: 'UNLOCKED',
    unlockedAt: '2026-09-28T16:20:00Z',
    reward: {
      id: 'rew-1',
      gymId: 'gym-1',
      title: '10-Day Streak Warrior',
      description: 'Awarded for checking in 10 consecutive days without missing a day!',
      rewardType: 'BADGE',
      triggerType: 'STREAK_MILESTONE',
      triggerThreshold: 10,
      badgeIcon: 'flame-gold',
      isActive: true,
    },
    member: {
      id: 'mem-4',
      gymId: 'gym-1',
      memberCode: 'GR-1004',
      firstName: 'Fatima',
      lastName: 'Zahra',
      phone: '+923214455667',
      joinDate: '2026-09-01',
      status: 'ACTIVE',
      streak: {
        id: 'st-4',
        currentStreak: 7,
        longestStreak: 10,
      },
    },
  },
  {
    id: 'red-5',
    rewardId: 'rew-3',
    memberId: 'mem-5',
    status: 'UNLOCKED',
    unlockedAt: '2026-09-29T08:15:00Z',
    reward: {
      id: 'rew-3',
      gymId: 'gym-1',
      title: '20% Next Month Discount',
      description: 'Special 20% discount on renewal for 25 consecutive workout days.',
      rewardType: 'DISCOUNT_PERCENT',
      triggerType: 'STREAK_MILESTONE',
      triggerThreshold: 25,
      rewardValue: 20,
      badgeIcon: 'percent-circle',
      isActive: true,
    },
    member: {
      id: 'mem-5',
      gymId: 'gym-1',
      memberCode: 'GR-1005',
      firstName: 'Bilal',
      lastName: 'Ahmed',
      phone: '+923456677889',
      joinDate: '2026-05-10',
      status: 'ACTIVE',
      streak: {
        id: 'st-5',
        currentStreak: 6,
        longestStreak: 25,
      },
    },
  },
  {
    id: 'red-6',
    rewardId: 'rew-2',
    memberId: 'mem-6',
    status: 'REDEEMED',
    unlockedAt: '2026-09-22T12:00:00Z',
    redeemedAt: '2026-09-23T10:45:00Z',
    reward: {
      id: 'rew-2',
      gymId: 'gym-1',
      title: 'Free Whey Protein Shake',
      description: 'Redeemable at the reception juice bar for hitting a 15-day streak.',
      rewardType: 'FREE_ITEM',
      triggerType: 'STREAK_MILESTONE',
      triggerThreshold: 15,
      badgeIcon: 'cup-shake',
      isActive: true,
    },
    member: {
      id: 'mem-6',
      gymId: 'gym-1',
      memberCode: 'GR-1006',
      firstName: 'Ali',
      lastName: 'Raza',
      phone: '+923157788990',
      joinDate: '2026-07-01',
      status: 'ACTIVE',
      streak: {
        id: 'st-6',
        currentStreak: 5,
        longestStreak: 15,
      },
    },
  },
];

export default function StreakWinnersPage() {
  const [winners, setWinners] = useState<RewardRedemption[]>(DEFAULT_WINNERS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNLOCKED' | 'REDEEMED'>('ALL');

  // Modals
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Redemption Fulfillment Modal
  const [activeFulfillTarget, setActiveFulfillTarget] = useState<RewardRedemption | null>(null);
  const [fulfillNotes, setFulfillNotes] = useState('');
  const [fulfilling, setFulfilling] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchWinners = async () => {
    setLoading(true);
    try {
      const data = await api.getRewardWinners();
      setWinners(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinners();
  }, []);

  const handleConfirmFulfill = async () => {
    if (!activeFulfillTarget) return;
    setFulfilling(true);
    try {
      await api.redeemReward(activeFulfillTarget.id, fulfillNotes);
      setSuccessToast(`Reward successfully marked as fulfilled for ${activeFulfillTarget.member?.firstName || 'member'}!`);
      setTimeout(() => setSuccessToast(null), 3000);
      setActiveFulfillTarget(null);
      setFulfillNotes('');
      await fetchWinners();
    } finally {
      setFulfilling(false);
    }
  };

  // Filtered dataset
  const filteredWinners = winners.filter((w) => {
    const matchesStatus =
      statusFilter === 'ALL' || w.status === statusFilter;

    const term = searchTerm.toLowerCase();
    const fullName = `${w.member?.firstName || ''} ${w.member?.lastName || ''}`.toLowerCase();
    const code = (w.member?.memberCode || '').toLowerCase();
    const phone = (w.member?.phone || '').toLowerCase();
    const rewardTitle = (w.reward?.title || '').toLowerCase();

    const matchesSearch =
      fullName.includes(term) ||
      code.includes(term) ||
      phone.includes(term) ||
      rewardTitle.includes(term);

    return matchesStatus && matchesSearch;
  });

  // KPIs
  const totalWinners = winners.length;
  const pendingCount = winners.filter((w) => w.status === 'UNLOCKED').length;
  const redeemedCount = winners.filter((w) => w.status === 'REDEEMED').length;
  const topStreakWinner = winners.reduce((max, w) => {
    const cur = w.member?.streak?.currentStreak || 0;
    return cur > (max?.member?.streak?.currentStreak || 0) ? w : max;
  }, winners[0]);

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col">
      {/* 1. Unified Navigation */}
      <TopNavbar
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenCheckInModal={() => setIsCheckInOpen(true)}
      />

      {/* Main SaaS Content Container */}
      <main className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Toast Alert */}
        {successToast && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast(null)} className="text-zinc-400 hover:text-zinc-200">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 2. Top Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-zinc-800/60">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Streak Reward Winners
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {pendingCount} Pending Redemption
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Members who unlocked milestone achievements. Verify streak qualifications and fulfill rewards at the front desk.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/rewards"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#121215] hover:bg-[#18181B] border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors btn-shadow"
            >
              <Award className="w-3.5 h-3.5 text-zinc-400" />
              <span>Configure Rules</span>
            </Link>
          </div>
        </div>

        {/* 3. Secondary Stats: Compact 4-Tile Row */}
        <section aria-label="Streak Winner Key Performance Metrics">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Stat 1: Total Unlocked Rewards */}
            <div className="bg-[#121215] border border-zinc-800 rounded-lg p-3.5 sm:p-4 shadow-sm hover:border-zinc-700/80 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium">Total Rewards Won</span>
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100 font-mono">
                  {totalWinners}
                </span>
                <span className="text-xs text-zinc-400 font-normal">milestones</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Streaks successfully hit</p>
            </div>

            {/* Stat 2: Pending Front-Desk Claim */}
            <div className="bg-[#121215] border border-zinc-800 rounded-lg p-3.5 sm:p-4 shadow-sm hover:border-zinc-700/80 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium">Pending Claim</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-amber-400 font-mono">
                  {pendingCount}
                </span>
                <span className="text-xs text-amber-400/90 font-medium">ready</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Awaiting reception pickup</p>
            </div>

            {/* Stat 3: Claimed / Fulfilled */}
            <div className="bg-[#121215] border border-zinc-800 rounded-lg p-3.5 sm:p-4 shadow-sm hover:border-zinc-700/80 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium">Fulfilled</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-emerald-400 font-mono">
                  {redeemedCount}
                </span>
                <span className="text-xs text-emerald-400/90 font-medium">claimed</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Given to members</p>
            </div>

            {/* Stat 4: Top Active Streak Winner */}
            <div className="bg-[#121215] border border-zinc-800 rounded-lg p-3.5 sm:p-4 shadow-sm hover:border-zinc-700/80 transition-colors">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-medium">Top Streak Member</span>
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2 truncate">
                <span className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-100 truncate">
                  {topStreakWinner?.member?.firstName || 'Hamza'} {topStreakWinner?.member?.lastName?.charAt(0) || 'S'}.
                </span>
                <span className="text-xs text-orange-400 font-mono shrink-0">
                  {topStreakWinner?.member?.streak?.currentStreak || 12}d
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Active gym record</p>
            </div>
          </div>
        </section>

        {/* 4. Controls Bar: Search & Status Filters */}
        <div className="bg-[#121215] border border-zinc-800 rounded-lg p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by member name, code (GR-1001), phone, or reward..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#18181B] border border-zinc-700/80 rounded-md pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#18181B] p-0.5 rounded-md border border-zinc-800 shrink-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all btn-shadow ${
                statusFilter === 'ALL'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Winners ({winners.length})
            </button>
            <button
              onClick={() => setStatusFilter('UNLOCKED')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all btn-shadow ${
                statusFilter === 'UNLOCKED'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-amber-400'
              }`}
            >
              Ready to Claim ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('REDEEMED')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all btn-shadow ${
                statusFilter === 'REDEEMED'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-emerald-400'
              }`}
            >
              Claimed ({redeemedCount})
            </button>
          </div>
        </div>

        {/* 5. Winners Data Table (Desktop) & Card List (Mobile) */}
        <div className="bg-[#121215] border border-zinc-800 rounded-lg shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#18181B]/70 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400 font-semibold select-none">
                <tr>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Streak Milestone</th>
                  <th className="py-3 px-4">Reward Won</th>
                  <th className="py-3 px-4">Unlocked Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredWinners.map((winner) => {
                  const isPending = winner.status === 'UNLOCKED';
                  const streakCount = winner.member?.streak?.currentStreak ?? winner.reward?.triggerThreshold ?? 10;

                  return (
                    <tr
                      key={winner.id}
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      {/* Member Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-200 shrink-0">
                            {winner.member?.firstName?.[0] || 'M'}
                            {winner.member?.lastName?.[0] || ''}
                          </div>
                          <div>
                            <div className="font-medium text-zinc-100">
                              {winner.member?.firstName} {winner.member?.lastName}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-mono">
                              {winner.member?.memberCode} • {winner.member?.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Milestone */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-mono font-medium text-xs border border-amber-500/20">
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                            {winner.reward?.triggerThreshold} Days
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            (Current: {streakCount}d)
                          </span>
                        </div>
                      </td>

                      {/* Reward Won */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-medium text-zinc-200 flex items-center gap-1.5">
                            {winner.reward?.rewardType === 'FREE_ITEM' && (
                              <Gift className="w-3.5 h-3.5 text-purple-400" />
                            )}
                            {winner.reward?.rewardType === 'DISCOUNT_PERCENT' && (
                              <Tag className="w-3.5 h-3.5 text-blue-400" />
                            )}
                            {winner.reward?.rewardType === 'BADGE' && (
                              <Award className="w-3.5 h-3.5 text-amber-400" />
                            )}
                            <span>{winner.reward?.title}</span>
                          </div>
                          {winner.reward?.description && (
                            <p className="text-[11px] text-zinc-500 line-clamp-1 mt-0.5">
                              {winner.reward.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Unlocked Date */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                        {new Date(winner.unlockedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/25 text-[11px] font-medium">
                            <Clock className="w-3 h-3" />
                            Ready to Claim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[11px] font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            Claimed
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <button
                            onClick={() => {
                              setActiveFulfillTarget(winner);
                              setFulfillNotes('');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-xs transition-all shadow-sm btn-shadow-primary"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Fulfill Reward</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-zinc-500 font-mono">
                            {winner.redeemedAt
                              ? `Fulfilled ${new Date(winner.redeemedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                              : 'Fulfilled'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="block md:hidden divide-y divide-zinc-800/80">
            {filteredWinners.map((winner) => {
              const isPending = winner.status === 'UNLOCKED';
              return (
                <div key={winner.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-200">
                        {winner.member?.firstName?.[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-zinc-100">
                          {winner.member?.firstName} {winner.member?.lastName}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          {winner.member?.memberCode}
                        </div>
                      </div>
                    </div>
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/25 text-[10px] font-medium">
                        Ready to Claim
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-medium">
                        Claimed
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-md bg-[#18181B] border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-zinc-200">
                        {winner.reward?.title}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">
                        Unlocked for {winner.reward?.triggerThreshold}-day streak
                      </div>
                    </div>
                    <Flame className="w-4 h-4 text-amber-400" />
                  </div>

                  {isPending && (
                    <button
                      onClick={() => {
                        setActiveFulfillTarget(winner);
                        setFulfillNotes('');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-xs shadow-sm btn-shadow-primary transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Fulfill Member Reward</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredWinners.length === 0 && (
            <div className="py-12 text-center">
              <Trophy className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-300">No streak winners found</p>
              <p className="text-xs text-zinc-500 mt-1">
                {searchTerm
                  ? 'No members matching your search query.'
                  : 'Streak winners will automatically show up here when members hit milestone targets.'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* 6. Front-Desk Reward Fulfillment Modal */}
      {activeFulfillTarget && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121215] max-w-md w-full rounded-lg p-5 sm:p-6 border border-zinc-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => setActiveFulfillTarget(null)}
              className="absolute right-4 top-4 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 shadow-sm btn-shadow"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-100">Fulfill Streak Reward</h3>
                <p className="text-xs text-zinc-400">Front-desk verification & handoff</p>
              </div>
            </div>

            {/* Member & Reward Summary */}
            <div className="p-3.5 rounded-md bg-[#18181B] border border-zinc-800 space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Recipient:</span>
                <span className="font-medium text-zinc-200">
                  {activeFulfillTarget.member?.firstName} {activeFulfillTarget.member?.lastName} ({activeFulfillTarget.member?.memberCode})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Streak Record:</span>
                <span className="font-mono text-amber-400 font-medium">
                  {activeFulfillTarget.reward?.triggerThreshold} Days Achieved
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-zinc-800/80 pt-2">
                <span className="text-zinc-500">Reward Item:</span>
                <span className="font-medium text-zinc-100">
                  {activeFulfillTarget.reward?.title}
                </span>
              </div>
            </div>

            {/* Staff Notes */}
            <div className="mb-4">
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                Staff Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Handed chocolate whey shake at reception bar"
                value={fulfillNotes}
                onChange={(e) => setFulfillNotes(e.target.value)}
                className="w-full bg-[#18181B] border border-zinc-700 rounded-md px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveFulfillTarget(null)}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors btn-shadow"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={fulfilling}
                onClick={handleConfirmFulfill}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-xs shadow-sm btn-shadow-primary disabled:opacity-50 transition-all"
              >
                {fulfilling ? (
                  <span>Fulfilling...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Fulfill</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <QuickCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onCheckInSuccess={() => fetchWinners()}
      />

      <FrontDeskQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
