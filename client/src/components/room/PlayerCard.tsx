import type { Player } from '@/types/game';
import { StatusDot } from '@/components/ui/StatusDot';

function PlayerSilhouette() {
  return (
    <svg viewBox="0 0 80 104" className="w-full h-full" fill="none">
      {/* Hood */}
      <ellipse cx="40" cy="28" rx="18" ry="21" fill="#1c1409" stroke="#5c3d12" strokeWidth="1.2" />
      {/* Cloak body */}
      <path
        d="M14 56 Q10 92 22 102 L58 102 Q70 92 66 56 Q54 47 40 43 Q26 47 14 56Z"
        fill="#1c1409"
        stroke="#5c3d12"
        strokeWidth="1.2"
      />
      {/* Face shadow */}
      <ellipse cx="40" cy="30" rx="11" ry="13" fill="#0d0906" />
      {/* Faint amber eyes */}
      <ellipse cx="35.5" cy="28.5" rx="2.2" ry="1.6" fill="#92500a" opacity="0.55" />
      <ellipse cx="44.5" cy="28.5" rx="2.2" ry="1.6" fill="#92500a" opacity="0.55" />
    </svg>
  );
}

interface Props {
  player: Player;
  index: number;
  isCurrentPlayer: boolean;
  isReady?: boolean;
}

export function PlayerCard({ player, index, isCurrentPlayer, isReady }: Props) {
  const offline = !player.isConnected;
  return (
    <div
      className={`relative flex flex-col items-center rounded-lg border p-2 transition-all duration-300 ${
        offline
          ? 'border-gray-800/30 bg-black/20 opacity-50'
          : isCurrentPlayer
          ? 'border-amber-500/60 bg-amber-950/30 shadow-[0_0_12px_rgba(217,119,6,0.15)]'
          : 'border-amber-900/30 bg-black/35'
      }`}
    >
      {/* Number badge */}
      <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 border border-amber-600/60 flex items-center justify-center z-10">
        <span className="text-amber-100 text-[10px] font-bold font-cinzel leading-none">
          {index + 1}
        </span>
      </div>

      {/* Online dot */}
      <div className="absolute top-2 right-2 z-10">
        <StatusDot connected={player.isConnected} />
      </div>

      {/* Avatar */}
      <div className="w-20 h-28 mt-1 rounded border border-amber-900/20 overflow-hidden bg-[#0d0a06]">
        <PlayerSilhouette />
      </div>

      {/* Name */}
      <p className="mt-2 text-amber-100 text-xs font-semibold tracking-wide truncate max-w-full px-1 text-center w-full">
        {player.name}
      </p>

      {/* Status row */}
      <div className="flex items-center gap-1.5 mt-0.5">
        {player.isHost && (
          <span className="text-[10px] text-amber-500 uppercase tracking-widest font-cinzel">Host</span>
        )}
        {isCurrentPlayer && !player.isHost && (
          <span className="text-[10px] text-amber-700 uppercase tracking-widest">(you)</span>
        )}
        {isReady && (
          <span className="text-[10px] text-green-500 font-bold">✓</span>
        )}
      </div>
    </div>
  );
}
