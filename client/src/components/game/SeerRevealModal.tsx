'use client';

import { useEffect } from 'react';
import type { Role } from '@/types/game';
import { ROLE_INFO } from '@/types/game';
import { useT } from '@/i18n';

const ROLE_IMAGE: Record<Role, string> = {
  werewolf:  '/role-werewolf.png',
  seer:      '/role-seer.png',
  doctor:    '/role-doctor.png',
  villager:  '/role-villager.png',
  hunter:    '/role-hunter.png',
  witch:     '/role-witch.png',
  bodyguard: '/role-bodyguard.png',
};

interface Props {
  targetName: string;
  role: Role;
  onDismiss: () => void;
}

export function SeerRevealModal({ targetName, role, onDismiss }: Props) {
  const T = useT();
  const isWolf = role === 'werewolf';
  const verdict = isWolf ? '#ef4444' : '#34d399';

  // Auto-dismiss after a beat
  useEffect(() => {
    const id = setTimeout(onDismiss, 6000);
    return () => clearTimeout(id);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-phase-in"
      style={{ backgroundColor: 'rgba(8,3,20,0.88)', backdropFilter: 'blur(4px)' }}
      onClick={onDismiss}
    >
      <div
        className="relative w-full max-w-xs rounded-2xl overflow-hidden text-center"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(46,16,101,0.75) 0%, #0d0a14 70%)',
          border: '1px solid rgba(139,92,246,0.55)',
          boxShadow: '0 0 60px rgba(124,58,237,0.45)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pt-6 px-6">
          <p className="text-[10px] font-cinzel uppercase tracking-[0.3em]" style={{ color: '#a78bfa' }}>
            {T('seerReveal.title')}
          </p>
          <p className="text-[10px] italic mt-1" style={{ color: 'rgba(167,139,250,0.6)' }}>
            {T('seerReveal.subtitle')}
          </p>
        </div>

        {/* Eye + role image */}
        <div className="relative flex items-center justify-center my-5" style={{ height: 132 }}>
          {/* Pulsing mystical ring */}
          <div
            className="absolute rounded-full"
            style={{
              width: 132, height: 132,
              border: '1px solid rgba(139,92,246,0.35)',
              boxShadow: '0 0 30px rgba(124,58,237,0.35) inset',
              animation: 'seer-ring-pulse 2.4s ease-in-out infinite',
            }}
          />
          <div style={{ animation: 'seer-eye-open 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
            <img
              src={ROLE_IMAGE[role]}
              alt=""
              draggable={false}
              className="w-24 h-24 rounded-full object-cover object-top"
              style={{ border: `2px solid ${verdict}`, boxShadow: `0 0 24px ${verdict}88` }}
            />
          </div>
        </div>

        {/* Target name */}
        <p className="px-6 font-cinzel text-xl font-bold tracking-wider uppercase truncate" style={{ color: '#f5e6c8' }}>
          {targetName}
        </p>

        {/* True role */}
        <p className="mt-1 text-[10px] font-cinzel uppercase tracking-[0.2em]" style={{ color: 'rgba(167,139,250,0.7)' }}>
          {T('seerReveal.roleLabel')}: <span style={{ color: ROLE_INFO[role].accentColor }}>{T(`role.${role}.name`)}</span>
        </p>

        {/* Verdict banner */}
        <div
          className="mx-6 mt-4 mb-5 flex items-center justify-center gap-2 py-2.5 rounded-lg"
          style={{
            backgroundColor: isWolf ? 'rgba(127,29,29,0.35)' : 'rgba(6,78,59,0.35)',
            border: `1px solid ${verdict}66`,
            animation: 'seer-verdict-in 0.5s 0.35s ease-out backwards',
          }}
        >
          {isWolf ? (
            <svg viewBox="0 0 20 20" className="w-4 h-4 shrink-0" fill="none">
              <path d="M6 4Q4.5 9 7 16M10 3Q10 9 10 17M14 4Q15.5 9 13 16" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" className="w-4 h-4 shrink-0" fill="none">
              <path d="M4 10l4 4 8-8" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          <span className="font-cinzel text-sm font-bold tracking-wide" style={{ color: verdict }}>
            {isWolf ? T('seerReveal.isWerewolf') : T('seerReveal.isSafe')}
          </span>
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="w-full py-3 text-[11px] font-cinzel font-bold uppercase tracking-widest transition-all duration-150 hover:brightness-125 active:scale-[0.98]"
          style={{ backgroundColor: 'rgba(46,16,101,0.6)', borderTop: '1px solid rgba(139,92,246,0.35)', color: '#c4b5fd' }}
        >
          {T('seerReveal.dismiss')}
        </button>
      </div>
    </div>
  );
}
