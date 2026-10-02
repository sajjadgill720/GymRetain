'use client';

import React from 'react';
import { IconContext } from '@phosphor-icons/react';

export function PhosphorIconProvider({ children }: { children: React.ReactNode }) {
  return (
    <IconContext.Provider
      value={{
        size: 20,
        weight: 'duotone',
        mirrored: false,
      }}
    >
      {children}
    </IconContext.Provider>
  );
}
