'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { RoomState, Role } from '@/types/game';
import { ROLE_INFO } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { CopyButton } from '@/components/ui/CopyButton';
import { StatusDot } from '@/components/ui/StatusDot';
import { AudioControls } from '@/components/ui/AudioControls';
import { RolePanel } from './RolePanel';
import { GamePlayerGrid } from './GamePlayerGrid';
import { EventLog } from './EventLog';
import { GameOverScreen } from './GameOverScreen';
import { HostGameControls } from './HostGameControls';
import { PhaseTimer } from './PhaseTimer';

// ── Props ─────────────────────────────────────────────────────────────────────

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

// ── Constants ─────────────────────────────────────────────────────────────────

const PHASE_BANNER_CFG: Record<string, { bg: string; borderColor: string; textColor: string; instrColor: string }> = {
  night:  { bg: 'rgba(10,5,25,0.92)',  borderColor: 'rgba(109,40,217,0.50)', textColor: '#a78bfa', instrColor: '#c4b5fd' },
  day:    { bg: 'rgba(25,14,2,0.92)',  borderColor: 'rgba(180,83,9,0.50)',   textColor: '#fbbf24', instrColor: '#fde68a' },
  voting: { bg: 'rgba(25,4,4,0.92)',   borderColor: 'rgba(185,28,28,0.50)',  textColor: '#f87171', instrColor: '#fca5a5' },
};

