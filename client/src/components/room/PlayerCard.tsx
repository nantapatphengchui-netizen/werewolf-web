import type { Player } from '@/types/game';

function HostCrown() {
  return (
    <svg viewBox="0 0 18 12" className="w-4 h-3" fill="#fbbf24">
      <path d="M1 11L4 5.5L9 8.5L14 5.5L17 11H1Z" stroke="#92400e" strokeWidth="0.7" strokeLinejoin="round" />
      <circle cx="1"  cy="4.5" r="1.5" fill="#fbbf24" />
      <circle cx="9"  cy="2"   r="1.5" fill="#fbbf24" />
      <circle cx="17" cy="4.5" r="1.5" fill="#fbbf24" />
    </svg>
  );
}

interface Props {
  player: Player;
  index: number;
  isCurrentPlayer: boolean;
  isReady?: boolean;
}

export function PlayerCard({ player, index, isCurrentPlayer, isReady }: Props) {
  const offline = !player.isConnected;
  const ready   = !!isReady && !offline;

  const borderGlow = offline
    ? 'border border-stone-700/40'
    : ready
    ? 'border border-green-500/70 shadow-[0_0_22px_rgba(74,222,128,0.2),0_4px_16px_rgba(0,0,0,0.6)]'
    : isCurrentPlayer
    ? 'border-2 border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.35),0_4px_16px_rgba(0,0,0,0.6)]'
    : 'border border-amber-800/50 shadow-[0_4px_14px_rgba(0,0,0,0.55)]';

  // Name text color — solid values, no opacity fractions
  const nameColor = offline
    ? '#94a3b8'       // slate-400
    : ready
    ? '#bbf7d0'       // green-200
    : isCurrentPlayer
    ? '#f7e7b0'       // warm cream-gold
    : '#f7e7b0';      // same for all other filled cards

  return (
    <div
      className={`
        relative w-full h-full overflow-hidden rounded-xl
        animate-card-enter
        transition-all duration-200 ease-out
        ${!offline ? 'hover:-translate-y-0.5 hover:shadow-[0_10px_32px_rgba(0,0,0,0.65)]' : ''}
        ${borderGlow}
      `}
    >
      {/* Avatar — full cover */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/avatar-hooded.png"
        alt=""
        draggable={false}
        className={`absolute inset-0 w-full h-full object-cover object-[50%_18%] transition-all duration-300 ${
          offline ? 'grayscale brightness-[0.4]' : ''
        }`}
      />

      {/* Nameplate gradient — covers bottom 65% of card for strong name contrast */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.2) 70%, transparent 100%)' }}
      />

      {/* Ready green tint */}
      {ready && (
        <div className="absolute inset-0 bg-gradient-to-t from-green-950/30 to-transparent pointer-events-none" />
      )}

      {/* Host crown — centered at top */}
      {player.isHost && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 drop-shadow-sm">
          <HostCrown />
        </div>
      )}

      {/* Slot number — top left */}
      <span className="absolute top-1.5 left-2 text-[9px] text-amber-600 font-cinzel tabular-nums z-10 leading-none">
        {index + 1}
      </span>

      {/* Badges — top right */}
      <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1 z-10">
        {offline ? (
          <span style={{ backgroundColor: 'rgba(30,30,35,0.97)', borderColor: 'rgba(148,163,184,0.6)', color: '#e2e8f0' }}
            className="border text-[7px] px-1.5 py-0.5 rounded-md font-cinzel uppercase tracking-wider leading-none">
            Away
          </span>
        ) : ready ? (
          <span style={{ backgroundColor: 'rgba(20,83,45,0.97)', borderColor: 'rgba(74,222,128,0.7)', color: '#bbf7d0' }}
            className="border text-[7px] px-1.5 py-0.5 rounded-md font-cinzel uppercase tracking-wider leading-none shadow-[0_0_8px_rgba(74,222,128,0.25)]">
            Ready
          </span>
        ) : null}
        {player.isBot && (
          <span style={{ backgroundColor: 'rgba(15,23,42,0.97)', borderColor: 'rgba(148,163,184,0.5)', color: '#94a3b8' }}
            className="border text-[7px] px-1.5 py-0.5 rounded-md font-cinzel uppercase tracking-wider leading-none">
            Bot
          </span>
        )}
      </div>

      {/* Nameplate content */}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 pt-10 z-10">
        <p
          className="text-[11px] font-cinzel tracking-wider uppercase truncate text-center leading-tight"
          style={{ color: nameColor, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}
        >
          {player.name}
        </p>

        {/* Sub-label row */}
        <div className="flex items-center justify-center gap-1.5 mt-0.5">
          {isCurrentPlayer && !offline && (
            <span className="text-amber-400 text-[8px] font-cinzel uppercase tracking-[0.2em] leading-none"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
              You
            </span>
          )}
          {player.isHost && !offline && (
            <span className="text-amber-400 text-[8px] font-cinzel uppercase tracking-[0.2em] leading-none"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
              Host
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
