import { useRef } from 'react';
import type { Player, Role } from '@/types/game';
import { ROLE_INFO } from '@/types/game';

const ROLE_IMAGE: Record<Role, string> = {
  werewolf: '/role-werewolf.png',
  seer:     '/role-seer.png',
  doctor:   '/role-doctor.png',
  villager: '/role-villager.png',
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

const CONFIRM_LABEL: Record<CardActionType, string> = {
  vote: 'Cast Vote', kill: 'Kill', inspect: 'Inspect', protect: 'Protect',
};

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
  actionType?: CardActionType | null;
  onConfirmAction?: () => void;
  onCancelAction?: () => void;
  showAskBtn?: boolean;
  onAsk?: () => void;
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
  actionType = null, onConfirmAction, onCancelAction, showAskBtn = false, onAsk,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

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

  // ── Action color lookup ───────────────────────────────────────────────────────
  const ac = actionType ? ACTION_COLORS[actionType] : null;

  // ── Role RGB for current player (used in border + YOU banner) ───────────────────
  const myRoleRgb = myRole === 'werewolf' ? '220,38,38'
    : myRole === 'seer'   ? '124,58,237'
    : myRole === 'doctor' ? '16,185,129'
    : '217,119,6';

  // ── Border / shadow per state ─────────────────────────────────────────────────
  let border    = '1px solid rgba(120,65,10,0.35)';
  let boxShadow: string | undefined;

  if (!alive) {
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

  // ── Hover: role-specific glow via direct DOM (no re-render) ──────────────────
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

  // ── Image filter ──────────────────────────────────────────────────────────────
  const imgFilter = !alive  ? 'grayscale(1) brightness(0.38)'
    : offline               ? 'grayscale(1) brightness(0.50)'
    : undefined;

  const cursor = isValidTarget || isSelected ? 'cursor-pointer'
    : isInvalidTarget                         ? 'cursor-not-allowed'
    : 'cursor-default';

  // ── Sub-label ─────────────────────────────────────────────────────────────────
  let subLabel: { text: string; color: string } | null = null;
  if (isCurrentPlayer && alive && myRole) {
    subLabel = { text: `You · ${ROLE_INFO[myRole].name}`, color: ROLE_INFO[myRole].accentColor };
  } else if (!isCurrentPlayer && seerRevealedRole && alive) {
    subLabel = { text: ROLE_INFO[seerRevealedRole].name, color: ROLE_INFO[seerRevealedRole].accentColor };
  } else if (revealedInfo) {
    subLabel = { text: revealedInfo.name, color: revealedInfo.accentColor };
  } else if (!alive) {
    subLabel = { text: 'Eliminated', color: '#7f1d1d' };
  } else if (offline) {
    subLabel = { text: 'Away', color: '#57534e' };
  }

  const checkColor     = ac?.checkColor ?? '#fbbf24';

  // ── Corner ornament color ─────────────────────────────────────────────────────
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
      myRole === 'werewolf' ? 'rgba(220,38,38,0.85)' :
      myRole === 'seer'     ? 'rgba(139,92,246,0.85)' :
      myRole === 'doctor'   ? 'rgba(52,211,153,0.85)' : 'rgba(251,191,36,0.85)';
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
      style={{ border, boxShadow }}
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
          style={{ filter: imgFilter }}
          className="absolute inset-0 w-full h-full object-cover object-top transition-all duration-300"
        />
      ) : (
        <img
          src="/avatar-hooded.png"
          alt=""
          draggable={false}
          style={{ filter: imgFilter }}
          className="absolute inset-0 w-full h-full object-cover object-[50%_18%] transition-all duration-300"
        />
      )}

      {/* ── Nameplate gradient ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.62) 38%, rgba(0,0,0,0.10) 65%, transparent 100%)' }}
      />

      {/* ── State overlays ── */}
      {isInvalidTarget && (
        <div className="absolute inset-0 bg-black/55 pointer-events-none" />
      )}
      {offline && alive && (
        <div className="absolute inset-0 bg-black/42 pointer-events-none" />
      )}
      {isSelected && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: ac?.selOverlay ?? 'rgba(251,191,36,0.06)' }}
        />
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
            ◆ YOU ◆
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

      {/* ── Suspicion badge ── */}
      {suspicionCount > 0 && !voteCount && alive && (
        <div className="absolute top-[42%] left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 h-[18px] rounded-full px-1.5" style={{ backgroundColor: 'rgba(120,53,0,0.97)', border: '1px solid rgba(217,119,6,0.65)' }}>
          <svg viewBox="0 0 12 12" className="w-2 h-2" fill="#fbbf24">
            <path d="M6 1L7.5 4.5H11L8.5 6.5L9.5 10L6 8L2.5 10L3.5 6.5L1 4.5H4.5Z" />
          </svg>
          <span className="text-[9px] font-bold leading-none" style={{ color: '#fcd34d' }}>{suspicionCount}</span>
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
              ✓ {actionType ? CONFIRM_LABEL[actionType] : 'Confirm'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
