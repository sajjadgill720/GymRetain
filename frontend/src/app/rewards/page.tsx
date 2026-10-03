'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../components/AppLayout';
import { api } from '../../lib/api';
import { Reward } from '../../types';
import {
  Award,
  Flame,
  Plus,
  Sparkles,
  Trophy,
  Gift,
  Tag,
  CheckCircle2,
  X,
  ArrowRight,
} from '@/components/icons';
import Link from 'next/link';

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddRewardOpen, setIsAddRewardOpen] = useState(false);

  // New Reward Rule form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardType, setRewardType] = useState<'BADGE' | 'DISCOUNT_PERCENT' | 'FREE_ITEM'>('BADGE');
  const [triggerThreshold, setTriggerThreshold] = useState(10);
  const [rewardValue, setRewardValue] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      const list = await api.getRewards();
      setRewards(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setSubmitting(true);
    try {
      await api.createReward({
        title,
        description,
        rewardType,
        triggerType: 'STREAK_MILESTONE',
        triggerThreshold,
        rewardValue,
      });

      setIsAddRewardOpen(false);
      setTitle('');
      setDescription('');
      await fetchRewards();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout onRefreshData={fetchRewards}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
        {/* Page Context Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-surface-border">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600 dark:text-cyan-400" />
                Attendance Rewards &amp; Milestones
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-subtle text-content-secondary border border-surface-border">
                {rewards.length} Active Rewards
              </span>
            </div>
            <p className="text-xs text-content-tertiary mt-1">
              Set workout streak milestones to reward consistent members with fee discounts, shakes, and gym perks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/rewards/winners"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-semibold text-amber-600 dark:text-amber-400 transition-colors btn-shadow"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>View Rewarded Members</span>
              <ArrowRight className="w-3.5 h-3.5 text-content-tertiary" />
            </Link>

            <button
              onClick={() => setIsAddRewardOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-xs shadow-sm btn-shadow transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Reward Milestone</span>
            </button>
          </div>
        </div>

        {/* Milestone Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="bg-surface border border-surface-border rounded-2xl p-4 sm:p-5 relative group hover:border-purple-500/40 dark:hover:border-cyan-400/40 transition-all flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-mono font-medium border border-amber-500/20">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span>{reward.triggerThreshold}-Day Streak</span>
                  </div>

                  <span className="text-[10px] uppercase font-semibold text-content-tertiary bg-surface-subtle px-2 py-0.5 rounded border border-surface-border">
                    {reward.rewardType.replace('_', ' ')}
                  </span>
                </div>

                <h2 className="text-base font-semibold text-content-primary mt-3 tracking-tight">
                  {reward.title}
                </h2>

                <p className="text-xs text-content-secondary mt-1 leading-relaxed">
                  {reward.description || 'Awarded automatically when a member hits this streak threshold.'}
                </p>
              </div>

              <div className="pt-4 border-t border-surface-border mt-5 flex items-center justify-between text-xs">
                <div className="text-content-tertiary">
                  Redeemed:{' '}
                  <span className="font-semibold text-content-primary font-mono">
                    {reward._count?.redemptions ?? 0} members
                  </span>
                </div>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active Rule
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Reward Modal */}
      {isAddRewardOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface max-w-md w-full rounded-3xl p-5 sm:p-6 border border-surface-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => setIsAddRewardOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-content-tertiary hover:text-content-primary hover:bg-surface-subtle shadow-sm btn-shadow"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-content-primary">Create Streak Milestone</h3>
                <p className="text-[11px] text-content-tertiary">Tenant-isolated retention rule</p>
              </div>
            </div>

            <form onSubmit={handleCreateReward} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-medium text-content-secondary block mb-1">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 21-Day Habit Master"
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-purple-500 dark:focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-content-secondary block mb-1">
                  Required Streak (Consecutive Days) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={triggerThreshold}
                  onChange={(e) => setTriggerThreshold(parseInt(e.target.value, 10))}
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary font-mono focus:outline-none focus:border-purple-500 dark:focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-content-secondary block mb-1">
                  Reward Type
                </label>
                <select
                  value={rewardType}
                  onChange={(e) => setRewardType(e.target.value as any)}
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary focus:outline-none focus:border-purple-500 dark:focus:border-cyan-400"
                >
                  <option value="BADGE">Digital Badge &amp; Profile Flair</option>
                  <option value="FREE_ITEM">Free Item / Smoothie / Shake</option>
                  <option value="DISCOUNT_PERCENT">Renewal Discount Percentage</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-content-secondary block mb-1">
                  Description / Redemptions Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Show badge at reception juice bar to claim free whey protein shake."
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-2 text-xs text-content-primary placeholder-content-tertiary focus:outline-none focus:border-purple-500 dark:focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsAddRewardOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-content-tertiary hover:text-content-primary transition-colors btn-shadow"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-xs shadow-sm btn-shadow disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Saving...' : 'Save Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
