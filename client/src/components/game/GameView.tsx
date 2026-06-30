'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { RoomState, Role } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { DarkPanel } from '@/components/ui/DarkPanel';
import { CopyButton } from '@/components/ui/CopyButton';
import { StatusDot } from '@/components/ui/StatusDot';
import { AudioControls } from '@/components/ui/AudioControls';
import { RolePanel } from './RolePanel';
import { ActionPanel } from './ActionPanel';
import { GamePlayerGrid } from './GamePlayerGrid';
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
  const [actionSubmitted, setActionSubmitted]     = useState(false);
  const [selectedTarget, setSelectedTarget]       = useState<string | null>(null);
  const [logOpen, setLogOpen]                     = useState(false);
  const [hostControlsOpen, setHostControlsOpen]   = useState(false);
  const prevPhaseRef = useRef(room.phase);
  const isHost = room.hostId === playerId;
  const seerLog = useGameStore(s => s.seerLog);

  const seerRevealedMap = useMemo((): Record<string, Role> => {
    if (myRole !== 'seer') return {};
    return Object.fromEntries(seerLog.map(e => [e.targetId, e.role]));
  }, [myRole, seerLog]);

  useEffect(() => {
    if (prevPhaseRef.current !== room.phase) {
      prevPhaseRef.current = room.phase;
      setActionSubmitted(false);
      setSelectedTarget(null);
      setHostControlsOpen(false);
    }
  }, [room.phase]);

  const handleNightAction = (targetId: string) => { onNightAction(targetId); setActionSubmitted(true); };
  const handleCastVote    = (targetId: string) => { onCastVote(targetId);    setActionSubmitted(true); };

  const me             = room.players.find(p => p.id === playerId);
  const imAlive        = me?.isAlive ?? false;
  const aliveCount     = room.players.filter(p => p.isAlive).length;
  const deadCount      = room.players.length - aliveCount;
  const hasVotedAlready    = room.publicVotes?.hasVoted.includes(playerId) ?? false;
  const isActionSubmitted  = actionSubmitted || hasVotedAlready;

  const validTargetIds = useMemo(() => {
    if (isActionSubmitted || !imAlive) return [];
    if (room.phase === 'night') {
      if (myRole === 'werewolf') return room.players.filter(p => p.isAlive && !werewolfIds.includes(p.id)).map(p => p.id);
      if (myRole === 'seer')     return room.players.filter(p => p.isAlive && p.id !== playerId).map(p => p.id);
      if (myRole === 'doctor')   return room.players.filter(p => p.isAlive).map(p => p.id);
      return [];
    }
    if (room.phase === 'voting') return room.players.filter(p => p.isAlive && p.id !== playerId).map(p => p.id);
    return [];
  }, [isActionSubmitted, imAlive, room.phase, room.players, myRole, werewolfIds, playerId]);

  const onPlayerCardClick = (targetPlayerId: string) => {
    if (!validTargetIds.includes(targetPlayerId)) return;
    setSelectedTarget(prev => prev === targetPlayerId ? null : targetPlayerId);
  };

  const instructionText    = getInstructionText(room.phase, myRole, imAlive, isActionSubmitted);
  const stripStyle         = STRIP_STYLE[room.phase] ?? STRIP_STYLE.day;
  const selectedPlayerName = selectedTarget ? room.players.find(p => p.id === selectedTarget)?.name : null;
  const showTimer          = !!(room.phaseEndAt || room.timerPaused);

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

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <DarkPanel className="flex items-center gap-3 px-4 py-2">

          {/* Room code */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-amber-700 text-[10px] uppercase tracking-widest hidden sm:inline">Room</span>
            <span className="font-mono font-bold text-base text-amber-300 tracking-[0.3em]">{room.code}</span>
            <CopyButton text={room.code} />
          </div>

          {/* Phase + round */}
          <div className="flex items-center gap-1.5 min-w-0">
            {PHASE_ICON[room.phase]}
            <span className={`font-cinzel text-xs tracking-widest uppercase truncate ${PHASE_COLOR[room.phase] ?? 'text-amber-300'}`}>
              {room.phase === 'ended' ? 'Ended' : `${room.phase} · R${room.round}`}
            </span>
            {room.timerPaused && (
              <span className="text-[9px] text-amber-700 border border-amber-800/40 rounded px-1.5 py-0.5 shrink-0">⏸</span>
            )}
          </div>

          {/* Alive / Dead counts */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] shrink-0">
            <span className="text-green-500 font-semibold">{aliveCount}</span>
            <span className="text-stone-700 text-[10px]">alive</span>
            <span className="text-stone-700 mx-0.5">·</span>
            <span className="text-red-700 font-semibold">{deadCount}</span>
            <span className="text-stone-700 text-[10px]">dead</span>
          </div>

          <div className="flex-1" />

          {/* Connection + music + leave */}
          <div className="flex items-center gap-3 shrink-0">
            <StatusDot connected={isConnected} />
            <div className="h-4 w-px bg-amber-900/20 hidden sm:block" />
            <AudioControls />
            <div className="h-4 w-px bg-amber-900/20 hidden sm:block" />
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

          {/* Last announcement — compact strip above instruction */}
          {room.lastAnnouncement && (
            <div className="shrink-0 px-3 py-1.5 rounded-lg border border-amber-900/15 bg-amber-950/10 text-center">
              <p className="text-amber-400/65 text-[11px] italic leading-snug">{room.lastAnnouncement}</p>
            </div>
          )}

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
              myRole={myRole}
              seerRevealedMap={seerRevealedMap}
              validTargetIds={validTargetIds}
              selectedTargetId={selectedTarget}
              onPlayerCardClick={onPlayerCardClick}
            />
          </div>
        </div>

        {/* ── Right sidebar — slim ─────────────────────────────────────── */}
        <div className="w-full lg:w-48 xl:w-52 shrink-0 flex flex-col gap-2">

          {/* Timer */}
          {showTimer && (
            <DarkPanel className="px-3 py-2.5">
              <PhaseTimer
                phase={room.phase}
                phaseEndAt={room.phaseEndAt}
                paused={room.timerPaused}
                pausedTimeRemaining={room.pausedTimeRemaining}
              />
            </DarkPanel>
          )}

          {/* Role */}
          <RolePanel
            myRole={myRole}
            werewolfIds={werewolfIds}
            players={room.players}
            playerId={playerId}
          />

          {/* Primary action */}
          <ActionPanel
            room={room}
            playerId={playerId}
            myRole={myRole}
            isHost={isHost}
            werewolfIds={werewolfIds}
            selectedTarget={selectedTarget}
            onNightAction={handleNightAction}
            onCastVote={handleCastVote}
            onAdvanceDay={onAdvanceDay}
          />

          {/* Host controls — collapsible */}
          {isHost && (
            <div className="flex flex-col">
              <button
                onClick={() => setHostControlsOpen(p => !p)}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-amber-900/20 bg-black/20 hover:border-amber-800/35 transition-colors"
              >
                <span className="text-[10px] font-cinzel uppercase tracking-widest text-amber-800/70">Host Controls</span>
                <svg
                  viewBox="0 0 16 16"
                  className={`w-3 h-3 text-amber-800/50 transition-transform duration-200 ${hostControlsOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {hostControlsOpen && (
                <div className="mt-1">
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
                </div>
              )}
            </div>
          )}

          {/* Event log toggle */}
          <button
            onClick={() => setLogOpen(true)}
            className="flex items-center justify-between px-3 py-2 rounded-lg border border-amber-900/15 bg-black/10 hover:border-amber-900/30 hover:bg-black/20 transition-colors group"
          >
            <span className="text-[10px] font-cinzel uppercase tracking-widest text-amber-900/50 group-hover:text-amber-800/70 transition-colors">
              Event Log
            </span>
            <span className="text-[10px] text-amber-900/30 group-hover:text-amber-800/50 transition-colors">
              {room.eventLog.length}
            </span>
          </button>

        </div>
      </div>

      {/* ── Event log drawer ─────────────────────────────────────────────── */}
      {logOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setLogOpen(false)}>
          {/* Backdrop */}
          <div className="flex-1 bg-black/40 backdrop-blur-[1px]" />
          {/* Panel */}
          <div
            className="relative w-72 bg-stone-950/98 border-l border-amber-900/25 flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-900/20 shrink-0">
              <p className="font-cinzel text-amber-600/80 text-[10px] uppercase tracking-widest">Event Log</p>
              <button
                onClick={() => setLogOpen(false)}
                className="text-amber-800/60 hover:text-amber-500 text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <EventLog events={room.eventLog} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
