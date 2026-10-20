'use client';
import React,{useEffect,useState} from 'react';
import { Button } from '@/components/ui';
import { usePortal } from '@/components/portal/PortalProvider';
import { memberPost, memberRequest } from '@/lib/member-api';
interface InstallPrompt extends Event {prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>;}
export default function NotificationsPage() {
 const {data,act,busy,preview,notify}=usePortal();const [install,setInstall]=useState<InstallPrompt|null>(null);const [subscribed,setSubscribed]=useState(false);const [supported,setSupported]=useState(false);
 useEffect(()=>{setSupported('serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window);const capture=(e:Event)=>{e.preventDefault();setInstall(e as InstallPrompt);};window.addEventListener('beforeinstallprompt',capture);if('serviceWorker' in navigator)navigator.serviceWorker.ready.then(reg=>reg.pushManager.getSubscription()).then(sub=>setSubscribed(!!sub)).catch(()=>{});return()=>window.removeEventListener('beforeinstallprompt',capture);},[]);
 const enable=()=>act(async()=>{
  const config=await memberRequest<{publicKey:string|null}>('/member/push/config');if(!config.publicKey)throw new Error('Push notifications are not configured by your gym yet.');
  if(await Notification.requestPermission()!=='granted')throw new Error('Notifications are blocked. You can enable them in browser settings.');
  const registration=await navigator.serviceWorker.ready;
  const base64=config.publicKey.replace(/-/g,'+').replace(/_/g,'/');const decoded=atob(base64.padEnd(Math.ceil(base64.length/4)*4,'='));const key=Uint8Array.from(decoded,c=>c.charCodeAt(0));
  const existing=await registration.pushManager.getSubscription();const subscription=existing||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
  try{const serialized=subscription.toJSON();await memberPost('/member/push/subscribe',{endpoint:serialized.endpoint,keys:serialized.keys});setSubscribed(true);}catch(error){if(!existing)await subscription.unsubscribe();throw error;}
 },'Notifications enabled');
 const disable=()=>act(async()=>{await memberPost('/member/push/unsubscribe');const registration=await navigator.serviceWorker.ready;await(await registration.pushManager.getSubscription())?.unsubscribe();setSubscribed(false);},'Notifications disabled');
 return <div className="max-w-xl mx-auto"><div className="portal-eyebrow">Stay close to your routine</div><h1 className="text-4xl font-extrabold mb-6">A gentle heads-up.</h1><section className="portal-card"><h2>Gym notifications</h2><p className="mt-3">Get a notification when your gym posts an announcement. Your message content stays inside your member app.</p><div className="portal-button-row"><Button disabled={busy||!supported||!data} onClick={subscribed?disable:enable}>{subscribed?'Turn off notifications':'Enable notifications'}</Button></div>{!supported&&<p className="mt-4 portal-caption">Push is unavailable in this browser. On iPhone, install the app on your home screen first.</p>}</section><section className="portal-card mt-5"><h2>A place on your home screen</h2><p className="mt-3">Install your member space for quick access. On Safari, use Share → Add to Home Screen.</p>{install&&<Button className="mt-5" variant="secondary" onClick={async()=>{await install.prompt();await install.userChoice;setInstall(null);}}>Install GymRetain</Button>}</section></div>;
}
