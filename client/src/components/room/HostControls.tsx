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
    <div
      style={{ backgroundColor: 'rgba(3,5,7,0.96)' }}
      className="flex items-center gap-3 px-4 py-2.5 border border-amber-700/55 rounded-xl shadow-[0_-2px_24px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(251,191,36,0.05)]"
    >

      {/* Ready button */}
      <button
        onClick={onReady}
        className={`shrink-0 px-5 py-2 font-cinzel text-xs tracking-[0.15em] uppercase rounded-lg border transition-all duration-200 active:scale-95 ${
          isReady
            ? 'border-green-500/80 text-green-100 shadow-[0_0_16px_rgba(74,222,128,0.3)] hover:shadow-[0_0_22px_rgba(74,222,128,0.45)]'
            : 'border-amber-600/70 text-amber-200 hover:border-amber-500 hover:text-amber-100'
        }`}
        style={{
          backgroundColor: isReady ? 'rgba(20,83,45,0.90)' : 'rgba(92,45,5,0.70)',
        }}
      >
        {isReady ? '✓ Ready' : 'Ready'}
      </button>

      {/* Status text */}
      <div className="flex-1 min-w-0 text-center">
        {playerCount < minPlayers ? (
          <p className="text-amber-400 text-[11px]">
            Need{' '}
            <span className="text-amber-200 font-semibold">{needed}</span>
            {' '}more player{needed !== 1 ? 's' : ''}
            <span className="text-amber-600 ml-1.5">({playerCount}/{minPlayers})</span>
          </p>
        ) : allReady ? (
          <p className="text-green-400 text-[11px] font-cinzel tracking-wide">
            All ready — host can start!
          </p>
        ) : (
          <p className="text-amber-400 text-[11px]">
            <span className="text-amber-200 font-semibold">{readyCount}</span>
            <span className="text-amber-600"> / {playerCount} ready</span>
          </p>
        )}
        {!isHost && (
          <p className="text-amber-500 text-[9px] mt-0.5 font-cinzel tracking-widest uppercase">
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
              ? 'border-red-500/80 text-white shadow-[0_0_24px_rgba(220,38,38,0.55)] hover:shadow-[0_0_36px_rgba(220,38,38,0.7)]'
              : 'border-stone-600/55 text-stone-400 cursor-not-allowed'
          }`}
          style={{
            backgroundColor: canStart ? 'rgba(153,27,27,0.85)' : 'rgba(28,25,23,0.80)',
          }}
        >
          Start Game
        </button>
      ) : (
        <div className="shrink-0 w-[90px]" />
      )}
    </div>
  );
}
