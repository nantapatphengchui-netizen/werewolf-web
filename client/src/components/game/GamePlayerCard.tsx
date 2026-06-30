import type { Player, Role } from '@/types/game';
import { ROLE_INFO } from '@/types/game';
import { RoleCardArt } from './RoleCardArt';

function HoodedAvatar() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/avatar-hooded.png"
      alt=""
      draggable={false}
      className="absolute inset-0 w-full h-full object-cover object-[50%_18%]"
    />
  );
}

function DeadOverlay() {
  return (
    <svg viewBox="0 0 80 104" className="absolute inset-0 w-full h-full" fill="none">
      <line x1="14" y1="14" x2="66" y2="90" stroke="#7f1d1d" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
      <line x1="66" y1="14" x2="14" y2="90" stroke="#7f1d1d" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

function WolfBadge() {
  return (
    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-950 border border-red-700/70 flex items-center justify-center z-20" title="Werewolf teammate">
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <path d="M5 3Q4 7 6 12M8 2Q8 7 8 13M11 3Q12 7 10 12" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function ActionDoneBadge() {
  return (
    <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-green-950 border border-green-600/70 flex items-center justify-center z-20" title="Action submitted">
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <path d="M3 8l4 4 6-6" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function SelectedBadge() {
  return (
    <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-amber-900 border border-amber-400/80 flex items-center justify-center z-20">
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <path d="M3 8l4 4 6-6" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function HostBadge() {
  return (
    <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20" title="Host">
      <svg viewBox="0 0 14 9" className="w-4 h-2.5" fill="#d97706">
        <path d="M1 8L3 4L7 6.5L11 4L13 8H1Z" stroke="#92400e" strokeWidth="0.6" />
      </svg>
    </div>
  );
}

/** Thin role-colored accent glow on the avatar border when role is known */
const ROLE_BORDER: Record<Role, string> = {
  werewolf: 'border-red-800/60',
  seer:     'border-violet-700/60',
  doctor:   'border-emerald-700/60',
  villager: 'border-amber-800/40',
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
}: Props) {
  const alive = player.isAlive;
  const offline = alive && !player.isConnected;
  const revealedInfo = player.revealedRole ? ROLE_INFO[player.revealedRole] : null;

  // Determine which role art to show (null = hooded silhouette)
  const shownRole: Role | null =
    player.revealedRole                        ? player.revealedRole  // dead / game-over reveal
    : isCurrentPlayer && myRole                ? myRole               // your own card
    : isWerewolfTeammate                       ? 'werewolf'           // wolf sees teammates
    : seerRevealedRole                         ? seerRevealedRole     // seer inspection
    : null;

  const targetingActive = onClick !== undefined;
  const isInvalidTarget = targetingActive && alive && !isValidTarget && !isCurrentPlayer;

  // Card border / background
  let cardClass: string;
  if (!alive) {
    cardClass = 'border-stone-800/40 bg-stone-950/30 grayscale cursor-default';
  } else if (isSelected) {
    cardClass = 'border-2 border-amber-400/90 bg-amber-950/25 shadow-[0_0_20px_rgba(251,191,36,0.35)] cursor-pointer';
  } else if (isValidTarget) {
    cardClass = 'border border-amber-600/50 bg-amber-950/10 hover:border-amber-400/80 hover:bg-amber-950/20 hover:shadow-[0_0_14px_rgba(251,191,36,0.2)] cursor-pointer';
  } else if (isInvalidTarget) {
    cardClass = 'border border-stone-800/30 bg-black/20 opacity-40 cursor-not-allowed';
  } else if (offline) {
    cardClass = 'border-stone-700/30 bg-black/30 opacity-50 cursor-default';
  } else if (isCurrentPlayer) {
    // Own card — accent color based on role
    const roleAccent = myRole === 'werewolf' ? 'border-red-600/70 bg-red-950/15 shadow-[0_0_18px_rgba(220,38,38,0.2)]'
      : myRole === 'seer'    ? 'border-violet-600/70 bg-violet-950/15 shadow-[0_0_18px_rgba(124,58,237,0.2)]'
      : myRole === 'doctor'  ? 'border-emerald-600/70 bg-emerald-950/15 shadow-[0_0_18px_rgba(5,150,105,0.2)]'
      : 'border-amber-500/70 bg-amber-950/20 shadow-[0_0_18px_rgba(217,119,6,0.18)]';
    cardClass = `${roleAccent} cursor-default`;
  } else if (isWerewolfTeammate) {
    cardClass = 'border-red-700/60 bg-red-950/15 shadow-[0_0_12px_rgba(185,28,28,0.22)] cursor-default';
  } else {
    cardClass = 'border-amber-900/25 bg-black/25 cursor-default';
  }

  const dotClass = alive && player.isConnected
    ? 'bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.65)]'
    : alive ? 'bg-stone-600' : 'bg-red-900/70';

  // Avatar inner border color — matches role when role is known
  const avatarBorderClass = shownRole && alive ? ROLE_BORDER[shownRole] : 'border-amber-900/15';

  return (
    <div
      onClick={isValidTarget || isSelected ? onClick : undefined}
      className={`relative w-full h-full flex flex-col items-center rounded-xl border p-2 gap-1 transition-all duration-200 select-none ${cardClass}`}
    >
      {player.isHost && <HostBadge />}

      {/* Slot number */}
      <div className="absolute top-2 left-2 w-[18px] h-[18px] rounded-full bg-amber-900/60 border border-amber-800/40 flex items-center justify-center z-10">
        <span className="text-amber-300 text-[8px] font-bold font-cinzel">{index + 1}</span>
      </div>

      {/* Status — top right */}
      {isWerewolfTeammate && alive ? (
        <WolfBadge />
      ) : (
        <div className={`absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full z-10 ${dotClass}`} />
      )}

      {/* Avatar */}
      <div className={`relative w-full flex-1 min-h-0 mt-2 rounded-lg overflow-hidden bg-[#090805] border ${avatarBorderClass}`}>
        {shownRole ? <RoleCardArt role={shownRole} /> : <HoodedAvatar />}
        {!alive && <DeadOverlay />}
        {offline && (
          <div className="absolute inset-0 bg-black/60 flex items-end justify-center pb-1.5">
            <span className="text-[8px] text-stone-500 uppercase tracking-[0.15em]">Away</span>
          </div>
        )}
        {isCurrentPlayer && actionSubmitted && alive && <ActionDoneBadge />}
        {isSelected && !actionSubmitted && <SelectedBadge />}
        {typeof voteCount === 'number' && voteCount > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 min-w-[22px] h-[18px] flex items-center justify-center bg-red-950/95 border border-red-600/70 rounded-full px-1.5">
            <span className="text-red-200 text-[10px] font-bold leading-none">{voteCount}</span>
          </div>
        )}
      </div>

      {/* Name */}
      <p className={`text-[11px] font-semibold tracking-wide truncate text-center leading-tight w-full px-0.5 mt-0.5 ${
        !alive ? 'text-stone-600'
        : offline ? 'text-stone-500'
        : isCurrentPlayer ? 'text-amber-100'
        : 'text-amber-200/85'
      }`}>
        {player.name}
      </p>

      {/* Sub-label */}
      {isCurrentPlayer && alive && myRole && (
        <span
          className="text-[8px] uppercase tracking-[0.2em] font-cinzel -mt-0.5"
          style={{ color: ROLE_INFO[myRole].accentColor + 'bb' }}
        >
          {ROLE_INFO[myRole].name}
        </span>
      )}
      {!isCurrentPlayer && seerRevealedRole && alive && (
        <span
          className="text-[8px] uppercase tracking-[0.2em] font-cinzel -mt-0.5"
          style={{ color: ROLE_INFO[seerRevealedRole].accentColor + 'bb' }}
        >
          {ROLE_INFO[seerRevealedRole].name}
        </span>
      )}
      {!alive && !revealedInfo && (
        <span className="text-[8px] text-red-900/80 uppercase tracking-[0.15em] font-cinzel -mt-0.5">Dead</span>
      )}
      {revealedInfo && (
        <p className="text-[9px] font-cinzel font-bold tracking-widest -mt-0.5" style={{ color: revealedInfo.accentColor }}>
          {revealedInfo.name.toUpperCase()}
        </p>
      )}
    </div>
  );
}
