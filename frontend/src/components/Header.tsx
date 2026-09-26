'use client';

import React from 'react';
import { UserCheck, Plus, Bell, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenCheckInModal?: () => void;
  onOpenAddMemberModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenCheckInModal,
  onOpenAddMemberModal,
}) => {
  const currentGym = api.getCurrentGym();

  return (
    <header className="h-20 border-b border-white/5 bg-[#090d16]/80 backdrop-blur-md sticky top-0 z-20 px-8 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Check-in Button */}
        {onOpenCheckInModal && (
          <button
            onClick={onOpenCheckInModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-100 hover:bg-surface-50 border border-white/10 text-xs font-semibold text-white transition-all shadow-sm hover:border-brand-500/40"
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Quick Check-In</span>
          </button>
        )}

        {/* Add Member Button */}
        {onOpenAddMemberModal && (
          <button
            onClick={onOpenAddMemberModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white transition-all shadow-glow hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        )}

        <div className="h-6 w-[1px] bg-white/10 mx-1" />

        {/* Staff User Avatar */}
        <div className="flex items-center gap-3 pl-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center font-bold text-xs text-slate-900 shadow-md">
            BC
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-white">Bilal Chaudhry</div>
            <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              GYM OWNER
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
