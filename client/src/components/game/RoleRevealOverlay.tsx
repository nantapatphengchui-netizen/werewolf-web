'use client';

import { useState, useEffect, useRef } from 'react';
import type { Role } from '@/types/game';
import { ROLE_INFO } from '@/types/game';
import { RoleSkillIcon } from './RoleSkillIcon';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useT } from '@/i18n';

const ROLE_IMAGE: Record<Role, string> = {
  werewolf:  '/role-werewolf.png',
  seer:      '/role-seer.png',
  doctor:    '/role-doctor.png',
  villager:  '/role-villager.png',
  hunter:    '/role-hunter.png',
  witch:     '/role-witch.png',
  bodyguard: '/role-bodyguard.png',
  jester:    '/role-joker.png',
};

// Gacha-style single-card reveal:
// enter (card descends) → charge (trembles, aura tints toward YOUR role colour)
// → ready (floats, waiting for the tap) → burst (flash + flip) → revealed
type Phase = 'enter' | 'charge' | 'ready' | 'burst' | 'revealed';
const ORDER: Record<Phase, number> = { enter: 0, charge: 1, ready: 2, burst: 3, revealed: 4 };

const KEYFRAMES = `
@keyframes reveal-descend{from{transform:translateY(-80px) scale(.9);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}
@keyframes reveal-shake{0%,100%{transform:translate(0,0) rotate(0deg)}20%{transform:translate(-1.6px,1px) rotate(-.5deg)}40%{transform:translate(1.6px,-1px) rotate(.5deg)}60%{transform:translate(-1.1px,-1px) rotate(-.35deg)}80%{transform:translate(1.1px,1px) rotate(.35deg)}}
@keyframes card-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes charge-glow{0%,100%{opacity:.30;transform:scale(.92)}50%{opacity:.70;transform:scale(1.04)}}
@keyframes ready-glow{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
@keyframes seam-flicker{0%,100%{opacity:.12}50%{opacity:.7}}
@keyframes reveal-flash{from{opacity:.92}to{opacity:0}}
@keyframes reveal-ring{from{transform:scale(.55);opacity:.85}to{transform:scale(2.1);opacity:0}}
@keyframes spark-fly{from{transform:translate(0,0) scale(1);opacity:1}to{transform:translate(var(--sx),var(--sy)) scale(0);opacity:0}}
@keyframes pulseGlow{0%,100%{opacity:1}50%{opacity:.55}}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
`;

// Burst sparks — direction endpoints (px) around the card
const SPARKS = [
  { sx: '110px',  sy: '-70px',  d: '0s',    s: 5 },
  { sx: '-120px', sy: '-40px',  d: '0.04s', s: 4 },
  { sx: '80px',   sy: '110px',  d: '0.02s', s: 5 },
  { sx: '-90px',  sy: '95px',   d: '0.07s', s: 4 },
  { sx: '140px',  sy: '25px',   d: '0.05s', s: 3.5 },
  { sx: '-145px', sy: '15px',   d: '0.03s', s: 3.5 },
  { sx: '30px',   sy: '-130px', d: '0.06s', s: 4.5 },
  { sx: '-40px',  sy: '-120px', d: '0.01s', s: 4 },
  { sx: '55px',   sy: '125px',  d: '0.08s', s: 3 },
  { sx: '-15px',  sy: '135px',  d: '0.05s', s: 3 },
] as const;

