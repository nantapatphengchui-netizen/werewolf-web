'use client';

export type ToastTone = 'default' | 'danger' | 'safe' | 'arcane';

export interface ToastState {
  text: string;
  tone: ToastTone;
  key: number;
}

const TONE: Record<ToastTone, { bg: string; border: string; color: string; glow: string }> = {
  default: { bg: 'rgba(20,14,4,0.96)',  border: 'rgba(217,119,6,0.55)',  color: '#fde68a', glow: 'rgba(217,119,6,0.30)' },
  danger:  { bg: 'rgba(30,6,6,0.96)',   border: 'rgba(239,68,68,0.55)',  color: '#fca5a5', glow: 'rgba(220,38,38,0.30)' },
  safe:    { bg: 'rgba(4,26,18,0.96)',  border: 'rgba(52,211,153,0.55)', color: '#a7f3d0', glow: 'rgba(16,185,129,0.30)' },
  arcane:  { bg: 'rgba(20,10,34,0.96)', border: 'rgba(139,92,246,0.55)', color: '#ddd6fe', glow: 'rgba(124,58,237,0.30)' },
};

export function ActionToast({ toast }: { toast: ToastState }) {
  const t = TONE[toast.tone];
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[75] pointer-events-none">
      <div
        key={toast.key}
        className="flex items-center gap-2 px-4 py-2 rounded-full"
        style={{
          backgroundColor: t.bg,
          border: `1px solid ${t.border}`,
          boxShadow: `0 4px 24px rgba(0,0,0,0.6), 0 0 18px ${t.glow}`,
          animation: 'toast-pop 2.2s ease-out forwards',
        }}
      >
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="none">
          <path d="M3 8l4 4 6-6" stroke={t.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-[12px] font-cinzel uppercase tracking-wide whitespace-nowrap" style={{ color: t.color }}>
          {toast.text}
        </span>
      </div>
    </div>
  );
}
