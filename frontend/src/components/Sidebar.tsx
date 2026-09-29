'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Award,
  AlertTriangle,
  UserCheck,
  Building2,
  ChevronDown,
  ChevronRight,
  Trophy,
  X,
  MessageCircle,
  QrCode,
  Sparkles,
  Dumbbell,
  Settings,
  HelpCircle,
  FileText,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth, GymInfo } from '../lib/AuthProvider';
import { ThemeToggle } from './ThemeToggle';
import { GymLogo } from './GymLogo';

interface SidebarProps {
  onOpenQrModal?: () => void;
  onOpenCheckInModal?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

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

  const currentGym = activeGym || DEMO_FALLBACK_GYM;
  const userGyms = gyms.length > 0 ? gyms : [DEMO_FALLBACK_GYM];
  const hasMultipleGyms = userGyms.length > 1;

  const [showGymDropdown, setShowGymDropdown] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [operationsOpen, setOperationsOpen] = useState(true);

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

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      name: 'Members',
      href: '/members',
      icon: Users,
      badge: '142',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono',
    },
    {
      name: 'At-Risk Queue',
      href: '/retention',
      icon: AlertTriangle,
      badge: '6 High',
      badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 font-mono',
    },
    {
      name: 'Check-In Kiosk',
      href: '/check-in',
      icon: UserCheck,
    },
    {
      name: 'Trainers & Staff',
      href: '/trainers',
      icon: Dumbbell,
    },
    {
      name: 'Streak Winners',
      href: '/rewards/winners',
      icon: Trophy,
      badge: '6 Won',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono',
    },
    {
      name: 'Reward Rules',
      href: '/rewards',
      icon: Award,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface-sidebar border-r border-surface-border select-none transition-colors duration-200">
      {/* Brand Logo & Collapse Toggle (Matching Image 1 & 2) */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-surface-border">
        <Link href="/" className="flex items-center gap-3 group">
          <GymLogo size={32} />
          {!collapsed && (
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-content-primary font-sans">
                GymRetain
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-subtle transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-subtle"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Single-Gym Branch Indicator (or Multi-gym Switcher if authorized) */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-surface-border/60">
          {hasMultipleGyms ? (
            <div className="relative">
              <button
                onClick={() => setShowGymDropdown(!showGymDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-surface-subtle hover:bg-surface-elevated border border-surface-border text-xs font-medium text-content-primary transition-colors btn-shadow text-left"
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">{currentGym.name}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-content-tertiary shrink-0 ml-1" />
              </button>

              {showGymDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-full bg-surface border border-surface-border rounded-xl shadow-xl py-1 z-50">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-content-tertiary">
                    Your Gyms
                  </div>
                  {userGyms.map((gym) => (
                    <button
                      key={gym.id}
                      onClick={() => {
                        switchGym(gym.id);
                        setShowGymDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs transition-colors flex flex-col ${
                        currentGym.id === gym.id
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-content-secondary hover:text-content-primary hover:bg-surface-subtle'
                      }`}
                    >
                      <span className="truncate">{gym.name}</span>
                      {gym.city && (
                        <span className="text-[10px] text-content-tertiary">
                          {gym.city.split(',')[0]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-subtle/80 border border-surface-border text-xs font-medium text-content-secondary">
              <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate text-content-primary font-medium">{currentGym.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onCloseMobile}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 relative ${
                isActive
                  ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-subtle'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Active Indicator Bar on Left (Matching Image 1 Shopeers style) */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                )}
                <item.icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-content-tertiary group-hover:text-content-primary'
                  }`}
                />
                {!collapsed && <span>{item.name}</span>}
              </div>

              {!collapsed && item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Quick Tools & Settings Section */}
        {!collapsed && (
          <div className="pt-4 mt-2 border-t border-surface-border/60 space-y-1">
            <div className="px-3 py-1 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
              Management
            </div>
            <button
              onClick={onOpenCheckInModal}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface-subtle transition-colors"
            >
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span>+ Quick Check-In</span>
            </button>
            <button
              onClick={onOpenQrModal}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface-subtle transition-colors"
            >
              <QrCode className="w-4 h-4 text-blue-500" />
              <span>Front-Desk QR</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Promo Card (Matching Image 1 Shopeers "Upgrade to Premium" style) */}
      {!collapsed && (
        <div className="p-3">
          <div className="relative rounded-2xl p-4 overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg btn-shadow">
            <div className="relative z-10 space-y-2">
              <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">Pro Retention Suite</h4>
                <p className="text-[11px] text-blue-100/90 leading-snug mt-0.5">
                  Automated WhatsApp flows &amp; AI retention predictions.
                </p>
              </div>
              <button
                onClick={onOpenCheckInModal}
                className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-blue-50 text-blue-700 text-xs font-semibold shadow transition-all btn-shadow flex items-center justify-center gap-1.5"
              >
                <span>Launch Kiosk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile & Theme Toggle Footer */}
      <div className="p-3 border-t border-surface-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
            {userInitials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-xs font-semibold text-content-primary truncate">
                {userName}
              </div>
              <div className="text-[10px] text-content-tertiary font-mono">{userRole}</div>
            </div>
          )}
        </div>
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 h-screen sticky top-0 transition-all duration-200 z-30 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={onCloseMobile}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 max-w-full z-50 shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
