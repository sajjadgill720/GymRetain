'use client';

import React, { useState } from 'react';
import { UserCheck, Plus, ShieldCheck, Menu, MessageCircle, X, Send, Sparkles } from '@/components/icons';
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
      <header className="border-b border-[#26221E] bg-[#111111]/95 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mobile Menu + Titles + Walled Subdomain Badge */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl bg-[#1C1814] text-[#A39E98] hover:text-[#F7F5F2] border border-[#2A2520] shadow-sm shadow-black/40 hover:shadow-md btn-shadow"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#F7F5F2]">{title}</h1>

              {/* Walled Workspace Domain Badge (Signals Data Privacy on all screens) */}
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-0.5 rounded-full bg-[#4E9F6E]/10 border border-[#4E9F6E]/25 text-[9px] sm:text-[10px] font-mono text-[#4E9F6E] shadow-sm">
                <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#4E9F6E]" />
                <span className="truncate max-w-[140px] sm:max-w-none">{currentGym.slug}.gymretain.app</span>
                <span className="text-[8px] bg-[#4E9F6E]/20 text-[#4E9F6E] px-1 py-0.2 rounded font-bold uppercase">
                  WALLED
                </span>
              </div>
            </div>
            {subtitle && <p className="text-xs text-[#A39E98] mt-0.5 line-clamp-1">{subtitle}</p>}
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
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1814] hover:bg-[#26221E] border border-[#2A2520] hover:border-[#BFA785]/40 text-[#A39E98] hover:text-[#BFA785] text-xs font-semibold transition-all shadow-sm shadow-black/40 hover:shadow-md btn-shadow"
            title="Test what members see on WhatsApp when they text STREAK"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#4E9F6E]" />
            <span>Test Member WhatsApp</span>
          </button>

          {/* Quick Check-in Button */}
          {onOpenCheckInModal && (
            <button
              onClick={onOpenCheckInModal}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#1C1814] hover:bg-[#26221E] border border-[#2A2520] hover:border-[#BFA785]/40 text-xs font-semibold text-[#F7F5F2] transition-all shadow-sm shadow-black/40 hover:shadow-md btn-shadow"
            >
              <UserCheck className="w-4 h-4 text-[#4E9F6E]" />
              <span>Check-In</span>
            </button>
          )}

          {/* Add Member Button */}
          {onOpenAddMemberModal && (
            <button
              onClick={onOpenAddMemberModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#BFA785] hover:bg-[#B29976] text-xs font-bold text-[#111111] transition-all shadow-md shadow-[#BFA785]/25 hover:shadow-lg hover:shadow-[#BFA785]/35 btn-shadow-primary"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Member</span>
            </button>
          )}

          <div className="h-6 w-[1px] bg-[#26221E] hidden sm:block" />

          {/* Staff User Avatar */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8B7454] to-[#BFA785] flex items-center justify-center font-bold text-xs text-[#111111] shadow-sm shadow-[#BFA785]/20">
              BC
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold text-[#F7F5F2]">Bilal Chaudhry</div>
              <div className="text-[10px] text-[#BFA785] font-mono font-bold">OWNER</div>
            </div>
          </div>
        </div>
      </header>

      {/* WhatsApp Inbound Keyword Simulator Modal */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#161310] max-w-sm w-full rounded-2xl p-6 border border-[#2A2520] shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsSimulatorOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-[#A39E98] hover:text-white hover:bg-[#26221E] shadow-sm btn-shadow"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-[#4E9F6E]/15 text-[#4E9F6E] flex items-center justify-center border border-[#4E9F6E]/30 shadow-sm shadow-[#4E9F6E]/20">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F7F5F2]">WhatsApp Member Experience</h3>
                <p className="text-[11px] text-[#A39E98]">Zero-app friction: Text STREAK</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[#A39E98] block mb-1.5">
                  Member Phone (Hamza Sheikh):
                </label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full bg-[#1C1814] border border-[#2A2520] focus:border-[#BFA785] rounded-xl px-3 py-2 text-xs text-[#F7F5F2] font-mono shadow-inner outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#A39E98] block mb-1.5">
                  Message Keyword:
                </label>
                <div className="flex gap-2">
                  {['STREAK', 'STATUS', 'HELP'].map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => setSimText(kw)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition-all shadow-sm btn-shadow ${
                        simText === kw
                          ? 'bg-[#4E9F6E] text-white shadow-[#4E9F6E]/30 font-bold'
                          : 'bg-[#1C1814] text-[#A39E98] hover:text-[#F7F5F2] hover:bg-[#26221E] border border-[#2A2520]'
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
                className="w-full py-2.5 rounded-xl bg-[#4E9F6E] hover:bg-[#41885C] disabled:opacity-50 text-white font-bold text-xs tracking-wide shadow-md shadow-[#4E9F6E]/30 hover:shadow-lg hover:shadow-[#4E9F6E]/40 btn-shadow transition-all flex items-center justify-center gap-1.5 mt-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{simLoading ? 'Sending...' : `Send "${simText}" via WhatsApp`}</span>
              </button>

              {/* WhatsApp Chat Bubble Display */}
              {simResponse && (
                <div className="mt-4 p-4 rounded-xl bg-[#14241B] border border-[#4E9F6E]/30 text-xs text-[#EAF5EF] font-sans shadow-inner whitespace-pre-line leading-relaxed">
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
