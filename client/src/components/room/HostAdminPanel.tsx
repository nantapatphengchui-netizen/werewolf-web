'use client';

import { useState } from 'react';
import type { Player } from '@/types/game';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const TEST_BOTS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_TEST_BOTS === 'true';

interface Props {
  isHost: boolean;
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

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xs bg-stone-950 border border-amber-900/25 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-amber-900/15">
          <span className="font-cinzel text-amber-600/75 text-[10px] uppercase tracking-widest">{title}</span>
          <button
            onClick={onClose}
            className="text-amber-900/50 hover:text-amber-400 text-xl leading-none transition-colors w-6 h-6 flex items-center justify-center"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function HostAdminPanel({
  isHost,
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
  const [hostOpen, setHostOpen] = useState(false);
  const [botsOpen, setBotsOpen] = useState(false);
  const [kickTarget, setKickTarget] = useState<Player | null>(null);

  const nonHostPlayers = players.filter(p => p.id !== hostId);

  if (!isHost && !TEST_BOTS_ENABLED) return null;

  return (
    <>
      {/* Kick confirm — lives outside modals so it survives modal close */}
      {kickTarget && (
        <ConfirmDialog
          title="Kick Player"
          description={`Remove ${kickTarget.name} from the room?`}
          confirmLabel="Kick"
          onConfirm={() => { onKick(kickTarget.id); setKickTarget(null); }}
          onCancel={() => setKickTarget(null)}
        />
      )}

      {/* ── Utility button row ──────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2">
        {isHost && (
          <button
            onClick={() => setHostOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-900/15 bg-black/20 hover:border-amber-800/28 hover:bg-black/30 transition-colors group"
          >
            {/* gear icon */}
            <svg viewBox="0 0 20 20" className="w-3 h-3 text-amber-800/45 group-hover:text-amber-700/65 shrink-0 transition-colors" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            <span className="text-[9px] font-cinzel uppercase tracking-widest text-amber-800/45 group-hover:text-amber-700/65 transition-colors">
              Host Tools
            </span>
            {isLocked && (
              <span className="text-[7px] text-amber-700/35 font-cinzel uppercase tracking-wider border border-amber-900/15 rounded px-1">
                Locked
              </span>
            )}
          </button>
        )}

        {TEST_BOTS_ENABLED && (
          <button
            onClick={() => setBotsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-800/18 bg-black/20 hover:border-stone-700/28 hover:bg-black/30 transition-colors group"
          >
            {/* users/bots icon */}
            <svg viewBox="0 0 20 20" className="w-3 h-3 text-stone-600/45 group-hover:text-stone-500/65 shrink-0 transition-colors" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            <span className="text-[9px] font-cinzel uppercase tracking-widest text-stone-600/45 group-hover:text-stone-500/65 transition-colors">
              Dev Bots
            </span>
          </button>
        )}
      </div>

      {/* ── Host Tools modal ─────────────────────────────────────────────── */}
      {hostOpen && (
        <Modal title="Host Tools" onClose={() => setHostOpen(false)}>
          <div className="space-y-3">

            {/* Lock / Reset */}
            <div className="flex gap-2">
              <button
                onClick={isLocked ? onUnlock : onLock}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-cinzel tracking-wider uppercase rounded-lg border transition-colors ${
                  isLocked
                    ? 'bg-amber-950/30 border-amber-700/40 text-amber-300 hover:bg-amber-950/50'
                    : 'bg-black/25 border-amber-900/22 text-amber-600/80 hover:border-amber-700/40 hover:text-amber-400'
                }`}
              >
                <svg viewBox="0 0 14 16" className="w-2.5 h-3 shrink-0" fill="currentColor">
                  <path opacity={isLocked ? 1 : 0.55} d="M11 7V5a4 4 0 0 0-8 0v2H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1zM5 5a2 2 0 1 1 4 0v2H5V5z" />
                </svg>
                {isLocked ? 'Unlock Room' : 'Lock Room'}
              </button>

              <button
                onClick={onResetReady}
                className="flex-1 py-2 text-xs font-cinzel tracking-wider uppercase rounded-lg border border-amber-900/20 text-amber-700/65 hover:border-amber-800/38 hover:text-amber-500 bg-black/22 transition-colors"
              >
                Reset Ready
              </button>
            </div>

            {isLocked && (
              <p className="text-amber-700/45 text-[10px] text-center">Room locked — no new players can join</p>
            )}

            {/* Player kick list */}
            {nonHostPlayers.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-amber-900/45 text-[9px] font-cinzel uppercase tracking-widest">Players</p>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {nonHostPlayers.map(player => (
                    <div key={player.id} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-black/22">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${player.isConnected ? 'bg-green-500/70' : 'bg-stone-700/60'}`} />
                      <span className={`flex-1 text-xs truncate ${player.isConnected ? 'text-amber-200/80' : 'text-stone-600'}`}>
                        {player.name}
                      </span>
                      {player.isBot && (
                        <span className="text-[8px] text-slate-600 font-cinzel uppercase shrink-0">Bot</span>
                      )}
                      <button
                        onClick={() => { setKickTarget(player); setHostOpen(false); }}
                        className="text-[9px] text-red-800/60 hover:text-red-400 font-cinzel uppercase tracking-wider border border-red-900/20 hover:border-red-700/40 px-2 py-0.5 rounded transition-colors shrink-0"
                      >
                        Kick
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-amber-900/38 text-[10px] text-center italic">No other players in room</p>
            )}
          </div>
        </Modal>
      )}

      {/* ── Dev Bots modal ───────────────────────────────────────────────── */}
      {botsOpen && (
        <Modal title="Dev Bots" onClose={() => setBotsOpen(false)}>
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onAddBot}
                className="py-2 text-xs font-cinzel tracking-wider uppercase rounded-lg border border-stone-800/38 text-stone-400/75 hover:text-stone-300 hover:border-stone-700/50 bg-black/20 transition-colors"
              >
                + Add Bot
              </button>
              <button
                onClick={onRemoveBots}
                className="py-2 text-xs font-cinzel tracking-wider uppercase rounded-lg border border-stone-800/38 text-stone-500/65 hover:text-red-500/70 hover:border-red-900/35 bg-black/20 transition-colors"
              >
                Remove All
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([5, 8, 12] as const).map(n => (
                <button
                  key={n}
                  onClick={() => onFillBots(n)}
                  className="py-2 text-xs font-cinzel tracking-wider uppercase rounded-lg border border-stone-800/32 text-stone-500/65 hover:text-stone-300 hover:border-stone-700/45 bg-black/20 transition-colors"
                >
                  Fill {n}
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
