'use client';

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
  const needed    = minPlayers - playerCount;
  const hasEnough = playerCount >= minPlayers;

  return (
    <div
      style={{ backgroundColor: 'rgba(3,5,7,0.94)' }}
      className="flex items-center gap-3 px-4 py-2.5 border border-amber-800/55 rounded-lg shadow-[0_4px_28px_rgba(0,0,0,0.7)]"
    >

      {/* Left: room code */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-amber-600 text-[9px] font-cinzel uppercase tracking-widest hidden sm:inline">Room</span>
        <span
          className="font-mono font-bold text-lg tracking-[0.35em]"
          style={{ color: '#fbbf24', textShadow: '0 0 12px rgba(251,191,36,0.45)' }}
        >
          {code}
        </span>
        <CopyButton text={code} />
      </div>

      <div className="hidden sm:block w-px h-4 bg-amber-700/40 shrink-0" />

      {/* Center: player pips + count */}
      <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
        <div className="flex items-center gap-[3px]">
          {Array.from({ length: maxPlayers }, (_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i < playerCount
                  ? 'w-[7px] h-[7px] bg-amber-400'
                  : 'w-[5px] h-[5px] bg-amber-900/50'
              }`}
            />
          ))}
        </div>
        <span className="font-cinzel font-semibold text-sm tabular-nums shrink-0" style={{ color: '#fbbf24' }}>
          {playerCount}
          <span className="text-amber-600 font-normal text-xs">/{maxPlayers}</span>
        </span>
        <span className={`text-[10px] font-cinzel hidden md:inline shrink-0 ${hasEnough ? 'text-green-400' : 'text-amber-500'}`}>
          {hasEnough ? 'Ready to start' : `Need ${needed} more`}
        </span>
      </div>

      <div className="hidden sm:block w-px h-4 bg-amber-700/40 shrink-0" />

      {/* Right: status + music + leave */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <StatusDot connected={isConnected} />
          <span className={`text-[9px] font-cinzel uppercase tracking-wider hidden sm:inline ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>

        <div className="h-4 w-px bg-amber-800/40 hidden sm:block" />

        <AudioControls />

        <div className="h-4 w-px bg-amber-800/40 hidden sm:block" />

        <button
          onClick={onLeave}
          className="px-3 py-1.5 border border-amber-700/55 hover:border-red-600/70 text-amber-400 hover:text-red-400 text-[10px] font-cinzel uppercase tracking-widest rounded-lg transition-colors"
        >
          Leave
        </button>
      </div>
    </div>
  );
}
