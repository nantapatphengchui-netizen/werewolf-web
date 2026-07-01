'use client';

import { useRef, useState, useEffect } from 'react';
import type { Player, Role } from '@/types/game';
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

// ── Action color config ───────────────────────────────────────────────────────

export type CardActionType = 'vote' | 'kill' | 'inspect' | 'protect';

interface ActionColorConfig {
  validBorder: string; validGlow: string; hoverGlow: string;
  selBorder: string; selGlow: string; selOverlay: string;
  btnBg: string; btnBorder: string; btnText: string;
  checkColor: string;
}

const ACTION_COLORS: Record<CardActionType, ActionColorConfig> = {
  vote: {
    validBorder: 'rgba(217,119,6,0.72)',  validGlow: '0 0 14px rgba(217,119,6,0.28)',
    hoverGlow:   '0 0 22px rgba(251,191,36,0.55)',
    selBorder:   'rgba(251,191,36,0.92)', selGlow: '0 0 28px rgba(251,191,36,0.55), inset 0 0 0 1px rgba(251,191,36,0.12)',
    selOverlay:  'rgba(251,191,36,0.06)',
    btnBg: 'rgba(120,53,0,0.90)', btnBorder: 'rgba(217,119,6,0.65)', btnText: '#fde68a',
    checkColor: '#fbbf24',
  },
  kill: {
    validBorder: 'rgba(185,28,28,0.72)',  validGlow: '0 0 14px rgba(220,38,38,0.28)',
    hoverGlow:   '0 0 22px rgba(220,38,38,0.55)',
    selBorder:   'rgba(239,68,68,0.92)',  selGlow: '0 0 28px rgba(220,38,38,0.55), inset 0 0 0 1px rgba(239,68,68,0.12)',
    selOverlay:  'rgba(220,38,38,0.06)',
    btnBg: 'rgba(127,29,29,0.90)', btnBorder: 'rgba(239,68,68,0.65)', btnText: '#fca5a5',
    checkColor: '#f87171',
  },
  inspect: {
    validBorder: 'rgba(109,40,217,0.72)', validGlow: '0 0 14px rgba(124,58,237,0.28)',
    hoverGlow:   '0 0 22px rgba(124,58,237,0.55)',
    selBorder:   'rgba(139,92,246,0.92)', selGlow: '0 0 28px rgba(124,58,237,0.55), inset 0 0 0 1px rgba(139,92,246,0.12)',
    selOverlay:  'rgba(124,58,237,0.06)',
    btnBg: 'rgba(76,29,149,0.90)', btnBorder: 'rgba(139,92,246,0.65)', btnText: '#ddd6fe',
    checkColor: '#c4b5fd',
  },
  protect: {
    validBorder: 'rgba(5,150,105,0.72)',  validGlow: '0 0 14px rgba(16,185,129,0.28)',
    hoverGlow:   '0 0 22px rgba(16,185,129,0.55)',
    selBorder:   'rgba(52,211,153,0.92)', selGlow: '0 0 28px rgba(16,185,129,0.55), inset 0 0 0 1px rgba(52,211,153,0.12)',
    selOverlay:  'rgba(16,185,129,0.06)',
    btnBg: 'rgba(6,78,59,0.90)', btnBorder: 'rgba(52,211,153,0.65)', btnText: '#a7f3d0',
    checkColor: '#6ee7b7',
  },
};

// ── Ember particles config ────────────────────────────────────────────────────

const EMBERS = [
  { left: '22%', top: '58%', color: '#fb923c', delay: '0.10s', dur: '0.82s', anim: 'ember-0' },
  { left: '48%', top: '66%', color: '#ef4444', delay: '0.18s', dur: '0.76s', anim: 'ember-1' },
  { left: '68%', top: '46%', color: '#fbbf24', delay: '0.13s', dur: '0.90s', anim: 'ember-2' },
  { left: '32%', top: '42%', color: '#fb923c', delay: '0.26s', dur: '0.74s', anim: 'ember-3' },
  { left: '78%', top: '62%', color: '#fcd34d', delay: '0.07s', dur: '0.84s', anim: 'ember-4' },
  { left: '14%', top: '50%', color: '#ef4444', delay: '0.22s', dur: '0.68s', anim: 'ember-5' },
] as const;

