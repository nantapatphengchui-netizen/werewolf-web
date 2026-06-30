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
    ? 'border border-stone-800/20 opacity-50'
    : ready
    ? 'border border-green-700/55 shadow-[0_0_20px_rgba(74,222,128,0.1),0_4px_14px_rgba(0,0,0,0.45)]'
    : isCurrentPlayer
    ? 'border-2 border-amber-500/70 shadow-[0_0_18px_rgba(217,119,6,0.25),0_4px_14px_rgba(0,0,0,0.45)]'
    : 'border border-amber-900/28 shadow-[0_4px_12px_rgba(0,0,0,0.4)]';

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
          offline ? 'grayscale brightness-[0.35]' : ''
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
      <span className="absolute top-1.5 left-2 text-[9px] text-amber-900/40 font-cinzel tabular-nums z-10 leading-none">
        {index + 1}
      </span>

      {/* Badges — top right */}
      <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1 z-10">
        {offline ? (
          <span className="bg-stone-950/90 border border-stone-700/40 text-stone-500 text-[7px] px-1.5 py-0.5 rounded-md font-cinzel uppercase tracking-wider leading-none">
            Away
          </span>
        ) : ready ? (
          <span className="bg-green-950/85 border border-green-700/45 text-green-400 text-[7px] px-1.5 py-0.5 rounded-md font-cinzel uppercase tracking-wider leading-none">
            Ready
          </span>
        ) : null}
        {player.isBot && (
          <span className="bg-slate-950/85 border border-slate-700/35 text-slate-500 text-[7px] px-1.5 py-0.5 rounded-md font-cinzel uppercase tracking-wider leading-none">
            Bot
          </span>
        )}
      </div>

      {/* Nameplate */}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 pt-8 z-10">
        <p className={`text-[11px] font-cinzel tracking-wider uppercase truncate text-center leading-tight ${
          offline        ? 'text-stone-500/70'
          : ready        ? 'text-green-100/90'
          : isCurrentPlayer ? 'text-amber-100'
          : 'text-amber-200/85'
        }`}>
          {player.name}
        </p>

        {/* Sub-label row */}
        <div className="flex items-center justify-center gap-1.5 mt-0.5">
          {isCurrentPlayer && !offline && (
            <span className="text-amber-600/50 text-[8px] font-cinzel uppercase tracking-[0.2em] leading-none">You</span>
          )}
          {player.isHost && !offline && (
            <span className="text-amber-600/50 text-[8px] font-cinzel uppercase tracking-[0.2em] leading-none">Host</span>
          )}
        </div>
      </div>
    </div>
  );
}
