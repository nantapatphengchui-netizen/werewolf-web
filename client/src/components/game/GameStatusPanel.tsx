import type { RoomState } from '@/types/game';
import { DarkPanel } from '@/components/ui/DarkPanel';
import { formatMessage } from '@/i18n';

interface Props {
  room: RoomState;
}

export function GameStatusPanel({ room }: Props) {
  const alive = room.players.filter(p => p.isAlive).length;
  const dead  = room.players.length - alive;
  const votesIn = room.publicVotes?.hasVoted.length ?? 0;

  return (
    <DarkPanel className="p-4 space-y-3">
      <p className="text-amber-700 text-[10px] uppercase tracking-widest text-center">
        Game Status
      </p>

      {/* Alive / Dead counts */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-green-950/20 rounded-lg border border-green-900/25 py-2.5">
          <p className="text-green-400 font-cinzel text-2xl font-bold leading-none">{alive}</p>
          <p className="text-green-700/70 text-[10px] uppercase tracking-widest mt-1">Alive</p>
        </div>
        <div className="bg-red-950/20 rounded-lg border border-red-900/25 py-2.5">
          <p className="text-red-500 font-cinzel text-2xl font-bold leading-none">{dead}</p>
          <p className="text-red-700/60 text-[10px] uppercase tracking-widest mt-1">Dead</p>
        </div>
      </div>

      {/* Voting progress bar */}
      {room.phase === 'voting' && room.publicVotes && (
        <div>
          <div className="flex justify-between text-[10px] text-amber-800 uppercase tracking-widest mb-1">
            <span>Votes Cast</span>
            <span className="text-red-400 font-cinzel font-bold">{votesIn}/{alive}</span>
          </div>
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-700/70 rounded-full transition-all duration-500"
              style={{ width: alive > 0 ? `${(votesIn / alive) * 100}%` : '0%' }}
            />
          </div>
        </div>
      )}

      {/* Last announcement */}
      {room.lastAnnouncement && (
        <div className="bg-amber-950/15 border border-amber-800/25 rounded-lg px-3 py-2.5">
          <p className="text-amber-700/60 text-[9px] uppercase tracking-widest mb-1">Latest</p>
          <p className="text-amber-400/80 text-xs leading-relaxed italic">
            {formatMessage(room.lastAnnouncement)}
          </p>
        </div>
      )}

      {/* Round / Phase footer */}
      <div className="flex justify-between text-[10px] text-amber-900 uppercase tracking-widest border-t border-amber-900/20 pt-2.5">
        <span>Round {room.round}</span>
        <span className={
          room.phase === 'night' ? 'text-violet-800' :
          room.phase === 'voting' ? 'text-red-900' :
          'text-amber-800'
        }>{room.phase}</span>
      </div>
    </DarkPanel>
  );
}
