'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Flame,
  Award,
  QrCode,
  AlertTriangle,
  UserCheck,
  Building2,
  ChevronDown,
  ShieldCheck,
  MessageCircle,
  Menu,
  X,
  Send,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';

interface TopNavbarProps {
  onOpenQrModal?: () => void;
  onOpenCheckInModal?: () => void;
}

const DEMO_GYMS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Iron House Gym & Fitness',
    slug: 'iron-house-lahore',
    city: 'Lahore, Pakistan',
    currency: 'PKR',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'K-Town Crossfit & Performance',
    slug: 'ktown-crossfit',
    city: 'Karachi, Pakistan',
    currency: 'PKR',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Margalla Heights Fitness Club',
    slug: 'margalla-heights',
    city: 'Islamabad, Pakistan',
    currency: 'PKR',
  },
];

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onOpenQrModal,
  onOpenCheckInModal,
}) => {
  const pathname = usePathname();
  const [selectedGym, setSelectedGym] = useState(DEMO_GYMS[0]);
  const [showGymDropdown, setShowGymDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // WhatsApp Simulator modal state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simPhone, setSimPhone] = useState('+923009876543');
  const [simText, setSimText] = useState('STREAK');
  const [simResponse, setSimResponse] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const handleSelectGym = (gym: typeof DEMO_GYMS[0]) => {
    setSelectedGym(gym);
    api.setGym(gym);
    setShowGymDropdown(false);
  };

  const handleSimulate = async () => {
    setSimLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/v1/messaging/whatsapp/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: simPhone, message: simText, gymId: selectedGym.id }),
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
          `🔥 *${selectedGym.name} Member Status*\nSalam Hamza! Here is your attendance summary:\n\n• *Current Streak:* 12 consecutive days 🔥\n• *Personal Best:* 12 days\n• *Active Plan:* Monthly Gold\n• *Next Reward:* 3 more days until the 15-Day Milestone (Free Whey Protein Shake)! 🎁\n\nDrop by today to keep your streak alive! 💪`,
        );
      } else {
        setSimResponse(
          `Salam! Welcome to *${selectedGym.name}* on WhatsApp.\n\nReply with:\n• *STREAK* — View your active workout streak & badge progress\n• *STATUS* — Check membership expiration date\n• *HELP* — Speak with front-desk reception`,
        );
      }
    } finally {
      setSimLoading(false);
    }
  };

  const navItems = [
    {
      name: 'Overview',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'At-Risk Members',
      href: '/retention',
      icon: AlertTriangle,
      badge: '6 High',
      badgeColor: 'bg-[#D9534F]/20 text-[#D9534F] border border-[#D9534F]/30',
    },
    {
      name: 'Members Directory',
      href: '/members',
      icon: Users,
    },
    {
      name: 'Check-In Kiosk',
      href: '/check-in',
      icon: UserCheck,
    },
    {
      name: 'Rewards & Streaks',
      href: '/rewards',
      icon: Award,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#111111]/95 backdrop-blur-md border-b border-[#26221E] shadow-sm select-none">
        {/* Tier 1: Main Top Bar (Amazon / SaaS Style) */}
        <div className="max-w-[1700px] mx-auto px-4 sm:px-8 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Brand Logo + Tenant Gym Selector */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B7454] via-[#BFA785] to-[#E2D2BC] flex items-center justify-center shadow-md shadow-[#BFA785]/20 group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5 text-[#111111] animate-flame" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-[#F7F5F2]">GymRetain</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#BFA785]/15 text-[#BFA785] font-mono font-bold border border-[#BFA785]/30">
                  PRO
                </span>
              </div>
            </Link>

            <div className="h-5 w-[1px] bg-[#26221E] hidden md:block" />

            {/* Current Tenant Gym Dropdown (Amazon-style deliver/location selector) */}
            <div className="relative">
              <button
                onClick={() => setShowGymDropdown(!showGymDropdown)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1C1814] hover:bg-[#26221E] border border-[#2A2520] hover:border-[#BFA785]/40 transition-all text-left shadow-sm btn-shadow"
                title="Switch Multi-Tenant Gym"
              >
                <Building2 className="w-3.5 h-3.5 text-[#BFA785] shrink-0" />
                <div className="max-w-[170px] truncate">
                  <div className="text-xs font-semibold text-[#F7F5F2] truncate leading-tight">
                    {selectedGym.name}
                  </div>
                  <div className="text-[10px] text-[#A39E98] leading-none">{selectedGym.city.split(',')[0]}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#A39E98] shrink-0 ml-0.5" />
              </button>

              {/* Gym Switcher Dropdown Menu */}
              {showGymDropdown && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-[#1C1814] border border-[#332C26] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[10px] text-[#A39E98] px-2.5 py-1 uppercase font-semibold">
                    Multi-Tenant Gym Isolation
                  </div>
                  {DEMO_GYMS.map((gym) => (
                    <button
                      key={gym.id}
                      onClick={() => handleSelectGym(gym)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-center justify-between shadow-sm btn-shadow my-1 ${
                        selectedGym.id === gym.id
                          ? 'bg-[#BFA785]/20 text-[#BFA785] font-semibold border border-[#BFA785]/30'
                          : 'text-[#A39E98] hover:text-[#F7F5F2] hover:bg-[#26221E]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{gym.name}</div>
                        <div className="text-[10px] text-[#6B6661]">{gym.city}</div>
                      </div>
                      {selectedGym.id === gym.id && (
                        <span className="w-2 h-2 rounded-full bg-[#BFA785]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Quick Action Buttons & Staff Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Front Desk QR Placard Modal Trigger */}
            {onOpenQrModal && (
              <button
                onClick={onOpenQrModal}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1814] hover:bg-[#26221E] border border-[#2A2520] hover:border-[#BFA785]/40 text-xs font-semibold text-[#F7F5F2] hover:text-[#BFA785] transition-all shadow-sm btn-shadow"
                title="Open Printable Front-Desk Placard"
              >
                <QrCode className="w-3.5 h-3.5 text-[#BFA785]" />
                <span className="hidden xl:inline">Front-Desk QR</span>
              </button>
            )}

            {/* Test WhatsApp Experience Button */}
            <button
              onClick={() => {
                setIsSimulatorOpen(true);
                setSimResponse(null);
              }}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1814] hover:bg-[#26221E] border border-[#2A2520] hover:border-[#4E9F6E]/40 text-xs font-semibold text-[#A39E98] hover:text-[#4E9F6E] transition-all shadow-sm btn-shadow"
              title="Test Member WhatsApp Interaction"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#4E9F6E]" />
              <span>Test WhatsApp</span>
            </button>

            {/* Quick Check-In CTA Button */}
            {onOpenCheckInModal && (
              <button
                onClick={onOpenCheckInModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#BFA785] hover:bg-[#B29976] text-xs font-bold text-[#111111] transition-all shadow-md shadow-[#BFA785]/25 hover:shadow-lg hover:shadow-[#BFA785]/35 btn-shadow-primary"
              >
                <UserCheck className="w-4 h-4" />
                <span>Check-In</span>
              </button>
            )}

            <div className="h-5 w-[1px] bg-[#26221E] hidden sm:block" />

            {/* Staff User Avatar */}
            <div className="flex items-center gap-2 pl-0.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8B7454] to-[#BFA785] flex items-center justify-center font-bold text-xs text-[#111111] shadow-sm shadow-[#BFA785]/20">
                BC
              </div>
              <div className="hidden 2xl:block text-left">
                <div className="text-xs font-semibold text-[#F7F5F2] leading-none">Bilal C.</div>
                <div className="text-[9px] text-[#BFA785] font-mono font-bold">OWNER</div>
              </div>
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#1C1814] text-[#A39E98] hover:text-[#F7F5F2] border border-[#2A2520] shadow-sm btn-shadow"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Tier 2: Horizontal Navigation Strip (Amazon / SaaS Category Bar) */}
        <div className="border-t border-[#26221E] bg-[#161310]/95 overflow-x-auto scrollbar-none">
          <div className="max-w-[1700px] mx-auto px-4 sm:px-8 py-1.5 flex items-center justify-between gap-4 min-w-max sm:min-w-0">
            {/* Horizontal Nav Tabs */}
            <nav className="flex items-center gap-1.5 sm:gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all btn-shadow ${
                      isActive
                        ? 'bg-[#BFA785]/20 text-[#BFA785] border border-[#BFA785]/40 shadow-sm font-bold'
                        : 'text-[#A39E98] hover:text-[#F7F5F2] hover:bg-[#1C1814] border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#BFA785]' : 'text-[#A39E98]'}`} />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-sm ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right: Walled Domain Security Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#4E9F6E]/10 border border-[#4E9F6E]/25 text-[10px] font-mono text-[#4E9F6E] shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4E9F6E]" />
              <span>{selectedGym.slug}.gymretain.app</span>
              <span className="text-[8px] bg-[#4E9F6E]/20 text-[#4E9F6E] px-1 py-0.2 rounded font-bold uppercase">
                WALLED
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Slide-Down Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-[#26221E] bg-[#161310] p-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
            {/* Gym Selector inside mobile drawer */}
            <div className="p-3 rounded-xl bg-[#1C1814] border border-[#2A2520]">
              <label className="text-[10px] uppercase font-bold text-[#A39E98] block mb-1.5">
                Current Gym Tenant
              </label>
              <div className="flex items-center justify-between text-xs font-semibold text-[#F7F5F2]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#BFA785]" />
                  <span>{selectedGym.name}</span>
                </div>
                <span className="text-[10px] text-[#A39E98] font-mono">{selectedGym.city.split(',')[0]}</span>
              </div>
            </div>

            {/* Mobile Nav Links */}
            <div className="space-y-1 pt-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all btn-shadow ${
                      isActive
                        ? 'bg-[#BFA785]/20 text-[#BFA785] border border-[#BFA785]/40 shadow-sm font-bold'
                        : 'text-[#A39E98] hover:text-[#F7F5F2] hover:bg-[#1C1814] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#BFA785]' : 'text-[#A39E98]'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Mobile Utilities */}
            <div className="pt-2 border-t border-[#26221E] grid grid-cols-2 gap-2">
              {onOpenQrModal && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenQrModal();
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1C1814] text-xs font-semibold text-[#F7F5F2] border border-[#2A2520] btn-shadow"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#BFA785]" />
                  <span>QR Placard</span>
                </button>
              )}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSimulatorOpen(true);
                  setSimResponse(null);
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1C1814] text-xs font-semibold text-[#4E9F6E] border border-[#2A2520] btn-shadow"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#4E9F6E]" />
                <span>Test WhatsApp</span>
              </button>
            </div>
          </div>
        )}
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
