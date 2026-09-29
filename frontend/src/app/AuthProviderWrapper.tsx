'use client';

import React from 'react';
import { AuthProvider } from '../lib/AuthProvider';

export const AuthProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AuthProvider>{children}</AuthProvider>;
};
