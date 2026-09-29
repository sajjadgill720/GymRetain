'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Flame,
  Building2,
  ChevronDown,
  MessageCircle,
  Menu,
  X,
  Send,
  QrCode,
  UserCheck,
} from 'lucide-react';
import { useAuth, GymInfo } from '../lib/AuthProvider';

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
  const { user, gyms, activeGym, switchGym } = useAuth();

  // Resolved gym: from auth context, or fallback
  const currentGym = activeGym || DEMO_FALLBACK_GYM;
  const userGyms = gyms.length > 0 ? gyms : [DEMO_FALLBACK_GYM];
  const hasMultipleGyms = userGyms.length > 1;

  const [showGymDropdown, setShowGymDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#09090B] border-b border-zinc-800 select-none">
        {/* Tier 1: Main Top Bar (Linear / Stripe Style) */}
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* Left: Mobile Brand / Gym Location Badge */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Logo — visible on mobile or fallback */}
            <Link href="/" className="flex items-center gap-2 shrink-0 group lg:hidden">
              <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white">
                <Flame className="w-4 h-4 text-zinc-200" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-zinc-100">GymRetain</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono border border-zinc-700">
                  PRO
                </span>
              </div>
            </Link>

            {/* Gym Location Indicator (Single gym = static badge; Multiple gyms = dropdown switcher) */}
            <div className="relative">
              {hasMultipleGyms ? (
                <>
                  <button
                    onClick={() => setShowGymDropdown(!showGymDropdown)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#121215] hover:bg-[#18181B] border border-zinc-800 hover:border-zinc-700 transition-all text-left shadow-sm btn-shadow"
                    title="Switch Gym Branch"
                  >
                    <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <div className="max-w-[180px] truncate">
                      <div className="text-xs font-medium text-zinc-200 truncate leading-tight">
                        {currentGym.name}
                      </div>
                      {currentGym.city && (
                        <div className="text-[10px] text-zinc-500 leading-none truncate">
                          {currentGym.city.split(',')[0]}
                        </div>
                      )}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0 ml-0.5" />
                  </button>

                  {/* Gym Switcher Dropdown Menu (ONLY shows user's actual authorized gyms) */}
                  {showGymDropdown && (
                    <div className="absolute left-0 top-full mt-1.5 w-72 bg-[#121215] border border-zinc-800 rounded-lg shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="text-[10px] text-zinc-500 px-2 py-1 uppercase font-medium tracking-wider">
                        Your Gym Locations
                      </div>
                      {userGyms.map((gym) => (
                        <button
                          key={gym.id}
                          onClick={() => handleSelectGym(gym)}
                          className={`w-full text-left p-2 rounded-md text-xs transition-colors flex items-center justify-between shadow-sm btn-shadow my-0.5 ${
                            currentGym.id === gym.id
                              ? 'bg-zinc-800 text-white font-medium border border-zinc-700'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-zinc-200">{gym.name}</div>
                            {gym.city && <div className="text-[10px] text-zinc-500">{gym.city}</div>}
                          </div>
                          {currentGym.id === gym.id && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Single-gym user: Clean static badge, NO dropdown, NO unrelated gyms */
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[#121215] border border-zinc-800 text-left">
                  <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <div className="max-w-[200px] truncate">
                    <div className="text-xs font-medium text-zinc-200 truncate leading-tight">
                      {currentGym.name}
                    </div>
                    {currentGym.city && (
                      <div className="text-[10px] text-zinc-500 leading-none truncate">
                        {currentGym.city.split(',')[0]}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Quick Action Buttons & Staff Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Front Desk QR Placard Modal Trigger */}
            {onOpenQrModal && (
              <button
                onClick={onOpenQrModal}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#121215] hover:bg-[#18181B] border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-300 hover:text-white transition-all shadow-sm btn-shadow"
                title="Open Printable Front-Desk Placard"
              >
                <QrCode className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden xl:inline">Front-Desk QR</span>
              </button>
            )}

            {/* Test WhatsApp Experience Button */}
            <button
              onClick={() => {
                setIsSimulatorOpen(true);
                setSimResponse(null);
              }}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#121215] hover:bg-[#18181B] border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-all shadow-sm btn-shadow"
              title="Test Member WhatsApp Interaction"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Test WhatsApp</span>
            </button>

            {/* Quick Check-In CTA Button */}
            {onOpenCheckInModal && (
              <button
                onClick={onOpenCheckInModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-medium text-xs transition-all shadow-sm btn-shadow-primary"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>+ Check-In</span>
              </button>
            )}

            <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

            {/* Staff User Avatar */}
            <div className="flex items-center gap-2 pl-0.5">
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-medium text-xs text-zinc-300">
                {userInitials}
              </div>
              <div className="hidden 2xl:block text-left">
                <div className="text-xs font-medium text-zinc-200 leading-none">{userName}</div>
                <div className="text-[10px] text-zinc-500 font-mono">{userRole}</div>
              </div>
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={onToggleMobileMenu || (() => setIsMobileMenuOpen(!isMobileMenuOpen))}
              className="lg:hidden p-1.5 rounded-md bg-[#121215] text-zinc-400 hover:text-zinc-200 border border-zinc-800 shadow-sm btn-shadow"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* WhatsApp Inbound Keyword Simulator Modal */}
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
                <h3 className="text-sm font-semibold text-zinc-100">WhatsApp Member Experience</h3>
                <p className="text-[11px] text-zinc-500">Test inbound keyword response</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Member Phone (Hamza Sheikh):
                </label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-md px-2.5 py-1.5 text-xs text-zinc-100 font-mono shadow-inner outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                  Message Keyword:
                </label>
                <div className="flex gap-1.5">
                  {['STREAK', 'STATUS', 'HELP'].map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => setSimText(kw)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all shadow-sm btn-shadow ${
                        simText === kw
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
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
                className="w-full py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs shadow-sm btn-shadow transition-all flex items-center justify-center gap-1.5 mt-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{simLoading ? 'Sending...' : `Send "${simText}" via WhatsApp`}</span>
              </button>

              {/* WhatsApp Chat Bubble Display */}
              {simResponse && (
                <div className="mt-3 p-3 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-sans shadow-inner whitespace-pre-line leading-relaxed">
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
