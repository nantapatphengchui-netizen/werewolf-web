'use client';

import { useT } from '@/i18n';

interface Props {
  isHost: boolean;
  canStart: boolean;
  playerCount: number;
  minPlayers: number;
  readyCount: number;
  onStartGame: () => void;
  onReady: () => void;
  isReady: boolean;
}

export function HostControls({
  isHost,
  canStart,
  playerCount,
  minPlayers,
  readyCount,
  onStartGame,
  onReady,
  isReady,
}: Props) {
  const T = useT();
  const needed   = minPlayers - playerCount;
  const allReady = readyCount === playerCount && playerCount > 0;

  return (
    <div
      style={{
        backgroundColor: 'rgba(8,5,2,0.98)',
        border: '1px solid rgba(146,64,14,0.35)',
        borderRadius: '12px',
        boxShadow: '0 -2px 20px rgba(0,0,0,0.6)',
      }}
      className="flex items-center gap-3 px-4 py-3"
    >
      {/* ── Ready button ── */}
      <button
        onClick={onReady}
        style={{
          backgroundColor: isReady ? 'rgb(20,83,45)'   : 'rgb(120,50,10)',
          border:          isReady ? '1px solid rgba(74,222,128,0.65)' : '1px solid rgba(217,119,6,0.6)',
          color:           isReady ? '#bbf7d0' : '#fde68a',
          minWidth: '90px',
        }}
        className="shrink-0 px-5 py-2.5 font-cinzel text-[11px] tracking-[0.2em] uppercase rounded-lg transition-all duration-150 hover:brightness-125 active:scale-95"
      >
        {isReady ? T('lobby.ready') : T('lobby.notReady')}
      </button>

      {/* ── Status ── */}
      <div className="flex-1 min-w-0 text-center space-y-0.5">
        {playerCount < minPlayers ? (
          <p className="font-cinzel text-[11px]" style={{ color: '#fbbf24' }}>
            {T('lobby.needPlayers', { n: needed, s: needed !== 1 ? 's' : '', cur: playerCount, min: minPlayers })}
          </p>
        ) : allReady ? (
          <p className="font-cinzel text-[11px]" style={{ color: '#86efac' }}>
            {T('lobby.allReady')}
          </p>
        ) : (
          <p className="font-cinzel text-[11px]" style={{ color: '#fbbf24' }}>
            {T('lobby.readyCount', { ready: readyCount, total: playerCount })}
          </p>
        )}
        {!isHost && (
          <p className="font-cinzel text-[9px] tracking-widest uppercase" style={{ color: '#b45309' }}>
            {T('lobby.waitHost')}
          </p>
        )}
      </div>

      {/* ── Start Game (host) or spacer ── */}
      {isHost ? (
        <button
          onClick={onStartGame}
          disabled={!canStart}
          style={{
            backgroundColor: canStart ? 'rgb(127,29,29)' : 'rgb(20,18,16)',
            border:          canStart ? '1px solid rgba(239,68,68,0.55)' : '1px solid rgba(87,83,78,0.45)',
            color:           canStart ? '#ffffff'         : '#78716c',
            minWidth: '110px',
          }}
          className={`shrink-0 px-5 py-2.5 font-cinzel text-[11px] tracking-[0.2em] uppercase rounded-lg transition-all duration-150 ${
            canStart ? 'hover:brightness-125 active:scale-95' : 'cursor-not-allowed'
          }`}
        >
          {T('lobby.startGame')}
        </button>
      ) : (
        <div style={{ minWidth: '110px' }} />
      )}
    </div>
  );
}
