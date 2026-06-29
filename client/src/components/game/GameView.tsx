'use client';

import { useState, useEffect, useRef } from 'react';
import type { RoomState, Role } from '@/types/game';
import { DarkPanel } from '@/components/ui/DarkPanel';
import { CopyButton } from '@/components/ui/CopyButton';
import { StatusDot } from '@/components/ui/StatusDot';
import { PhaseBanner } from './PhaseBanner';
import { RolePanel } from './RolePanel';
import { ActionPanel } from './ActionPanel';
import { GamePlayerGrid } from './GamePlayerGrid';
import { GameStatusPanel } from './GameStatusPanel';
import { EventLog } from './EventLog';
import { GameOverScreen } from './GameOverScreen';
import { HostGameControls } from './HostGameControls';

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
  const prevPhaseRef = useRef(room.phase);
  const isHost = room.hostId === playerId;

  useEffect(() => {
    if (prevPhaseRef.current !== room.phase) {
      prevPhaseRef.current = room.phase;
      setActionSubmitted(false);
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

  return (
    <div className="relative z-10 flex flex-col min-h-screen p-3 gap-3">

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
      <DarkPanel className="flex items-center justify-between px-4 py-2.5 gap-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-amber-700 text-[10px] uppercase tracking-widest hidden sm:inline shrink-0">
            Room
          </span>
          <span className="font-mono font-bold text-lg text-amber-300 tracking-[0.3em]">
            {room.code}
          </span>
          <CopyButton text={room.code} />
        </div>

        <div className="flex items-center gap-2">
          {room.phase === 'night' && (
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-violet-400" fill="currentColor">
              <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
            </svg>
          )}
          {room.phase === 'day' && (
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          )}
          {room.phase === 'voting' && (
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l9-3 9 3M12 3v18M5 6l-2 8h4l-2-8zM19 6l-2 8h4l-2-8z" />
              <path strokeLinecap="round" d="M5 21h14" />
            </svg>
          )}
          <span className={`font-cinzel text-sm tracking-widest uppercase ${
            room.phase === 'night' ? 'text-violet-300' :
            room.phase === 'voting' ? 'text-red-300' :
            'text-amber-300'
          }`}>
            {room.phase === 'ended' ? 'Ended' : `${room.phase} · Round ${room.round}`}
          </span>
          {room.timerPaused && (
            <span className="text-[10px] text-amber-700 font-cinzel uppercase tracking-widest border border-amber-800/40 rounded px-1.5 py-0.5">
              Paused
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <StatusDot connected={isConnected} />
          <button
            onClick={onLeave}
            className="px-3 py-1.5 border border-amber-900/40 hover:border-red-800/60 text-amber-700 hover:text-red-400 text-xs uppercase tracking-widest rounded transition-colors"
          >
            Leave
          </button>
        </div>
      </DarkPanel>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">

        {/* Centre: phase banner + player arc */}
        <div className="flex-1 flex gap-3 min-w-0 min-h-0">
          <DarkPanel className="flex-1 flex flex-col gap-3 p-4 min-w-0 overflow-hidden">

            {/* Phase banner + timer */}
            <div className="flex-shrink-0">
              <PhaseBanner
                phase={room.phase}
                round={room.round}
                phaseEndAt={room.phaseEndAt}
                timerPaused={room.timerPaused}
                pausedTimeRemaining={room.pausedTimeRemaining}
              />
            </div>

            {/* Announcement banner */}
            {room.lastAnnouncement && (
              <div className="flex-shrink-0 bg-amber-950/20 border border-amber-800/30 rounded-lg px-4 py-3 text-center">
                <p className="text-amber-300/85 text-sm italic leading-relaxed">
                  {room.lastAnnouncement}
                </p>
              </div>
            )}

            {/* Player arc */}
            <div className="flex-1 min-h-0">
              <GamePlayerGrid
                players={room.players}
                currentPlayerId={playerId}
                werewolfIds={werewolfIds}
                publicVotes={room.publicVotes}
                currentPlayerSubmitted={actionSubmitted}
              />
            </div>
          </DarkPanel>
        </div>

        {/* Right panel */}
        <div className="w-full lg:w-60 xl:w-64 flex flex-row lg:flex-col gap-3 shrink-0 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto">
          <div className="flex flex-col gap-3 min-w-[15rem] lg:min-w-0 lg:w-full">
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
    </div>
  );
}
