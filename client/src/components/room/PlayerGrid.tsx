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
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {slots.map(({ index, player }) =>
        player ? (
          <PlayerCard
            key={player.id}
            player={player}
            index={index}
            isCurrentPlayer={player.id === currentPlayerId}
            isReady={readyPlayers.includes(player.id)}
          />
        ) : (
          <EmptySlot key={`empty-${index}`} index={index} />
        )
      )}
    </div>
  );
}