function CardFace({ role }: { role: Role }) {
  const info = ROLE_INFO[role];
  const T = useT();
  return (
    <div className="w-full h-full rounded-xl overflow-hidden relative">
      <img
        src={ROLE_IMAGE[role]}
        alt={T(`role.${role}.name`)}
        className="absolute inset-0 w-full h-full object-cover object-top"
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)' }}
      />
      <div className="absolute bottom-0 left-0 right-0 py-2 sm:py-3 text-center px-1">
        <p
          className="font-cinzel text-[11px] sm:text-[14px] font-bold uppercase tracking-widest"
          style={{ color: info.accentColor, textShadow: `0 0 14px ${info.accentColor}90` }}
        >
          {T(`role.${role}.name`)}
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
  const T = useT();
  const reducedMotion     = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('enter');
  const roleInfo          = ROLE_INFO[myRole];
  const accent            = roleInfo.accentColor;

  // "Deal into place" — after the reveal, the card flies to the player's slot
  const cardRef                     = useRef<HTMLDivElement>(null);
  const [flying, setFlying]         = useState(false);
  const [flyStarted, setFlyStarted] = useState(false);
  const [fly, setFly]               = useState<{ from: DOMRect; to: DOMRect } | null>(null);

  // Never move backwards through phases (timers may fire after a manual skip)
  const advanceTo = (target: Phase) =>
    setPhase(p => (ORDER[p] >= ORDER[target] ? p : target));

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    if (reducedMotion) {
      timersRef.current = [setTimeout(() => setPhase('revealed'), 150)];
    } else {
      timersRef.current = [
        setTimeout(() => advanceTo('charge'), 750),
        setTimeout(() => advanceTo('ready'),  2500),
        setTimeout(() => advanceTo('burst'),  6500), // auto-open if the player never taps
      ];
    }
    return () => timersRef.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // burst → revealed once the flip lands
  useEffect(() => {
    if (phase !== 'burst') return;
    const t = setTimeout(() => setPhase('revealed'), 850);
    return () => clearTimeout(t);
  }, [phase]);

  const handleTap = () => {
    if (flying || phase === 'burst') return;
    if (phase === 'revealed') { handleEnter(); return; }
    advanceTo('burst'); // open the card now
  };

  const handleEnter = () => {
    if (flying) return;
    const from = cardRef.current?.getBoundingClientRect();
    const to   = document.querySelector('[data-own-card="true"]')?.getBoundingClientRect();
    if (!from || !to || to.width === 0) { onDismiss(); return; }
    setFly({ from, to });
    setFlying(true);
    // Two frames so the clone paints at the source rect before transitioning
    requestAnimationFrame(() => requestAnimationFrame(() => setFlyStarted(true)));
    setTimeout(onDismiss, 700);
  };

  // Auto-deal the card into the slot after the player has had time to read
  useEffect(() => {
    if (phase !== 'revealed') return;
    const t = setTimeout(handleEnter, 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const isOpen     = phase === 'burst' || phase === 'revealed';
  const isRevealed = phase === 'revealed';

  // Card animation per phase (none during flip so the transform transition plays)
  const cardAnim =
    phase === 'enter'  ? 'reveal-descend 0.7s cubic-bezier(0.22,1,0.36,1) both'
    : phase === 'charge' ? 'reveal-shake 0.45s ease-in-out infinite'
    : phase === 'ready'  ? 'card-float 2.6s ease-in-out infinite'
    : undefined;

  const glowAnim =
    phase === 'charge' ? 'charge-glow 1.3s ease-in-out infinite'
    : phase === 'ready' ? 'ready-glow 0.85s ease-in-out infinite'
    : undefined;

  return (
    <div
      onClick={handleTap}
      className={`fixed inset-0 px-4 ${flying ? '' : 'cursor-pointer'}`}
      style={{
        zIndex: 200,
        backgroundColor: flying ? 'rgba(2,0,8,0)' : 'rgba(2,0,8,0.94)',
        backdropFilter: flying ? 'blur(0px)' : 'blur(6px)',
        WebkitBackdropFilter: flying ? 'blur(0px)' : 'blur(6px)',
        transition: 'background-color 0.7s ease, backdrop-filter 0.7s ease',
        pointerEvents: flying ? 'none' : undefined,
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* Everything except the flying clone fades out as the card is dealt in */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center px-4"
        style={{ opacity: flying ? 0 : 1, transition: 'opacity 0.4s ease' }}
      >

        {/* ── Title ── */}
        <div className="mb-4 sm:mb-6 text-center" style={{ animation: 'fadeUp 0.7s ease both' }}>
          <p
            className="text-[9px] sm:text-[10px] font-cinzel uppercase tracking-[0.4em] mb-1"
            style={{ color: 'rgba(167,139,250,0.55)' }}
          >
            {T('reveal.destiny')}
          </p>
          <h2
            className="font-cinzel text-lg sm:text-2xl font-bold uppercase tracking-widest"
            style={{ color: '#e2d9f3', textShadow: '0 0 24px rgba(139,92,246,0.38)' }}
          >
            {T('reveal.decided')}
          </h2>
        </div>

        {/* ── Card stage ── */}
        <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>

          {/* Moonbeam from above */}
          <div
            className="absolute inset-x-0 -top-10 mx-auto pointer-events-none"
            style={{
              width: 190,
              height: 340,
              background: 'linear-gradient(180deg, rgba(196,181,253,0.14) 0%, rgba(196,181,253,0.05) 55%, transparent 100%)',
              clipPath: 'polygon(32% 0, 68% 0, 100% 100%, 0 100%)',
              opacity: phase === 'enter' ? 0 : isOpen ? 0.35 : 1,
              transition: 'opacity 0.8s ease',
            }}
          />

          {/* Charging aura — tinted with YOUR role colour (the tell before the flip) */}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              width: 300,
              height: 320,
              background: `radial-gradient(ellipse, ${accent}59 0%, ${accent}21 45%, transparent 70%)`,
              opacity: glowAnim ? undefined : 0,
              animation: glowAnim,
              transition: 'opacity 0.4s ease',
            }}
          />

          {/* Burst effects */}
          {isOpen && (
            <>
              {/* Flash */}
              <div
                className="absolute pointer-events-none rounded-full"
                style={{
                  width: 320, height: 320,
                  background: `radial-gradient(circle, rgba(255,255,255,0.9) 0%, ${accent}88 35%, transparent 68%)`,
                  animation: 'reveal-flash 0.55s ease-out both',
                }}
              />
              {/* Shockwave ring */}
              <div
                className="absolute pointer-events-none rounded-full"
                style={{
                  width: 220, height: 260,
                  border: `2px solid ${accent}cc`,
                  boxShadow: `0 0 24px ${accent}88, inset 0 0 18px ${accent}44`,
                  animation: 'reveal-ring 0.7s ease-out both',
                }}
              />
              {/* Sparks */}
              {SPARKS.map((sp, i) => (
                <span
                  key={i}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: sp.s, height: sp.s,
                    backgroundColor: i % 3 === 0 ? '#ffe9b8' : accent,
                    boxShadow: `0 0 8px 2px ${i % 3 === 0 ? 'rgba(255,220,150,0.8)' : `${accent}aa`}`,
                    ['--sx' as string]: sp.sx,
                    ['--sy' as string]: sp.sy,
                    animation: `spark-fly 0.7s ${sp.d} cubic-bezier(0.2,0.7,0.4,1) both`,
                  } as React.CSSProperties}
                />
              ))}
            </>
          )}

          {/* The card */}
          <div
            ref={cardRef}
            style={{
              width: 'clamp(150px, 38vw, 190px)',
              height: 'clamp(220px, 56vw, 278px)',
              perspective: '900px',
              animation: cardAnim,
              filter: isOpen
                ? `drop-shadow(0 0 30px ${accent}66) drop-shadow(0 16px 40px rgba(0,0,0,0.7))`
                : 'drop-shadow(0 14px 34px rgba(0,0,0,0.7))',
              transition: 'filter 0.5s ease',
            }}
          >
            <div
              style={{
                width: '100%', height: '100%',
                transformStyle: 'preserve-3d',
                transform: isOpen ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1)',
                position: 'relative',
              }}
            >
              {/* Back */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  borderRadius: '12px', overflow: 'hidden',
                  border: `1px solid ${phase === 'ready' ? `${accent}88` : 'rgba(109,40,217,0.35)'}`,
                  transition: 'border-color 0.6s ease',
                }}
              >
                <img src="/card-back.png" alt="" draggable={false} className="w-full h-full object-cover" />
                {/* Cracking light seams while charging */}
                {(phase === 'charge' || phase === 'ready') && (
                  <>
                    <div className="absolute pointer-events-none" style={{ left: '18%', top: '-6%', width: 1.5, height: '115%', transform: 'rotate(14deg)', background: `linear-gradient(180deg, transparent, ${accent}, transparent)`, animation: 'seam-flicker 1.1s ease-in-out 0.1s infinite' }} />
                    <div className="absolute pointer-events-none" style={{ left: '58%', top: '-6%', width: 1.5, height: '115%', transform: 'rotate(-11deg)', background: `linear-gradient(180deg, transparent, ${accent}, transparent)`, animation: 'seam-flicker 1.3s ease-in-out 0.5s infinite' }} />
                    <div className="absolute pointer-events-none" style={{ left: '82%', top: '-6%', width: 1, height: '115%', transform: 'rotate(9deg)', background: `linear-gradient(180deg, transparent, ${accent}cc, transparent)`, animation: 'seam-flicker 0.9s ease-in-out 0.3s infinite' }} />
                  </>
                )}
              </div>
              {/* Face */}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  borderRadius: '12px', overflow: 'hidden',
                  border: `1px solid ${accent}66`,
                }}
              >
                <CardFace role={myRole} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Tap-to-open prompt (ready) ── */}
        <p
          className="mt-3 font-cinzel text-[11px] sm:text-[12px] uppercase tracking-[0.3em] text-center"
          style={{
            color: accent,
            textShadow: `0 0 14px ${accent}88`,
            opacity: phase === 'ready' ? 1 : 0,
            transition: 'opacity 0.4s ease',
            animation: phase === 'ready' ? 'pulseGlow 1.2s ease-in-out infinite' : undefined,
          }}
        >
          {T('reveal.tapOpen')}
        </p>

        {/* ── Role info after the flip ── */}
        <div
          className="mt-3 sm:mt-4 text-center"
          style={{
            opacity: isRevealed ? 1 : 0,
            transform: isRevealed ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 0.65s, transform 0.65s',
            pointerEvents: isRevealed ? 'auto' : 'none',
          }}
        >
          <p
            className="text-[8px] sm:text-[9px] font-cinzel uppercase tracking-[0.32em] mb-1"
            style={{ color: `${accent}80` }}
          >
            {T('reveal.youAre')}
          </p>
          <h3
            className="font-cinzel text-2xl sm:text-4xl font-bold uppercase tracking-widest mb-2"
            style={{ color: accent, textShadow: `0 0 28px ${accent}70` }}
          >
            {T(`role.${myRole}.name`)}
          </h3>
          <p
            className="text-[10px] sm:text-[11px] max-w-xs sm:max-w-sm leading-relaxed mb-1"
            style={{ color: 'rgba(255,255,255,0.50)' }}
          >
            {T(`role.${myRole}.description`)}
          </p>
          {/* Skill badge */}
          <div className="flex items-center justify-center gap-2 mt-1">
            <RoleSkillIcon role={myRole} size={20} color={accent} />
            <span
              className="text-[10px] sm:text-[11px] font-cinzel font-bold uppercase tracking-widest"
              style={{ color: accent }}
            >
              {T(`skill.${myRole}`)}
            </span>
          </div>
        </div>

        {/* Tap hint (before the reveal) */}
        <span
          className="absolute bottom-6 left-0 right-0 text-center text-[10px] font-cinzel uppercase tracking-[0.3em] pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.28)', opacity: isRevealed ? 0 : 1, transition: 'opacity 0.4s' }}
        >
          {T('overlay.tapSkip')}
        </span>

      </div>{/* end fading content */}

      {/* ── Flying clone — deals the revealed card into the player's own slot ── */}
      {fly && (
        <div
          style={{
            position: 'fixed',
            left: fly.from.left,
            top: fly.from.top,
            width: fly.from.width,
            height: fly.from.height,
            transformOrigin: 'top left',
            transform: flyStarted
              ? `translate(${fly.to.left - fly.from.left}px, ${fly.to.top - fly.from.top}px) scale(${fly.to.width / fly.from.width}, ${fly.to.height / fly.from.height})`
              : 'none',
            opacity: flyStarted ? 0.15 : 1,
            transition: 'transform 0.66s cubic-bezier(0.5,0,0.2,1), opacity 0.66s ease-in',
            zIndex: 210,
            borderRadius: '12px',
            boxShadow: `0 0 44px ${accent}66, 0 18px 44px rgba(0,0,0,0.7)`,
            pointerEvents: 'none',
          }}
        >
          <CardFace role={myRole} />
        </div>
      )}
    </div>
  );
}