// ── Action icon config ────────────────────────────────────────────────────────

const PULSE_COLORS: Record<CardActionType, string> = {
  vote:    'rgba(251,191,36,0.18)',
  kill:    'rgba(220,38,38,0.18)',
  inspect: 'rgba(124,58,237,0.18)',
  protect: 'rgba(16,185,129,0.18)',
};

const ACTION_GLOW_COLORS: Record<CardActionType, string> = {
  vote:    '#fbbf24',
  kill:    '#ef4444',
  inspect: '#8b5cf6',
  protect: '#10b981',
};

function ClawIcon() {
  return (
    <svg viewBox="0 0 40 40" style={{ width: 44, height: 44 }} fill="none">
      <path d="M11 6 Q9 13 11 24" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round"/>
      <path d="M18 5 Q16 12 18 23" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round"/>
      <path d="M25 6 Q23 13 25 24" stroke="#ef4444" strokeWidth="2.8" strokeLinecap="round"/>
      <circle cx="11" cy="25.5" r="1.6" fill="#ef4444"/>
      <circle cx="18" cy="24.5" r="1.6" fill="#ef4444"/>
      <circle cx="25" cy="25.5" r="1.6" fill="#ef4444"/>
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 40 40" style={{ width: 44, height: 44 }} fill="none">
      <path d="M5 20 Q20 7 35 20 Q20 33 5 20Z" stroke="#8b5cf6" strokeWidth="1.8" fill="rgba(139,92,246,0.15)"/>
      <circle cx="20" cy="20" r="7.5" fill="#8b5cf6" opacity="0.9"/>
      <circle cx="20" cy="20" r="3.5" fill="rgba(10,5,20,0.80)"/>
      <circle cx="22" cy="18" r="1.8" fill="rgba(255,255,255,0.70)"/>
      <path d="M20 5v4M20 31v4M5 20h4M31 20h4" stroke="#8b5cf6" strokeWidth="1.2" strokeLinecap="round" opacity="0.65"/>
    </svg>
  );
}