const PHASE_ICON: Record<string, React.ReactNode> = {
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
  night: '#a78bfa', day: '#fbbf24', voting: '#f87171', ended: '#fbbf24',
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

interface NightCfg {
  confirmLabel: string;
  btnBg: string; btnBorder: string; btnText: string;
  selBg: string; selBorder: string; selText: string;
}

const NIGHT_CFG: Record<string, NightCfg> = {
  werewolf: {
    confirmLabel: 'Confirm Kill',
    btnBg: 'rgba(127,29,29,0.90)', btnBorder: 'rgba(239,68,68,0.65)',  btnText: '#fca5a5',
    selBg: 'rgba(69,10,10,0.55)',  selBorder: 'rgba(185,28,28,0.55)', selText: '#fca5a5',
  },
  seer: {
    confirmLabel: 'Inspect',
    btnBg: 'rgba(76,29,149,0.90)', btnBorder: 'rgba(139,92,246,0.65)', btnText: '#ddd6fe',
    selBg: 'rgba(46,16,101,0.55)', selBorder: 'rgba(109,40,217,0.55)', selText: '#c4b5fd',
  },
  doctor: {
    confirmLabel: 'Confirm Protect',
    btnBg: 'rgba(6,78,59,0.90)',   btnBorder: 'rgba(52,211,153,0.65)', btnText: '#a7f3d0',
    selBg: 'rgba(6,53,37,0.55)',   selBorder: 'rgba(5,150,105,0.55)', selText: '#6ee7b7',
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    if (myRole === 'werewolf') return 'Click a player card to eliminate tonight.';
    if (myRole === 'seer')     return 'Click a player card to reveal their identity.';
    if (myRole === 'doctor')   return 'Click a player card to protect tonight.';
    return 'Night falls. The village sleeps.';
  }
  if (phase === 'day')    return 'Discuss and find the wolves among you.';
  if (phase === 'voting') return 'Click a player card to cast your vote for exile.';
  return '';
}

// ── Shared drawer overlay ─────────────────────────────────────────────────────

function Drawer({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/50 backdrop-blur-[1px]" />
      <div
        className="relative w-72 flex flex-col shadow-2xl"
        style={{ backgroundColor: 'rgba(3,5,7,0.98)', borderLeft: '1px solid rgba(120,65,10,0.35)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(120,65,10,0.28)' }}>
          <p className="font-cinzel text-[10px] uppercase tracking-widest" style={{ color: '#d97706' }}>{title}</p>
          <button
            onClick={onClose}
            className="text-xl leading-none w-6 h-6 flex items-center justify-center"
            style={{ color: '#92400e' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fbbf24')}
            onMouseLeave={e => (e.currentTarget.style.color = '#92400e')}
          >×</button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ── CheckIcon ─────────────────────────────────────────────────────────────────

function CheckIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="none">
      <path d="M3 8l4 4 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── ActionBar ─────────────────────────────────────────────────────────────────

const BAR_BASE: React.CSSProperties = {
  backgroundColor: 'rgba(3,5,7,0.94)',
  border: '1px solid rgba(146,64,14,0.50)',
  borderRadius: '10px',
  padding: '8px 12px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  minHeight: '50px',
};

interface ActionBarProps {
  phase: string;
  myRole: Role | null;
  imAlive: boolean;
  isHost: boolean;
  isActionSubmitted: boolean;
  selectedTarget: string | null;
  selectedPlayerName: string | null;
  nc: NightCfg | null;
  votedCount: number;
  totalAlive: number;
  alivePeers: { id: string; name: string }[];
  onConfirmNight: () => void;
  onConfirmVote: () => void;
  onAdvanceDay: () => void;
  onDayReaction: (targetId: string) => void;
}

function ActionBar({
  phase, imAlive, isHost, isActionSubmitted,
  selectedTarget, selectedPlayerName, nc,
  votedCount, totalAlive, alivePeers,
  onConfirmNight, onConfirmVote, onAdvanceDay, onDayReaction,
}: ActionBarProps) {

  // ── Night ──
  if (phase === 'night') {
    if (isActionSubmitted) {
      return (
        <div style={BAR_BASE}>
          <CheckIcon color="#4ade80" />
          <p className="text-[11px] font-cinzel" style={{ color: '#4ade80' }}>
            Action submitted — awaiting all night actions…
          </p>
        </div>
      );
    }
    if (!imAlive) {
      return (
        <div style={BAR_BASE}>
          <p className="text-[11px] font-cinzel italic" style={{ color: '#57534e' }}>
            You have perished. Watch the night from the shadows.
          </p>
        </div>
      );
    }
    if (!nc) {
      return (
        <div style={BAR_BASE}>
          <p className="text-[11px] font-cinzel italic" style={{ color: '#57534e' }}>
            Night falls. You close your eyes and wait for dawn.
          </p>
        </div>
      );
    }
    return (
      <div style={BAR_BASE}>
        <div
          className="flex-1 flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all duration-200"
          style={selectedTarget
            ? { backgroundColor: nc.selBg, border: `1px solid ${nc.selBorder}` }
            : { border: '1px solid transparent' }
          }
        >
          {selectedTarget ? (
            <>
              <CheckIcon color={nc.selText} />
              <span className="text-[12px] font-cinzel uppercase tracking-wide" style={{ color: nc.selText }}>
                {selectedPlayerName}
              </span>
            </>
          ) : (
            <span className="text-[11px] font-cinzel italic" style={{ color: '#57534e' }}>
              Select a player card above…
            </span>
          )}
        </div>
        <button
          onClick={onConfirmNight}
          disabled={!selectedTarget}
          style={selectedTarget
            ? { backgroundColor: nc.btnBg, border: `1px solid ${nc.btnBorder}`, color: nc.btnText }
            : { backgroundColor: 'rgba(12,10,8,0.70)', border: '1px solid rgba(68,64,60,0.35)', color: '#57534e' }
          }
          className="shrink-0 px-4 py-2 text-[11px] font-cinzel uppercase tracking-widest rounded-lg transition-all duration-150 disabled:cursor-not-allowed hover:enabled:brightness-110 active:enabled:scale-[0.98]"
        >
          {nc.confirmLabel}
        </button>
      </div>
    );
  }

  // ── Day ──
  if (phase === 'day') {
    return (
      <div style={BAR_BASE}>
        {imAlive && alivePeers.length > 0 && (
          <div className="flex-1 flex gap-1.5 overflow-x-auto min-w-0" style={{ scrollbarWidth: 'none' }}>
            {alivePeers.map(p => (
              <button
                key={p.id}
                onClick={() => onDayReaction(p.id)}
                style={{
                  backgroundColor: 'rgba(46,16,101,0.25)',
                  border: '1px solid rgba(109,40,217,0.35)',
                  color: '#8b5cf6',
                  whiteSpace: 'nowrap',
                }}
                className="px-2.5 py-1 rounded-lg text-[9px] font-cinzel uppercase tracking-wide shrink-0 transition-all duration-150 hover:brightness-125"
              >
                Ask {p.name}
              </button>
            ))}
          </div>
        )}
        {!imAlive && (
          <p className="flex-1 text-[11px] font-cinzel italic" style={{ color: '#57534e' }}>You have perished.</p>
        )}
        {isHost ? (
          <button
            onClick={onAdvanceDay}
            style={{ backgroundColor: 'rgba(120,53,0,0.85)', border: '1px solid rgba(217,119,6,0.60)', color: '#fde68a' }}
            className="shrink-0 px-4 py-2 text-[11px] font-cinzel tracking-widest uppercase rounded-lg transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
          >
            Call to Vote →
          </button>
        ) : (
          <p className="shrink-0 text-[10px] font-cinzel italic" style={{ color: '#a16207' }}>Waiting for host…</p>
        )}
      </div>
    );
  }

  // ── Voting ──
  if (phase === 'voting') {
    if (!imAlive) {
      return (
        <div style={BAR_BASE}>
          <p className="text-[11px] font-cinzel italic" style={{ color: '#57534e' }}>
            You are eliminated. Watch the vote unfold.
          </p>
        </div>
      );
    }
    if (isActionSubmitted) {
      return (
        <div style={BAR_BASE}>
          <CheckIcon color="#4ade80" />
          <p className="text-[11px] font-cinzel" style={{ color: '#4ade80' }}>
            Vote cast · {votedCount} / {totalAlive} voted
          </p>
        </div>
      );
    }
    return (
      <div style={BAR_BASE}>
        <div
          className="flex-1 flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all duration-200"
          style={selectedTarget
            ? { backgroundColor: 'rgba(69,35,5,0.55)', border: '1px solid rgba(180,83,9,0.55)' }
            : { border: '1px solid transparent' }
          }
        >
          {selectedTarget ? (
            <>
              <CheckIcon color="#fde68a" />
              <span className="text-[12px] font-cinzel uppercase tracking-wide" style={{ color: '#fde68a' }}>
                {selectedPlayerName}
              </span>
            </>
          ) : (
            <span className="text-[11px] font-cinzel italic" style={{ color: '#57534e' }}>
              Select a player to exile…
            </span>
          )}
        </div>
        <button
          onClick={onConfirmVote}
          disabled={!selectedTarget}
          style={selectedTarget
            ? { backgroundColor: 'rgba(120,53,0,0.90)', border: '1px solid rgba(217,119,6,0.65)', color: '#fde68a' }
            : { backgroundColor: 'rgba(12,10,8,0.70)', border: '1px solid rgba(68,64,60,0.35)', color: '#57534e' }
          }
          className="shrink-0 px-4 py-2 text-[11px] font-cinzel uppercase tracking-widest rounded-lg transition-all duration-150 disabled:cursor-not-allowed hover:enabled:brightness-110 active:enabled:scale-[0.98]"
        >
          Cast Vote
        </button>
      </div>
    );
  }

  return null;
}

// ── GameView ──────────────────────────────────────────────────────────────────

export function GameView({
  room, playerId, myRole, werewolfIds, isConnected,
  onLeave, onNightAction, onCastVote, onAdvanceDay,
  onRestart, onReturnToLobby,
  onHostPauseTimer, onHostResumeTimer, onHostExtendTimer, onHostEndPhase,
  onHostRestartGame, onHostReturnToLobby,
  onMarkSuspicion, onDayReaction,
}: Props) {
  const [actionSubmitted, setActionSubmitted] = useState(false);
  const [selectedTarget, setSelectedTarget]   = useState<string | null>(null);
  const [logOpen, setLogOpen]   = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [hostOpen, setHostOpen] = useState(false);
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
      setHostOpen(false);
    }
  }, [room.phase]);

  const handleNightAction = (id: string) => { onNightAction(id); setActionSubmitted(true); };
  const handleCastVote    = (id: string) => { onCastVote(id);    setActionSubmitted(true); };

  const me         = room.players.find(p => p.id === playerId);
  const imAlive    = me?.isAlive ?? false;
  const aliveCount = room.players.filter(p => p.isAlive).length;
  const deadCount  = room.players.length - aliveCount;
  const hasVotedAlready   = room.publicVotes?.hasVoted.includes(playerId) ?? false;
  const isActionSubmitted = actionSubmitted || hasVotedAlready;
  const showTimer         = !!(room.phaseEndAt || room.timerPaused);

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
  const banner             = PHASE_BANNER_CFG[room.phase];
  const selectedPlayerName = selectedTarget ? (room.players.find(p => p.id === selectedTarget)?.name ?? null) : null;
  const phaseHudColor      = PHASE_HUD_COLOR[room.phase] ?? '#fbbf24';
  const roleInfo           = myRole ? ROLE_INFO[myRole] : null;
  const nc                 = myRole ? (NIGHT_CFG[myRole] ?? null) : null;
  const alivePeers         = useMemo(
    () => room.players.filter(p => p.isAlive && p.id !== playerId),
    [room.players, playerId],
  );
  const votedCount = room.publicVotes?.hasVoted.length ?? 0;

  return (
    <div className="relative z-10 flex flex-col overflow-hidden" style={{ height: '100dvh' }}>

      {/* ── Game over overlay ── */}
      {room.phase === 'ended' && (
        <GameOverScreen room={room} playerId={playerId} onLeave={onLeave} onRestart={onRestart} onReturnToLobby={onReturnToLobby} />
      )}

      {/* ── Top HUD ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <div
          style={{ backgroundColor: 'rgba(3,5,7,0.94)', border: '1px solid rgba(146,64,14,0.50)', borderRadius: '10px', boxShadow: '0 4px 28px rgba(0,0,0,0.7)' }}
          className="flex items-center gap-2 px-3 py-2"
        >
          {/* Room code */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] font-cinzel uppercase tracking-widest hidden sm:inline" style={{ color: '#a16207' }}>Room</span>
            <span className="font-mono font-bold text-base tracking-[0.35em]" style={{ color: '#fbbf24', textShadow: '0 0 12px rgba(251,191,36,0.45)' }}>
              {room.code}
            </span>
            <CopyButton text={room.code} />
          </div>

          <div className="w-px h-4 shrink-0" style={{ backgroundColor: 'rgba(146,64,14,0.35)' }} />

          {/* Phase + round */}
          <div className="flex items-center gap-1.5 shrink-0" style={{ color: phaseHudColor }}>
            {PHASE_ICON[room.phase]}
            <span className="font-cinzel text-xs tracking-widest uppercase">
              {room.phase === 'ended' ? 'Game Over' : `${room.phase} · R${room.round}`}
            </span>
          </div>

          {/* Compact timer */}
          {showTimer && (
            <div className="shrink-0">
              <PhaseTimer
                phase={room.phase}
                phaseEndAt={room.phaseEndAt}
                paused={room.timerPaused}
                pausedTimeRemaining={room.pausedTimeRemaining}
                compact
              />
            </div>
          )}

          <div className="flex-1" />

          {/* Role badge — opens role drawer */}
          {roleInfo && (
            <button
              onClick={() => setRoleOpen(true)}
              style={{
                backgroundColor: `${roleInfo.accentColor}18`,
                border: `1px solid ${roleInfo.accentColor}55`,
                borderRadius: '7px',
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 shrink-0 transition-all duration-150 hover:brightness-125"
            >
              <span className="text-[9px] font-cinzel uppercase tracking-widest hidden sm:inline" style={{ color: '#a16207' }}>Role</span>
              <span className="text-[10px] font-cinzel font-bold uppercase tracking-wider" style={{ color: roleInfo.accentColor }}>
                {roleInfo.name}
              </span>
            </button>
          )}

          <div className="w-px h-4 shrink-0" style={{ backgroundColor: 'rgba(146,64,14,0.30)' }} />

          {/* Alive / Dead counts */}
          <div className="flex items-center gap-1 text-[11px] shrink-0">
            <span className="font-semibold tabular-nums" style={{ color: '#4ade80' }}>{aliveCount}</span>
            <span style={{ color: '#57534e' }}>↑</span>
            <span className="font-semibold tabular-nums" style={{ color: '#ef4444' }}>{deadCount}</span>
            <span style={{ color: '#57534e' }}>↓</span>
          </div>

          <div className="w-px h-4 shrink-0" style={{ backgroundColor: 'rgba(146,64,14,0.30)' }} />

          {/* Connection + Audio */}
          <div className="flex items-center gap-2 shrink-0">
            <StatusDot connected={isConnected} />
            <AudioControls />
          </div>

          {/* Host controls icon — host only */}
          {isHost && (
            <button
              onClick={() => setHostOpen(true)}
              title="Host Controls"
              style={{ border: '1px solid rgba(120,65,10,0.40)', borderRadius: '7px' }}
              className="p-1.5 shrink-0 transition-all duration-150 hover:brightness-125"
            >
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="#d97706" strokeWidth="1.5">
                <circle cx="8" cy="8" r="2.5" />
                <path strokeLinecap="round" d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M11.5 3.1l-1.4 1.4M3.1 11.5l1.4-1.4" />
              </svg>
            </button>
          )}

          {/* Event log icon */}
          <button
            onClick={() => setLogOpen(true)}
            title="Event Log"
            className="p-1.5 shrink-0 transition-all duration-150 hover:brightness-125"
            style={{ border: '1px solid rgba(120,65,10,0.40)', borderRadius: '7px', position: 'relative' }}
          >
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="#d97706" strokeWidth="1.5">
              <path strokeLinecap="round" d="M2 4h12M2 8h8M2 12h10" />
            </svg>
            {room.eventLog.length > 0 && (
              <span
                className="absolute -top-1 -right-1 w-3.5 h-3.5 flex items-center justify-center rounded-full text-[8px] font-bold"
                style={{ backgroundColor: '#92400e', color: '#fbbf24' }}
              >
                {room.eventLog.length > 9 ? '9+' : room.eventLog.length}
              </span>
            )}
          </button>

          {/* Leave */}
          <button
            onClick={onLeave}
            className="px-2.5 py-1.5 text-[10px] font-cinzel uppercase tracking-widest rounded-lg shrink-0 hidden sm:block transition-colors"
            style={{ border: '1px solid rgba(146,64,14,0.50)', color: '#d97706' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#d97706')}
          >
            Leave
          </button>
        </div>
      </div>

      {/* ── Banner area ───────────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 space-y-1.5 pb-1">

        {/* Last announcement */}
        {room.lastAnnouncement && (
          <div className="px-3 py-1.5 rounded-lg text-center" style={{ backgroundColor: 'rgba(25,14,2,0.80)', border: '1px solid rgba(180,83,9,0.30)' }}>
            <p className="text-[11px] italic leading-snug" style={{ color: '#fde68a' }}>{room.lastAnnouncement}</p>
          </div>
        )}

        {/* Phase banner */}
        {instructionText && banner && (
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-lg"
            style={{ backgroundColor: banner.bg, borderLeft: `3px solid ${banner.borderColor}`, paddingLeft: '12px' }}
          >
            <div style={{ color: banner.textColor }} className="flex items-center gap-1.5 shrink-0">
              {PHASE_ICON[room.phase]}
              <span className="font-cinzel text-[10px] uppercase tracking-widest font-semibold hidden sm:inline">
                {room.phase} · R{room.round}
              </span>
            </div>
            <div className="w-px h-3 shrink-0 hidden sm:block" style={{ backgroundColor: banner.borderColor }} />
            <p className="text-[11px] flex-1 leading-snug" style={{ color: banner.instrColor }}>{instructionText}</p>
            {selectedPlayerName && (
              <span className="shrink-0 text-[11px] font-cinzel uppercase tracking-wider" style={{ color: banner.textColor }}>
                → {selectedPlayerName}
              </span>
            )}
          </div>
        )}

        {/* Discussion prompt — day only */}
        {room.phase === 'day' && (
          <div className="flex items-start gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(20,12,2,0.75)', border: '1px solid rgba(120,65,10,0.28)' }}>
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
          <div className="flex flex-col gap-0.5">
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
      </div>

      {/* ── Player grid — full width ──────────────────────────────────────── */}
      <div className="flex-1 min-h-0 px-3 overflow-y-auto">
        <GamePlayerGrid
          players={room.players}
          currentPlayerId={playerId}
          werewolfIds={werewolfIds}
          publicVotes={room.publicVotes}
          currentPlayerSubmitted={isActionSubmitted}
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

      {/* ── Action bar ────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-3 pb-3 pt-2">
        <ActionBar
          phase={room.phase}
          myRole={myRole}
          imAlive={imAlive}
          isHost={isHost}
          isActionSubmitted={isActionSubmitted}
          selectedTarget={selectedTarget}
          selectedPlayerName={selectedPlayerName}
          nc={nc}
          votedCount={votedCount}
          totalAlive={aliveCount}
          alivePeers={alivePeers}
          onConfirmNight={() => { if (selectedTarget) handleNightAction(selectedTarget); }}
          onConfirmVote={() => { if (selectedTarget) handleCastVote(selectedTarget); }}
          onAdvanceDay={onAdvanceDay}
          onDayReaction={onDayReaction}
        />
      </div>

      {/* ── Drawers ──────────────────────────────────────────────────────── */}

      {/* Event Log */}
      <Drawer open={logOpen} onClose={() => setLogOpen(false)} title="Event Log">
        <EventLog events={room.eventLog} />
      </Drawer>

      {/* Role Details */}
      <Drawer open={roleOpen} onClose={() => setRoleOpen(false)} title="Your Role">
        <div className="p-3 flex flex-col gap-3">
          <RolePanel myRole={myRole} werewolfIds={werewolfIds} players={room.players} playerId={playerId} />

          {/* Seer inspection log */}
          {myRole === 'seer' && seerLog.length > 0 && (
            <div className="space-y-1.5 pt-1" style={{ borderTop: '1px solid rgba(109,40,217,0.25)' }}>
              <p className="text-[9px] uppercase tracking-widest font-cinzel" style={{ color: '#7c3aed' }}>Inspection Log</p>
              {[...seerLog].reverse().map((entry, i) => {
                const info = ROLE_INFO[entry.role];
                return (
                  <div key={i} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs" style={{ backgroundColor: 'rgba(46,16,101,0.25)', border: '1px solid rgba(109,40,217,0.22)' }}>
                    <span className="font-cinzel shrink-0 text-[9px]" style={{ color: '#7c3aed' }}>R{entry.round}</span>
                    <span className="flex-1 truncate" style={{ color: '#fde68a' }}>{entry.targetName}</span>
                    <span className="font-cinzel font-bold text-[10px] shrink-0 tracking-wider" style={{ color: info.accentColor }}>
                      {info.name.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Drawer>

      {/* Host Controls */}
      <Drawer open={hostOpen} onClose={() => setHostOpen(false)} title="Host Controls">
        <div className="p-3">
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
      </Drawer>
    </div>
  );
}
