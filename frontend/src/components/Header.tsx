'use client';

import React, { useState } from 'react';
import { UserCheck, Plus, ShieldCheck, Menu, MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenCheckInModal?: () => void;
  onOpenAddMemberModal?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenCheckInModal,
  onOpenAddMemberModal,
  onToggleMobileMenu,
}) => {
  const currentGym = api.getCurrentGym();
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simPhone, setSimPhone] = useState('+923009876543');
  const [simText, setSimText] = useState('STREAK');
  const [simResponse, setSimResponse] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const handleSimulate = async () => {
    setSimLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/v1/messaging/whatsapp/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: simPhone, message: simText, gymId: currentGym.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setSimResponse(data.reply);
      } else {
        throw new Error();
      }
    } catch {
      // Fallback demo simulation
      if (simText.toUpperCase().includes('STREAK')) {
        setSimResponse(
          `🔥 *${currentGym.name} Member Status*\nSalam Hamza! Here is your attendance summary:\n\n• *Current Streak:* 12 consecutive days 🔥\n• *Personal Best:* 12 days\n• *Active Plan:* Monthly Gold\n• *Next Reward:* 3 more days until the 15-Day Milestone (Free Whey Protein Shake)! 🎁\n\nDrop by today to keep your streak alive! 💪`,
        );
      } else {
        setSimResponse(
          `Salam! Welcome to *${currentGym.name}* on WhatsApp.\n\nReply with:\n• *STREAK* — View your active workout streak & badge progress\n• *STATUS* — Check membership expiration date\n• *HELP* — Speak with front-desk reception`,
        );
      }
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <>
      <header className="border-b border-white/5 bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mobile Menu + Titles + Walled Subdomain Badge */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg bg-surface-100 text-slate-300 hover:text-white border border-white/10"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">{title}</h1>

              {/* Walled Workspace Domain Badge (Signals Data Privacy on all screens) */}
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] sm:text-[10px] font-mono text-emerald-400">
                <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-400" />
                <span className="truncate max-w-[140px] sm:max-w-none">{currentGym.slug}.gymretain.app</span>
                <span className="text-[8px] bg-emerald-400/20 text-emerald-300 px-1 py-0.2 rounded font-bold uppercase">
                  WALLED
                </span>
              </div>
            </div>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{subtitle}</p>}
          </div>
        </div>

        {/* Right: Actions & Staff Profile */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* WhatsApp Member Experience Test */}
          <button
            onClick={() => {
              setIsSimulatorOpen(true);
              setSimResponse(null);
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-all"
            title="Test what members see on WhatsApp when they text STREAK"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test Member WhatsApp</span>
          </button>

          {/* Quick Check-in Button */}
          {onOpenCheckInModal && (
            <button
              onClick={onOpenCheckInModal}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-surface-100 hover:bg-surface-50 border border-white/10 text-xs font-semibold text-white transition-all shadow-sm hover:border-brand-500/40"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Check-In</span>
            </button>
          )}

          {/* Add Member Button */}
          {onOpenAddMemberModal && (
            <button
              onClick={onOpenAddMemberModal}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white transition-all shadow-glow hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Member</span>
            </button>
          )}

          <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />

          {/* Staff User Avatar */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center font-bold text-xs text-slate-900 shadow-md">
              BC
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold text-white">Bilal Chaudhry</div>
              <div className="text-[10px] text-amber-400 font-mono">OWNER</div>
            </div>
          </div>
        </div>
      </header>

      {/* WhatsApp Inbound Keyword Simulator Modal */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full rounded-2xl p-5 border border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsSimulatorOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">WhatsApp Member Experience</h3>
                <p className="text-[11px] text-slate-400">Zero-app friction: Text STREAK</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Member Phone (Hamza Sheikh):
                </label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full bg-[#10141f] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Message Keyword:
                </label>
                <div className="flex gap-1.5">
                  {['STREAK', 'STATUS', 'HELP'].map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => setSimText(kw)}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-all ${
                        simText === kw
                          ? 'bg-emerald-500 text-white'
                          : 'bg-surface-100 text-slate-300 hover:bg-surface-50'
                      }`}
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSimulate}
                disabled={simLoading}
                className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-xs tracking-wide shadow-glow transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{simLoading ? 'Sending...' : `Send "${simText}" via WhatsApp`}</span>
              </button>

              {/* WhatsApp Chat Bubble Display */}
              {simResponse && (
                <div className="mt-4 p-3.5 rounded-xl bg-[#0b241b] border border-emerald-500/30 text-xs text-emerald-100 font-sans shadow-inner whitespace-pre-line leading-relaxed">
                  {simResponse}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
