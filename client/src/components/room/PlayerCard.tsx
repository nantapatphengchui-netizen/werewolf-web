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
      className={`relative rounded-lg overflow-hidden aspect-[3/4] transition-all duration-300 ${
        offline
          ? 'border border-gray-800/25 opacity-50'
          : isCurrentPlayer
          ? 'border-2 border-amber-500/80 shadow-[0_0_16px_rgba(217,119,6,0.30)]'
          : 'border border-amber-800/50'
      }`}
    >
      {/* Portrait — fills entire card */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/avatar-hooded.png"
        alt=""
        draggable={false}
        className={`absolute inset-0 w-full h-full object-cover object-[50%_18%] ${
          offline ? 'grayscale' : ''
        }`}
      />

      {/* Bottom gradient for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {/* Number badge — top left */}
      <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-amber-900/80 border border-amber-600/60 flex items-center justify-center z-10">
        <span className="text-amber-100 text-[9px] font-bold font-cinzel leading-none">
          {index + 1}
        </span>
      </div>

      {/* Online dot — top right */}
      <div className="absolute top-2 right-2 z-10">
        <StatusDot connected={player.isConnected} />
      </div>

      {/* Ready badge — top right below dot */}
      {isReady && (
        <div className="absolute top-6 right-1.5 z-10">
          <span className="text-green-400 text-[11px] font-bold">✓</span>
        </div>
      )}

      {/* Name + status — bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-4 z-10">
        <p className="text-amber-100 text-[11px] font-semibold tracking-widest uppercase truncate text-center font-cinzel leading-tight">
          {player.name}
        </p>
        <div className="flex items-center justify-center gap-1 mt-0.5">
          {player.isHost && (
            <span className="text-[9px] text-amber-500/80 uppercase tracking-widest font-cinzel">Host</span>
          )}
          {isCurrentPlayer && !player.isHost && (
            <span className="text-[9px] text-amber-700/80 uppercase tracking-widest">You</span>
          )}
          {player.isBot && (
            <span className="text-[9px] text-violet-400/80 uppercase tracking-widest font-cinzel">Bot</span>
          )}
        </div>
      </div>
    </div>
  );
}
