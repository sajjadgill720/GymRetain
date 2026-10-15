import React from 'react';

export const GymLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
    <rect width="40" height="40" rx="11" fill="var(--accent-brand)" />
    <path d="M27 14a9 9 0 1 0 1.5 11V20H21" stroke="var(--accent-foreground)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="29" cy="11" r="2" fill="var(--accent-foreground)" opacity=".5" />
  </svg>
);
