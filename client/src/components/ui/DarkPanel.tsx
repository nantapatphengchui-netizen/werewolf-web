import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function DarkPanel({ children, className = '' }: Props) {
  return (
    <div
      style={{ backgroundColor: 'rgba(3,5,7,0.92)' }}
      className={`border border-amber-800/55 rounded-lg shadow-[0_4px_28px_rgba(0,0,0,0.7)] ${className}`}
    >
      {children}
    </div>
  );
}
