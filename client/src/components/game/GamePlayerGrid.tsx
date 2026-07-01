import type { Player, PublicVotes, Role } from '@/types/game';
import { GamePlayerCard } from './GamePlayerCard';

interface Props {
  players: Player[];
  currentPlayerId: string;
  werewolfIds: string[];
  publicVotes: PublicVotes | null;
  currentPlayerSubmitted?: boolean;
  myRole?: Role | null;
  seerRevealedMap?: Record<string, Role>;
  validTargetIds?: string[];
  selectedTargetId?: string | null;
  onPlayerCardClick?: (playerId: string) => void;
  suspicionMap?: Record<string, string[]>;
  canMarkSuspicion?: boolean;
  onMarkSuspicion?: (targetId: string) => void;
}

export function GamePlayerGrid({
  players,
  currentPlayerId,
  werewolfIds,
  publicVotes,
  currentPlayerSubmitted = false,
  myRole,
  seerRevealedMap = {},
  validTargetIds = [],
  selectedTargetId = null,
  onPlayerCardClick,
  suspicionMap = {},
  canMarkSuspicion = false,
  onMarkSuspicion,
}: Props) {
  const n = players.length;

  // Responsive column counts
  const lgCols = n >= 7 ? 4 : 3;
  const lgRows = Math.ceil(n / lgCols);

  const lgColClass = lgCols === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3';
  const lgRowClass =
    lgRows <= 2 ? 'lg:[grid-template-rows:repeat(2,minmax(0,1fr))]' :
    lgRows <= 3 ? 'lg:[grid-template-rows:repeat(3,minmax(0,1fr))]' :
                  'lg:[grid-template-rows:repeat(4,minmax(0,1fr))]';

  return (
    <div className={`w-full lg:h-full grid grid-cols-3 sm:grid-cols-4 ${lgColClass} gap-2 sm:gap-2.5 ${lgRowClass}`}>
      {players.map((player, index) => {
        const suspicionCount  = (suspicionMap[player.id] ?? []).length;
        const isSuspectedByMe = (suspicionMap[player.id] ?? []).includes(currentPlayerId);
        const showSuspectBtn  = canMarkSuspicion && player.isAlive && player.id !== currentPlayerId;
        return (
          <div key={player.id} className="aspect-[3/4] lg:aspect-auto lg:min-h-0">
            <GamePlayerCard
              player={player}
              index={index}
              isCurrentPlayer={player.id === currentPlayerId}
              isWerewolfTeammate={werewolfIds.includes(player.id) && player.id !== currentPlayerId}
              voteCount={publicVotes?.tally[player.id]}
              actionSubmitted={player.id === currentPlayerId ? currentPlayerSubmitted : false}
              myRole={player.id === currentPlayerId ? myRole : undefined}
              seerRevealedRole={seerRevealedMap[player.id]}
              isValidTarget={validTargetIds.includes(player.id)}
              isSelected={player.id === selectedTargetId}
              onClick={onPlayerCardClick ? () => onPlayerCardClick(player.id) : undefined}
              suspicionCount={suspicionCount}
              isSuspectedByMe={isSuspectedByMe}
              showSuspectBtn={showSuspectBtn}
              onMarkSuspicion={showSuspectBtn && onMarkSuspicion ? () => onMarkSuspicion(player.id) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
