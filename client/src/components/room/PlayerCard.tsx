import type { Player } from '@/types/game';
import { StatusDot } from '@/components/ui/StatusDot';

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
      <div className={`w-20 h-28 mt-1 rounded overflow-hidden bg-[#0d0a06] border ${
        isCurrentPlayer
          ? 'border-amber-500/70 shadow-[0_0_8px_rgba(217,119,6,0.25)]'
          : offline
          ? 'border-amber-900/15'
          : 'border-amber-700/45'
      }`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/avatar-hooded.png"
          alt=""
          draggable={false}
          className={`w-full h-full object-cover object-[50%_18%] transition-all duration-300 ${
            offline ? 'grayscale opacity-40' : 'opacity-90'
          }`}
        />
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
