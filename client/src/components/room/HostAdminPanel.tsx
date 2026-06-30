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
        style={{ backgroundColor: 'rgb(12,8,4)', border: '1px solid rgba(146,64,14,0.35)' }}
        className="relative w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div style={{ borderBottom: '1px solid rgba(146,64,14,0.25)' }} className="flex items-center justify-between px-5 py-3">
          <span className="font-cinzel text-[11px] uppercase tracking-widest" style={{ color: '#d97706' }}>{title}</span>
          <button
            onClick={onClose}
            className="text-xl leading-none w-6 h-6 flex items-center justify-center transition-colors"
            style={{ color: '#92400e' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fbbf24')}
            onMouseLeave={e => (e.currentTarget.style.color = '#92400e')}
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

// Reusable small action button inside modals
function ModalBtn({
  onClick,
  children,
  danger,
  active,
}: {
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  active?: boolean;
}) {
  const bg      = active  ? 'rgba(120,50,10,0.9)' : danger ? 'rgba(80,10,10,0.7)' : 'rgba(25,18,8,0.9)';
  const border  = active  ? 'rgba(217,119,6,0.6)' : danger ? 'rgba(239,68,68,0.4)' : 'rgba(146,64,14,0.40)';
  const color   = active  ? '#fde68a'              : danger ? '#fca5a5'             : '#d97706';

  return (
    <button
      onClick={onClick}
      style={{ backgroundColor: bg, border: `1px solid ${border}`, color }}
      className="flex-1 py-2 text-[11px] font-cinzel tracking-wider uppercase rounded-lg transition-all duration-150 hover:brightness-125 active:scale-95"
    >
      {children}
    </button>
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
      {kickTarget && (
        <ConfirmDialog
          title="Kick Player"
          description={`Remove ${kickTarget.name} from the room?`}
          confirmLabel="Kick"
          onConfirm={() => { onKick(kickTarget.id); setKickTarget(null); }}
          onCancel={() => setKickTarget(null)}
        />
      )}

      {/* ── Trigger row ── */}
      <div className="flex items-center justify-end gap-2 px-1">
        {isHost && (
          <button
            onClick={() => setHostOpen(true)}
            style={{
              backgroundColor: 'rgba(22,15,6,0.95)',
              border: '1px solid rgba(160,90,20,0.50)',
              color: '#d97706',
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-cinzel uppercase tracking-widest transition-all duration-150 hover:brightness-125"
          >
            <svg viewBox="0 0 20 20" className="w-3 h-3 shrink-0" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Host Tools
            {isLocked && (
              <span style={{ color: '#fbbf24', border: '1px solid rgba(217,119,6,0.55)', borderRadius: '3px', padding: '0 4px', fontSize: '7px' }}>
                Locked
              </span>
            )}
          </button>
        )}

        {TEST_BOTS_ENABLED && (
          <button
            onClick={() => setBotsOpen(true)}
            style={{
              backgroundColor: 'rgba(16,16,18,0.95)',
              border: '1px solid rgba(100,100,110,0.50)',
              color: '#a8a29e',
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-cinzel uppercase tracking-widest transition-all duration-150 hover:brightness-125"
          >
            <svg viewBox="0 0 20 20" className="w-3 h-3 shrink-0" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Dev Bots
          </button>
        )}
      </div>

      {/* ── Host Tools modal ── */}
      {hostOpen && (
        <Modal title="Host Tools" onClose={() => setHostOpen(false)}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <ModalBtn onClick={isLocked ? onUnlock : onLock} active={isLocked}>
                {isLocked ? 'Unlock Room' : 'Lock Room'}
              </ModalBtn>
              <ModalBtn onClick={onResetReady}>Reset Ready</ModalBtn>
            </div>

            {isLocked && (
              <p className="text-[10px] text-center font-cinzel" style={{ color: '#92400e' }}>
                Room locked — no new players can join
              </p>
            )}

            {nonHostPlayers.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[9px] font-cinzel uppercase tracking-widest" style={{ color: '#78350f' }}>Players</p>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {nonHostPlayers.map(player => (
                    <div key={player.id} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(20,15,8,0.80)' }}>
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: player.isConnected ? '#4ade80' : '#44403c' }} />
                      <span className="flex-1 text-xs truncate" style={{ color: player.isConnected ? '#fde68a' : '#57534e' }}>
                        {player.name}
                      </span>
                      {player.isBot && (
                        <span className="text-[8px] font-cinzel uppercase shrink-0" style={{ color: '#57534e' }}>Bot</span>
                      )}
                      <button
                        onClick={() => { setKickTarget(player); setHostOpen(false); }}
                        className="text-[9px] font-cinzel uppercase tracking-wider px-2 py-0.5 rounded transition-all duration-150 hover:brightness-125 shrink-0"
                        style={{ color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)', backgroundColor: 'rgba(80,10,10,0.6)' }}
                      >
                        Kick
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-center italic font-cinzel" style={{ color: '#78350f' }}>No other players in room</p>
            )}
          </div>
        </Modal>
      )}

      {/* ── Dev Bots modal ── */}
      {botsOpen && (
        <Modal title="Dev Bots" onClose={() => setBotsOpen(false)}>
          <div className="space-y-2.5">
            <div className="flex gap-2">
              <ModalBtn onClick={onAddBot}>+ Add Bot</ModalBtn>
              <ModalBtn onClick={onRemoveBots} danger>Remove All</ModalBtn>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([5, 8, 12] as const).map(n => (
                <ModalBtn key={n} onClick={() => onFillBots(n)}>Fill {n}</ModalBtn>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
