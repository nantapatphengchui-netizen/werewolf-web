import type { Player } from '@/types/game';
import { ROLE_INFO } from '@/types/game';
import { StatusDot } from '@/components/ui/StatusDot';

function PlayerSilhouette({ isAlive }: { isAlive: boolean }) {
  return (
    <svg viewBox="0 0 80 104" className={`w-full h-full ${isAlive ? '' : 'opacity-25'}`} fill="none">
      <ellipse cx="40" cy="28" rx="18" ry="21" fill="#1c1409" stroke="#5c3d12" strokeWidth="1.2" />
      <path
        d="M14 56 Q10 92 22 102 L58 102 Q70 92 66 56 Q54 47 40 43 Q26 47 14 56Z"
        fill="#1c1409"
        stroke="#5c3d12"
        strokeWidth="1.2"
      />
      <ellipse cx="40" cy="30" rx="11" ry="13" fill="#0d0906" />
      <ellipse cx="35.5" cy="28.5" rx="2.2" ry="1.6" fill="#92500a" opacity="0.55" />
      <ellipse cx="44.5" cy="28.5" rx="2.2" ry="1.6" fill="#92500a" opacity="0.55" />
    </svg>
  );
}

function DeadOverlay() {
  return (
    <svg viewBox="0 0 80 104" className="absolute inset-0 w-full h-full" fill="none">
      <line x1="10" y1="10" x2="70" y2="94" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      <line x1="70" y1="10" x2="10" y2="94" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

function WolfBadge() {
  return (
    <div
      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-950 border border-red-700/60 flex items-center justify-center z-10"
      title="Werewolf"
    >
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <path d="M5 3Q4 7 6 12M8 2Q8 7 8 13M11 3Q12 7 10 12" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function OfflineOverlay() {
  return (
    <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-1 z-10">
      <span className="text-[8px] text-gray-500 uppercase tracking-widest font-cinzel">offline</span>
    </div>
  );
}

function SubmittedBadge() {
  return (
    <div
      className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-950/90 border border-green-700/60 flex items-center justify-center z-10"
      title="Action submitted"
    >
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <path d="M3 8l4 4 6-6" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

  const borderClass = !alive
    ? 'border-red-950/40 bg-black/20 grayscale'
    : offline
    ? 'border-gray-700/30 bg-black/30 opacity-55'
    : isCurrentPlayer
    ? 'border-amber-500/60 bg-amber-950/30 shadow-[0_0_14px_rgba(217,119,6,0.18)]'
    : isWerewolfTeammate
    ? 'border-red-700/50 bg-red-950/20 shadow-[0_0_10px_rgba(185,28,28,0.2)]'
    : 'border-amber-900/30 bg-black/35';

  return (
    <div className={`relative flex flex-col items-center rounded-lg border p-2 transition-all duration-300 ${borderClass}`}>
      {/* Number badge */}
      <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 border border-amber-600/60 flex items-center justify-center z-10">
        <span className="text-amber-100 text-[10px] font-bold font-cinzel">{index + 1}</span>
      </div>

      {/* Top-right: wolf badge, or status dot */}
      {isWerewolfTeammate && alive ? (
        <WolfBadge />
      ) : (
        <div className="absolute top-2 right-2 z-10">
          <StatusDot connected={player.isConnected} />
        </div>
      )}

      {/* Avatar */}
      <div className="relative w-20 h-28 mt-1 rounded border border-amber-900/20 overflow-hidden bg-[#0d0a06]">
        <PlayerSilhouette isAlive={alive} />
        {!alive && <DeadOverlay />}
        {offline && <OfflineOverlay />}
        {isCurrentPlayer && actionSubmitted && alive && <SubmittedBadge />}
        {typeof voteCount === 'number' && voteCount > 0 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-red-900/90 border border-red-600/60 rounded-full px-2 py-0.5 z-10">
            <span className="text-red-300 text-[10px] font-bold">{voteCount}</span>
          </div>
        )}
      </div>

      {/* Name */}
      <p className={`mt-2 text-xs font-semibold tracking-wide truncate max-w-full px-1 text-center w-full ${
        alive && !offline ? 'text-amber-100' : alive ? 'text-gray-500' : 'text-gray-600'
      }`}>
        {player.name}
      </p>

      {/* Revealed role */}
      {revealedInfo && (
        <p
          className="text-[9px] font-cinzel tracking-widest font-bold"
          style={{ color: revealedInfo.accentColor }}
        >
          {revealedInfo.name.toUpperCase()}
        </p>
      )}

      {/* Status label */}
      <p className={`text-[10px] uppercase tracking-widest font-cinzel ${
        !alive ? 'text-red-800' : offline ? 'text-gray-600' : 'text-green-600'
      }`}>
        {!alive ? 'Dead' : offline ? 'Away' : 'Alive'}
      </p>
    </div>
  );
}
