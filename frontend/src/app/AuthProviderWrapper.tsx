'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '../lib/AuthProvider';
import { ThemeProvider } from '../lib/ThemeProvider';
import { PhosphorIconProvider } from '../components/icons/PhosphorIconProvider';

export const AuthProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const memberSpace = usePathname().startsWith('/portal');
  return (
    <PhosphorIconProvider>
      <ThemeProvider>
        {memberSpace ? children : <AuthProvider>{children}</AuthProvider>}
      </ThemeProvider>
    </PhosphorIconProvider>
  );
};
