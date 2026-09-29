import React from 'react';

export const GymLogo: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 32,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="gymLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      {/* Outer stylized faceted hexagon matching Image 2 */}
      <path
        d="M28 8 H60 C68 8 75 14 78 22 L90 44 C93 50 93 58 89 64 L74 86 C70 92 63 96 55 96 H26 C18 96 11 90 8 82 L2 58 C-1 52 -1 44 3 38 L16 16 C19 11 23 8 28 8 Z"
        fill="url(#gymLogoGrad)"
      />
      {/* Precision inner cutout */}
      <path
        d="M38 32 H62 C65 32 68 35 69 38 L76 50 C77 53 77 57 75 60 L65 72 C63 75 60 77 57 77 H33 C30 77 27 74 26 71 L21 59 C20 56 20 52 22 49 L30 36 C32 33 35 32 38 32 Z"
        fill="var(--bg-canvas)"
      />
    </svg>
  );
};
