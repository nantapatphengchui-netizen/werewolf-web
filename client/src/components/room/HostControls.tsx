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
  const needed = minPlayers - playerCount;
  const allReady = readyCount === playerCount && playerCount > 0;

  return (
    <div className="bg-black/70 backdrop-blur-md border border-amber-900/30 rounded-lg px-4 py-3 flex items-center gap-3 flex-wrap">

      {/* Ready button — always visible */}
      <button
        onClick={onReady}
        className={`shrink-0 px-5 py-2 font-cinzel text-xs tracking-[0.15em] uppercase rounded border transition-all active:scale-95 ${
          isReady
            ? 'bg-green-950/60 border-green-700/60 text-green-300 hover:bg-green-950/80'
            : 'bg-amber-950/40 border-amber-700/50 text-amber-300 hover:bg-amber-900/50'
        }`}
      >
        {isReady ? '✓ Ready' : 'Ready Up'}
      </button>

      {/* Status text */}
      <div className="flex-1 min-w-0">
        {playerCount < minPlayers ? (
          <p className="text-amber-700 text-xs leading-snug">
            Need <span className="text-amber-400 font-semibold">{needed}</span> more player{needed !== 1 ? 's' : ''} to start
            <span className="text-amber-900 ml-1">({playerCount}/{minPlayers})</span>
          </p>
        ) : allReady ? (
          <p className="text-green-500 text-xs font-semibold">All players ready!</p>
        ) : (
          <p className="text-amber-700 text-xs">{readyCount}/{playerCount} ready</p>
        )}
        {!isHost && (
          <p className="text-amber-900/60 text-[10px] flex items-center gap-1 mt-0.5">
            <span className="animate-pulse inline-block">●</span> Waiting for host to start
          </p>
        )}
      </div>

      {/* Start button — host only */}
      {isHost && (
        <button
          onClick={onStartGame}
          disabled={!canStart}
          className={`shrink-0 px-6 py-2 font-cinzel text-xs tracking-[0.2em] uppercase rounded border transition-all active:scale-95 ${
            canStart
              ? 'bg-red-950/70 border-red-700/60 text-red-200 shadow-[0_0_16px_rgba(185,28,28,0.25)] hover:bg-red-900/70 hover:shadow-[0_0_24px_rgba(185,28,28,0.4)]'
              : 'bg-gray-900/40 border-gray-800/30 text-gray-700 cursor-not-allowed'
          }`}
        >
          Start Game
        </button>
      )}
    </div>
  );
}
