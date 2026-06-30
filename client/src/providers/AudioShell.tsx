'use client';

import type { ReactNode } from 'react';
import { AudioProvider } from './AudioProvider';
import { AudioWidget } from '@/components/ui/AudioWidget';

export function AudioShell({ children }: { children: ReactNode }) {
  return (
    <AudioProvider>
      <AudioWidget />
      {children}
    </AudioProvider>
  );
}
