import type { Player, Role } from '@/types/game';
import { ROLE_INFO } from '@/types/game';

const ROLE_IMAGE: Record<Role, string> = {
  werewolf: '/role-werewolf.png',
  seer:     '/role-seer.png',
  doctor:   '/role-doctor.png',
  villager: '/role-villager.png',
};

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
}

export function GamePlayerCard({
  player,
  index,
  isCurrentPlayer,
  isWerewolfTeammate,
  voteCount,
  actionSubmitted,
  myRole,
  seerRevealedRole,
  isValidTarget = false,
  isSelected = false,
  onClick,
  suspicionCount = 0,
  isSuspectedByMe = false,
  showSuspectBtn = false,
  onMarkSuspicion,
}: Props) {
  const alive        = player.isAlive;
  const offline      = alive && !player.isConnected;
  const revealedInfo = player.revealedRole ? ROLE_INFO[player.revealedRole] : null;

  // Which role art to show (null = hooded silhouette — no hidden info revealed)
  const shownRole: Role | null =
    player.revealedRole                       ? player.revealedRole
    : isCurrentPlayer && myRole               ? myRole
    : isWerewolfTeammate                      ? 'werewolf'
    : seerRevealedRole                        ? seerRevealedRole
    : null;

  const targetingActive = onClick !== undefined;
  const isInvalidTarget = targetingActive && alive && !isValidTarget && !isCurrentPlayer;

  // ── Border / shadow ────────────────────────────────────────────────────────
  let border    = '1px solid rgba(120,65,10,0.35)';
  let boxShadow: string | undefined;

  if (!alive) {
    border = '1px solid rgba(68,64,60,0.35)';
  } else if (isSelected) {
    border    = '2px solid rgba(251,191,36,0.92)';
    boxShadow = '0 0 28px rgba(251,191,36,0.55), inset 0 0 0 1px rgba(251,191,36,0.12)';
  } else if (isValidTarget) {
    border    = '1px solid rgba(217,119,6,0.72)';
    boxShadow = '0 0 14px rgba(217,119,6,0.28)';
  } else if (isInvalidTarget) {
    border = '1px solid rgba(68,64,60,0.22)';
  } else if (isCurrentPlayer) {
    const rgb = myRole === 'werewolf' ? '220,38,38'
      : myRole === 'seer'   ? '124,58,237'
      : myRole === 'doctor' ? '16,185,129'
      : '217,119,6';
    border    = `2px solid rgba(${rgb},0.75)`;
    boxShadow = `0 0 16px rgba(${rgb},0.22)`;
  } else if (isWerewolfTeammate) {
    border    = '1px solid rgba(185,28,28,0.60)';
    boxShadow = '0 0 10px rgba(185,28,28,0.18)';
  }

  // ── Image filter ───────────────────────────────────────────────────────────
  const imgFilter = !alive   ? 'grayscale(1) brightness(0.38)'
    : offline ? 'grayscale(1) brightness(0.50)'
    : undefined;

  const cursor = isValidTarget || isSelected ? 'cursor-pointer'
    : isInvalidTarget                         ? 'cursor-not-allowed'
    : 'cursor-default';

  // ── Sub-label below name ──────────────────────────────────────────────────
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

  return (
    <div
      onClick={isValidTarget || isSelected ? onClick : undefined}
      style={{ border, boxShadow }}
      className={`relative w-full h-full overflow-hidden rounded-xl select-none transition-all duration-200 ${cursor} ${isValidTarget && !isSelected ? 'hover:shadow-[0_0_26px_rgba(251,191,36,0.48)]' : ''}`}
    >
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
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(251,191,36,0.06)' }} />
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

      {/* ── Host crown ── */}
      {player.isHost && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20">
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

      {/* ── Suspicion badge (day phase, no vote) ── */}
      {suspicionCount > 0 && !voteCount && alive && (
        <div className="absolute top-[42%] left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 h-[18px] rounded-full px-1.5" style={{ backgroundColor: 'rgba(120,53,0,0.97)', border: '1px solid rgba(217,119,6,0.65)' }}>
          <svg viewBox="0 0 12 12" className="w-2 h-2" fill="#fbbf24">
            <path d="M6 1L7.5 4.5H11L8.5 6.5L9.5 10L6 8L2.5 10L3.5 6.5L1 4.5H4.5Z" />
          </svg>
          <span className="text-[9px] font-bold leading-none" style={{ color: '#fcd34d' }}>{suspicionCount}</span>
        </div>
      )}

      {/* ── Action done / selected check ── */}
      {isCurrentPlayer && actionSubmitted && alive && (
        <div className="absolute right-1.5 top-[38%] z-10 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(20,83,45,0.97)', border: '1px solid rgba(74,222,128,0.75)' }}>
          <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
            <path d="M3 8l4 4 6-6" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {isSelected && !actionSubmitted && (
        <div className="absolute right-1.5 top-[38%] z-10 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(120,60,0,0.97)', border: '1px solid rgba(251,191,36,0.85)' }}>
          <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
            <path d="M3 8l4 4 6-6" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

        {subLabel && (
          <p
            className="text-[8px] font-cinzel uppercase tracking-[0.14em] text-center leading-none mt-0.5 truncate"
            style={{ color: subLabel.color, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
          >
            {subLabel.text}
          </p>
        )}

        {showSuspectBtn && (
          <button
            onClick={e => { e.stopPropagation(); onMarkSuspicion?.(); }}
            style={{
              backgroundColor: isSuspectedByMe ? 'rgba(120,53,0,0.85)' : 'rgba(0,0,0,0.55)',
              border:          isSuspectedByMe ? '1px solid rgba(217,119,6,0.70)' : '1px solid rgba(120,65,10,0.40)',
              color:           isSuspectedByMe ? '#fcd34d' : '#92400e',
            }}
            className="w-full mt-1 py-0.5 rounded text-[8px] font-cinzel uppercase tracking-widest transition-all duration-150 hover:brightness-125"
          >
            {isSuspectedByMe ? '★ Suspected' : '☆ Suspect'}
          </button>
        )}
      </div>
    </div>
  );
}
