'use client';

import React from 'react';
import { AuthProvider } from '../lib/AuthProvider';
import { ThemeProvider } from '../lib/ThemeProvider';
import { PhosphorIconProvider } from '../components/icons/PhosphorIconProvider';

export const AuthProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <PhosphorIconProvider>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </PhosphorIconProvider>
  );
};
