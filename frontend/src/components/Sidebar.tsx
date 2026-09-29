'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Flame,
  Award,
  AlertTriangle,
  UserCheck,
  Building2,
  ChevronDown,
  ShieldCheck,
  Trophy,
  X,
  MessageCircle,
  QrCode,
  Sparkles,
  Send,
  Dumbbell,
  LogOut,
} from 'lucide-react';
import { useAuth, GymInfo } from '../lib/AuthProvider';
import { api } from '../lib/api';

interface SidebarProps {
  onOpenQrModal?: () => void;
  onOpenCheckInModal?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

/**
 * DEMO_FALLBACK_GYM: Used ONLY when no auth context is available
 * (e.g. user hasn't logged in, or backend is offline in demo mode).
 * This is a single default gym, NOT a list of all gyms in the system.
 */
const DEMO_FALLBACK_GYM: GymInfo = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Iron House Gym & Fitness',
  slug: 'iron-house-lahore',
  city: 'Lahore, Pakistan',
  currency: 'PKR',
};

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenQrModal,
  onOpenCheckInModal,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const { user, gyms, activeGym, switchGym, logout } = useAuth();

  // Resolved gym: from auth context, or demo fallback
  const currentGym = activeGym || DEMO_FALLBACK_GYM;
  const userGyms = gyms.length > 0 ? gyms : [DEMO_FALLBACK_GYM];
  const hasMultipleGyms = userGyms.length > 1;

  const [showGymDropdown, setShowGymDropdown] = useState(false);

  // WhatsApp Simulator modal state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simPhone, setSimPhone] = useState('+923009876543');
  const [simText, setSimText] = useState('STREAK');
  const [simResponse, setSimResponse] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const handleSelectGym = (gym: GymInfo) => {
    switchGym(gym.id);
    setShowGymDropdown(false);
  };

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

  // Resolved user display
  const userName = user?.name || 'Bilal C.';
  const userRole = user?.role || 'OWNER';
  const userInitials =
    userName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'BC';

  const navSections = [
    {
      title: 'OPERATIONS',
      items: [
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
          badgeColor: 'bg-red-500/10 text-red-400 border border-red-500/20',
        },
        {
          name: 'Members Directory',
          href: '/members',
          icon: Users,
        },
        {
          name: 'Trainers & Diets',
          href: '/trainers',
          icon: Dumbbell,
        },
        {
          name: 'Check-In Kiosk',
          href: '/check-in',
          icon: UserCheck,
        },
      ],
    },
    {
      title: 'RETENTION & REWARDS',
      items: [
        {
          name: 'Reward Rules',
          href: '/rewards',
          icon: Award,
        },
        {
          name: 'Streak Winners',
          href: '/rewards/winners',
          icon: Trophy,
          badge: '6 Won',
          badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0C0C0E] border-r border-zinc-800 select-none">
      {/* Brand Logo & Location */}
      <div className="p-4 border-b border-zinc-800/80">
        <div className="flex items-center justify-between mb-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
              <Flame className="w-4 h-4 text-zinc-100" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold tracking-tight text-zinc-100">GymRetain</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono border border-zinc-700">
                PRO
              </span>
            </div>
          </Link>

          {isOpenMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 btn-shadow"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Gym Location — show dropdown ONLY if user has multiple gyms */}
        <div className="relative">
          {hasMultipleGyms ? (
            <>
              <button
                onClick={() => setShowGymDropdown(!showGymDropdown)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#121215] hover:bg-[#18181B] border border-zinc-800 text-xs font-medium text-zinc-200 transition-colors btn-shadow text-left"
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">{currentGym.name}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0 ml-1" />
              </button>

              {showGymDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-full bg-[#121215] border border-zinc-800 rounded-md shadow-xl py-1 z-50">
                  <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-zinc-500 border-b border-zinc-800/80">
                    Your Gyms
                  </div>
                  {userGyms.map((gym) => (
                    <button
                      key={gym.id}
                      onClick={() => handleSelectGym(gym)}
                      className={`w-full text-left px-2.5 py-2 text-xs transition-colors flex flex-col ${
                        currentGym.id === gym.id
                          ? 'bg-zinc-800 text-white font-medium'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className="truncate">{gym.name}</span>
                      {gym.city && (
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {gym.city.split(',')[0]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Single-gym user: static display, no dropdown */
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#121215] border border-zinc-800 text-xs font-medium text-zinc-200">
              <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">{currentGym.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Action: Front-Desk Check-In CTA */}
      <div className="p-3 border-b border-zinc-800/60">
        {onOpenCheckInModal && (
          <button
            onClick={onOpenCheckInModal}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-xs transition-all shadow-sm btn-shadow-primary"
          >
            <UserCheck className="w-4 h-4" />
            <span>+ Quick Check-In</span>
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all btn-shadow ${
                    isActive
                      ? 'bg-zinc-800 text-white font-medium border border-zinc-700/60 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-zinc-100' : 'text-zinc-400'}`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full shrink-0 ${
                        item.badgeColor || 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Quick Tools */}
        <div className="space-y-1 pt-2 border-t border-zinc-800/80">
          <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            TOOLS
          </div>
          {onOpenQrModal && (
            <button
              onClick={onOpenQrModal}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors btn-shadow text-left"
            >
              <QrCode className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>Front-Desk QR Placard</span>
            </button>
          )}
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-zinc-900 transition-colors btn-shadow text-left"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Test WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Staff User Footer */}
      <div className="p-3 border-t border-zinc-800/80 bg-[#09090B]">
        <div className="flex items-center justify-between p-2 rounded-md bg-[#121215] border border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-medium text-xs text-zinc-300">
              {userInitials}
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-200 leading-none">{userName}</div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{userRole}</div>
            </div>
          </div>
          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-medium border border-emerald-500/20">
            ACTIVE
          </span>
        </div>
      </div>

      {/* WhatsApp Simulator Modal */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121215] max-w-sm w-full rounded-lg p-5 border border-zinc-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => setIsSimulatorOpen(false)}
              className="absolute right-3.5 top-3.5 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 shadow-sm btn-shadow"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">WhatsApp Experience</h3>
                <p className="text-[11px] text-zinc-500">Test inbound keyword response</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Simulated Member Phone
                </label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full bg-[#18181B] border border-zinc-700 rounded-md px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Inbound Keyword
                </label>
                <div className="flex gap-1.5 mb-1.5">
                  {['STREAK', 'STATUS', 'HELP'].map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => setSimText(kw)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all btn-shadow ${
                        simText.toUpperCase() === kw
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {kw}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  className="w-full bg-[#18181B] border border-zinc-700 rounded-md px-3 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500"
                />
              </div>

              <button
                type="button"
                disabled={simLoading}
                onClick={handleSimulate}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-xs shadow-sm btn-shadow-primary transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{simLoading ? 'Simulating...' : 'Send WhatsApp Message'}</span>
              </button>

              {simResponse && (
                <div className="mt-3 p-3 rounded-md bg-[#18181B] border border-emerald-500/20 text-xs text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {simResponse}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left Column, w-64) */}
      <aside className="hidden lg:flex w-64 flex-col shrink-0 min-h-screen sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-Over Backdrop) */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
