'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, Award, TrendingUp, User, QrCode, WifiOff, ChevronLeft } from '@/components/icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GymLogo } from '@/components/GymLogo';
import { memberHref, memberNavSection } from '@/lib/member-navigation';
import { usePortal } from './PortalProvider';

const tabs = [
  { href: '/portal', section: 'home', label: 'Home', icon: Home },
  { href: '/portal/workouts', section: 'workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/portal/progress', section: 'progress', label: 'Activity', icon: TrendingUp },
  { href: '/portal/rewards', section: 'rewards', label: 'Rewards', icon: Award },
  { href: '/portal/me', section: 'account', label: 'Account', icon: User },
];

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { data, preview } = usePortal();
  const pathname = usePathname();
  const [online, setOnline] = useState(true);
  const section = memberNavSection(pathname);
  const publicPage = pathname.includes('/login') || pathname.includes('/join/');
  const primaryPage = tabs.some(tab => tab.href === pathname);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/portal/sw.js', { scope: '/portal/' }).catch(() => {});
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  const nav = (className: string, label: string) => <nav className={className} aria-label={label}>
    {tabs.map(({ href, section: tabSection, label: tabLabel, icon: Icon }) => <Link key={href} href={memberHref(href, preview)} aria-current={section === tabSection ? 'page' : undefined}><Icon aria-hidden="true" /><span>{tabLabel}</span></Link>)}
  </nav>;

  return <div className="portal-shell">
    <a className="member-skip" href="#portal-main">Skip to content</a>
    <header className="portal-header"><div className="portal-header-inner">
      <Link href={memberHref('/portal', preview)} className="portal-brand"><GymLogo size={32} /><span>GymRetain<small>YOUR MEMBER SPACE</small></span></Link>
      {!publicPage && nav('member-desktop-nav', 'Member desktop navigation')}
      <div className="member-header-tools"><ThemeToggle />{!publicPage && <Link href={memberHref('/portal/pass', preview)} className="member-checkin-button" aria-label="Open gym pass to check in"><QrCode aria-hidden="true" /><span>Check in</span></Link>}</div>
    </div></header>
    {preview && <div className="portal-preview"><span><span className="member-preview-dot" />Member preview <span className="member-preview-detail">· Sample data, read-only</span></span><Link href="/portal/login">Sign in</Link></div>}
    {!online && <div role="status" className="portal-offline"><WifiOff className="w-4 h-4" /> You’re offline. Reconnect to load or save changes.</div>}
    <main id="portal-main" tabIndex={-1} className="portal-main page-enter">
      {!publicPage && !primaryPage && <Link className="member-back" href={memberHref(section === 'workouts' ? '/portal/workouts' : '/portal/me', preview)}><ChevronLeft aria-hidden="true" />{section === 'workouts' ? 'Workouts' : 'My account'}</Link>}
      {children}
      {data && <footer className="member-page-footer"><GymLogo size={18} /><span>Your routine. Your pace. Your gym.</span></footer>}
    </main>
    {!publicPage && nav('portal-tabs', 'Member navigation')}
  </div>;
}
