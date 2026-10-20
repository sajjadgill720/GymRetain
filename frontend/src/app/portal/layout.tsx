import type { Metadata, Viewport } from 'next';
import { PortalProvider } from '@/components/portal/PortalProvider';
import { PortalShell } from '@/components/portal/PortalShell';
import '@/styles/portal.css';
export const metadata:Metadata={title:'Your member space · GymRetain',description:'Your progress, classes, rewards and gym pass.',manifest:'/portal/manifest.webmanifest',appleWebApp:{capable:true,statusBarStyle:'default',title:'GymRetain'}};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#151F19'};
export default function PortalLayout({children}:{children:React.ReactNode}) {return <PortalProvider><PortalShell>{children}</PortalShell></PortalProvider>;}
