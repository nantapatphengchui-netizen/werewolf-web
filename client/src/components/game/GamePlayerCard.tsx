import type { Player } from '@/types/game';
import { ROLE_INFO } from '@/types/game';

function PlayerSilhouette({ isAlive }: { isAlive: boolean }) {
  return (
    <svg viewBox="0 0 80 104" className={`w-full h-full transition-opacity duration-300 ${isAlive ? '' : 'opacity-15'}`} fill="none">
      <ellipse cx="40" cy="28" rx="18" ry="21" fill="#1c1409" stroke="#5c3d12" strokeWidth="1.2" />
      <path d="M14 56 Q10 92 22 102 L58 102 Q70 92 66 56 Q54 47 40 43 Q26 47 14 56Z" fill="#1c1409" stroke="#5c3d12" strokeWidth="1.2" />
      <ellipse cx="40" cy="30" rx="11" ry="13" fill="#0d0906" />
      <ellipse cx="35.5" cy="28.5" rx="2.2" ry="1.6" fill="#92500a" opacity="0.55" />
      <ellipse cx="44.5" cy="28.5" rx="2.2" ry="1.6" fill="#92500a" opacity="0.55" />
    </svg>
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
    <div
      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-950 border border-red-700/70 flex items-center justify-center z-20"
      title="Werewolf teammate"
    >
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <path d="M5 3Q4 7 6 12M8 2Q8 7 8 13M11 3Q12 7 10 12" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function SubmittedBadge() {
  return (
    <div
      className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-green-950 border border-green-600/70 flex items-center justify-center z-20"
      title="Action submitted"
    >
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <path d="M3 8l4 4 6-6" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

interface Props {
  player: Player;
  index: number;
  isCurrentPlayer: boolean;
  isWerewolfTeammate: boolean;
  voteCount?: number;
  actionSubmitted?: boolean;
}

export function GamePlayerCard({
  player,
  index,
  isCurrentPlayer,
  isWerewolfTeammate,
  voteCount,
  actionSubmitted,
}: Props) {
  const alive = player.isAlive;
  const offline = alive && !player.isConnected;
  const revealedInfo = player.revealedRole ? ROLE_INFO[player.revealedRole] : null;

  const cardClass = !alive
    ? 'border-stone-800/40 bg-stone-950/30 grayscale'
    : offline
    ? 'border-stone-700/30 bg-black/30 opacity-50'
    : isCurrentPlayer
    ? 'border-amber-500/70 bg-amber-950/20 shadow-[0_0_18px_rgba(217,119,6,0.18),inset_0_1px_0_rgba(251,191,36,0.06)]'
    : isWerewolfTeammate
    ? 'border-red-700/60 bg-red-950/15 shadow-[0_0_12px_rgba(185,28,28,0.22)]'
    : 'border-amber-900/25 bg-black/25';

  const dotClass = alive && player.isConnected
    ? 'bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.65)]'
    : alive
    ? 'bg-stone-600'
    : 'bg-red-900/70';

  return (
    <div className={`relative flex flex-col items-center rounded-xl border p-2 gap-1 transition-all duration-300 w-[88px] shrink-0 ${cardClass}`}>

      {player.isHost && <HostBadge />}

      {/* Number badge */}
      <div className="absolute top-2 left-2 w-[18px] h-[18px] rounded-full bg-amber-900/60 border border-amber-800/40 flex items-center justify-center z-10">
        <span className="text-amber-300 text-[8px] font-bold font-cinzel">{index + 1}</span>
      </div>

      {/* Status top-right */}
      {isWerewolfTeammate && alive ? (
        <WolfBadge />
      ) : (
        <div className={`absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full z-10 ${dotClass}`} />
      )}

      {/* Avatar */}
      <div className="relative w-full h-[100px] mt-2 rounded-lg overflow-hidden bg-[#090805] border border-amber-900/15">
        <PlayerSilhouette isAlive={alive} />
        {!alive && <DeadOverlay />}
        {offline && (
          <div className="absolute inset-0 bg-black/60 flex items-end justify-center pb-1.5">
            <span className="text-[8px] text-stone-500 uppercase tracking-[0.15em]">Away</span>
          </div>
        )}
        {isCurrentPlayer && actionSubmitted && alive && <SubmittedBadge />}
        {typeof voteCount === 'number' && voteCount > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 min-w-[22px] h-[18px] flex items-center justify-center bg-red-950/95 border border-red-600/70 rounded-full px-1.5">
            <span className="text-red-200 text-[10px] font-bold leading-none">{voteCount}</span>
          </div>
        )}
      </div>

      {/* Name row */}
      <div className="flex items-center justify-center gap-1 w-full px-0.5 mt-0.5">
        <p className={`text-[11px] font-semibold tracking-wide truncate text-center leading-tight ${
          !alive ? 'text-stone-600'
          : offline ? 'text-stone-500'
          : isCurrentPlayer ? 'text-amber-100'
          : 'text-amber-200/85'
        }`}>
          {player.name}
        </p>
      </div>

      {/* Sub-label */}
      {isCurrentPlayer && alive && (
        <span className="text-[8px] text-amber-600/70 uppercase tracking-[0.22em] font-cinzel -mt-0.5">You</span>
      )}
      {!alive && !revealedInfo && (
        <span className="text-[8px] text-red-900/80 uppercase tracking-[0.15em] font-cinzel -mt-0.5">Dead</span>
      )}

      {/* Revealed role (only after death/game over) */}
      {revealedInfo && (
        <p className="text-[9px] font-cinzel font-bold tracking-widest -mt-0.5" style={{ color: revealedInfo.accentColor }}>
          {revealedInfo.name.toUpperCase()}
        </p>
      )}
    </div>
  );
}
