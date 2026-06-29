import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function DarkPanel({ children, className = '' }: Props) {
  return (
    <div
      className={`bg-gradient-to-b from-black/60 to-black/50 backdrop-blur-md border border-amber-900/40 rounded-lg shadow-[inset_0_1px_0_rgba(251,191,36,0.04),0_4px_24px_rgba(0,0,0,0.4)] ${className}`}
    >
      {children}
    </div>
  );
}
