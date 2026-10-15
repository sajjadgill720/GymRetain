'use client';

import React, { useEffect, useState } from 'react';
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
  Trophy,
  X,
  MessageCircle,
  QrCode,
  Sparkles,
  Dumbbell,
  Utensils,
  CreditCard,
  Calendar,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ShieldCheck,
} from '@/components/icons';
import { useAuth, GymInfo } from '../lib/AuthProvider';

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

  useEffect(() => { if (isOpenMobile) setCollapsed(false); }, [isOpenMobile]);

  const userName = user?.name || 'Gym owner';
  const userRole = user?.role || 'OWNER';
  const userInitials =
    userName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'GO';

  const navItems = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Operations', href: '/operations', icon: Calendar },
    {
      name: 'Insights',
      href: '/insights',
      icon: Sparkles,
      badge: undefined,
      badgeColor: 'bg-brand-500/10 text-brand-600 dark:text-brass-400 font-mono',
    },
    {
      name: 'Diet Plans',
      href: '/diet-plans',
      icon: Utensils,
      badge: undefined,
      badgeColor: 'bg-status-success-bg text-status-success-text font-mono',
    },
    {
      name: 'Memberships',
      href: '/subscriptions',
      icon: CreditCard,
      badge: undefined,
      badgeColor: 'bg-status-success-bg text-status-success-text font-mono',
    },
    {
      name: 'Members',
      href: '/members',
      icon: Users,
      badge: undefined,
      badgeColor: 'bg-status-success-bg text-status-success-text font-mono',
    },
    {
      name: 'Retention',
      href: '/retention',
      icon: AlertTriangle,
      badge: undefined,
      badgeColor: 'bg-status-danger-bg text-status-danger-text font-mono',
    },
    {
      name: 'Check-in',
      href: '/check-in',
      icon: UserCheck,
    },
    {
      name: 'Trainers',
      href: '/trainers',
      icon: Dumbbell,
    },
    {
      name: 'Streak Winners',
      href: '/rewards/winners',
      icon: Trophy,
      badge: undefined,
      badgeColor: 'bg-status-warning-bg text-status-warning-text font-mono',
    },
    {
      name: 'Rewards',
      href: '/rewards',
      icon: Award,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: ShieldCheck,
      badge: undefined,
      badgeColor: 'bg-brand-500/10 text-brand-600 dark:text-brass-400 font-mono',
    },
  ];

  const navOrder = ['/', '/operations', '/members', '/subscriptions', '/check-in', '/retention', '/trainers', '/diet-plans', '/rewards', '/rewards/winners', '/insights', '/settings'];
  navItems.sort((a,b) => navOrder.indexOf(a.href)-navOrder.indexOf(b.href));

  const sidebarContent = (
    <div className="workspace-rail flex flex-col h-full bg-surface-sidebar border-r border-surface-border select-none transition-colors duration-200">
      {/* Brand Logo & Collapse Toggle */}
      <div className={`flex items-center border-b border-surface-border ${collapsed ? 'flex-col gap-3 p-3' : 'p-4 sm:p-5 justify-between'}`}>
        <Link href="/" className="flex items-center gap-3 group">
          <GymLogo size={32} />
          {!collapsed && (
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-semibold tracking-tight text-content-primary font-sans">
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
            aria-label="Close navigation"
            className="lg:hidden p-1.5 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-subtle"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Gym Branch Location Badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-surface-border">
          {hasMultipleGyms ? (
            <div className="relative">
              <button
                onClick={() => setShowGymDropdown(!showGymDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-surface-subtle hover:bg-surface-elevated border border-surface-border text-xs font-medium text-content-primary transition-colors btn-shadow text-left"
              >
                <div className="flex items-center gap-2 truncate">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-brass-400 shrink-0" />
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
                          ? 'bg-brand-500/15 dark:bg-brass-500/15 text-brand-700 dark:text-brass-400 font-semibold'
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
              <Building2 className="w-3.5 h-3.5 text-brand-600 dark:text-brass-400 shrink-0" />
              <span className="truncate text-content-primary font-medium">{currentGym.name}</span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Items (Light: Foxstocks Lavender Pill | Dark: Vision High-Contrast White Pill) */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {!collapsed && (
          <div className="px-3 py-1 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
            Workspace
          </div>
        )}

        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : (pathname === item.href || pathname.startsWith(item.href + '/')) && !(item.href === '/rewards' && pathname.startsWith('/rewards/winners'));

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.name : undefined}
              onClick={onCloseMobile}
              className={`workspace-nav-link group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'premium-nav-active'
                  : 'text-content-secondary hover:text-content-primary hover:bg-surface-subtle'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-inherit'
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

        {/* Quick Tools */}
        {!collapsed && (
          <div className="pt-4 mt-2 border-t border-surface-border space-y-1">
            <div className="px-3 py-1 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
              Front Desk
            </div>
            <button
              onClick={onOpenCheckInModal}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface-subtle transition-colors"
            >
              <UserCheck className="w-4 h-4 text-status-success-text" />
              <span>+ Quick Check-In</span>
            </button>
            <button
              onClick={onOpenQrModal}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface-subtle transition-colors"
            >
              <QrCode className="w-4 h-4 text-brand-600 dark:text-brass-400" />
              <span>Front-Desk QR</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer User Profile & Theme Toggle */}
      <div className={`p-3 border-t border-surface-border flex items-center justify-between gap-2 ${collapsed ? 'flex-col' : ''}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-brand-600/10 dark:bg-brass-500/10 text-brand-700 dark:text-brass-400 font-bold text-xs flex items-center justify-center shrink-0 border border-brand-500/20 dark:border-brass-500/20">
            {userInitials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-xs font-bold text-content-primary truncate">
                {userName}
              </div>
              <div className="text-[10px] text-content-tertiary font-mono">{userRole}</div>
            </div>
          )}
        </div>
        {user ? <button title="Sign out" aria-label="Sign out" onClick={() => { logout(); window.location.assign('/login'); }} className="p-2 rounded-lg text-content-secondary hover:bg-surface-subtle"><LogOut className="w-4 h-4" /></button> : <Link href="/login" title="Sign in" aria-label="Sign in" className="p-2 rounded-lg text-content-secondary hover:bg-surface-subtle btn-shadow"><ArrowRight className="w-4 h-4" /></Link>}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`hidden lg:block shrink-0 h-screen sticky top-0 transition-all duration-200 z-30 ${
          collapsed ? 'w-20' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

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
