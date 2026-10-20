'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, Menu, MessageCircle, Send, QrCode, ArrowRight } from '@/components/icons';
import { useAuth } from '../lib/AuthProvider';
import { api } from '../lib/api';
import { Member, MemberRiskDetails } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { Modal } from './ui/Modal';

interface TopNavbarProps {
  onOpenQrModal?: () => void;
  onOpenCheckInModal?: () => void;
  onToggleMobileMenu?: () => void;
}
const pages = [
  { name: 'Member inbox', href: '/member-inbox' },
  { name: 'Overview', href: '/' }, { name: 'Operations', href: '/operations' }, { name: 'Lead pipeline', href: '/operations?view=leads' }, { name: 'Schedule', href: '/operations?view=sessions' }, { name: 'Expenses', href: '/operations?view=expenses' }, { name: 'Members', href: '/members' },
  { name: 'Check-in', href: '/check-in' }, { name: 'Retention', href: '/retention' },
  { name: 'Insights', href: '/insights' }, { name: 'Trainers', href: '/trainers' },
  { name: 'Diet Plans', href: '/diet-plans' }, { name: 'Memberships', href: '/subscriptions' },
  { name: 'Rewards', href: '/rewards' }, { name: 'Streak Winners', href: '/rewards/winners' },
  { name: 'Settings', href: '/settings' }, { name: 'Conversations', href: '/chat' },
];

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenQrModal, onToggleMobileMenu }) => {
  const { user, activeGym } = useAuth();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState<MemberRiskDetails[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [keyword, setKeyword] = useState('STREAK');
  const [reply, setReply] = useState('');
  const [simError, setSimError] = useState('');
  const [sending, setSending] = useState(false);
  const name = user?.name || 'Gym owner';
  const initials = name.split(' ').map(word => word[0]).join('').slice(0, 2);
  const matchingPages = pages.filter(page => page.name.toLowerCase().includes(query.toLowerCase().trim()));

  useEffect(() => {
    if (!query.trim()) { setMembers([]); setSearching(false); setSearchError(false); return; }
    let cancelled = false;
    setSearching(true);
    setMembers([]);
    setSearchError(false);
    const timer = setTimeout(() => {
      api.getMembers({ search: query.trim() }).then(result => {
        if (!cancelled) setMembers(result.members.slice(0, 5));
      }).catch(() => { if (!cancelled) setSearchError(true); })
        .finally(() => { if (!cancelled) setSearching(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, []);

  const openAlerts = () => {
    setAlertsOpen(true); setAlertsLoading(true); setAlertsError(false);
    api.getAtRiskMembers().then(setAlerts).catch(() => setAlertsError(true)).finally(() => setAlertsLoading(false));
  };

  const simulate = async (event: React.FormEvent) => {
    event.preventDefault(); setSending(true); setSimError(''); setReply('');
    try {
      const result = await api.previewWhatsAppReply({ phone: phone.trim(), message: keyword, ...(activeGym ? { gymId: activeGym.id } : {}) });
      setReply(result.reply || result.message || 'No response was returned. Check that this phone belongs to a member.');
    } catch (error) { setSimError(error instanceof Error ? error.message : 'Could not load the preview. Please try again.'); }
    finally { setSending(false); }
  };

  return <>
    <header className="sticky top-0 z-20 border-b border-surface-border bg-surface transition-colors">
      <div className="flex min-h-[64px] items-center gap-3 px-4 sm:px-8">
        <button onClick={onToggleMobileMenu} aria-label="Open navigation" className="lg:hidden p-2.5 rounded-xl border border-surface-border text-content-secondary"><Menu className="w-5 h-5" /></button>
        <div className="hidden xl:block min-w-[170px]">
          <p className="text-sm font-semibold">{pages.find(page => page.href === pathname)?.name || 'Workspace'}</p>
          <p className="text-xs text-content-secondary mt-1">{activeGym?.name || 'Your gym workspace'}</p>
        </div>
        <div ref={searchRef} className="relative flex-1 max-w-lg mx-auto">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-content-tertiary pointer-events-none" />
          <input aria-label="Search members and pages" aria-expanded={searchOpen} aria-controls="workspace-search" type="search" autoComplete="off" value={query}
            onFocus={() => setSearchOpen(true)} onChange={event => { setQuery(event.target.value); setSearchOpen(true); }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setSearchOpen(false); } }}
            placeholder="Search members or pages…" className="w-full h-11 pl-10 pr-3 rounded-xl border border-surface-border bg-canvas text-sm outline-none focus:border-brand-500 dark:focus:border-brass-400" />
          {searchOpen && <div id="workspace-search" className="absolute top-full mt-2 w-full max-h-[65vh] overflow-y-auto rounded-2xl border border-surface-border bg-surface p-2 shadow-xl">
            <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-content-tertiary">{query ? 'Pages' : 'Go to'}</p>
            {matchingPages.map(page => <Link key={page.href} href={page.href} onClick={() => setSearchOpen(false)} className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-surface-subtle">{page.name}<ArrowRight className="w-3.5 h-3.5 text-content-tertiary" /></Link>)}
            {query.trim() && <><p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-content-tertiary">Members</p>
              {searching ? <p role="status" className="px-3 py-3 text-sm text-content-secondary">Searching…</p> : members.map(member => <Link key={member.id} href={`/members?search=${encodeURIComponent(member.memberCode)}`} onClick={() => { setSearchOpen(false); setQuery(''); }} className="block rounded-lg px-3 py-2.5 hover:bg-surface-subtle"><span className="text-sm font-medium">{member.firstName} {member.lastName}</span><span className="block text-xs text-content-secondary mt-1">{member.memberCode}</span></Link>)}
              {!searching && !members.length && <p role="status" className="px-3 py-3 text-sm text-content-secondary">{searchError ? 'Search unavailable. Please try again.' : 'No matching members.'}</p>}
            </>}
          </div>}
        </div>
        <div className="flex items-center gap-2">
          {onOpenQrModal && <button onClick={onOpenQrModal} aria-label="Front-desk QR code" title="Front-desk QR code" className="hidden sm:flex p-2.5 rounded-xl text-content-secondary hover:bg-surface-subtle"><QrCode className="w-4 h-4" /></button>}
          <button onClick={() => { setSimOpen(true); setReply(''); setSimError(''); }} aria-label="Preview WhatsApp replies" title="Preview WhatsApp replies" className="hidden sm:flex p-2.5 rounded-xl text-content-secondary hover:bg-surface-subtle"><MessageCircle className="w-4 h-4" /></button>
          <ThemeToggle />
          <button onClick={openAlerts} aria-label="View member alerts" title="Member alerts" className="p-2.5 rounded-xl text-content-secondary hover:bg-surface-subtle"><Bell className="w-4 h-4" /></button>
          <Link href="/settings" aria-label="Account settings" title={name} className="hidden sm:flex w-11 h-11 ml-2 items-center justify-center rounded-full bg-brand-500/10 dark:bg-brass-400/10 text-brand-700 dark:text-brass-400 text-xs font-semibold border border-brand-500/15">{initials}</Link>
        </div>
      </div>
    </header>
    <Modal isOpen={alertsOpen} onClose={() => setAlertsOpen(false)} title="Member alerts" description="Members who may need a friendly follow-up.">
      <div className="space-y-2">
        {alertsLoading ? <p role="status" className="py-8 text-center text-sm text-content-secondary">Loading alerts…</p> : alertsError ? <p role="alert" className="py-6 text-sm text-status-danger-text">Could not load alerts. Close and try again.</p> : alerts.length ? alerts.map(member => <Link key={member.memberId} href="/retention" className="flex items-center justify-between gap-4 p-4 rounded-xl bg-canvas hover:bg-surface-subtle"><div><p className="text-sm font-medium">{member.fullName}</p><p className="text-xs text-content-secondary mt-1">{member.factors.daysSinceLastCheckIn} days since last visit</p></div><ArrowRight className="w-4 h-4 shrink-0" /></Link>) : <p className="py-8 text-center text-sm text-content-secondary">You’re all caught up. No members need a follow-up.</p>}
      </div>
    </Modal>
    <Modal isOpen={simOpen} onClose={() => setSimOpen(false)} title="WhatsApp preview" description="Test the reply a member receives for a keyword.">
      <form onSubmit={simulate} className="space-y-5">
        <div><label htmlFor="preview-phone" className="block text-sm font-medium mb-2">Member phone</label><input id="preview-phone" type="tel" required pattern="\+?[0-9 ()-]{7,20}" value={phone} onChange={event => setPhone(event.target.value)} placeholder="+92 300 1234567" className="w-full rounded-xl border border-surface-border bg-canvas px-4 py-3 text-sm" /></div>
        <fieldset><legend className="text-sm font-medium mb-2">Keyword</legend><div className="flex gap-2">{['STREAK', 'STATUS', 'HELP'].map(word => <button key={word} type="button" aria-pressed={keyword === word} onClick={() => setKeyword(word)} className={`flex-1 rounded-xl py-2.5 text-xs font-semibold border ${keyword === word ? 'border-brand-500 dark:border-brass-400 bg-brand-500/10 dark:bg-brass-400/10' : 'border-surface-border'}`}>{word}</button>)}</div></fieldset>
        <button disabled={sending} className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm btn-shadow-primary"><Send className="w-4 h-4" />{sending ? 'Loading preview…' : 'Preview reply'}</button>
        {simError && <p role="alert" className="text-sm text-status-danger-text">{simError}</p>}
        {reply && <p role="status" className="p-4 rounded-xl bg-canvas border border-surface-border text-sm leading-relaxed whitespace-pre-line">{reply}</p>}
      </form>
    </Modal>
  </>;
};
