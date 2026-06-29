'use client';

import type { RoomState } from '@/types/game';
import { ROLE_INFO } from '@/types/game';

interface Props {
  room: RoomState;
  playerId: string;
  onLeave: () => void;
  onRestart: () => void;
  onReturnToLobby: () => void;
}

function VillageWinIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-16 h-16" fill="none">
      <circle cx="24" cy="14" r="8" stroke="#d97706" strokeWidth="2.5" />
      <path d="M8 44 Q8 30 24 30 Q40 30 40 44" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 22 L20 28 L32 16" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WolfWinIcon() {
  return (
    <svg viewBox="0 0 48 48" className="w-16 h-16" fill="none">
      <path d="M14 8 Q10 20 16 36" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M24 6 Q22 20 24 38" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M34 8 Q38 20 32 36" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M14 36 Q24 44 34 36" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function GameOverScreen({ room, playerId, onLeave, onRestart, onReturnToLobby }: Props) {
  const isVillageWin = room.winner === 'village';
  const isHost = room.hostId === playerId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-phase-in">
      <div className="relative max-w-md w-full bg-[#0d0a06] border border-amber-900/50 rounded-xl shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden">

        {/* Header */}
        <div className={`px-8 py-7 text-center ${isVillageWin ? 'bg-amber-950/25' : 'bg-red-950/25'}`}>
          <div className="flex justify-center mb-4">
            {isVillageWin ? <VillageWinIcon /> : <WolfWinIcon />}
          </div>

          <h2
            className="font-cinzel text-3xl font-bold tracking-[0.2em] drop-shadow-[0_0_20px_currentColor]"
            style={{ color: isVillageWin ? '#d97706' : '#dc2626' }}
          >
            {isVillageWin ? 'VILLAGE WINS' : 'WOLVES WIN'}
          </h2>
          <p className="text-amber-700 text-sm mt-1">
            {isVillageWin
              ? 'The villagers have driven out the evil.'
              : 'The werewolves have claimed the village.'}
          </p>

          {room.lastAnnouncement && (
            <p className="mt-3 text-amber-600/70 text-xs italic leading-relaxed border-t border-amber-900/30 pt-3">
              {room.lastAnnouncement}
            </p>
          )}
        </div>

        {/* Role reveals */}
        <div className="px-6 py-4 border-t border-amber-900/30">
          <p className="text-amber-700 text-[10px] uppercase tracking-widest text-center mb-3">
            The truth revealed
          </p>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {room.players.map(player => {
              const role = player.revealedRole;
              const info = role ? ROLE_INFO[role] : null;
              return (
                <div
                  key={player.id}
                  className="flex items-center gap-3 px-3 py-2 rounded bg-black/30 border border-amber-900/20"
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      player.isAlive ? 'bg-green-500' : 'bg-red-800/80'
                    }`}
                  />
                  <span
                    className={`text-sm font-semibold flex-1 truncate ${
                      player.isAlive ? 'text-amber-200' : 'text-amber-800'
                    }`}
                  >
                    {player.name}
                  </span>
                  {info ? (
                    <span
                      className="text-[11px] font-cinzel font-bold tracking-wider flex-shrink-0"
                      style={{ color: info.accentColor }}
                    >
                      {info.name.toUpperCase()}
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-800 flex-shrink-0">Unknown</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-6 pt-2 flex flex-col gap-2">
          {isHost && (
            <>
              <button
                onClick={onRestart}
                className="w-full py-2.5 bg-amber-900/50 border border-amber-700/60 text-amber-200 font-cinzel text-sm tracking-[0.15em] uppercase rounded hover:bg-amber-900/70 transition-colors"
              >
                Play Again
              </button>
              <button
                onClick={onReturnToLobby}
                className="w-full py-2.5 bg-black/30 border border-amber-900/40 text-amber-500 font-cinzel text-sm tracking-[0.15em] uppercase rounded hover:bg-black/50 hover:border-amber-700/50 transition-colors"
              >
                Return to Lobby
              </button>
            </>
          )}
          <button
            onClick={onLeave}
            className="w-full py-2.5 bg-transparent border border-red-900/40 text-red-700 font-cinzel text-sm tracking-[0.15em] uppercase rounded hover:border-red-700/60 hover:text-red-500 transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
