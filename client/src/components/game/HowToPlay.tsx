'use client';

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

// Werewolf first (the threat), then village roles
const ROLE_ORDER: Role[] = ['werewolf', 'seer', 'doctor', 'bodyguard', 'witch', 'hunter', 'villager'];

const PHASE_STEPS: { phase: 'night' | 'day' | 'voting'; descKey: string; color: string }[] = [
  { phase: 'night',  descKey: 'howto.nightDesc',  color: '#a78bfa' },
  { phase: 'day',    descKey: 'howto.dayDesc',    color: '#fbbf24' },
  { phase: 'voting', descKey: 'howto.votingDesc', color: '#f87171' },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="block h-px flex-1 bg-amber-800/40" />
      <span className="text-amber-500 text-[10px] font-cinzel uppercase tracking-[0.25em]">{children}</span>
      <span className="block h-px flex-1 bg-amber-800/40" />
    </div>
  );
}

export function HowToPlay({ onClose }: { onClose: () => void }) {
  const T = useT();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-phase-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[88vh] flex flex-col rounded-xl overflow-hidden"
        style={{ backgroundColor: '#0d0a06', border: '1px solid rgba(146,64,14,0.55)', boxShadow: '0 0 60px rgba(0,0,0,0.9)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(120,65,10,0.30)' }}>
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#d97706" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M9.2 9.2a2.8 2.8 0 0 1 5.4.9c0 1.9-2.8 2.5-2.8 2.5" />
              <circle cx="12" cy="17" r="0.6" fill="#d97706" stroke="none" />
            </svg>
            <h2 className="font-cinzel text-lg font-bold tracking-widest uppercase" style={{ color: '#fbbf24' }}>
              {T('howto.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-md transition-colors"
            style={{ color: '#92400e' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fbbf24')}
            onMouseLeave={e => (e.currentTarget.style.color = '#92400e')}
          >×</button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

          {/* Objective */}
          <section>
            <SectionTitle>{T('howto.objectiveTitle')}</SectionTitle>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(120,53,0,0.18)', border: '1px solid rgba(180,83,9,0.30)' }}>
                <span className="text-base leading-none mt-0.5">🏰</span>
                <p className="text-[12px] leading-snug" style={{ color: '#fde68a' }}>{T('howto.villageGoal')}</p>
              </div>
              <div className="flex items-start gap-2.5 px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(80,10,10,0.25)', border: '1px solid rgba(185,28,28,0.30)' }}>
                <span className="text-base leading-none mt-0.5">🐺</span>
                <p className="text-[12px] leading-snug" style={{ color: '#fca5a5' }}>{T('howto.wolfGoal')}</p>
              </div>
            </div>
          </section>

          {/* Flow */}
          <section>
            <SectionTitle>{T('howto.flowTitle')}</SectionTitle>
            <div className="space-y-2">
              {PHASE_STEPS.map((step, i) => (
                <div key={step.phase} className="flex items-start gap-3">
                  <div
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-cinzel font-bold mt-0.5"
                    style={{ backgroundColor: `${step.color}22`, border: `1px solid ${step.color}66`, color: step.color }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-cinzel font-bold uppercase tracking-wider" style={{ color: step.color }}>
                      {T(`phase.${step.phase}`)}
                    </p>
                    <p className="text-[11px] leading-snug mt-0.5" style={{ color: '#a8a29e' }}>{T(step.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Roles */}
          <section>
            <SectionTitle>{T('howto.rolesTitle')}</SectionTitle>
            <div className="space-y-2">
              {ROLE_ORDER.map(role => {
                const info = ROLE_INFO[role];
                const isWolf = info.alignment === 'werewolf';
                return (
                  <div
                    key={role}
                    className="flex items-start gap-3 px-2.5 py-2 rounded-lg"
                    style={{ backgroundColor: 'rgba(0,0,0,0.35)', border: `1px solid ${info.accentColor}33` }}
                  >
                    <img
                      src={ROLE_IMAGE[role]}
                      alt=""
                      draggable={false}
                      className="shrink-0 w-11 h-11 rounded-md object-cover object-top"
                      style={{ border: `1px solid ${info.accentColor}55` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-cinzel font-bold uppercase tracking-wide" style={{ color: info.accentColor }}>
                          {T(`role.${role}.name`)}
                        </span>
                        <span
                          className="text-[8px] font-cinzel uppercase tracking-widest px-1.5 py-px rounded-full"
                          style={{
                            backgroundColor: isWolf ? 'rgba(185,28,28,0.20)' : 'rgba(217,119,6,0.18)',
                            color: isWolf ? '#f87171' : '#d97706',
                            border: `1px solid ${isWolf ? 'rgba(185,28,28,0.40)' : 'rgba(217,119,6,0.35)'}`,
                          }}
                        >
                          {T(isWolf ? 'alignment.werewolf' : 'alignment.village')}
                        </span>
                      </div>
                      <p className="text-[11px] leading-snug mt-1" style={{ color: '#a8a29e' }}>
                        {T(`role.${role}.description`)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Tip */}
          <p className="text-[11px] italic text-center leading-snug" style={{ color: '#a16207' }}>
            {T('howto.tip')}
          </p>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-3" style={{ borderTop: '1px solid rgba(120,65,10,0.30)' }}>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-[12px] font-cinzel font-bold uppercase tracking-widest rounded-lg transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundColor: 'rgba(120,53,0,0.85)', border: '1px solid rgba(217,119,6,0.60)', color: '#fde68a' }}
          >
            {T('howto.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
