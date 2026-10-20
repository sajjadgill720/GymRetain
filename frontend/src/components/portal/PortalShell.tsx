'use client';
import React,{useEffect,useState} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Award, TrendingUp, User, QrCode, ArrowRight, WifiOff } from '@/components/icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GymLogo } from '@/components/GymLogo';
import { usePortal } from './PortalProvider';

export function PortalShell({children}:{children:React.ReactNode}) {
 const {data,preview}=usePortal();const pathname=usePathname();const [online,setOnline]=useState(true);
 useEffect(()=>{const update=()=>setOnline(navigator.onLine);update();window.addEventListener('online',update);window.addEventListener('offline',update);if('serviceWorker' in navigator)navigator.serviceWorker.register('/portal/sw.js',{scope:'/portal/'}).catch(()=>{});return()=>{window.removeEventListener('online',update);window.removeEventListener('offline',update);};},[]);
 const link=(path:string)=>`${path}${preview?'?preview=1':''}`;
 const tabs=[{href:'/portal',label:'Home',icon:Home},{href:'/portal/classes',label:'Classes',icon:Calendar},{href:'/portal/rewards',label:'Rewards',icon:Award},{href:'/portal/progress',label:'Progress',icon:TrendingUp},{href:'/portal/me',label:'Me',icon:User}];
 const publicPage=pathname.includes('/login')||pathname.includes('/join/');
 return <div className="portal-shell"><a className="sr-only focus:not-sr-only" href="#portal-main">Skip to content</a><header className="portal-header"><Link href={link('/portal')} className="portal-brand"><GymLogo size={32}/><span>GymRetain<small>{data?.gym.name||'Your member space'}</small></span></Link><div className="flex items-center gap-2"><ThemeToggle/>{!publicPage&&<Link href={link('/portal/pass')} className="portal-icon-button" aria-label="Open my member pass"><QrCode className="w-5 h-5"/></Link>}</div></header>
 {preview&&<div className="portal-preview">Sample member · read-only preview<Link href="/portal/login">Sign in <ArrowRight className="w-4 h-4"/></Link></div>}
 {!online&&<div role="status" className="portal-offline"><WifiOff className="w-4 h-4"/> You’re offline. Reconnect to load or save changes.</div>}
 <main id="portal-main" tabIndex={-1} className="portal-main page-enter">{children}</main>
 {!publicPage&&<nav className="portal-tabs" aria-label="Member navigation">{tabs.map(({href,label,icon:Icon})=><Link key={href} href={link(href)} aria-current={pathname===href?'page':undefined}><Icon className="w-5 h-5"/><span>{label}</span></Link>)}</nav>}
 </div>;
}
