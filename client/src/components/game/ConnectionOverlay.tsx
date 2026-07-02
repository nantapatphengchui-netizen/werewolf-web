'use client';

import { useT } from '@/i18n';

interface Props {
  /** 'reconnecting' overlays the live board after a drop; 'loading' is the initial standalone screen. */
  mode: 'reconnecting' | 'loading';
  onLeave?: () => void;
}

export function ConnectionOverlay({ mode, onLeave }: Props) {
  const T = useT();
  const isReconnect = mode === 'reconnecting';

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-5 px-6"
      style={{ backgroundColor: 'rgba(3,4,6,0.82)', backdropFilter: 'blur(3px)' }}
    >
      {/* Spinner ring */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full" style={{ border: '3px solid rgba(120,65,10,0.25)' }} />
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{ border: '3px solid transparent', borderTopColor: '#d97706', borderRightColor: '#92400e' }}
        />
        {/* Moon glyph in the middle */}
        <svg viewBox="0 0 24 24" className="absolute inset-0 m-auto w-6 h-6" fill="#fbbf24">
          <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
        </svg>
      </div>

      <div className="text-center">
        <p
          className="font-cinzel text-lg font-bold tracking-widest uppercase"
          style={{ color: '#fbbf24', textShadow: '0 0 16px rgba(217,119,6,0.5)' }}
        >
          {isReconnect ? T('conn.reconnecting') : T('conn.loading')}
        </p>
        {isReconnect && (
          <p className="text-[12px] mt-1.5 tracking-wide" style={{ color: '#a16207' }}>
            {T('conn.reconnectingDesc')}
          </p>
        )}
      </div>

      {onLeave && (
        <button
          onClick={onLeave}
          className="mt-2 px-4 py-2 text-[11px] font-cinzel uppercase tracking-widest rounded-lg transition-colors"
          style={{ border: '1px solid rgba(146,64,14,0.50)', color: '#92400e' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={e => (e.currentTarget.style.color = '#92400e')}
        >
          {T('conn.leaveHome')}
        </button>
      )}
    </div>
  );
}
