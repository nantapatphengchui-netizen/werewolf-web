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
      className={`relative w-full h-full overflow-hidden rounded-lg transition-all duration-300 ${
        offline
          ? 'border border-gray-800/25 opacity-50'
          : isCurrentPlayer
          ? 'border-2 border-amber-500/80 shadow-[0_0_12px_rgba(217,119,6,0.25)]'
          : 'border border-amber-800/40'
      }`}
    >
      {/* Avatar — fills card */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/avatar-hooded.png"
        alt=""
        draggable={false}
        className={`absolute inset-0 w-full h-full object-cover object-[50%_18%] ${offline ? 'grayscale' : ''}`}
      />

      {/* Gradient for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/20" />

      {/* Slot number — top left */}
      <span className="absolute top-1 left-1.5 text-[9px] text-amber-900/55 font-cinzel tabular-nums leading-none">
        {index + 1}
      </span>

      {/* Indicators — top right */}
      <div className="absolute top-1 right-1.5 flex items-center gap-1">
        {isReady && <span className="text-green-400 text-[9px] font-bold leading-none">✓</span>}
        <StatusDot connected={player.isConnected} />
      </div>

      {/* Name + badges — bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5">
        <p className="text-amber-100 text-[10px] font-cinzel tracking-widest uppercase truncate text-center leading-tight">
          {player.name}
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-0.5 flex-wrap">
          {player.isHost && (
            <span className="text-[7px] text-amber-500/80 uppercase tracking-widest font-cinzel leading-none">Host</span>
          )}
          {isCurrentPlayer && !player.isHost && (
            <span className="text-[7px] text-amber-700/70 uppercase tracking-widest leading-none">You</span>
          )}
          {player.isBot && (
            <span className="text-[7px] text-violet-400/70 uppercase tracking-widest font-cinzel leading-none">Bot</span>
          )}
        </div>
      </div>
    </div>
  );
}
