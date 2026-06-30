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
  const needed   = minPlayers - playerCount;
  const allReady = readyCount === playerCount && playerCount > 0;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-black/85 backdrop-blur-md border border-amber-800/40 rounded-xl shadow-[0_-2px_20px_rgba(0,0,0,0.5)]">

      {/* Ready button */}
      <button
        onClick={onReady}
        className={`shrink-0 px-5 py-2 font-cinzel text-xs tracking-[0.15em] uppercase rounded-lg border transition-all duration-200 active:scale-95 ${
          isReady
            ? 'bg-green-900/65 border-green-500/70 text-green-100 shadow-[0_0_16px_rgba(74,222,128,0.25)] hover:bg-green-800/70'
            : 'bg-amber-950/40 border-amber-700/55 text-amber-300 hover:bg-amber-900/50 hover:border-amber-600/65'
        }`}
      >
        {isReady ? '✓ Ready' : 'Ready'}
      </button>

      {/* Status text */}
      <div className="flex-1 min-w-0 text-center">
        {playerCount < minPlayers ? (
          <p className="text-amber-500/95 text-[11px]">
            Need{' '}
            <span className="text-amber-200 font-semibold">{needed}</span>
            {' '}more player{needed !== 1 ? 's' : ''}
            <span className="text-amber-700/90 ml-1.5">({playerCount}/{minPlayers})</span>
          </p>
        ) : allReady ? (
          <p className="text-green-400 text-[11px] font-cinzel tracking-wide">
            All ready — host can start!
          </p>
        ) : (
          <p className="text-amber-500/95 text-[11px]">
            <span className="text-amber-200 font-semibold">{readyCount}</span>
            <span className="text-amber-700/90"> / {playerCount} ready</span>
          </p>
        )}
        {!isHost && (
          <p className="text-amber-600/80 text-[9px] mt-0.5 font-cinzel tracking-widest uppercase">
            Waiting for host
          </p>
        )}
      </div>

      {/* Start Game (host) or symmetry spacer */}
      {isHost ? (
        <button
          onClick={onStartGame}
          disabled={!canStart}
          className={`shrink-0 px-6 py-2 font-cinzel text-xs tracking-[0.2em] uppercase rounded-lg border transition-all duration-200 active:scale-95 ${
            canStart
              ? 'bg-red-800/70 border-red-500/65 text-white shadow-[0_0_24px_rgba(220,38,38,0.5)] hover:bg-red-700/80 hover:shadow-[0_0_36px_rgba(220,38,38,0.65)]'
              : 'bg-stone-900/50 border-stone-600/40 text-stone-400/85 cursor-not-allowed'
          }`}
        >
          Start Game
        </button>
      ) : (
        <div className="shrink-0 w-[90px]" />
      )}
    </div>
  );
}
