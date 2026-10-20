'use client';
import { useEffect, useState } from 'react';
export function CountUp({value}:{value:number}) {
  const [display,setDisplay]=useState(value);
  useEffect(()=>{
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setDisplay(value); return; }
    const start=performance.now(); let frame=0;
    const tick=(now:number)=>{const t=Math.min(1,(now-start)/220);setDisplay(Math.round(value*(1-(1-t)**3)));if(t<1)frame=requestAnimationFrame(tick);};
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  },[value]);
  return <>{display.toLocaleString()}</>;
}
