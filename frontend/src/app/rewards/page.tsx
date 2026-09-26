'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Header } from '../../components/Header';
import { QuickCheckInModal } from '../../components/QuickCheckInModal';
import { FrontDeskQrModal } from '../../components/FrontDeskQrModal';
import { api } from '../../lib/api';
import { Reward } from '../../types';
import {
  Award,
  Flame,
  Plus,
  Sparkles,
  Gift,
  Tag,
  Clock,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddRewardOpen, setIsAddRewardOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

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
    <div className="min-h-screen bg-[#090d16] flex">
      <Sidebar
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenCheckInModal={() => setIsCheckInOpen(true)}
      />

      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <Header
          title="Rewards & Streak Gamification Engine"
          subtitle="Configure streak milestones to gamify gym loyalty and celebrate consistent members"
          onOpenCheckInModal={() => setIsCheckInOpen(true)}
        />

        <div className="p-8 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
          {/* Header Action Card */}
          <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-glow-orange">
                <Award className="w-6 h-6 animate-flame" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Gym Milestone Rewards Engine
                </h2>
                <p className="text-xs text-slate-400">
                  Automatically unlocks when a member hits consecutive day check-in milestones.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddRewardOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white shadow-glow transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create Milestone Rule</span>
            </button>
          </div>

          {/* Active Rewards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden group hover:border-amber-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold">
                      <Flame className="w-3.5 h-3.5 animate-flame" />
                      <span>{reward.triggerThreshold}-Day Streak</span>
                    </div>

                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {reward.rewardType.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mt-4 tracking-tight group-hover:text-amber-300 transition-colors">
                    {reward.title}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {reward.description || 'Awarded automatically when member reaches milestone.'}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/5 mt-6 flex items-center justify-between text-xs">
                  <div className="text-slate-400">
                    Redeemed:{' '}
                    <span className="font-bold text-white font-mono">
                      {reward._count?.redemptions ?? 0} members
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-brand-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active Rule
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Add Reward Modal */}
      {isAddRewardOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl p-6 border border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsAddRewardOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Create Streak Milestone</h3>
                <p className="text-xs text-slate-400">Configurable per gym tenant</p>
              </div>
            </div>

            <form onSubmit={handleCreateReward} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 21-Day Habit Master"
                  className="w-full bg-[#10141f] border border-white/10 focus:border-brand-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Required Streak (Consecutive Days) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={triggerThreshold}
                  onChange={(e) => setTriggerThreshold(parseInt(e.target.value, 10))}
                  className="w-full bg-[#10141f] border border-white/10 focus:border-brand-500 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Reward Type
                </label>
                <select
                  value={rewardType}
                  onChange={(e) => setRewardType(e.target.value as any)}
                  className="w-full bg-[#10141f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="BADGE">Digital Badge & Profile Flair</option>
                  <option value="FREE_ITEM">Free Item / Smoothie / Shake</option>
                  <option value="DISCOUNT_PERCENT">Renewal Discount Percentage</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Description / Redemptions Notes
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Show badge at reception juice bar to claim free whey protein shake."
                  className="w-full bg-[#10141f] border border-white/10 focus:border-brand-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRewardOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-xs font-semibold text-white shadow-glow transition-all"
                >
                  {submitting ? 'Saving...' : 'Save Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <QuickCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onCheckInSuccess={() => fetchRewards()}
      />

      <FrontDeskQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
}
