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
  const left   = players.slice(0, 3);
  const bottom = players.slice(3, 8);
  const top    = players.slice(8);

  const card = (player: Player) => (
    <GamePlayerCard
      key={player.id}
      player={player}
      index={players.indexOf(player)}
      isCurrentPlayer={player.id === currentPlayerId}
      isWerewolfTeammate={werewolfIds.includes(player.id) && player.id !== currentPlayerId}
      voteCount={publicVotes?.tally[player.id]}
      actionSubmitted={player.id === currentPlayerId ? currentPlayerSubmitted : false}
    />
  );

  return (
    <div className="flex gap-3 w-full h-full">
      {/* Left column */}
      {left.length > 0 && (
        <div className="flex flex-col gap-2 shrink-0">
          {left.map(card)}
        </div>
      )}

      {/* Centre column */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Top row (players 9–12) */}
        {top.length > 0 && (
          <div className="flex justify-center gap-2 flex-wrap">
            {top.map(card)}
          </div>
        )}

        {/* Bottom row (players 4–8) */}
        {bottom.length > 0 && (
          <div className="flex justify-center gap-2 flex-wrap mt-auto">
            {bottom.map(card)}
          </div>
        )}
      </div>
    </div>
  );
}
