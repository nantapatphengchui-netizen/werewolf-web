'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { RoomState, Role } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { CopyButton } from '@/components/ui/CopyButton';
import { StatusDot } from '@/components/ui/StatusDot';
import { AudioControls } from '@/components/ui/AudioControls';
import { DarkPanel } from '@/components/ui/DarkPanel';
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
  onMarkSuspicion: (targetId: string) => void;
  onDayReaction: (targetId: string) => void;
}

// ── Phase banner config ────────────────────────────────────────────────────────
const PHASE_BANNER: Record<string, { bg: string; borderColor: string; textColor: string; instrColor: string }> = {
  night:  { bg: 'rgba(10,5,25,0.92)',  borderColor: 'rgba(109,40,217,0.50)',  textColor: '#a78bfa', instrColor: '#c4b5fd' },
  day:    { bg: 'rgba(25,14,2,0.92)',  borderColor: 'rgba(180,83,9,0.50)',    textColor: '#fbbf24', instrColor: '#fde68a' },
  voting: { bg: 'rgba(25,4,4,0.92)',   borderColor: 'rgba(185,28,28,0.50)',   textColor: '#f87171', instrColor: '#fca5a5' },
};

const PHASE_ICON_SVG: Record<string, React.ReactNode> = {
  night: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="currentColor">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
    </svg>
  ),
  day: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  voting: (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l9-3 9 3M12 3v18M5 6l-2 8h4l-2-8zM19 6l-2 8h4l-2-8z" />
      <path strokeLinecap="round" d="M5 21h14" />
    </svg>
  ),
};

const PHASE_HUD_COLOR: Record<string, string> = {
  night:  '#a78bfa',
  day:    '#fbbf24',
  voting: '#f87171',
  ended:  '#fbbf24',
};

const DISCUSSION_PROMPTS = [
  'Who seemed most suspicious last round?',
  'Who changed their story since dawn?',
  'Has anyone been unusually quiet today?',
  'Who do you trust least right now?',
  'Which player deflected instead of answering?',
  'Who was most eager to point fingers?',
  'Did anyone defend a suspicious player without reason?',
  'Who looked most relieved when the victim was named?',
];

function getInstructionText(phase: string, myRole: Role | null, imAlive: boolean, isSubmitted: boolean): string {
  if (phase === 'ended' || phase === 'lobby') return '';
  if (isSubmitted) {
    if (phase === 'night')  return 'Action submitted — awaiting other night actions…';
    if (phase === 'voting') return 'Vote cast — awaiting other players…';
  }
  if (!imAlive) {
    if (phase === 'night')  return 'You have perished. Watch the night from the shadows.';
    if (phase === 'voting') return 'You are eliminated. Watch the vote.';
    return 'You have perished.';
  }
  if (phase === 'night') {
    if (myRole === 'werewolf') return 'Click a player to eliminate tonight.';
    if (myRole === 'seer')     return 'Click a player to reveal their identity.';
    if (myRole === 'doctor')   return 'Click a player to protect tonight.';
    return 'Night falls. The village sleeps. Wait for dawn.';
  }
  if (phase === 'day')    return 'Discuss with the village. Find the wolves among you.';
  if (phase === 'voting') return 'Click a player to cast your vote for exile.';
  return '';
}

