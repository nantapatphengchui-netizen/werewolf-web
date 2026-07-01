'use client';

import { useState, useEffect } from 'react';
import type { Role } from '@/types/game';
import { ROLE_INFO } from '@/types/game';

const ROLE_IMAGE: Record<Role, string> = {
  werewolf:  '/role-werewolf.png',
  seer:      '/role-seer.png',
  doctor:    '/role-doctor.png',
  villager:  '/role-villager.png',
  hunter:    '/role-hunter.png',
  witch:     '/role-witch.png',
  bodyguard: '/role-bodyguard.png',
};

type Phase = 'enter' | 'spread' | 'shuffle' | 'pick' | 'flip' | 'revealed';

const KEYFRAMES = `
@keyframes cardShuf0{
  0%,100%{transform:translateX(0) rotate(-5deg)}
  20%{transform:translateX(90px) rotate(7deg)}
  40%{transform:translateX(-75px) rotate(-9deg)}
  60%{transform:translateX(105px) rotate(6deg)}
  80%{transform:translateX(-55px) rotate(-4deg)}
}
@keyframes cardShuf1{
  0%,100%{transform:translateX(0) rotate(-2deg)}
  15%{transform:translateX(-95px) rotate(-8deg)}
  35%{transform:translateX(85px) rotate(9deg)}
  55%{transform:translateX(-85px) rotate(-6deg)}
  75%{transform:translateX(65px) rotate(5deg)}
}
@keyframes cardShuf2{
  0%,100%{transform:translateX(0) rotate(2deg)}
  25%{transform:translateX(85px) rotate(8deg)}
  45%{transform:translateX(-95px) rotate(-9deg)}
  65%{transform:translateX(75px) rotate(7deg)}
  85%{transform:translateX(-60px) rotate(-6deg)}
}
@keyframes cardShuf3{
  0%,100%{transform:translateX(0) rotate(5deg)}
  20%{transform:translateX(-85px) rotate(-7deg)}
  40%{transform:translateX(100px) rotate(10deg)}
  60%{transform:translateX(-75px) rotate(-6deg)}
  80%{transform:translateX(90px) rotate(8deg)}
}
@keyframes pulseGlow{
  0%,100%{opacity:1}
  50%{opacity:0.65}
}
@keyframes fadeUp{
  from{opacity:0;transform:translateY(16px)}
  to{opacity:1;transform:translateY(0)}
}
`;

const SPREAD_ROTATIONS = [-7, -2, 2, 7];

function CardBack() {
  return (
    <img
      src="/card-back.png"
      alt=""
      draggable={false}
      className="w-full h-full rounded-xl object-cover"
    />
  );
}

function CardFace({ role }: { role: Role }) {
  const info = ROLE_INFO[role];
  return (
    <div className="w-full h-full rounded-xl overflow-hidden relative">
      <img
        src={ROLE_IMAGE[role]}
        alt={info.name}
        className="absolute inset-0 w-full h-full object-cover object-top"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)' }}
      />
      <div className="absolute bottom-0 left-0 right-0 py-2 sm:py-3 text-center px-1">
        <p
          className="font-cinzel text-[10px] sm:text-[13px] font-bold uppercase tracking-widest"
          style={{ color: info.accentColor, textShadow: `0 0 14px ${info.accentColor}90` }}
        >
          {info.name}
        </p>
      </div>
    </div>
  );
}

interface Props {
  myRole: Role;
  onDismiss: () => void;
}

