import type { Player } from '@/types/game';
import { PlayerCard } from './PlayerCard';
import { EmptySlot } from './EmptySlot';

interface Props {
  players: Player[];
  maxPlayers: number;
  currentPlayerId: string;
  readyPlayers?: string[];
}

export function PlayerGrid({ players, maxPlayers, currentPlayerId, readyPlayers = [] }: Props) {
  const slots = Array.from({ length: maxPlayers }, (_, i) => ({
    index: i,
    player: players[i] ?? null,
  }));

  return (
    // Desktop: fills parent height with fixed 3-row grid (4 cols × 3 rows = 12 slots).
    // Mobile: auto row heights with aspect-ratio wrappers, parent scrolls.
    <div className="w-full lg:h-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5 lg:[grid-template-rows:repeat(3,minmax(0,1fr))]">
      {slots.map(({ index, player }) => (
        // Mobile: aspect ratio gives the slot a defined height.
        // Desktop: grid template row gives height; aspect-auto removes the forced ratio.
        <div key={player?.id ?? `empty-${index}`} className="aspect-[3/4] lg:aspect-auto lg:min-h-0">
          {player ? (
            <PlayerCard
              player={player}
              index={index}
              isCurrentPlayer={player.id === currentPlayerId}
              isReady={readyPlayers.includes(player.id)}
            />
          ) : (
            <EmptySlot index={index} />
          )}
        </div>
      ))}
    </div>
  );
}