export function GameView({
  room, playerId, myRole, werewolfIds, isConnected,
  onLeave, onNightAction, onCastVote, onAdvanceDay,
  onRestart, onReturnToLobby,
  onHostPauseTimer, onHostResumeTimer, onHostExtendTimer, onHostEndPhase,
  onHostRestartGame, onHostReturnToLobby,
  onMarkSuspicion, onDayReaction,
}: Props) {
  const [actionSubmitted, setActionSubmitted]   = useState(false);
  const [selectedTarget, setSelectedTarget]     = useState<string | null>(null);
  const [logOpen, setLogOpen]                   = useState(false);
  const [hostCtrlOpen, setHostCtrlOpen]         = useState(false);
  const prevPhaseRef = useRef(room.phase);
  const isHost       = room.hostId === playerId;
  const seerLog      = useGameStore(s => s.seerLog);
  const dayReactions = useGameStore(s => s.dayReactions);

  const seerRevealedMap = useMemo((): Record<string, Role> => {
    if (myRole !== 'seer') return {};
    return Object.fromEntries(seerLog.map(e => [e.targetId, e.role]));
  }, [myRole, seerLog]);

  useEffect(() => {
    if (prevPhaseRef.current !== room.phase) {
      prevPhaseRef.current = room.phase;
      setActionSubmitted(false);
      setSelectedTarget(null);
      setHostCtrlOpen(false);
    }
  }, [room.phase]);

  const handleNightAction = (id: string) => { onNightAction(id); setActionSubmitted(true); };
  const handleCastVote    = (id: string) => { onCastVote(id);    setActionSubmitted(true); };

  const me             = room.players.find(p => p.id === playerId);
  const imAlive        = me?.isAlive ?? false;
  const aliveCount     = room.players.filter(p => p.isAlive).length;
  const deadCount      = room.players.length - aliveCount;
  const hasVotedAlready    = room.publicVotes?.hasVoted.includes(playerId) ?? false;
  const isActionSubmitted  = actionSubmitted || hasVotedAlready;
  const showTimer          = !!(room.phaseEndAt || room.timerPaused);

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

  const onPlayerCardClick = (targetId: string) => {
    if (!validTargetIds.includes(targetId)) return;
    setSelectedTarget(prev => prev === targetId ? null : targetId);
  };

  const instructionText    = getInstructionText(room.phase, myRole, imAlive, isActionSubmitted);
  const banner             = PHASE_BANNER[room.phase];
  const selectedPlayerName = selectedTarget ? room.players.find(p => p.id === selectedTarget)?.name : null;
  const phaseHudColor      = PHASE_HUD_COLOR[room.phase] ?? '#fbbf24';

  return (
    <div className="relative z-10 flex flex-col overflow-hidden" style={{ height: '100dvh' }}>

      {/* ── Game over modal ── */}
      {room.phase === 'ended' && (
        <GameOverScreen
          room={room}
          playerId={playerId}
          onLeave={onLeave}
          onRestart={onRestart}
          onReturnToLobby={onReturnToLobby}
        />
      )}

      {/* ── Top HUD — matches lobby RoomHeader exactly ───────────────────── */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <div
          style={{ backgroundColor: 'rgba(3,5,7,0.94)', border: '1px solid rgba(146,64,14,0.50)', borderRadius: '10px', boxShadow: '0 4px 28px rgba(0,0,0,0.7)' }}
          className="flex items-center gap-3 px-4 py-2.5"
        >
          {/* Room code */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[9px] font-cinzel uppercase tracking-widest hidden sm:inline" style={{ color: '#a16207' }}>Room</span>
            <span className="font-mono font-bold text-lg tracking-[0.35em]" style={{ color: '#fbbf24', textShadow: '0 0 12px rgba(251,191,36,0.45)' }}>
              {room.code}
            </span>
            <CopyButton text={room.code} />
          </div>

          <div className="hidden sm:block w-px h-4 shrink-0" style={{ backgroundColor: 'rgba(146,64,14,0.35)' }} />

          {/* Phase + round */}
          <div className="flex items-center gap-1.5 shrink-0" style={{ color: phaseHudColor }}>
            {PHASE_ICON_SVG[room.phase]}
            <span className="font-cinzel text-xs tracking-widest uppercase">
              {room.phase === 'ended' ? 'Game Over' : `${room.phase} · R${room.round}`}
            </span>
            {room.timerPaused && (
              <span className="text-[9px] font-cinzel" style={{ color: '#a16207', border: '1px solid rgba(146,64,14,0.45)', borderRadius: '4px', padding: '1px 5px' }}>⏸</span>
            )}
          </div>

          {/* Alive / Dead */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] shrink-0">
            <span className="font-semibold" style={{ color: '#4ade80' }}>{aliveCount}</span>
            <span className="text-[10px]" style={{ color: '#57534e' }}>alive</span>
            <span className="mx-0.5" style={{ color: '#44403c' }}>·</span>
            <span className="font-semibold" style={{ color: '#ef4444' }}>{deadCount}</span>
            <span className="text-[10px]" style={{ color: '#57534e' }}>dead</span>
          </div>

          <div className="flex-1" />

          {/* Connection + music + leave */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <StatusDot connected={isConnected} />
              <span className="text-[9px] font-cinzel uppercase tracking-wider hidden sm:inline" style={{ color: isConnected ? '#4ade80' : '#ef4444' }}>
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="h-4 w-px hidden sm:block" style={{ backgroundColor: 'rgba(146,64,14,0.30)' }} />
            <AudioControls />
            <div className="h-4 w-px hidden sm:block" style={{ backgroundColor: 'rgba(146,64,14,0.30)' }} />
            <button
              onClick={onLeave}
              className="px-3 py-1.5 text-[10px] font-cinzel uppercase tracking-widest rounded-lg text-amber-400 hover:text-red-400 transition-colors"
              style={{ border: '1px solid rgba(146,64,14,0.50)' }}
            >
              Leave
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 px-3 pb-3 flex flex-col lg:flex-row gap-3 overflow-y-auto lg:overflow-hidden">

        {/* ── Player grid area ── */}
        <div className="flex flex-col gap-2 lg:flex-1 lg:min-h-0">

          {/* Last announcement */}
          {room.lastAnnouncement && (
            <div className="shrink-0 px-3 py-1.5 rounded-lg text-center" style={{ backgroundColor: 'rgba(25,14,2,0.80)', border: '1px solid rgba(180,83,9,0.30)' }}>
              <p className="text-[11px] italic leading-snug" style={{ color: '#fde68a' }}>{room.lastAnnouncement}</p>
            </div>
          )}

          {/* Phase banner — instruction strip replacement */}
          {instructionText && banner && (
            <div
              className="shrink-0 flex items-center gap-3 px-3 py-2 rounded-lg"
              style={{ backgroundColor: banner.bg, borderLeft: `3px solid ${banner.borderColor}`, paddingLeft: '12px' }}
            >
              <div style={{ color: banner.textColor }} className="flex items-center gap-1.5 shrink-0">
                {PHASE_ICON_SVG[room.phase]}
                <span className="font-cinzel text-[10px] uppercase tracking-widest font-semibold">
                  {room.phase} · R{room.round}
                </span>
              </div>
              <div className="w-px h-3 shrink-0" style={{ backgroundColor: banner.borderColor }} />
              <p className="text-[11px] flex-1 leading-snug" style={{ color: banner.instrColor }}>
                {instructionText}
              </p>
              {selectedPlayerName && (
                <span className="shrink-0 text-[11px] font-cinzel uppercase tracking-wider" style={{ color: banner.textColor }}>
                  → {selectedPlayerName}
                </span>
              )}
            </div>
          )}

          {/* Discussion prompt — day only */}
          {room.phase === 'day' && (
            <div className="shrink-0 flex items-start gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(20,12,2,0.75)', border: '1px solid rgba(120,65,10,0.28)' }}>
              <svg viewBox="0 0 16 16" className="w-3 h-3 shrink-0 mt-0.5" fill="#92400e">
                <path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2v3l3-3h7a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
              </svg>
              <p className="text-[10px] italic leading-snug flex-1" style={{ color: '#ca8a04' }}>
                {DISCUSSION_PROMPTS[(room.round - 1) % DISCUSSION_PROMPTS.length]}
              </p>
            </div>
          )}

          {/* Day reactions */}
          {dayReactions.length > 0 && room.phase === 'day' && (
            <div className="shrink-0 flex flex-col gap-0.5">
              {dayReactions.map(r => (
                <div key={r.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md" style={{ backgroundColor: 'rgba(46,16,101,0.30)', border: '1px solid rgba(109,40,217,0.28)' }}>
                  <svg viewBox="0 0 16 16" className="w-2.5 h-2.5 shrink-0" fill="#7c3aed">
                    <path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2v3l3-3h7a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
                  </svg>
                  <p className="text-[10px] truncate" style={{ color: '#a78bfa' }}>
                    <span style={{ color: '#c4b5fd' }}>{r.fromName}</span>
                    {' '}asks{' '}
                    <span style={{ color: '#c4b5fd' }}>{r.targetName}</span>
                    {' '}to speak
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Ask-to-speak chips — day, alive players only */}
          {room.phase === 'day' && imAlive && (
            <div className="shrink-0 flex flex-wrap gap-1">
              {room.players.filter(p => p.isAlive && p.id !== playerId).map(p => (
                <button
                  key={p.id}
                  onClick={() => onDayReaction(p.id)}
                  style={{ backgroundColor: 'rgba(46,16,101,0.25)', border: '1px solid rgba(109,40,217,0.35)', color: '#8b5cf6' }}
                  className="px-2 py-0.5 rounded text-[9px] font-cinzel uppercase tracking-wide transition-all duration-150 hover:brightness-125"
                >
                  Ask {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Player grid */}
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
              suspicionMap={room.phase === 'day' || room.phase === 'voting' ? room.suspicionMap : {}}
              canMarkSuspicion={room.phase === 'day' && imAlive}
              onMarkSuspicion={onMarkSuspicion}
            />
          </div>
        </div>

        {/* ── Right sidebar — Action Console ── */}
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

          {/* Action */}
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

          {/* Host Controls — collapsible */}
          {isHost && (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setHostCtrlOpen(p => !p)}
                style={{ backgroundColor: 'rgba(12,8,3,0.85)', border: '1px solid rgba(120,65,10,0.42)', borderRadius: '8px' }}
                className="flex items-center justify-between px-3 py-2 transition-all duration-150 hover:brightness-125"
              >
                <span className="text-[10px] font-cinzel uppercase tracking-widest" style={{ color: '#d97706' }}>Host Controls</span>
                <svg viewBox="0 0 16 16" className={`w-3 h-3 transition-transform duration-200 ${hostCtrlOpen ? 'rotate-180' : ''}`} fill="none" stroke="#d97706" strokeWidth="2">
                  <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {hostCtrlOpen && (
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
          )}

          {/* Event Log toggle */}
          <button
            onClick={() => setLogOpen(true)}
            style={{ backgroundColor: 'rgba(8,5,2,0.80)', border: '1px solid rgba(120,65,10,0.40)', borderRadius: '8px' }}
            className="flex items-center justify-between px-3 py-2 transition-all duration-150 hover:brightness-125"
          >
            <span className="text-[10px] font-cinzel uppercase tracking-widest" style={{ color: '#d97706' }}>Event Log</span>
            <span className="text-[10px] font-cinzel" style={{ color: '#a16207' }}>{room.eventLog.length}</span>
          </button>

        </div>
      </div>

      {/* ── Event log drawer ── */}
      {logOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setLogOpen(false)}>
          <div className="flex-1 bg-black/50 backdrop-blur-[1px]" />
          <div
            className="relative w-72 flex flex-col shadow-2xl"
            style={{ backgroundColor: 'rgba(3,5,7,0.98)', borderLeft: '1px solid rgba(120,65,10,0.35)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(120,65,10,0.28)' }}>
              <p className="font-cinzel text-[10px] uppercase tracking-widest" style={{ color: '#d97706' }}>Event Log</p>
              <button
                onClick={() => setLogOpen(false)}
                className="text-xl leading-none w-6 h-6 flex items-center justify-center transition-colors"
                style={{ color: '#92400e' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fbbf24')}
                onMouseLeave={e => (e.currentTarget.style.color = '#92400e')}
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <EventLog events={room.eventLog} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
