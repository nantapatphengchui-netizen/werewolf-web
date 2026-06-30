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
    <div className="flex items-center gap-3 px-4 py-2.5 bg-black/55 backdrop-blur-md border border-amber-900/22 rounded-xl">

      {/* Ready button */}
      <button
        onClick={onReady}
        className={`shrink-0 px-5 py-2 font-cinzel text-xs tracking-[0.15em] uppercase rounded-lg border transition-all duration-200 active:scale-95 ${
          isReady
            ? 'bg-green-950/50 border-green-700/45 text-green-300 shadow-[0_0_14px_rgba(74,222,128,0.15)] hover:bg-green-900/55'
            : 'bg-amber-950/22 border-amber-800/32 text-amber-400 hover:bg-amber-950/40 hover:border-amber-700/45'
        }`}
      >
        {isReady ? '✓ Ready' : 'Ready'}
      </button>

      {/* Status text */}
      <div className="flex-1 min-w-0 text-center">
        {playerCount < minPlayers ? (
          <p className="text-amber-700/75 text-[11px]">
            Need{' '}
            <span className="text-amber-400 font-semibold">{needed}</span>
            {' '}more player{needed !== 1 ? 's' : ''}
            <span className="text-amber-900/55 ml-1.5">({playerCount}/{minPlayers})</span>
          </p>
        ) : allReady ? (
          <p className="text-green-500/85 text-[11px] font-cinzel tracking-wide">
            All ready — host can start!
          </p>
        ) : (
          <p className="text-amber-700/70 text-[11px]">
            <span className="text-amber-400 font-semibold">{readyCount}</span>
            <span className="text-amber-900/55"> / {playerCount} ready</span>
          </p>
        )}
        {!isHost && (
          <p className="text-amber-900/38 text-[9px] mt-0.5 font-cinzel tracking-widest uppercase">
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
              ? 'bg-red-900/60 border-red-600/50 text-white shadow-[0_0_22px_rgba(220,38,38,0.4)] hover:bg-red-800/70 hover:shadow-[0_0_32px_rgba(220,38,38,0.6)]'
              : 'bg-stone-950/28 border-stone-800/28 text-stone-600/70 cursor-not-allowed'
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
