'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { RoomState, Role } from '@/types/game';
import { DarkPanel } from '@/components/ui/DarkPanel';
import { CopyButton } from '@/components/ui/CopyButton';
import { StatusDot } from '@/components/ui/StatusDot';
import { RolePanel } from './RolePanel';
import { ActionPanel } from './ActionPanel';
import { GamePlayerGrid } from './GamePlayerGrid';
import { GameStatusPanel } from './GameStatusPanel';
import { EventLog } from './EventLog';
import { GameOverScreen } from './GameOverScreen';
import { HostGameControls } from './HostGameControls';
import { PhaseTimer } from './PhaseTimer';

interface Props {
  room: RoomState;
  playerId: string;
  myRole: Role | null;
  werewolfIds: string[];
  isConnected: boolean;
  onLeave: () => void;
  onNightAction: (targetId: string) => void;
  onCastVote: (targetId: string) => void;
  onAdvanceDay: () => void;
  onRestart: () => void;
  onReturnToLobby: () => void;
  // Host admin
  onHostPauseTimer: () => void;
  onHostResumeTimer: () => void;
  onHostExtendTimer: (extraSeconds: number) => void;
  onHostEndPhase: () => void;
  onHostRestartGame: () => void;
  onHostReturnToLobby: () => void;
}

function getInstructionText(
  phase: string,
  myRole: Role | null,
  imAlive: boolean,
  isSubmitted: boolean,
): string {
  if (phase === 'ended' || phase === 'lobby') return '';
  if (isSubmitted) {
    if (phase === 'night') return 'Action submitted — awaiting other night actions...';
    if (phase === 'voting') return 'Vote cast — awaiting other players...';
  }
  if (!imAlive) {
    if (phase === 'night') return 'You have perished. Watch the night from the shadows.';
    if (phase === 'voting') return 'You are eliminated. Watch the vote.';
    return 'You have perished.';
  }
  if (phase === 'night') {
    if (myRole === 'werewolf') return 'Click a player to eliminate tonight.';
    if (myRole === 'seer') return 'Click a player to reveal their identity.';
    if (myRole === 'doctor') return 'Click a player to protect tonight.';
    return 'Night falls. The village sleeps. Wait for dawn.';
  }
  if (phase === 'day') return 'Discuss with the village. Find the wolves among you.';
  if (phase === 'voting') return 'Click a player to cast your vote for exile.';
  return '';
}

const PHASE_ICON: Record<string, React.ReactNode> = {
  night: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-violet-400 shrink-0" fill="currentColor">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
    </svg>
  ),
  day: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  voting: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-red-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l9-3 9 3M12 3v18M5 6l-2 8h4l-2-8zM19 6l-2 8h4l-2-8z" />
      <path strokeLinecap="round" d="M5 21h14" />
    </svg>
  ),
};

const PHASE_COLOR: Record<string, string> = {
  night:  'text-violet-300',
  day:    'text-amber-300',
  voting: 'text-red-300',
  ended:  'text-amber-300',
};

const STRIP_STYLE: Record<string, string> = {
  night:  'bg-indigo-950/30 border-indigo-800/30 text-violet-300/85',
  day:    'bg-amber-950/20 border-amber-900/25 text-amber-300/85',
  voting: 'bg-red-950/20 border-red-900/25 text-red-300/85',
};

