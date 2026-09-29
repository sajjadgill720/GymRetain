'use client';

import React from 'react';
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
  X,
} from 'lucide-react';
import { api } from '../lib/api';

interface SidebarProps {
  onOpenQrModal?: () => void;
  onOpenCheckInModal?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenQrModal,
  onOpenCheckInModal,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const [selectedGym, setSelectedGym] = React.useState(DEMO_GYMS[0]);
  const [showGymDropdown, setShowGymDropdown] = React.useState(false);

  const handleSelectGym = (gym: typeof DEMO_GYMS[0]) => {
    setSelectedGym(gym);
    api.setGym(gym);
    setShowGymDropdown(false);
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
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
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
      highlight: true,
    },
    {
      name: 'Rewards & Streaks',
      href: '/rewards',
      icon: Award,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#161310] border-r border-[#26221E] select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#26221E] flex items-center justify-between">
        <Link href="/" onClick={onCloseMobile} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8B7454] via-[#BFA785] to-[#E2D2BC] flex items-center justify-center shadow-md shadow-[#BFA785]/20">
            <Flame className="w-6 h-6 text-[#111111] animate-flame" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#F7F5F2] flex items-center gap-1.5">
              GymRetain
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#BFA785]/15 text-[#BFA785] font-mono font-bold border border-[#BFA785]/30">
                PRO
              </span>
            </span>
            <p className="text-xs text-[#A39E98]">Retention & Streaks</p>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-[#A39E98] hover:text-white rounded-lg hover:bg-[#26221E] shadow-sm btn-shadow"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Gym Tenant Switcher */}
      <div className="p-4 border-b border-[#26221E]">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-[#A39E98] mb-2 block">
          Current Tenant Gym
        </label>
        <div className="relative">
          <button
            onClick={() => setShowGymDropdown(!showGymDropdown)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#1C1814] hover:bg-[#26221E] border border-[#2A2520] transition-all text-left shadow-sm shadow-black/40 hover:shadow-md group btn-shadow"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Building2 className="w-4 h-4 text-[#BFA785] shrink-0" />
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-[#F7F5F2] truncate">
                  {selectedGym.name}
                </div>
                <div className="text-[10px] text-[#A39E98]">{selectedGym.city}</div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[#A39E98] group-hover:text-white transition-colors shrink-0" />
          </button>

          {showGymDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#1C1814] border border-[#332C26] rounded-xl shadow-2xl p-1.5 z-50">
              <div className="text-[10px] text-[#A39E98] px-2 py-1 uppercase font-semibold">
                Switch Multi-Tenant Gym
              </div>
              {DEMO_GYMS.map((gym) => (
                <button
                  key={gym.id}
                  onClick={() => handleSelectGym(gym)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between shadow-sm btn-shadow ${
                    selectedGym.id === gym.id
                      ? 'bg-[#BFA785]/20 text-[#BFA785] font-semibold border border-[#BFA785]/30'
                      : 'text-[#A39E98] hover:text-[#F7F5F2] hover:bg-[#26221E]'
                  }`}
                >
                  <span className="truncate">{gym.name}</span>
                  <span className="text-[10px] text-[#6B6661]">{gym.city.split(',')[0]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action: Front Desk QR */}
      <div className="px-4 pt-3 pb-1">
        <button
          onClick={() => {
            if (onOpenQrModal) onOpenQrModal();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1C1814] hover:bg-[#26221E] border border-[#2A2520] hover:border-[#BFA785]/40 text-xs font-medium text-[#F7F5F2] hover:text-[#BFA785] transition-all shadow-sm shadow-black/40 hover:shadow-md group btn-shadow"
        >
          <QrCode className="w-4 h-4 text-[#BFA785] group-hover:scale-110 transition-transform" />
          <span>Front-Desk QR Placard</span>
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#BFA785]/15 text-[#BFA785] border border-[#BFA785]/30 shadow-sm shadow-[#BFA785]/10 font-bold'
                  : 'text-[#A39E98] hover:text-[#F7F5F2] hover:bg-[#1C1814]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#BFA785]' : 'text-[#A39E98] group-hover:text-white'
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Tenant Isolation Status */}
      <div className="p-4 border-t border-[#26221E] bg-[#111111]">
        <div className="flex items-center gap-2 text-xs text-[#A39E98] mb-1">
          <ShieldCheck className="w-4 h-4 text-[#4E9F6E]" />
          <span className="font-semibold text-[#F7F5F2]">Walled Tenant Space</span>
        </div>
        <div className="text-[11px] text-[#6B6661] font-mono">
          {selectedGym.slug}.gymretain.app
        </div>
        <div className="text-[10px] text-[#4E9F6E]/90 mt-1">
          ✓ RLS Isolation: 0 cross-gym leakage
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="w-64 h-screen fixed left-0 top-0 z-30 hidden lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
