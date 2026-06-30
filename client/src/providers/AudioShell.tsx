'use client';

import type { ReactNode } from 'react';
import { AudioProvider } from './AudioProvider';

export function AudioShell({ children }: { children: ReactNode }) {
  return (
    <AudioProvider>
      {children}
    </AudioProvider>
  );
}
