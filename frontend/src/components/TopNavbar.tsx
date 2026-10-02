'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Bell,
  Menu,
  MessageCircle,
  X,
  Send,
  QrCode,
  UserCheck,
  Building2,
  Sparkles,
} from '@/components/icons';
import { useAuth, GymInfo } from '../lib/AuthProvider';
import { ThemeToggle } from './ThemeToggle';
import { GymLogo } from './GymLogo';

interface TopNavbarProps {
  onOpenQrModal?: () => void;
  onOpenCheckInModal?: () => void;
  onToggleMobileMenu?: () => void;
}

const DEMO_FALLBACK_GYM: GymInfo = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Iron House Gym & Fitness',
  slug: 'iron-house-lahore',
  city: 'Lahore, Pakistan',
  currency: 'PKR',
};

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onOpenQrModal,
  onOpenCheckInModal,
  onToggleMobileMenu,
}) => {
  const { user, activeGym } = useAuth();
  const currentGym = activeGym || DEMO_FALLBACK_GYM;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simPhone, setSimPhone] = useState('+923009876543');
  const [simText, setSimText] = useState('STREAK');
  const [simResponse, setSimResponse] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const userName = user?.name || 'Bilal C.';
  const firstName = userName.split(' ')[0] || 'Bilal';
  const userInitials =
    userName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'BC';

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
      <header className="sticky top-0 z-20 w-full bg-surface/90 backdrop-blur-md border-b border-surface-border select-none transition-colors duration-200">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Greeting matching Foxstocks "Hello Matt," */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-content-secondary hover:text-content-primary hover:bg-surface-subtle border border-surface-border btn-shadow"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <GymLogo size={26} />
              <span className="font-bold text-sm text-content-primary">GymRetain</span>
            </Link>

            <div className="hidden sm:block">
              <h1 className="text-base sm:text-lg font-extrabold text-content-primary tracking-tight font-sans">
                Hello {firstName},
              </h1>
            </div>
          </div>

          {/* Center: Search pill matching Foxstocks Image 1 */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-content-tertiary">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for members, check-ins, streaks..."
                className="w-full pl-9 pr-4 py-2 rounded-2xl bg-surface-subtle hover:bg-surface focus:bg-surface border border-surface-border focus:border-purple-500 dark:focus:border-cyan-400 focus:ring-2 focus:ring-purple-500/20 text-xs text-content-primary placeholder-content-tertiary outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Right: Actions, Theme Toggle, Bell, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Front Desk QR trigger */}
            {onOpenQrModal && (
              <button
                onClick={onOpenQrModal}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-semibold text-content-secondary hover:text-content-primary transition-all btn-shadow"
                title="Printable QR kiosk placard"
              >
                <QrCode className="w-3.5 h-3.5 text-purple-600 dark:text-cyan-400" />
                <span>Front-Desk QR</span>
              </button>
            )}

            {/* Test WhatsApp Experience Button */}
            <button
              onClick={() => {
                setIsSimulatorOpen(true);
                setSimResponse(null);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-xs font-semibold text-content-secondary hover:text-content-primary transition-all btn-shadow"
              title="Test WhatsApp member response"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden lg:inline">WhatsApp Simulator</span>
            </button>

            {/* Theme Toggle (Sun / Moon) */}
            <ThemeToggle />

            {/* Notification Bell matching Image 1 */}
            <button
              className="relative p-2 rounded-xl bg-surface hover:bg-surface-subtle border border-surface-border text-content-secondary hover:text-content-primary transition-colors btn-shadow"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-surface" />
            </button>

            {/* User Profile Avatar matching Image 1 */}
            <div className="flex items-center gap-2 pl-0.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 dark:from-cyan-400 dark:to-blue-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                {userInitials}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* WhatsApp Simulation Modal */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface max-w-sm w-full rounded-2xl p-5 border border-surface-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => setIsSimulatorOpen(false)}
              className="absolute right-3.5 top-3.5 p-1 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-subtle"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-content-primary">WhatsApp Simulator</h3>
                <p className="text-[11px] text-content-tertiary">Inbound retention keywords</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-content-secondary block mb-1">
                  Member Phone:
                </label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3 py-1.5 text-xs text-content-primary font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-content-secondary block mb-1">
                  Keyword Trigger:
                </label>
                <div className="flex gap-1.5">
                  {['STREAK', 'STATUS', 'HELP'].map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => setSimText(kw)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
                        simText === kw
                          ? 'bg-emerald-600 text-white font-semibold shadow'
                          : 'bg-surface-subtle text-content-secondary hover:text-content-primary border border-surface-border'
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
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow transition-all flex items-center justify-center gap-1.5 btn-shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{simLoading ? 'Sending...' : `Send "${simText}" via WhatsApp`}</span>
              </button>

              {simResponse && (
                <div className="mt-3 p-3 rounded-xl bg-surface-subtle border border-surface-border text-xs text-content-primary whitespace-pre-line leading-relaxed shadow-inner">
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
