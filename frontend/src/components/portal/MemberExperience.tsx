'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronRight, QrCode, Dumbbell, Calendar, Utensils, MessageCircle, Award, Flame, Target, TrendingUp, User, CreditCard, Bell, HelpCircle, Users, LogOut, Clock } from '@/components/icons';
import { Button, Modal, ProgressRing } from '@/components/ui';
import { MEMBER_TOKEN_KEY, memberPost, portalMoney } from '@/lib/member-api';
import { crowdStatus, memberHref } from '@/lib/member-navigation';
import { usePortal } from './PortalProvider';

function MemberLink({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  const { preview } = usePortal();
  return <Link href={memberHref(href, preview)} className={className}>{children}</Link>;
}
function SectionTitle({ title, href, action = 'View all' }: { title: string; href?: string; action?: string }) {
  return <div className="member-section-title"><h2>{title}</h2>{href && <MemberLink href={href}>{action}<ArrowRight aria-hidden="true" /></MemberLink>}</div>;
}
function Initials({ name }: { name: string }) { return <span className="member-avatar" aria-hidden="true">{name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span>; }
function DateText({ value }: { value: string }) {
  const { data } = usePortal();
  return <>{new Intl.DateTimeFormat('en-PK', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: data?.gym.timezone }).format(new Date(value))}</>;
}
const shortcuts = [
  { href: '/portal/classes', label: 'Classes', detail: 'Find your session', icon: Calendar },
  { href: '/portal/diet', label: 'Nutrition', detail: 'Fuel your routine', icon: Utensils },
  { href: '/portal/chat', label: 'My trainer', detail: 'A little guidance', icon: MessageCircle },
  { href: '/portal/rewards', label: 'Rewards', detail: 'Make visits count', icon: Award },
];

export function MemberHome() {
  const { data, preview } = usePortal();
  if (!data) return null;
  const { member, gym, profile } = data;
  const crowd = crowdStatus(gym.insideNow, gym.capacity);
  const next = data.classes.filter(item => item.booking === 'BOOKED' && new Date(item.startsAt) > new Date()).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  const assigned = data.requests.find(item => item.kind === 'WORKOUT_PLAN' && item.status === 'ASSIGNED');
  return <div className="member-experience">
    <div className="member-welcome"><div><p className="portal-eyebrow">A little stronger, every visit</p><h1>Hey, {member.firstName}.</h1></div><MemberLink href="/portal/me" className="member-avatar-link"><Initials name={`${member.firstName} ${member.lastName}`} /><span className="sr-only">My account</span></MemberLink></div>
    <div className="member-hero-grid">
      <section className="member-motivation-hero"><div className="member-hero-art" aria-hidden="true"><Dumbbell /></div><div className="member-motivation-copy"><span className="portal-eyebrow">Your time. Your progress.</span><h2>SHOW UP.<br />FEEL STRONGER.</h2><p>Your next good move starts here.</p><MemberLink href="/portal/workouts" className="member-hero-link">Find my next move<ArrowRight aria-hidden="true" /></MemberLink></div></section>
      <section className="member-club-card"><div><span className="portal-eyebrow">My home gym</span><h2>{gym.name}</h2></div><div className="member-crowd-heading"><h3>{crowd.label}</h3><span className="member-live-dot">{preview ? 'Sample' : 'Now'}</span></div><div className="member-crowd-bars" role="meter" aria-label="Gym occupancy" aria-valuemin={0} aria-valuemax={Math.max(gym.capacity, gym.insideNow, 1)} aria-valuenow={gym.insideNow} aria-valuetext={gym.capacity > 0 ? `${gym.insideNow} of ${gym.capacity} people` : 'Capacity unavailable'}>{Array.from({ length: 12 }, (_, i) => <span key={i} className={i < Math.ceil(crowd.fraction * 12) ? 'filled' : ''} />)}</div><p className="portal-caption">{gym.insideNow} people inside{gym.capacity > 0 && ` · ${gym.capacity} capacity`}<br />Based on open check-ins.</p><MemberLink href="/portal/pass" className="member-pass-button"><QrCode aria-hidden="true" /><span>Open my gym pass<small>Ready when you are</small></span><ChevronRight aria-hidden="true" /></MemberLink></section>
    </div>
    <div className="member-shortcuts">{shortcuts.map(({ href, label, detail, icon: Icon }) => <MemberLink key={href} href={href} className="member-shortcut"><span className="member-icon-tile"><Icon aria-hidden="true" /></span><span><strong>{label}</strong><small>{detail}</small></span><ChevronRight aria-hidden="true" /></MemberLink>)}</div>
    <div className="member-content-grid"><section className="portal-card"><SectionTitle title="Your week, in motion" href="/portal/progress" action="My activity" /><div className="member-week-summary"><div><strong className="member-big-number">{data.weeklyVisits}<small> / {profile.weeklyTarget}</small></strong><p>visits this week</p><span className="member-goal-note">{data.weeklyVisits >= profile.weeklyTarget ? 'Weekly goal reached. Keep that feeling.' : `${Math.max(0, profile.weeklyTarget - data.weeklyVisits)} more to your weekly goal`}</span></div><ProgressRing value={data.weeklyVisits} max={profile.weeklyTarget} label="Weekly visit goal" size={100} /></div><div className="member-stat-strip"><div><Flame /><strong>{data.streak?.currentStreak || 0}</strong><span>day streak</span></div><div><TrendingUp /><strong>{data.totalVisits}</strong><span>total visits</span></div><div><Award /><strong>{data.points}</strong><span>points earned</span></div></div></section>
      <section className="portal-card member-training-card"><SectionTitle title="Make your next move" href="/portal/workouts" action="My workouts" /><span className="member-icon-tile"><Dumbbell /></span><h3>{assigned ? 'Your trainer’s plan is ready' : profile.goal || 'Build a routine that fits you'}</h3><p>{assigned ? assigned.message : data.trainer ? `${data.trainer.name} is here to help you take the next step.` : 'Keep a record of your sessions and see your consistency grow.'}</p><MemberLink href={assigned ? '/portal/workouts' : '/portal/progress?log=workout'} className="member-text-link">{assigned ? 'See my plan' : 'Log a workout'}<ArrowRight /></MemberLink></section>
    </div>
    <div className="member-content-grid"><section className="portal-card"><SectionTitle title="Next on your calendar" href="/portal/classes" action="Explore classes" />{next ? <div className="member-next-class"><span className="member-icon-tile"><Calendar /></span><div><span className="status-pill" data-tone="success">You’re booked</span><h3>{next.title}</h3><p><DateText value={next.startsAt} /></p><p>{next.coach} · {next.duration} min</p></div></div> : <div className="member-empty"><Calendar /><h3>A little time for yourself</h3><p>Find a class that fits your week.</p><MemberLink href="/portal/classes" className="member-text-link">Browse classes<ArrowRight /></MemberLink></div>}</section><section className="portal-card"><SectionTitle title="From your gym" href="/portal/help" action="Get in touch" />{data.announcements.length ? data.announcements.slice(0, 2).map(item => <article className="member-announcement" key={item.id}><h3>{item.title}</h3><p>{item.body}</p></article>) : <div className="member-empty"><MessageCircle /><h3>Your gym, a message away</h3><p>Questions about your membership or your next visit? Your gym team can help.</p></div>}</section></div>
  </div>;
}

export function MemberAccount() {
  const { data, preview } = usePortal();
  const router = useRouter();
  if (!data) return null;
  const groups = [
    { title: 'My training', items: [{ href: '/portal/workouts', label: 'My workouts', detail: 'Your plan and session history', icon: Dumbbell }, { href: '/portal/diet', label: 'Nutrition plan', detail: 'Meals and daily checklists', icon: Utensils }, { href: '/portal/chat', label: 'My trainer', detail: data.trainer?.name || 'Guidance from your gym', icon: MessageCircle }] },
    { title: 'Membership & goals', items: [{ href: '/portal/membership', label: 'Membership & payments', detail: 'Plan details and payment history', icon: CreditCard }, { href: '/portal/onboarding', label: 'My goals', detail: `${data.profile.weeklyTarget} visits per week`, icon: Target }, { href: '/portal/classes', label: 'My classes', detail: 'Bookings and upcoming sessions', icon: Calendar }] },
    { title: 'Preferences', items: [{ href: '/portal/profile', label: 'Personal details', detail: 'Profile and contact information', icon: User }, { href: '/portal/notifications', label: 'Notifications', detail: 'Choose what you hear about', icon: Bell }] },
    { title: 'Here to help', items: [{ href: '/portal/buddies', label: 'Bring a buddy', detail: 'Request a visit with a friend', icon: Users }, { href: '/portal/help', label: 'Contact my gym', detail: 'Questions, requests and feedback', icon: HelpCircle }] },
  ];
  return <div className="member-experience"><div className="member-page-title"><span className="portal-eyebrow">Your member space</span><h1>My account</h1></div><section className="member-identity"><Initials name={`${data.member.firstName} ${data.member.lastName}`} /><div><h2>{data.member.firstName} {data.member.lastName}</h2><p>{data.gym.name}</p><small>Member {data.member.memberCode}</small></div><MemberLink href="/portal/profile" className="member-text-link">Edit profile<ChevronRight /></MemberLink></section>
    <div className="member-account-feature-grid"><MemberLink href="/portal/membership" className="member-membership-tile"><div><span className="portal-eyebrow">My membership</span><h2>{data.membership?.planName || 'View your membership'}</h2><p>{data.membership ? `${portalMoney(data.membership.price, data.membership.currency)} · ${data.membership.status.replaceAll('_', ' ')}` : 'Your plan and payments, together'}</p></div><ChevronRight /></MemberLink><MemberLink href="/portal/pass" className="member-account-pass"><QrCode /><div><h2>Your gym pass</h2><p>One tap. Ready to check in.</p></div><ChevronRight /></MemberLink></div>
    <div className="member-account-groups">{groups.map(group => <section key={group.title} className="member-account-group"><h2>{group.title}</h2><div>{group.items.map(({ href, label, detail, icon: Icon }) => <MemberLink key={href} href={href} className="member-account-row"><Icon /><span><strong>{label}</strong><small>{detail}</small></span><ChevronRight /></MemberLink>)}</div></section>)}</div><button className="member-signout" onClick={() => { if (!preview) localStorage.removeItem(MEMBER_TOKEN_KEY); router.push('/portal/login'); }}><LogOut />{preview ? 'Exit preview' : 'Sign out'}</button>
  </div>;
}

export function MemberWorkouts() {
  const { data } = usePortal();
  const [tab, setTab] = useState('plan');
  if (!data) return null;
  const assigned = data.requests.find(item => item.kind === 'WORKOUT_PLAN' && item.status === 'ASSIGNED');
  return <div className="member-experience"><div className="member-page-title member-title-action"><div><span className="portal-eyebrow">Find your next good move</span><h1>My workouts</h1><p>A routine that feels like yours.</p></div><MemberLink href="/portal/progress?log=workout" className="member-checkin-button"><Dumbbell />Log workout</MemberLink></div><div className="member-segmented" aria-label="Workout view"><button aria-pressed={tab === 'plan'} onClick={() => setTab('plan')}>My plan</button><button aria-pressed={tab === 'history'} onClick={() => setTab('history')}>History ({data.workouts.length})</button></div>
    {tab === 'plan' ? <div className="member-content-grid"><section className="portal-card member-workout-plan"><div className="member-workout-art" aria-hidden="true"><Dumbbell /></div><span className="portal-eyebrow">Your training focus</span><h2>{data.profile.goal}</h2><p className="member-plan-copy">{assigned?.message || 'Your trainer can help you create a plan for your goals. Start a conversation to find the right next step.'}</p><MemberLink href="/portal/chat" className="member-text-link">{assigned ? 'Discuss my plan' : 'Ask about a workout plan'}<ArrowRight /></MemberLink></section><div className="portal-stack"><section className="portal-card"><SectionTitle title="Your support team" /><div className="member-trainer"><Initials name={data.trainer?.name || data.gym.name} /><div><h3>{data.trainer?.name || 'Your gym team'}</h3><p>{data.trainer?.specialties.join(' · ') || 'Here to help you get started'}</p></div></div><MemberLink href="/portal/chat" className="member-text-link">Message my trainer<ArrowRight /></MemberLink></section><section className="portal-card"><Target className="member-feature-icon" /><h3>{data.weeklyVisits} of {data.profile.weeklyTarget} weekly visits</h3><p>Showing up is progress. Keep going at your pace.</p><MemberLink href="/portal/onboarding" className="member-text-link">Adjust my goal<ArrowRight /></MemberLink></section></div></div> : <section className="portal-card"><SectionTitle title="Your session history" />{data.workouts.length ? [...data.workouts].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt)).map(item => <article className="member-history-row" key={item.id}><span className="member-icon-tile"><Dumbbell /></span><div><h3>{item.title}</h3><p><DateText value={item.loggedAt} /> · {item.minutes} min</p>{item.notes && <p>{item.notes}</p>}</div></article>) : <div className="member-empty"><Dumbbell /><h3>Your first session starts the story</h3><p>Log a workout to build your history.</p><MemberLink href="/portal/progress?log=workout" className="member-text-link">Log my first workout<ArrowRight /></MemberLink></div>}</section>}
    <div className="member-shortcuts">{shortcuts.filter(item => item.href !== '/portal/rewards').map(({ href, label, detail, icon: Icon }) => <MemberLink key={href} href={href} className="member-shortcut"><span className="member-icon-tile"><Icon /></span><span><strong>{label}</strong><small>{detail}</small></span><ChevronRight /></MemberLink>)}</div></div>;
}

