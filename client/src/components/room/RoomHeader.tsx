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

export function RoomHeader({
  code,
  playerCount,
  maxPlayers,
  minPlayers,
  isConnected,
  onLeave,
}: Props) {
  return (
    <DarkPanel className="flex items-center justify-between px-5 py-3 gap-4">
      {/* Left: Room code */}
      <div className="flex items-center gap-3">
        <div>
          <p className="text-amber-700 text-[10px] uppercase tracking-widest leading-none mb-1">
            Room Code
          </p>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xl text-amber-300 tracking-[0.35em]">
              {code}
            </span>
            <CopyButton text={code} />
          </div>
        </div>
      </div>

      {/* Center: Player count */}
      <div className="flex-1 flex justify-center">
        <div className="text-center">
          <p className="text-amber-700 text-[10px] uppercase tracking-widest leading-none mb-1">
            Players
          </p>
          <p className="text-amber-200 font-bold text-lg leading-none font-cinzel">
            {playerCount}
            <span className="text-amber-800 font-normal text-sm">/{maxPlayers}</span>
          </p>
          {playerCount < minPlayers && (
            <p className="text-amber-800 text-[10px] mt-0.5">
              need {minPlayers - playerCount} more
            </p>
          )}
        </div>
      </div>

      {/* Right: Connection + Leave */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <StatusDot connected={isConnected} />
          <span className="text-amber-800 text-[10px] uppercase tracking-wider hidden sm:inline">
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
        <button
          onClick={onLeave}
          className="px-3 py-1.5 border border-amber-900/40 hover:border-red-800/60 text-amber-700 hover:text-red-400 text-xs uppercase tracking-widest rounded transition-colors"
        >
          Leave
        </button>
      </div>
    </DarkPanel>
  );
}
