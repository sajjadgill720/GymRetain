'use client';
import { useRef } from 'react';
export function Tabs({options,value,onChange,label}:{options:string[];value:string;onChange:(value:string)=>void;label:string}) {
  const ref=useRef<HTMLDivElement>(null);
  return <div ref={ref} className="ui-tabs" role="tablist" aria-label={label}>{options.map((option,index)=><button key={option} role="tab" aria-selected={value===option} tabIndex={value===option?0:-1} onClick={()=>onChange(option)} onKeyDown={event=>{const step=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;if(step){event.preventDefault();const next=(index+step+options.length)%options.length;onChange(options[next]);ref.current?.querySelectorAll('button')[next].focus();}}}>{option}</button>)}</div>;
}
