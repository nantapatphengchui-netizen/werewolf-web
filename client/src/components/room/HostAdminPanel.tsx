'use client';

import { useState } from 'react';
import type { Player } from '@/types/game';
import { DarkPanel } from '@/components/ui/DarkPanel';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const TEST_BOTS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_TEST_BOTS === 'true';

interface Props {
  players: Player[];
  hostId: string;
  isLocked: boolean;
  onKick: (targetId: string) => void;
  onLock: () => void;
  onUnlock: () => void;
  onResetReady: () => void;
  onAddBot: () => void;
  onFillBots: (target: number) => void;
  onRemoveBots: () => void;
}

export function HostAdminPanel({
  players,
  hostId,
  isLocked,
  onKick,
  onLock,
  onUnlock,
  onResetReady,
  onAddBot,
  onFillBots,
  onRemoveBots,
}: Props) {
  const [open, setOpen] = useState(false);
  const [kickTarget, setKickTarget] = useState<Player | null>(null);

  const nonHostPlayers = players.filter(p => p.id !== hostId);

  return (
    <>
      {kickTarget && (
        <ConfirmDialog
          title="Kick Player"
          description={`Remove ${kickTarget.name} from the room? They will be disconnected.`}
          confirmLabel="Kick"
          onConfirm={() => { onKick(kickTarget.id); setKickTarget(null); }}
          onCancel={() => setKickTarget(null)}
        />
      )}

      <DarkPanel className="overflow-hidden">
        {/* Toggle header */}
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-amber-950/10 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-amber-700 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="5" r="3" />
              <path strokeLinecap="round" d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
            </svg>
            <span className="text-amber-700 text-[10px] uppercase tracking-widest">Host Controls</span>
          </div>
          <svg
            viewBox="0 0 16 16"
            className={`w-3 h-3 text-amber-800 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
          </svg>
        </button>

        {/* Collapsible content */}
        {open && (
          <div className="px-4 pb-4 space-y-3 border-t border-amber-900/20 pt-3">
            {/* Lock / Reset row */}
            <div className="flex gap-2">
              <button
                onClick={isLocked ? onUnlock : onLock}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-cinzel tracking-widest uppercase rounded border transition-colors ${
                  isLocked
                    ? 'bg-amber-950/40 border-amber-700/50 text-amber-300 hover:bg-amber-900/50'
                    : 'bg-black/30 border-amber-900/30 text-amber-700 hover:border-amber-700/50 hover:text-amber-500'
                }`}
              >
                <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor">
                  <path d="M11 7V5a3 3 0 0 0-6 0v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1zm-4-2a1 1 0 0 1 2 0v2H7V5z" opacity={isLocked ? 1 : 0.5} />
                </svg>
                {isLocked ? 'Unlock Room' : 'Lock Room'}
              </button>

              <button
                onClick={onResetReady}
                className="flex-1 py-2 text-xs font-cinzel tracking-widest uppercase rounded border border-amber-900/30 text-amber-800 hover:border-amber-700/50 hover:text-amber-600 bg-black/30 transition-colors"
              >
                Reset Ready
              </button>
            </div>

            {isLocked && (
              <p className="text-amber-700/60 text-[10px] text-center italic">Room is locked — no new players can join</p>
            )}

            {/* Player kick list */}
            {nonHostPlayers.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-amber-800 text-[10px] uppercase tracking-widest">Players</p>
                {nonHostPlayers.map(player => (
                  <div
                    key={player.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-black/25 border border-amber-900/20"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${player.isConnected ? 'bg-green-500' : 'bg-gray-600'}`} />
                    <span className={`flex-1 text-sm truncate ${player.isConnected ? 'text-amber-200' : 'text-gray-600'}`}>
                      {player.name}
                    </span>
                    <button
                      onClick={() => setKickTarget(player)}
                      className="px-2 py-0.5 text-[10px] font-cinzel tracking-widest uppercase rounded border border-red-900/40 text-red-800 hover:border-red-700/60 hover:text-red-500 transition-colors shrink-0"
                    >
                      Kick
                    </button>
                  </div>
                ))}
              </div>
            )}

            {nonHostPlayers.length === 0 && (
              <p className="text-amber-900/60 text-xs text-center italic">No other players in room</p>
            )}

            {/* Test bot controls — only shown when NEXT_PUBLIC_ENABLE_TEST_BOTS=true */}
            {TEST_BOTS_ENABLED && (
              <div className="border-t border-violet-900/25 pt-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-violet-500/70 text-[9px] uppercase tracking-widest font-cinzel">Test Bots</span>
                  <span className="text-[8px] text-violet-700/50 border border-violet-800/30 rounded px-1 py-0.5 font-mono">DEV</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={onAddBot}
                    className="py-1.5 text-[10px] font-cinzel tracking-widest uppercase rounded border border-violet-900/40 text-violet-600 hover:border-violet-700/60 hover:text-violet-400 bg-black/20 transition-colors"
                  >
                    + Add Bot
                  </button>
                  <button
                    onClick={onRemoveBots}
                    className="py-1.5 text-[10px] font-cinzel tracking-widest uppercase rounded border border-violet-900/40 text-violet-800 hover:border-red-800/50 hover:text-red-600 bg-black/20 transition-colors"
                  >
                    Remove Bots
                  </button>
                  {([5, 8, 12] as const).map(n => (
                    <button
                      key={n}
                      onClick={() => onFillBots(n)}
                      className="py-1.5 text-[10px] font-cinzel tracking-widest uppercase rounded border border-violet-900/30 text-violet-700 hover:border-violet-700/50 hover:text-violet-400 bg-black/20 transition-colors"
                    >
                      Fill to {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DarkPanel>
    </>
  );
}