export function GameView({
  room,
  playerId,
  myRole,
  werewolfIds,
  isConnected,
  onLeave,
  onNightAction,
  onCastVote,
  onAdvanceDay,
  onRestart,
  onReturnToLobby,
  onHostPauseTimer,
  onHostResumeTimer,
  onHostExtendTimer,
  onHostEndPhase,
  onHostRestartGame,
  onHostReturnToLobby,
}: Props) {
  const [actionSubmitted, setActionSubmitted] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const prevPhaseRef = useRef(room.phase);
  const isHost = room.hostId === playerId;

  useEffect(() => {
    if (prevPhaseRef.current !== room.phase) {
      prevPhaseRef.current = room.phase;
      setActionSubmitted(false);
      setSelectedTarget(null);
    }
  }, [room.phase]);

  const handleNightAction = (targetId: string) => {
    onNightAction(targetId);
    setActionSubmitted(true);
  };

  const handleCastVote = (targetId: string) => {
    onCastVote(targetId);
    setActionSubmitted(true);
  };

  const me = room.players.find(p => p.id === playerId);
  const imAlive = me?.isAlive ?? false;
  const hasVotedAlready = room.publicVotes?.hasVoted.includes(playerId) ?? false;
  const isActionSubmitted = actionSubmitted || hasVotedAlready;

  const validTargetIds = useMemo(() => {
    if (isActionSubmitted || !imAlive) return [];
    if (room.phase === 'night') {
      if (myRole === 'werewolf') return room.players.filter(p => p.isAlive && !werewolfIds.includes(p.id)).map(p => p.id);
      if (myRole === 'seer')     return room.players.filter(p => p.isAlive && p.id !== playerId).map(p => p.id);
      if (myRole === 'doctor')   return room.players.filter(p => p.isAlive).map(p => p.id);
      return [];
    }
    if (room.phase === 'voting') {
      return room.players.filter(p => p.isAlive && p.id !== playerId).map(p => p.id);
    }
    return [];
  }, [isActionSubmitted, imAlive, room.phase, room.players, myRole, werewolfIds, playerId]);

  // Placeholder — action dispatch wired in next phase
  const onPlayerCardClick = (targetPlayerId: string) => {
    if (!validTargetIds.includes(targetPlayerId)) return;
    setSelectedTarget(prev => prev === targetPlayerId ? null : targetPlayerId);
  };

  const instructionText = getInstructionText(room.phase, myRole, imAlive, isActionSubmitted);
  const stripStyle = STRIP_STYLE[room.phase] ?? STRIP_STYLE.day;
  const selectedPlayerName = selectedTarget ? room.players.find(p => p.id === selectedTarget)?.name : null;
  const showTimer = !!(room.phaseEndAt || room.timerPaused);

  return (
    <div className="relative z-10 flex flex-col overflow-hidden" style={{ height: '100dvh' }}>

      {/* Game over modal */}
      {room.phase === 'ended' && (
        <GameOverScreen
          room={room}
          playerId={playerId}
          onLeave={onLeave}
          onRestart={onRestart}
          onReturnToLobby={onReturnToLobby}
        />
      )}

      {/* ── Compact top bar ─────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <DarkPanel className="flex items-center justify-between px-4 py-2 gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-amber-700 text-[10px] uppercase tracking-widest hidden sm:inline shrink-0">Room</span>
            <span className="font-mono font-bold text-base text-amber-300 tracking-[0.3em]">{room.code}</span>
            <CopyButton text={room.code} />
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            {PHASE_ICON[room.phase]}
            <span className={`font-cinzel text-xs tracking-widest uppercase truncate ${PHASE_COLOR[room.phase] ?? 'text-amber-300'}`}>
              {room.phase === 'ended' ? 'Ended' : `${room.phase} · R${room.round}`}
            </span>
            {room.timerPaused && (
              <span className="text-[9px] text-amber-700 font-cinzel border border-amber-800/40 rounded px-1.5 py-0.5 ml-1 shrink-0">
                ⏸
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <StatusDot connected={isConnected} />
            <button
              onClick={onLeave}
              className="px-3 py-1 border border-amber-900/40 hover:border-red-800/60 text-amber-700 hover:text-red-400 text-xs uppercase tracking-widest rounded transition-colors"
            >
              Leave
            </button>
          </div>
        </DarkPanel>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 px-3 pb-3 flex flex-col lg:flex-row gap-3 overflow-y-auto lg:overflow-hidden">

        {/* ── Player grid area ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 lg:flex-1 lg:min-h-0">

          {/* Instruction strip */}
          {instructionText && (
            <div className={`shrink-0 flex items-center gap-3 px-3 py-2 rounded-lg border ${stripStyle}`}>
              <p className="text-xs flex-1 leading-snug">{instructionText}</p>
              {selectedPlayerName && (
                <span className="shrink-0 text-amber-400 text-[11px] font-cinzel uppercase tracking-wider">
                  → {selectedPlayerName}
                </span>
              )}
            </div>
          )}

          {/* Grid */}
          <div className="lg:flex-1 lg:min-h-0">
            <GamePlayerGrid
              players={room.players}
              currentPlayerId={playerId}
              werewolfIds={werewolfIds}
              publicVotes={room.publicVotes}
              currentPlayerSubmitted={actionSubmitted}
              validTargetIds={validTargetIds}
              selectedTargetId={selectedTarget}
              onPlayerCardClick={onPlayerCardClick}
            />
          </div>
        </div>

        {/* ── Right sidebar ────────────────────────────────────────────── */}
        <div className="w-full lg:w-56 xl:w-64 shrink-0 flex flex-col gap-3">
          {showTimer && (
            <DarkPanel className="px-4 py-3">
              <PhaseTimer
                phase={room.phase}
                phaseEndAt={room.phaseEndAt}
                paused={room.timerPaused}
                pausedTimeRemaining={room.pausedTimeRemaining}
              />
            </DarkPanel>
          )}
          <RolePanel
            myRole={myRole}
            werewolfIds={werewolfIds}
            players={room.players}
            playerId={playerId}
          />
          <EventLog events={room.eventLog} />
          <ActionPanel
            room={room}
            playerId={playerId}
            myRole={myRole}
            isHost={isHost}
            werewolfIds={werewolfIds}
            onNightAction={handleNightAction}
            onCastVote={handleCastVote}
            onAdvanceDay={onAdvanceDay}
          />
          <GameStatusPanel room={room} />
          {isHost && (
            <HostGameControls
              phase={room.phase}
              timerPaused={room.timerPaused}
              onPauseTimer={onHostPauseTimer}
              onResumeTimer={onHostResumeTimer}
              onExtendTimer={onHostExtendTimer}
              onEndPhase={onHostEndPhase}
              onRestartGame={onHostRestartGame}
              onReturnToLobby={onHostReturnToLobby}
            />
          )}
        </div>
      </div>
    </div>
  );
}
