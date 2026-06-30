'use client';

import { DarkPanel } from '@/components/ui/DarkPanel';
import { CopyButton } from '@/components/ui/CopyButton';
import { StatusDot } from '@/components/ui/StatusDot';

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
        <span className="text-amber-900/55 text-[9px] font-cinzel uppercase tracking-widest hidden sm:inline">Room</span>
        <span className="font-mono font-bold text-lg text-amber-300 tracking-[0.35em]">{code}</span>
        <CopyButton text={code} />
      </div>

      <div className="hidden sm:block w-px h-4 bg-amber-900/20 shrink-0" />

      {/* Center: player pips + count */}
      <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: maxPlayers }, (_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i < playerCount
                  ? 'w-2 h-2 bg-amber-500/80'
                  : 'w-1.5 h-1.5 bg-amber-900/20'
              }`}
            />
          ))}
        </div>
        <span className="text-amber-400 font-cinzel font-semibold text-sm tabular-nums shrink-0">
          {playerCount}
          <span className="text-amber-900/60 font-normal text-xs">/{maxPlayers}</span>
        </span>
        <span className={`text-[10px] hidden md:inline shrink-0 ${hasEnough ? 'text-green-700/70' : 'text-amber-800/60'}`}>
          {hasEnough ? 'Ready to start' : `Need ${needed} more`}
        </span>
      </div>

      <div className="hidden sm:block w-px h-4 bg-amber-900/20 shrink-0" />

      {/* Right: status + leave */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <StatusDot connected={isConnected} />
          <span className="text-amber-900/50 text-[9px] uppercase tracking-wider hidden sm:inline">
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
        <button
          onClick={onLeave}
          className="px-3 py-1.5 border border-amber-900/30 hover:border-red-800/60 text-amber-700/70 hover:text-red-400 text-[10px] font-cinzel uppercase tracking-widest rounded-lg transition-colors"
        >
          Leave
        </button>
      </div>
    </DarkPanel>
  );
}
