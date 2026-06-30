import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function DarkPanel({ children, className = '' }: Props) {
  return (
    <div
      className={`bg-gradient-to-b from-black/82 to-black/72 backdrop-blur-md border border-amber-900/50 rounded-lg shadow-[inset_0_1px_0_rgba(251,191,36,0.06),0_4px_24px_rgba(0,0,0,0.55)] ${className}`}
    >
      {children}
    </div>
  );
}
