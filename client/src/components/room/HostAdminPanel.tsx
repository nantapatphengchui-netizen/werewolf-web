'use client';

import { useState } from 'react';
import type { Player } from '@/types/game';
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
  const [open, setOpen]             = useState(false);
  const [kickTarget, setKickTarget] = useState<Player | null>(null);

  const nonHostPlayers = players.filter(p => p.id !== hostId);

  return (
    <>
      {kickTarget && (
        <ConfirmDialog
          title="Kick Player"
          description={`Remove ${kickTarget.name} from the room?`}
          confirmLabel="Kick"
          onConfirm={() => { onKick(kickTarget.id); setKickTarget(null); }}
          onCancel={() => setKickTarget(null)}
        />
      )}

      <div className="bg-black/70 backdrop-blur-md border border-amber-900/18 rounded-xl overflow-hidden">

        {/* Toggle header — small and unobtrusive */}
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-amber-950/8 transition-colors"
        >
          <div className="flex items-center gap-2">
            {/* gear icon */}
            <svg viewBox="0 0 20 20" className="w-3 h-3 text-amber-800/50 shrink-0" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span className="text-amber-800/55 text-[9px] font-cinzel uppercase tracking-widest">Host Controls</span>
            {isLocked && (
              <span className="text-amber-700/40 text-[7px] border border-amber-900/25 rounded px-1 py-0.5 font-cinzel tracking-wider">Locked</span>
            )}
          </div>
          <svg
            viewBox="0 0 12 12"
            className={`w-2.5 h-2.5 text-amber-900/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth="2"
          >
            <path d="M2 4l4 4 4-4" strokeLinecap="round" />
          </svg>
        </button>

        {open && (
          <div className="px-3 pb-3 pt-2 border-t border-amber-900/12 space-y-2.5">

            {/* Lock + Reset Ready */}
            <div className="flex gap-2">
              <button
                onClick={isLocked ? onUnlock : onLock}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-cinzel tracking-widest uppercase rounded-lg border transition-colors ${
                  isLocked
                    ? 'bg-amber-950/28 border-amber-700/40 text-amber-400 hover:bg-amber-950/40'
                    : 'bg-black/18 border-amber-900/22 text-amber-700/65 hover:border-amber-800/38 hover:text-amber-500'
                }`}
              >
                <svg viewBox="0 0 14 16" className="w-2.5 h-3 shrink-0" fill="currentColor">
                  <path
                    opacity={isLocked ? 1 : 0.55}
                    d="M11 7V5a4 4 0 0 0-8 0v2H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1zM5 5a2 2 0 1 1 4 0v2H5V5z"
                  />
                </svg>
                {isLocked ? 'Unlock' : 'Lock Room'}
              </button>

              <button
                onClick={onResetReady}
                className="flex-1 py-1.5 text-[10px] font-cinzel tracking-widest uppercase rounded-lg border border-amber-900/22 text-amber-800/65 hover:border-amber-800/38 hover:text-amber-600 bg-black/18 transition-colors"
              >
                Reset Ready
              </button>
            </div>

            {isLocked && (
              <p className="text-amber-700/45 text-[9px] text-center italic">No new players can join</p>
            )}

            {/* Player list with kick */}
            {nonHostPlayers.length > 0 && (
              <div className="space-y-1">
                <p className="text-amber-900/45 text-[8px] font-cinzel uppercase tracking-widest">Players</p>
                {nonHostPlayers.map(player => (
                  <div
                    key={player.id}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/18"
                  >
                    <div className={`w-1 h-1 rounded-full shrink-0 ${player.isConnected ? 'bg-green-500/80' : 'bg-stone-600/60'}`} />
                    <span className={`flex-1 text-[10px] truncate ${player.isConnected ? 'text-amber-300/75' : 'text-stone-600/70'}`}>
                      {player.name}
                    </span>
                    {player.isBot && (
                      <span className="text-[7px] text-slate-600/70 font-cinzel uppercase shrink-0">Bot</span>
                    )}
                    <button
                      onClick={() => setKickTarget(player)}
                      className="text-[8px] text-red-800/55 hover:text-red-500/80 font-cinzel uppercase tracking-wider transition-colors shrink-0 px-1.5 py-0.5 rounded border border-red-900/18 hover:border-red-800/35"
                    >
                      Kick
                    </button>
                  </div>
                ))}
              </div>
            )}

            {nonHostPlayers.length === 0 && (
              <p className="text-amber-950/50 text-[9px] text-center italic">No other players in room</p>
            )}

            {/* Dev Bots — slate/dark, no purple */}
            {TEST_BOTS_ENABLED && (
              <div className="border-t border-stone-800/25 pt-2 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-stone-600/65 text-[8px] font-cinzel uppercase tracking-widest">Dev Bots</span>
                  <span className="text-[7px] text-stone-700/50 border border-stone-700/28 rounded px-1 font-mono">DEV</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={onAddBot}
                    className="py-1.5 text-[9px] font-cinzel uppercase rounded-lg border border-stone-800/35 text-stone-500/80 hover:text-stone-400 hover:border-stone-700/45 bg-black/18 transition-colors"
                  >
                    + Bot
                  </button>
                  <button
                    onClick={onRemoveBots}
                    className="py-1.5 text-[9px] font-cinzel uppercase rounded-lg border border-stone-800/35 text-stone-600/70 hover:text-red-600/65 hover:border-red-900/28 bg-black/18 transition-colors"
                  >
                    Remove
                  </button>
                  {([5, 8, 12] as const).map(n => (
                    <button
                      key={n}
                      onClick={() => onFillBots(n)}
                      className="py-1.5 text-[9px] font-cinzel uppercase rounded-lg border border-stone-800/28 text-stone-600/65 hover:text-stone-400 hover:border-stone-700/40 bg-black/18 transition-colors"
                    >
                      → {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </>
  );
}
