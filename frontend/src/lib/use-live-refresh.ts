'use client';
import { useEffect, useRef } from 'react';
export function useLiveRefresh(refresh:()=>unknown) {
 const latest=useRef(refresh);latest.current=refresh;
 useEffect(()=>{let timer:ReturnType<typeof setTimeout>;const update=()=>{clearTimeout(timer);timer=setTimeout(()=>latest.current(),150);};window.addEventListener('gymretain-live-change',update);return()=>{clearTimeout(timer);window.removeEventListener('gymretain-live-change',update);};},[]);
}
