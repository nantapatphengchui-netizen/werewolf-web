import type { Player, PublicVotes } from '@/types/game';
import { GamePlayerCard } from './GamePlayerCard';

interface Props {
  players: Player[];
  currentPlayerId: string;
  werewolfIds: string[];
  publicVotes: PublicVotes | null;
  currentPlayerSubmitted?: boolean;
}

export function GamePlayerGrid({
  players,
  currentPlayerId,
  werewolfIds,
  publicVotes,
  currentPlayerSubmitted = false,
}: Props) {
  return (
    <div className="flex flex-wrap gap-3 justify-center content-center py-2 w-full h-full">
      {players.map((player, index) => (
        <GamePlayerCard
          key={player.id}
          player={player}
          index={index}
          isCurrentPlayer={player.id === currentPlayerId}
          isWerewolfTeammate={werewolfIds.includes(player.id) && player.id !== currentPlayerId}
          voteCount={publicVotes?.tally[player.id]}
          actionSubmitted={player.id === currentPlayerId ? currentPlayerSubmitted : false}
        />
      ))}
    </div>
  );
}