function MedCrossIcon() {
  return (
    <svg viewBox="0 0 40 40" style={{ width: 44, height: 44 }} fill="none">
      <circle cx="20" cy="20" r="16" stroke="#10b981" strokeWidth="1.2" fill="rgba(16,185,129,0.10)" opacity="0.7"/>
      <path d="M20 9v22M9 20h22" stroke="#10b981" strokeWidth="4.5" strokeLinecap="round"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 40 40" style={{ width: 44, height: 44 }} fill="none">
      <path d="M20 4L6 9.5v8.5c0 7.5 6 13.5 14 16 8-2.5 14-8.5 14-16V9.5L20 4Z" stroke="#3b82f6" strokeWidth="1.8" fill="rgba(59,130,246,0.14)"/>
      <path d="M14 20l4.5 4.5 8-8" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CrosshairIcon() {
  return (
    <svg viewBox="0 0 40 40" style={{ width: 44, height: 44 }} fill="none">
      <circle cx="20" cy="20" r="13" stroke="#ea580c" strokeWidth="1.5" fill="rgba(234,88,12,0.10)"/>
      <circle cx="20" cy="20" r="6" stroke="#ea580c" strokeWidth="1" fill="none" opacity="0.6"/>
      <circle cx="20" cy="20" r="2.5" fill="#ea580c"/>
      <path d="M20 4v7M20 29v7M4 20h7M29 20h7" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function SkullIcon() {
  return (
    <svg viewBox="0 0 40 40" style={{ width: 44, height: 44 }} fill="none">
      <circle cx="20" cy="17" r="10" stroke="#9333ea" strokeWidth="1.5" fill="rgba(147,51,234,0.14)"/>
      <circle cx="15.5" cy="15.5" r="3" fill="#9333ea"/>
      <circle cx="24.5" cy="15.5" r="3" fill="#9333ea"/>
      <path d="M15 23 Q20 27 25 23" stroke="#9333ea" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M14 30h12" stroke="#9333ea" strokeWidth="2" strokeLinecap="round"/>
      <path d="M18 30v4M22 30v4" stroke="#9333ea" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function VoteIcon() {
  return (
    <svg viewBox="0 0 40 40" style={{ width: 44, height: 44 }} fill="none">
      <circle cx="20" cy="20" r="14" stroke="#fbbf24" strokeWidth="1.5" fill="rgba(251,191,36,0.10)"/>
      <path d="M13 20l5 5 9-9" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function getActionIcon(role: Role | null | undefined, actionType: CardActionType) {
  if (actionType === 'vote')    return <VoteIcon />;
  if (actionType === 'inspect') return <EyeIcon />;
  if (actionType === 'protect') return role === 'bodyguard' ? <ShieldIcon /> : <MedCrossIcon />;
  if (role === 'hunter') return <CrosshairIcon />;
  if (role === 'witch')  return <SkullIcon />;
  return <ClawIcon />;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  player: Player;
  index: number;
  isCurrentPlayer: boolean;
  isWerewolfTeammate: boolean;
  voteCount?: number;
  actionSubmitted?: boolean;
  myRole?: Role | null;
  seerRevealedRole?: Role | null;
  isValidTarget?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  suspicionCount?: number;
  isSuspectedByMe?: boolean;
  showSuspectBtn?: boolean;
  onMarkSuspicion?: () => void;
  trustCount?: number;
  isTrustedByMe?: boolean;
  showTrustBtn?: boolean;
  onMarkTrust?: () => void;
  actionType?: CardActionType | null;
  onConfirmAction?: () => void;
  onCancelAction?: () => void;
  showAskBtn?: boolean;
  onAsk?: () => void;
  reaction?: { emoji: string; key: number };
}

// ── Corner ornaments ──────────────────────────────────────────────────────────

function CardCorners({ color, opacity }: { color: string; opacity: number }) {
  const p = { stroke: color, strokeWidth: '1.5', fill: 'none', strokeLinecap: 'round' as const };
  return (
    <>
      <svg viewBox="0 0 14 14" className="absolute top-0.5 left-0.5 w-3 h-3 pointer-events-none z-20" style={{ opacity }}>
        <path d="M1 6V1H6" {...p} />
      </svg>
      <svg viewBox="0 0 14 14" className="absolute top-0.5 right-0.5 w-3 h-3 pointer-events-none z-20" style={{ opacity }}>
        <path d="M8 1H13V6" {...p} />
      </svg>
      <svg viewBox="0 0 14 14" className="absolute bottom-0.5 left-0.5 w-3 h-3 pointer-events-none z-20" style={{ opacity }}>
        <path d="M1 8V13H6" {...p} />
      </svg>
      <svg viewBox="0 0 14 14" className="absolute bottom-0.5 right-0.5 w-3 h-3 pointer-events-none z-20" style={{ opacity }}>
        <path d="M8 13H13V8" {...p} />
      </svg>
    </>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GamePlayerCard({
  player, index, isCurrentPlayer, isWerewolfTeammate,
  voteCount, actionSubmitted, myRole, seerRevealedRole,
  isValidTarget = false, isSelected = false, onClick,
  suspicionCount = 0, isSuspectedByMe = false, showSuspectBtn = false, onMarkSuspicion,
  trustCount = 0, isTrustedByMe = false, showTrustBtn = false, onMarkTrust,
  actionType = null, onConfirmAction, onCancelAction, showAskBtn = false, onAsk, reaction,
}: Props) {
  const T = useT();
  const cardRef = useRef<HTMLDivElement>(null);

  // ── Burn-on-death effect ──────────────────────────────────────────────────
  const prevAliveRef = useRef(player.isAlive);
  const [burning, setBurning] = useState(false);

  useEffect(() => {
    if (prevAliveRef.current && !player.isAlive) {
      setBurning(true);
      const t = setTimeout(() => setBurning(false), 2000);
      prevAliveRef.current = false;
      return () => clearTimeout(t);
    }
    prevAliveRef.current = player.isAlive;
  }, [player.isAlive]);

  const alive        = player.isAlive;
  const offline      = alive && !player.isConnected;
  const revealedInfo = player.revealedRole ? ROLE_INFO[player.revealedRole] : null;

  const shownRole: Role | null =
    player.revealedRole         ? player.revealedRole
    : isCurrentPlayer && myRole ? myRole
    : isWerewolfTeammate        ? 'werewolf'
    : seerRevealedRole          ? seerRevealedRole
    : null;

  const targetingActive = onClick !== undefined;
  const isInvalidTarget = targetingActive && alive && !isValidTarget && !isCurrentPlayer;

  const ac = actionType ? ACTION_COLORS[actionType] : null;

  const myRoleRgb = myRole === 'werewolf'  ? '220,38,38'
    : myRole === 'seer'      ? '124,58,237'
    : myRole === 'doctor'    ? '16,185,129'
    : myRole === 'hunter'    ? '234,88,12'
    : myRole === 'witch'     ? '147,51,234'
    : myRole === 'bodyguard' ? '37,99,235'
    : '217,119,6';

  let border    = '1px solid rgba(120,65,10,0.35)';
  let boxShadow: string | undefined;
  let cardAnimation: string | undefined;

  if (burning) {
    border = '1px solid rgba(251,146,60,0.55)';
    cardAnimation = 'card-burn-glow 2.0s ease-out forwards';
  } else if (!alive) {
    border = '1px solid rgba(68,64,60,0.35)';
  } else if (isSelected) {
    border    = `2px solid ${ac?.selBorder ?? 'rgba(251,191,36,0.92)'}`;
    boxShadow = ac?.selGlow ?? '0 0 28px rgba(251,191,36,0.55), inset 0 0 0 1px rgba(251,191,36,0.12)';
  } else if (isValidTarget) {
    border    = `1px solid ${ac?.validBorder ?? 'rgba(217,119,6,0.72)'}`;
    boxShadow = ac?.validGlow ?? '0 0 14px rgba(217,119,6,0.28)';
  } else if (isInvalidTarget) {
    border = '1px solid rgba(68,64,60,0.22)';
  } else if (isCurrentPlayer) {
    border    = `2px solid rgba(${myRoleRgb},0.75)`;
    boxShadow = `0 0 20px rgba(${myRoleRgb},0.28)`;
  } else if (isWerewolfTeammate) {
    border    = '1px solid rgba(185,28,28,0.60)';
    boxShadow = '0 0 10px rgba(185,28,28,0.18)';
  }

  const handleMouseEnter = () => {
    if (cardRef.current && isValidTarget && !isSelected && ac) {
      cardRef.current.style.boxShadow = ac.hoverGlow;
    }
  };
  const handleMouseLeave = () => {
    if (cardRef.current && isValidTarget && !isSelected) {
      cardRef.current.style.boxShadow = boxShadow ?? '';
    }
  };

  const imgFilter = burning  ? undefined
    : !alive                ? 'grayscale(1) brightness(0.38)'
    : offline               ? 'grayscale(1) brightness(0.50)'
    : undefined;
  const imgAnimation = burning ? 'card-burn-image 1.85s ease-in forwards' : undefined;

  const cursor = isValidTarget || isSelected ? 'cursor-pointer'
    : isInvalidTarget                         ? 'cursor-not-allowed'
    : 'cursor-default';

  // Sub-label with translated strings
  let subLabel: { text: string; color: string } | null = null;
  if (isCurrentPlayer && alive && myRole) {
    subLabel = {
      text: T('card.youRole', { role: T(`role.${myRole}.name`) }),
      color: ROLE_INFO[myRole].accentColor,
    };
  } else if (!isCurrentPlayer && seerRevealedRole && alive) {
    subLabel = { text: T(`role.${seerRevealedRole}.name`), color: ROLE_INFO[seerRevealedRole].accentColor };
  } else if (revealedInfo && player.revealedRole) {
    subLabel = { text: T(`role.${player.revealedRole}.name`), color: revealedInfo.accentColor };
  } else if (!alive) {
    subLabel = { text: T('card.eliminated'), color: '#7f1d1d' };
  } else if (offline) {
    subLabel = { text: T('card.away'), color: '#57534e' };
  }

  const checkColor = ac?.checkColor ?? '#fbbf24';

  let cornerColor   = 'rgba(161,98,7,0.80)';
  let cornerOpacity = 0.55;
  if (!alive) {
    cornerColor   = 'rgba(100,40,40,0.60)';
    cornerOpacity = 0.30;
  } else if (isSelected) {
    cornerColor   = ac?.selBorder ?? 'rgba(251,191,36,0.92)';
    cornerOpacity = 0.90;
  } else if (isValidTarget) {
    cornerColor   = ac?.validBorder ?? 'rgba(217,119,6,0.72)';
    cornerOpacity = 0.72;
  } else if (isCurrentPlayer) {
    cornerColor   =
      myRole === 'werewolf'  ? 'rgba(220,38,38,0.85)' :
      myRole === 'seer'      ? 'rgba(139,92,246,0.85)' :
      myRole === 'doctor'    ? 'rgba(52,211,153,0.85)' :
      myRole === 'hunter'    ? 'rgba(234,88,12,0.85)' :
      myRole === 'witch'     ? 'rgba(147,51,234,0.85)' :
      myRole === 'bodyguard' ? 'rgba(37,99,235,0.85)' : 'rgba(251,191,36,0.85)';
    cornerOpacity = 0.80;
  } else if (isWerewolfTeammate) {
    cornerColor   = 'rgba(220,38,38,0.70)';
    cornerOpacity = 0.60;
  }

  return (
    <div
      ref={cardRef}
      onClick={isValidTarget || isSelected ? onClick : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ border, boxShadow, animation: cardAnimation }}
      className={`relative w-full h-full overflow-hidden rounded-xl select-none transition-all duration-200 ${cursor}`}
    >
      {/* ── Corner ornaments ── */}
      <CardCorners color={cornerColor} opacity={cornerOpacity} />

      {/* ── Background image ── */}
      {shownRole ? (
        <img
          src={ROLE_IMAGE[shownRole]}
          alt=""
          draggable={false}
          style={{ filter: imgFilter, animation: imgAnimation }}
          className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-300"
        />
      ) : (
        <img
          src="/avatar-hooded.png"
          alt=""
          draggable={false}
          style={{ filter: imgFilter, animation: imgAnimation }}
          className="absolute inset-0 w-full h-full object-cover object-[50%_18%] transition-all duration-300"
        />
      )}

      {/* ── Nameplate gradient ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.62) 38%, rgba(0,0,0,0.10) 65%, transparent 100%)' }}
      />

      {/* ── Ambient shimmer (alive cards only) ── */}
      {alive && !burning && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl" style={{ zIndex: 4 }}>
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(105deg, transparent 35%, rgba(255,235,180,0.055) 50%, transparent 65%)',
              animation: `card-shimmer 6s ${(index % 8) * 0.65}s ease-in-out infinite`,
            }}
          />
        </div>
      )}

      {/* ── Burn death effect ── */}
      {burning && (
        <>
          {/* Initial flash burst */}
          <div
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              backgroundColor: 'rgba(255,190,80,0.50)',
              zIndex: 22,
              animation: 'card-burn-flash 0.32s ease-out forwards',
            }}
          />
          {/* Fire gradient sweeping up */}
          <div
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              background: 'linear-gradient(to top, rgba(255,110,0,0.94) 0%, rgba(239,50,0,0.80) 18%, rgba(200,20,0,0.60) 34%, rgba(140,10,0,0.35) 52%, rgba(80,5,0,0.12) 66%, transparent 78%)',
              transformOrigin: 'bottom center',
              zIndex: 18,
              animation: 'card-burn-fire 1.85s ease-in-out forwards',
            }}
          />
          {/* Ember particles */}
          {EMBERS.map((e, i) => (
            <div
              key={i}
              className="absolute pointer-events-none rounded-full"
              style={{
                left: e.left,
                top: e.top,
                width: '3px',
                height: '3px',
                backgroundColor: e.color,
                boxShadow: `0 0 5px 1px ${e.color}`,
                zIndex: 26,
                animation: `${e.anim} ${e.dur} ${e.delay} ease-out forwards`,
              }}
            />
          ))}
        </>
      )}

      {/* ── Emoji reaction float ── */}
      {reaction && (
        <div
          key={reaction.key}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 28 }}
        >
          <span
            style={{
              fontSize: 'clamp(3.5rem, 18vw, 10rem)',
              lineHeight: 1,
              animation: 'reaction-float 2.6s ease-out forwards',
              filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.80))',
              display: 'block',
            }}
          >
            {reaction.emoji}
          </span>
        </div>
      )}

      {/* ── Role action icon overlay ── */}
      {isSelected && alive && onConfirmAction && actionType && (
        <div
          className="absolute inset-x-0 flex justify-center pointer-events-none"
          style={{ top: '16%', zIndex: 15 }}
        >
          <div style={{
            animation: 'card-icon-appear 0.40s cubic-bezier(0.34,1.56,0.64,1) forwards',
            filter: `drop-shadow(0 0 8px ${ACTION_GLOW_COLORS[actionType]}) drop-shadow(0 0 20px ${ACTION_GLOW_COLORS[actionType]})`,
          }}>
            {getActionIcon(myRole, actionType)}
          </div>
        </div>
      )}

      {/* ── State overlays ── */}
      {isInvalidTarget && (
        <div className="absolute inset-0 bg-black/55 pointer-events-none" />
      )}
      {offline && alive && (
        <div className="absolute inset-0 bg-black/42 pointer-events-none" />
      )}
      {isSelected && (
        onConfirmAction && alive && ac ? (
          <div
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{
              backgroundColor: PULSE_COLORS[actionType!],
              zIndex: 5,
              animation: 'card-select-breathe 1.6s ease-in-out infinite',
            }}
          />
        ) : (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: ac?.selOverlay ?? 'rgba(251,191,36,0.06)' }}
          />
        )
      )}

      {/* ── Dead X ── */}
      {!alive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg viewBox="0 0 40 40" className="w-10 h-10 opacity-60">
            <line x1="8" y1="8" x2="32" y2="32" stroke="#7f1d1d" strokeWidth="3" strokeLinecap="round" />
            <line x1="32" y1="8" x2="8" y2="32" stroke="#7f1d1d" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* ── YOU banner (current player only) ── */}
      {isCurrentPlayer && (
        <div
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center"
          style={{
            background: `linear-gradient(to bottom, rgba(${myRoleRgb},${alive ? '0.72' : '0.40'}) 0%, rgba(${myRoleRgb},0.00) 100%)`,
            paddingTop: '3px',
            paddingBottom: '10px',
          }}
        >
          <span
            className="text-[7px] font-cinzel font-bold tracking-[0.30em] uppercase"
            style={{ color: '#ffffff', textShadow: '0 1px 5px rgba(0,0,0,0.95)' }}
          >
            {T('card.youBanner')}
          </span>
        </div>
      )}

      {/* ── Host crown ── */}
      {player.isHost && (
        <div className={`absolute ${isCurrentPlayer ? 'top-4' : 'top-1'} left-1/2 -translate-x-1/2 z-20`}>
          <svg viewBox="0 0 18 12" className="w-4 h-3" fill="#fbbf24">
            <path d="M1 11L4 5.5L9 8.5L14 5.5L17 11H1Z" stroke="#92400e" strokeWidth="0.7" strokeLinejoin="round" />
            <circle cx="1"  cy="4.5" r="1.5" fill="#fbbf24" />
            <circle cx="9"  cy="2"   r="1.5" fill="#fbbf24" />
            <circle cx="17" cy="4.5" r="1.5" fill="#fbbf24" />
          </svg>
        </div>
      )}

      {/* ── Slot number ── */}
      <span className="absolute top-1.5 left-1.5 z-10 text-[9px] font-cinzel tabular-nums leading-none" style={{ color: 'rgba(161,98,7,0.90)' }}>
        {index + 1}
      </span>

      {/* ── Top-right: wolf badge or connection dot ── */}
      <div className="absolute top-1.5 right-1.5 z-10">
        {isWerewolfTeammate && alive ? (
          <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(127,29,29,0.97)', border: '1px solid rgba(220,38,38,0.70)' }}>
            <svg viewBox="0 0 16 16" className="w-2.5 h-2.5" fill="none">
              <path d="M5 3Q4 7 6 12M8 2Q8 7 8 13M11 3Q12 7 10 12" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full" style={{
            backgroundColor: alive && player.isConnected ? '#4ade80' : alive ? '#57534e' : 'rgba(127,29,29,0.70)',
            boxShadow:        alive && player.isConnected ? '0 0 5px rgba(74,222,128,0.65)' : 'none',
          }} />
        )}
      </div>

      {/* ── Vote count ── */}
      {typeof voteCount === 'number' && voteCount > 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center min-w-[28px] h-[22px] rounded-full px-2" style={{ backgroundColor: 'rgba(127,29,29,0.97)', border: '1px solid rgba(239,68,68,0.75)' }}>
          <span className="font-bold leading-none text-sm" style={{ color: '#fca5a5' }}>{voteCount}</span>
        </div>
      )}

      {/* ── Social badges (suspicion + trust) ── */}
      {(suspicionCount > 0 || trustCount > 0) && !voteCount && alive && (
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 z-20 flex items-center gap-1">
          {suspicionCount > 0 && (
            <div className="flex items-center gap-0.5 h-[16px] rounded-full px-1.5" style={{ backgroundColor: 'rgba(120,53,0,0.97)', border: '1px solid rgba(217,119,6,0.65)' }}>
              <svg viewBox="0 0 12 12" className="w-2 h-2" fill="#fbbf24">
                <path d="M6 1L7.5 4.5H11L8.5 6.5L9.5 10L6 8L2.5 10L3.5 6.5L1 4.5H4.5Z" />
              </svg>
              <span className="text-[9px] font-bold leading-none" style={{ color: '#fcd34d' }}>{suspicionCount}</span>
            </div>
          )}
          {trustCount > 0 && (
            <div className="flex items-center gap-0.5 h-[16px] rounded-full px-1.5" style={{ backgroundColor: 'rgba(6,53,37,0.97)', border: '1px solid rgba(52,211,153,0.65)' }}>
              <svg viewBox="0 0 12 12" className="w-2 h-2" fill="#4ade80">
                <path d="M2 6l3 3 5-5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
              <span className="text-[9px] font-bold leading-none" style={{ color: '#86efac' }}>{trustCount}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Selected check (action pending confirm) ── */}
      {isSelected && onConfirmAction && alive && (
        <div
          className="absolute right-1.5 top-[38%] z-10 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)', border: `1px solid ${checkColor}88` }}
        >
          <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
            <path d="M3 8l4 4 6-6" stroke={checkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* ── Submitted green check on target card ── */}
      {isSelected && !onConfirmAction && alive && !isCurrentPlayer && (
        <div className="absolute right-1.5 top-[38%] z-10 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(20,83,45,0.97)', border: '1px solid rgba(74,222,128,0.75)' }}>
          <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
            <path d="M3 8l4 4 6-6" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* ── Own action submitted check ── */}
      {isCurrentPlayer && actionSubmitted && alive && (
        <div className="absolute right-1.5 top-[38%] z-10 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(20,83,45,0.97)', border: '1px solid rgba(74,222,128,0.75)' }}>
          <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
            <path d="M3 8l4 4 6-6" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* ── Nameplate ── */}
      <div className="absolute bottom-0 left-0 right-0 px-2 pb-1.5 z-10">
        <p
          className="text-[11px] font-cinzel tracking-wider uppercase truncate text-center leading-tight"
          style={{ color: !alive ? '#57534e' : '#f7e7b0', textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
        >
          {player.name}
        </p>

        {/* Sub-label: hidden when confirm button takes its space */}
        {subLabel && !isSelected && (
          isCurrentPlayer && alive ? (
            <div className="flex justify-center mt-1">
              <span
                className="px-1.5 py-px rounded-full text-[8px] font-cinzel font-bold uppercase tracking-[0.12em] truncate"
                style={{
                  backgroundColor: `rgba(${myRoleRgb},0.20)`,
                  border: `1px solid rgba(${myRoleRgb},0.55)`,
                  color: subLabel.color,
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                  maxWidth: '90%',
                }}
              >
                {subLabel.text}
              </span>
            </div>
          ) : (
            <p
              className="text-[8px] font-cinzel uppercase tracking-[0.14em] text-center leading-none mt-0.5 truncate"
              style={{ color: subLabel.color, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
            >
              {subLabel.text}
            </p>
          )
        )}

        {/* Social action buttons: Suspect / Trust / Ask — shown during day */}
        {!isSelected && alive && !isCurrentPlayer && (showSuspectBtn || showTrustBtn || showAskBtn) && (
          <div className="flex gap-1 mt-1">
            {showSuspectBtn && (
              <button
                onClick={e => { e.stopPropagation(); onMarkSuspicion?.(); }}
                className="flex-1 rounded text-[8px] font-cinzel uppercase tracking-wide transition-all duration-150 hover:brightness-125 active:scale-[0.95]"
                style={{
                  padding: '4px 2px',
                  backgroundColor: isSuspectedByMe ? 'rgba(120,53,0,0.85)' : 'rgba(0,0,0,0.60)',
                  border: isSuspectedByMe ? '1px solid rgba(217,119,6,0.75)' : '1px solid rgba(120,65,10,0.40)',
                  color: isSuspectedByMe ? '#fcd34d' : '#78716c',
                }}
              >
                {isSuspectedByMe ? '⚑' : '⚐'}
              </button>
            )}
            {showTrustBtn && (
              <button
                onClick={e => { e.stopPropagation(); onMarkTrust?.(); }}
                className="flex-1 rounded text-[8px] font-cinzel uppercase tracking-wide transition-all duration-150 hover:brightness-125 active:scale-[0.95]"
                style={{
                  padding: '4px 2px',
                  backgroundColor: isTrustedByMe ? 'rgba(6,53,37,0.85)' : 'rgba(0,0,0,0.60)',
                  border: isTrustedByMe ? '1px solid rgba(52,211,153,0.75)' : '1px solid rgba(120,65,10,0.40)',
                  color: isTrustedByMe ? '#86efac' : '#57534e',
                }}
              >
                ✓
              </button>
            )}
            {showAskBtn && (
              <button
                onClick={e => { e.stopPropagation(); onAsk?.(); }}
                className="flex-1 rounded text-[8px] font-cinzel uppercase tracking-wide transition-all duration-150 hover:brightness-125 active:scale-[0.95]"
                style={{
                  padding: '4px 2px',
                  backgroundColor: 'rgba(0,0,0,0.60)',
                  border: '1px solid rgba(109,40,217,0.35)',
                  color: '#7c3aed',
                }}
              >
                {T('social.ask')}
              </button>
            )}
          </div>
        )}

        {/* Cancel + Confirm buttons: shown on selected card before submission */}
        {isSelected && onConfirmAction && alive && (
          <div className="flex gap-1 mt-1.5">
            {/* Cancel */}
            <button
              onClick={e => { e.stopPropagation(); onCancelAction?.(); }}
              className="flex-1 flex items-center justify-center rounded transition-all duration-150 hover:brightness-125 active:scale-[0.93]"
              style={{
                paddingTop: '6px',
                paddingBottom: '6px',
                backgroundColor: 'rgba(0,0,0,0.70)',
                border: '1px solid rgba(120,65,10,0.45)',
                color: '#78716c',
                fontSize: '13px',
                lineHeight: 1,
              }}
            >✕</button>
            {/* Confirm */}
            <button
              onClick={e => { e.stopPropagation(); onConfirmAction(); }}
              className="flex-1 rounded text-[9px] font-cinzel font-bold uppercase tracking-widest transition-all duration-150 hover:brightness-125 active:scale-[0.96]"
              style={{
                paddingTop: '6px',
                paddingBottom: '6px',
                backgroundColor: ac?.btnBg ?? 'rgba(120,53,0,0.90)',
                border: `1px solid ${ac?.btnBorder ?? 'rgba(217,119,6,0.65)'}`,
                color: ac?.btnText ?? '#fde68a',
                boxShadow: ac ? `0 0 8px ${ac.btnBorder}55` : undefined,
              }}
            >
              ✓ {actionType ? T(`action.${actionType}`) : T('action.confirm')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