export function RoleRevealOverlay({ myRole, onDismiss }: Props) {
  const [phase, setPhase]     = useState<Phase>('enter');
  const [yourIdx]             = useState(() => Math.floor(Math.random() * 4));
  const roleInfo              = ROLE_INFO[myRole];

  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase('spread'),   350),
      setTimeout(() => setPhase('shuffle'),  950),
      setTimeout(() => setPhase('pick'),    2750),
      setTimeout(() => setPhase('flip'),    3250),
      setTimeout(() => setPhase('revealed'), 4050),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  const isSpread   = phase !== 'enter';
  const isShuffling = phase === 'shuffle';
  const isPick     = phase === 'pick' || phase === 'flip' || phase === 'revealed';
  const isFlipped  = phase === 'flip' || phase === 'revealed';
  const isRevealed = phase === 'revealed';

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-4"
      style={{ zIndex: 200, backgroundColor: 'rgba(2,0,8,0.94)', backdropFilter: 'blur(6px)' }}
    >
      <style>{KEYFRAMES}</style>

      {/* ── Title ── */}
      <div
        className="mb-6 sm:mb-10 text-center"
        style={{
          transition: 'opacity 0.6s, transform 0.6s',
          opacity: isSpread ? 1 : 0,
          transform: isSpread ? 'translateY(0)' : 'translateY(-18px)',
        }}
      >
        <p
          className="text-[9px] sm:text-[10px] font-cinzel uppercase tracking-[0.4em] mb-1"
          style={{ color: 'rgba(167,139,250,0.55)' }}
        >
          ✦ Destiny is Written ✦
        </p>
        <h2
          className="font-cinzel text-lg sm:text-2xl font-bold uppercase tracking-widest"
          style={{ color: '#e2d9f3', textShadow: '0 0 24px rgba(139,92,246,0.38)' }}
        >
          Your Role Has Been Decided
        </h2>
      </div>

      {/* ── 4 Cards ── */}
      <div className="flex gap-2.5 sm:gap-4 items-end">
        {[0, 1, 2, 3].map(i => {
          const isYours = i === yourIdx;
          const rot     = SPREAD_ROTATIONS[i];

          const cardStyle: React.CSSProperties = {
            width:  'clamp(72px, 18vw, 112px)',
            height: 'clamp(106px, 26vw, 164px)',
            transition: isShuffling ? 'none' : 'all 0.65s cubic-bezier(0.34,1.45,0.64,1)',
            transitionDelay: isShuffling ? '0ms' : `${i * 55}ms`,
            transform: isSpread
              ? `translateY(0) rotate(${rot}deg)`
              : 'translateY(90px)',
            opacity: isSpread
              ? (isPick && !isYours ? 0.28 : 1)
              : 0,
            animation: isShuffling
              ? `cardShuf${i} 0.42s ease-in-out infinite`
              : undefined,
            position: 'relative',
            zIndex: isYours ? 10 : 1,
            flexShrink: 0,
          };

          const borderColor = isPick && isYours
            ? roleInfo.accentColor
            : 'rgba(109,40,217,0.28)';
          const shadow = isPick && isYours && !isFlipped
            ? `0 0 32px ${roleInfo.accentColor}55, 0 0 64px ${roleInfo.accentColor}22`
            : '0 10px 36px rgba(0,0,0,0.65)';

          return (
            <div key={i} style={cardStyle}>
              {/* Glow pulse ring on "pick" */}
              {isPick && isYours && !isFlipped && (
                <div
                  className="absolute -inset-2 rounded-2xl pointer-events-none"
                  style={{
                    border: `2px solid ${roleInfo.accentColor}60`,
                    animation: 'pulseGlow 0.9s ease-in-out infinite',
                  }}
                />
              )}

              {/* 3-D flip wrapper */}
              <div style={{ perspective: '700px', width: '100%', height: '100%' }}>
                <div
                  style={{
                    width: '100%', height: '100%',
                    transformStyle: 'preserve-3d',
                    transform: isYours && isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: 'transform 0.80s cubic-bezier(0.4,0,0.2,1)',
                    position: 'relative',
                  }}
                >
                  {/* Back face */}
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      backfaceVisibility: 'hidden',
                      borderRadius: '12px', overflow: 'hidden',
                      border: `1px solid ${borderColor}`,
                      boxShadow: shadow,
                      transition: 'border 0.4s, box-shadow 0.4s',
                    }}
                  >
                    <CardBack />
                  </div>

                  {/* Front face (role image) */}
                  <div
                    style={{
                      position: 'absolute', inset: 0,
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      borderRadius: '12px', overflow: 'hidden',
                      boxShadow: `0 0 44px ${roleInfo.accentColor}55, 0 18px 44px rgba(0,0,0,0.70)`,
                    }}
                  >
                    <CardFace role={myRole} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Role info after flip ── */}
      <div
        className="mt-6 sm:mt-9 text-center"
        style={{
          opacity: isRevealed ? 1 : 0,
          transform: isRevealed ? 'translateY(0)' : 'translateY(18px)',
          transition: 'opacity 0.65s, transform 0.65s',
          pointerEvents: isRevealed ? 'auto' : 'none',
        }}
      >
        <p
          className="text-[8px] sm:text-[9px] font-cinzel uppercase tracking-[0.32em] mb-1"
          style={{ color: `${roleInfo.accentColor}80` }}
        >
          You Are
        </p>
        <h3
          className="font-cinzel text-2xl sm:text-4xl font-bold uppercase tracking-widest mb-2"
          style={{ color: roleInfo.accentColor, textShadow: `0 0 28px ${roleInfo.accentColor}70` }}
        >
          {roleInfo.name}
        </h3>
        <p
          className="text-[10px] sm:text-[11px] max-w-xs sm:max-w-sm leading-relaxed mb-1"
          style={{ color: 'rgba(255,255,255,0.50)' }}
        >
          {roleInfo.description}
        </p>
        {roleInfo.nightAction && (
          <p
            className="text-[9px] sm:text-[10px] max-w-xs sm:max-w-sm leading-relaxed mb-5 italic"
            style={{ color: `${roleInfo.accentColor}70` }}
          >
            ✦ {roleInfo.nightAction}
          </p>
        )}
        <button
          onClick={onDismiss}
          className="px-6 sm:px-8 py-2 sm:py-2.5 font-cinzel text-[10px] sm:text-[11px] uppercase tracking-widest rounded-lg transition-all duration-150 hover:brightness-125 active:scale-[0.97]"
          style={{
            background: `linear-gradient(135deg, ${roleInfo.accentColor}30 0%, rgba(0,0,0,0.65) 100%)`,
            border: `1px solid ${roleInfo.accentColor}72`,
            color: roleInfo.accentColor,
            boxShadow: `0 0 22px ${roleInfo.accentColor}25`,
          }}
        >
          Enter the Game ✦
        </button>
      </div>
    </div>
  );
}
