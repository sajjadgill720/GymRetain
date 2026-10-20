'use client';
import React,{createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MEMBER_TOKEN_KEY, memberRequest, PortalData, setPersonalMemberHandler } from '@/lib/member-api';
import { watchEvents } from '@/lib/live-events';
import { memberPreview } from '@/lib/member-preview';
import { PERSONAL_MODE_KEY, personalOverview, personalRequest } from '@/lib/member-personal';

interface PortalContextValue {data:PortalData|null;loading:boolean;error:string;preview:boolean;personal:boolean;busy:boolean;notice:string;refresh:()=>Promise<void>;act:(action:()=>Promise<unknown>,message?:string)=>Promise<boolean>;notify:(message:string)=>void;}
const PortalContext=createContext<PortalContextValue>(null!);
export const usePortal=()=>useContext(PortalContext);
export function PortalProvider({children}:{children:React.ReactNode}) {
 const router=useRouter();const pathname=usePathname();const [data,setData]=useState<PortalData|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [preview,setPreview]=useState(false);const [personal,setPersonal]=useState(false);const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');const noticeTimer=useRef<ReturnType<typeof setTimeout>>();const lock=useRef(false);
 const notify=useCallback((message:string)=>{clearTimeout(noticeTimer.current);setNotice(message);noticeTimer.current=setTimeout(()=>setNotice(''),6000);},[]);
 const refresh=useCallback(async()=>{
  setPersonalMemberHandler(null);
  if(new URLSearchParams(window.location.search).get('preview')==='1'){setPersonal(false);setPreview(true);setData(memberPreview());setLoading(false);return;}
  setPreview(false);
  const personalMode=!localStorage.getItem(MEMBER_TOKEN_KEY)||localStorage.getItem(PERSONAL_MODE_KEY)==='1';
  setPersonal(personalMode);
  if(personalMode){try{setPersonalMemberHandler(personalRequest);setData(personalOverview());setError('');}catch(err){setError(err instanceof Error?err.message:'Could not load personal data');setData(null);}finally{setLoading(false);}return;}
  try{const result=await memberRequest<PortalData>('/member/overview');setData(result);setError('');}catch(error){setError(error instanceof Error?error.message:'Could not load your membership');}finally{setLoading(false);}
 },[]);
 useEffect(()=>{refresh();const ended=()=>{setData(null);router.push('/portal/login');};window.addEventListener('member-session-ended',ended);return()=>{clearTimeout(noticeTimer.current);window.removeEventListener('member-session-ended',ended);};},[refresh,router,pathname]);
 useEffect(()=>{const token=localStorage.getItem(MEMBER_TOKEN_KEY);if(personal||preview||!token||!data?.member.id)return;return watchEvents('/member/events',token,()=>refresh());},[personal,preview,data?.member.id,refresh]);
 const act=async(action:()=>Promise<unknown>,message='Saved')=>{
  if(preview){notify('This is a read-only preview. Sign in to make changes.');return false;}
  if(lock.current)return false;lock.current=true;setBusy(true);
  try{await action();await refresh();notify(message);return true;}catch(error){notify(error instanceof Error?error.message:'Could not save. Please try again.');return false;}finally{lock.current=false;setBusy(false);}
 };
 return <PortalContext.Provider value={{data,loading,error,preview,personal,busy,notice,refresh,act,notify}}>{children}{notice&&<div className="ui-toast member-toast" role="status">{notice}</div>}</PortalContext.Provider>;
}
