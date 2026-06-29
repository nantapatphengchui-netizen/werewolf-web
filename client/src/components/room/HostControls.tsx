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

  if (!isHost) {
    return (
      <div className="flex flex-col items-center gap-3 py-5">
        <button
          onClick={onReady}
          className={`px-10 py-2.5 font-cinzel text-sm tracking-[0.15em] uppercase rounded border transition-all active:scale-95 ${
            isReady
              ? 'bg-green-950/60 border-green-700/60 text-green-300 hover:bg-green-950/80'
              : 'bg-amber-950/40 border-amber-700/50 text-amber-300 hover:bg-amber-900/50'
          }`}
        >
          {isReady ? '✓ Ready' : 'Ready Up'}
        </button>
        <div className="flex items-center gap-2">
          <span className="animate-pulse text-amber-900 text-xs">●</span>
          <p className="text-amber-800 text-sm tracking-wide">
            Waiting for the host to start...
          </p>
        </div>
        <p className="text-amber-900 text-xs">
          {readyCount}/{playerCount} ready
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-5">
      <button
        onClick={onReady}
        className={`px-10 py-2.5 font-cinzel text-sm tracking-[0.15em] uppercase rounded border transition-all active:scale-95 ${
          isReady
            ? 'bg-green-950/60 border-green-700/60 text-green-300 hover:bg-green-950/80'
            : 'bg-amber-950/40 border-amber-700/50 text-amber-300 hover:bg-amber-900/50'
        }`}
      >
        {isReady ? '✓ Ready' : 'Ready Up'}
      </button>

      <p className="text-amber-800 text-xs">
        {readyCount}/{playerCount} ready
        {playerCount >= minPlayers && !allReady && (
          <span className="text-amber-900 ml-2">— waiting for all players</span>
        )}
      </p>

      {playerCount < minPlayers && (
        <p className="text-amber-700 text-sm text-center">
          Need <span className="text-amber-500 font-semibold">{needed}</span> more player
          {needed !== 1 ? 's' : ''}
          <span className="text-amber-800 ml-1">({playerCount}/{minPlayers} minimum)</span>
        </p>
      )}

      <button
        onClick={onStartGame}
        disabled={!canStart}
        className={`px-14 py-3.5 font-cinzel text-base tracking-[0.2em] uppercase rounded border transition-all duration-200 active:scale-95 ${
          canStart
            ? 'bg-red-950/70 hover:bg-red-900/70 border-red-700/60 text-red-200 shadow-[0_0_20px_rgba(185,28,28,0.25)] hover:shadow-[0_0_28px_rgba(185,28,28,0.4)]'
            : 'bg-gray-900/40 border-gray-800/30 text-gray-700 cursor-not-allowed'
        }`}
      >
        Start Game
      </button>
    </div>
  );
}
