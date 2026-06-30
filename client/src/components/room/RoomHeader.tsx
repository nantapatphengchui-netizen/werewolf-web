'use client';

import { DarkPanel } from '@/components/ui/DarkPanel';
import { CopyButton } from '@/components/ui/CopyButton';
import { StatusDot } from '@/components/ui/StatusDot';
import { AudioControls } from '@/components/ui/AudioControls';

interface Props {
  code: string;
  playerCount: number;
  maxPlayers: number;
  minPlayers: number;
  isConnected: boolean;
  onLeave: () => void;
}

export function RoomHeader({ code, playerCount, maxPlayers, minPlayers, isConnected, onLeave }: Props) {
  const needed   = minPlayers - playerCount;
  const hasEnough = playerCount >= minPlayers;

  return (
    <DarkPanel className="flex items-center gap-3 px-4 py-2.5">

      {/* Left: room code */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-amber-700/80 text-[9px] font-cinzel uppercase tracking-widest hidden sm:inline">Room</span>
        <span className="font-mono font-bold text-lg text-amber-200 tracking-[0.35em] drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]">{code}</span>
        <CopyButton text={code} />
      </div>

      <div className="hidden sm:block w-px h-4 bg-amber-800/30 shrink-0" />

      {/* Center: player pips + count */}
      <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
        <div className="flex items-center gap-[3px]">
          {Array.from({ length: maxPlayers }, (_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i < playerCount
                  ? 'w-[7px] h-[7px] bg-amber-400'
                  : 'w-[5px] h-[5px] bg-amber-900/35'
              }`}
            />
          ))}
        </div>
        <span className="text-amber-300 font-cinzel font-semibold text-sm tabular-nums shrink-0">
          {playerCount}
          <span className="text-amber-700/90 font-normal text-xs">/{maxPlayers}</span>
        </span>
        <span className={`text-[10px] hidden md:inline shrink-0 ${hasEnough ? 'text-green-400/90' : 'text-amber-600/90'}`}>
          {hasEnough ? 'Ready to start' : `Need ${needed} more`}
        </span>
      </div>

      <div className="hidden sm:block w-px h-4 bg-amber-800/30 shrink-0" />

      {/* Right: status + music + leave */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <StatusDot connected={isConnected} />
          <span className={`text-[9px] uppercase tracking-wider hidden sm:inline ${isConnected ? 'text-green-400/90' : 'text-red-400/80'}`}>
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>

        <div className="h-4 w-px bg-amber-900/20 hidden sm:block" />

        <AudioControls />

        <div className="h-4 w-px bg-amber-900/20 hidden sm:block" />

        <button
          onClick={onLeave}
          className="px-3 py-1.5 border border-amber-800/50 hover:border-red-700/70 text-amber-500/90 hover:text-red-400 text-[10px] font-cinzel uppercase tracking-widest rounded-lg transition-colors"
        >
          Leave
        </button>
      </div>
    </DarkPanel>
  );
}
