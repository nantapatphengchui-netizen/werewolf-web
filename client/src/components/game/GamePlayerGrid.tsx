import type { Player, PublicVotes, Role } from '@/types/game';
import { GamePlayerCard } from './GamePlayerCard';
import type { CardActionType } from './GamePlayerCard';

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
  trustMap?: Record<string, string[]>;
  canMarkTrust?: boolean;
  onMarkTrust?: (targetId: string) => void;
  actionType?: CardActionType | null;
  onConfirmAction?: (playerId: string) => void;
  onCancelAction?: () => void;
  showAskBtns?: boolean;
  onAsk?: (targetId: string) => void;
  reactionsMap?: Record<string, { emoji: string; key: number }>;
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
  trustMap = {},
  canMarkTrust = false,
  onMarkTrust,
  actionType = null,
  onConfirmAction,
  onCancelAction,
  showAskBtns = false,
  onAsk,
  reactionsMap = {},
}: Props) {
  const n = players.length;

  const lgCols = n >= 9 ? 5 : n >= 5 ? 4 : 3;
  const lgRows = Math.ceil(n / lgCols);

  const lgColClass =
    lgCols === 5 ? 'lg:grid-cols-5' :
    lgCols === 4 ? 'lg:grid-cols-4' :
                   'lg:grid-cols-3';

  const lgRowClass =
    lgRows <= 2 ? 'lg:[grid-template-rows:repeat(2,minmax(0,1fr))]' :
    lgRows <= 3 ? 'lg:[grid-template-rows:repeat(3,minmax(0,1fr))]' :
                  'lg:[grid-template-rows:repeat(4,minmax(0,1fr))]';

  // Center orphan cards in the last lg row
  const lgOrphan  = n % lgCols;
  const lgSpacer  = lgOrphan > 0 ? Math.floor((lgCols - lgOrphan) / 2) : 0;
  const lgSpanClass =
    lgSpacer === 2 ? 'lg:col-span-2' :
    lgSpacer === 1 ? 'lg:col-span-1' : '';

  const items: React.ReactNode[] = [];
  players.forEach((player, index) => {
    if (lgOrphan > 0 && lgSpacer > 0 && index === n - lgOrphan) {
      items.push(<div key="__spacer__" className={`hidden ${lgSpanClass} lg:block`} />);
    }

    const suspicionCount  = (suspicionMap[player.id] ?? []).length;
    const isSuspectedByMe = (suspicionMap[player.id] ?? []).includes(currentPlayerId);
    const showSuspectBtn  = canMarkSuspicion && player.isAlive && player.id !== currentPlayerId;
    const trustCount      = (trustMap[player.id] ?? []).length;
    const isTrustedByMe   = (trustMap[player.id] ?? []).includes(currentPlayerId);
    const showTrustBtn    = canMarkTrust && player.isAlive && player.id !== currentPlayerId;
    const showAskBtn      = showAskBtns && player.isAlive && player.id !== currentPlayerId;
    const isSelected      = player.id === selectedTargetId;

    items.push(
      <div
        key={player.id}
        className="aspect-[3/4] lg:aspect-auto lg:min-h-0"
        style={{ filter: 'drop-shadow(0 7px 16px rgba(0,0,0,0.55))' }}
      >
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
          isSelected={isSelected}
          onClick={onPlayerCardClick ? () => onPlayerCardClick(player.id) : undefined}
          suspicionCount={suspicionCount}
          isSuspectedByMe={isSuspectedByMe}
          showSuspectBtn={showSuspectBtn}
          onMarkSuspicion={showSuspectBtn && onMarkSuspicion ? () => onMarkSuspicion(player.id) : undefined}
          trustCount={trustCount}
          isTrustedByMe={isTrustedByMe}
          showTrustBtn={showTrustBtn}
          onMarkTrust={showTrustBtn && onMarkTrust ? () => onMarkTrust(player.id) : undefined}
          actionType={actionType}
          onConfirmAction={onConfirmAction ? () => onConfirmAction(player.id) : undefined}
          onCancelAction={onCancelAction}
          showAskBtn={showAskBtn}
          onAsk={showAskBtn && onAsk ? () => onAsk(player.id) : undefined}
          reaction={reactionsMap[player.id]}
        />
      </div>
    );
  });

  return (
    <div className={`w-full lg:h-full grid grid-cols-3 sm:grid-cols-4 ${lgColClass} gap-2 sm:gap-2.5 ${lgRowClass}`}>
      {items}
    </div>
  );
}
