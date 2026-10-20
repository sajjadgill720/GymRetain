import React from 'react';

export function ProgressRing({ value, max = 100, label, size = 88 }: { value:number; max?:number; label:string; size?:number }) {
  const percent = Math.max(0, Math.min(100, max > 0 ? value / max * 100 : 0));
  return <div className="relative inline-grid place-items-center shrink-0" style={{width:size,height:size}} role="img" aria-label={`${label}: ${value} of ${max}`}>
    <svg viewBox="0 0 100 100" className="progress-ring absolute inset-0" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-subtle)" strokeWidth="7"/><circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent-brand)" strokeWidth="7" strokeLinecap="round" strokeDasharray="263.9" strokeDashoffset={263.9*(1-percent/100)}/></svg>
    <span className="display-number text-lg font-bold">{Math.round(percent)}%</span>
  </div>;
}