export function MemberClasses() {
  const { data, act, busy } = usePortal();
  const [view, setView] = useState('all');
  const [day, setDay] = useState('all');
  const [cancelId, setCancelId] = useState<string | null>(null);
  if (!data) return null;
  const dateKey = (value: string) => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: data.gym.timezone }).format(new Date(value));
  const upcoming = data.classes.filter(item => new Date(item.startsAt) > new Date()).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const days = Array.from(new Map(upcoming.map(item => [dateKey(item.startsAt), item.startsAt])).entries());
  const visible = upcoming.filter(item => (view === 'all' || !!item.booking) && (day === 'all' || dateKey(item.startsAt) === day));
  const cancelling = upcoming.find(item => item.id === cancelId);
  return <div className="member-experience"><div className="member-page-title"><span className="portal-eyebrow">Move together</span><h1>Find your class</h1><p>Good energy. A little structure. Time for you.</p></div><div className="member-segmented" aria-label="Class view"><button aria-pressed={view === 'all'} onClick={() => setView('all')}>Upcoming classes</button><button aria-pressed={view === 'mine'} onClick={() => setView('mine')}>My bookings ({upcoming.filter(item => item.booking).length})</button></div><div className="member-date-picker" aria-label="Class date"><button aria-pressed={day === 'all'} onClick={() => setDay('all')}>All dates</button>{days.map(([key, value]) => <button key={key} aria-pressed={day === key} onClick={() => setDay(key)}>{new Intl.DateTimeFormat('en-PK', { weekday: 'short', day: 'numeric', month: 'short', timeZone: data.gym.timezone }).format(new Date(value))}</button>)}</div>
    <div className="member-class-grid">{visible.map(item => <section className="portal-card member-class-card" key={item.id}><div className="member-class-top"><span className="member-icon-tile"><Dumbbell /></span><span className="status-pill" data-tone={item.booking === 'BOOKED' ? 'success' : item.spotsLeft ? 'neutral' : 'warning'}>{item.booking === 'BOOKED' ? 'Booked' : item.booking === 'WAITLISTED' ? 'Waitlisted' : `${item.spotsLeft} spots left`}</span></div><p className="portal-eyebrow"><DateText value={item.startsAt} /></p><h2>{item.title}</h2><p>{item.coach}</p><p className="member-class-duration"><Clock />{item.duration} minutes · {item.capacity} places</p><Button variant={item.booking ? 'secondary' : 'primary'} disabled={busy} onClick={() => item.booking ? setCancelId(item.id) : act(() => memberPost(`/member/classes/${item.id}/book`), item.spotsLeft ? 'Your place is booked' : 'You’re on the waitlist')}>{item.booking ? 'Manage booking' : item.spotsLeft ? 'Book my place' : 'Join waitlist'}</Button></section>)}</div>
    {!visible.length && <section className="portal-card member-empty"><Calendar /><h2>{view === 'mine' ? 'Make a little room in your week' : 'No classes on this date'}</h2><p>{view === 'mine' ? 'Your booked classes and waitlist places will appear here.' : 'Your gym’s upcoming sessions will appear here.'}</p><Button variant="secondary" onClick={() => { setView('all'); setDay('all'); }}>Browse all classes</Button></section>}
    <Modal isOpen={!!cancelId} onClose={() => setCancelId(null)} title="Manage your booking"><div className="portal-stack"><h3>{cancelling?.title}</h3><p>{cancelling && <DateText value={cancelling.startsAt} />}</p><p>{cancelling?.booking === 'WAITLISTED' ? 'Leave the waitlist for this session?' : 'Cancelling releases your place for another member.'}</p><Button disabled={busy} onClick={async () => { if (cancelId && await act(() => memberPost(`/member/classes/${cancelId}/cancel`), 'Booking cancelled')) setCancelId(null); }}>Cancel {cancelling?.booking === 'WAITLISTED' ? 'waitlist place' : 'booking'}</Button><Button variant="secondary" onClick={() => setCancelId(null)}>Keep my place</Button></div></Modal>
  </div>;
}
