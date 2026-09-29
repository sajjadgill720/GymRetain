'use client';

import React from 'react';
import { AuthProvider } from '../lib/AuthProvider';
import { ThemeProvider } from '../lib/ThemeProvider';

export const AuthProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
};
