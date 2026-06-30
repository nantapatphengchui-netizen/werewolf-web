import type { Player, PublicVotes } from '@/types/game';
import { GamePlayerCard } from './GamePlayerCard';

interface Props {
  players: Player[];
  currentPlayerId: string;
  werewolfIds: string[];
  publicVotes: PublicVotes | null;
  currentPlayerSubmitted?: boolean;
  validTargetIds?: string[];
  selectedTargetId?: string | null;
  onPlayerCardClick?: (playerId: string) => void;
}

export function GamePlayerGrid({
  players,
  currentPlayerId,
  werewolfIds,
  publicVotes,
  currentPlayerSubmitted = false,
  validTargetIds = [],
  selectedTargetId = null,
  onPlayerCardClick,
}: Props) {
  // Compute desktop row count so the grid fills the container height.
  const desktopRowCount = Math.ceil(players.length / 4);
  const rowClass = desktopRowCount <= 2
    ? 'lg:[grid-template-rows:repeat(2,minmax(0,1fr))]'
    : 'lg:[grid-template-rows:repeat(3,minmax(0,1fr))]';

  return (
    <div className={`w-full lg:h-full grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-2.5 ${rowClass}`}>
      {players.map((player, index) => (
        <div key={player.id} className="aspect-[3/4] lg:aspect-auto lg:min-h-0">
          <GamePlayerCard
            player={player}
            index={index}
            isCurrentPlayer={player.id === currentPlayerId}
            isWerewolfTeammate={werewolfIds.includes(player.id) && player.id !== currentPlayerId}
            voteCount={publicVotes?.tally[player.id]}
            actionSubmitted={player.id === currentPlayerId ? currentPlayerSubmitted : false}
            isValidTarget={validTargetIds.includes(player.id)}
            isSelected={player.id === selectedTargetId}
            onClick={onPlayerCardClick ? () => onPlayerCardClick(player.id) : undefined}
          />
        </div>
      ))}
    </div>
  );
}
