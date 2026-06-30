import type { Player } from '@/types/game';

function HostCrown() {
  return (
    <svg viewBox="0 0 18 12" className="w-4 h-3" fill="#d97706">
      <path d="M1 11L4 5.5L9 8.5L14 5.5L17 11H1Z" stroke="#92400e" strokeWidth="0.7" strokeLinejoin="round" />
      <circle cx="1"  cy="4.5" r="1.5" fill="#d97706" />
      <circle cx="9"  cy="2"   r="1.5" fill="#d97706" />
      <circle cx="17" cy="4.5" r="1.5" fill="#d97706" />
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
    ? 'border border-stone-700/30'
    : ready
    ? 'border border-green-600/65 shadow-[0_0_20px_rgba(74,222,128,0.15),0_4px_14px_rgba(0,0,0,0.55)]'
    : isCurrentPlayer
    ? 'border-2 border-amber-400/80 shadow-[0_0_22px_rgba(217,119,6,0.35),0_4px_14px_rgba(0,0,0,0.55)]'
    : 'border border-amber-900/40 shadow-[0_4px_12px_rgba(0,0,0,0.5)]';

  return (
    <div
      className={`
        relative w-full h-full overflow-hidden rounded-xl
        animate-card-enter
        transition-all duration-200 ease-out
        ${!offline ? 'hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)]' : ''}
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
          offline ? 'grayscale brightness-[0.45]' : ''
        }`}
      />

      {/* Bottom nameplate gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/96 via-black/35 to-black/5" />

      {/* Ready green tint */}
      {ready && (
        <div className="absolute inset-0 bg-gradient-to-t from-green-950/25 to-transparent pointer-events-none" />
      )}

      {/* Host crown — centered at top */}
      {player.isHost && (
        <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 drop-shadow-sm">
          <HostCrown />
        </div>
      )}

      {/* Slot number — top left */}
      <span className="absolute top-1.5 left-2 text-[9px] text-amber-700/70 font-cinzel tabular-nums z-10 leading-none">
        {index + 1}
      </span>

      {/* Badges — top right */}
      <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1 z-10">
        {offline ? (
          <span className="bg-stone-900/95 border border-stone-600/55 text-stone-300/90 text-[7px] px-1.5 py-0.5 rounded-md font-cinzel uppercase tracking-wider leading-none">
            Away
          </span>
        ) : ready ? (
          <span className="bg-green-900/90 border border-green-500/70 text-green-200 text-[7px] px-1.5 py-0.5 rounded-md font-cinzel uppercase tracking-wider leading-none shadow-[0_0_8px_rgba(74,222,128,0.2)]">
            Ready
          </span>
        ) : null}
        {player.isBot && (
          <span className="bg-slate-900/90 border border-slate-500/55 text-slate-300/90 text-[7px] px-1.5 py-0.5 rounded-md font-cinzel uppercase tracking-wider leading-none">
            Bot
          </span>
        )}
      </div>

      {/* Nameplate */}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 pt-10 z-10">
        <p className={`text-[11px] font-cinzel tracking-wider uppercase truncate text-center leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] ${
          offline        ? 'text-stone-400/90'
          : ready        ? 'text-green-100'
          : isCurrentPlayer ? 'text-amber-100'
          : 'text-amber-200/95'
        }`}>
          {player.name}
        </p>

        {/* Sub-label row */}
        <div className="flex items-center justify-center gap-1.5 mt-0.5">
          {isCurrentPlayer && !offline && (
            <span className="text-amber-500/80 text-[8px] font-cinzel uppercase tracking-[0.2em] leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">You</span>
          )}
          {player.isHost && !offline && (
            <span className="text-amber-500/80 text-[8px] font-cinzel uppercase tracking-[0.2em] leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Host</span>
          )}
        </div>
      </div>
    </div>
  );
}
