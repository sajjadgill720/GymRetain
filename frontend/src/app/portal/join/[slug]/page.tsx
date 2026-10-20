'use client';
import React,{useEffect,useState} from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { memberPost, memberRequest } from '@/lib/member-api';
export default function JoinPage({params}:{params:{slug:string}}) {
 const [gym,setGym]=useState<{name:string}|null>(null);const [error,setError]=useState('');const [sent,setSent]=useState(false);const [busy,setBusy]=useState(false);
 useEffect(()=>{memberRequest<{name:string}>(`/member/join/${encodeURIComponent(params.slug)}`).then(setGym).catch(err=>setError(err.message));},[params.slug]);
 const submit=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const f=new FormData(e.currentTarget);setBusy(true);setError('');try{await memberPost(`/member/join/${encodeURIComponent(params.slug)}`,{firstName:f.get('firstName'),lastName:f.get('lastName'),phone:f.get('phone')});setSent(true);}catch(err){setError(err instanceof Error?err.message:'Could not join');}finally{setBusy(false);}};
 return <div className="portal-login"><div className="portal-eyebrow">A new routine, a new community</div><h1>Join {gym?.name||'your gym'}.</h1><p className="text-content-secondary mt-4 mb-8">Start here. Your gym will help you choose a membership plan.</p>{sent?<div className="portal-card" role="status"><h2>You’re on the list.</h2><p className="mt-4">Your request is with the gym. Your membership stays pending until reception assigns your plan and confirms payment.</p><Link className="portal-link" href="/portal/login">Continue to sign in</Link></div>:gym?<form className="portal-card portal-stack" onSubmit={submit}><label className="ui-field">First name<input name="firstName" required maxLength={100} autoComplete="given-name"/></label><label className="ui-field">Last name<input name="lastName" required maxLength={100} autoComplete="family-name"/></label><label className="ui-field">Phone number<input name="phone" type="tel" required autoComplete="tel" placeholder="+92 300 1234567"/></label><Button type="submit" isLoading={busy}>Request to join</Button></form>:!error?<p role="status">Finding your gym…</p>:null}{error&&<p className="mt-4" role="alert">{error}</p>}</div>;
}
