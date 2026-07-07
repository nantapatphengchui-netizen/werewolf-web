'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { RoomState, Role } from '@/types/game';
import { ROLE_INFO } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { useSocket } from '@/providers/SocketProvider';
import { CopyButton } from '@/components/ui/CopyButton';
import { StatusDot } from '@/components/ui/StatusDot';
import { AudioControls } from '@/components/ui/AudioControls';
import { LangToggle } from '@/components/ui/LangToggle';
import { useT, useMessage } from '@/i18n';
import { useSoundEffect } from '@/hooks/useSoundEffect';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { RolePanel } from './RolePanel';
import { RoleRevealOverlay } from './RoleRevealOverlay';
import { GamePlayerGrid } from './GamePlayerGrid';
import { GameOverScreen } from './GameOverScreen';
import { HostGameControls } from './HostGameControls';
import { PhaseTimer } from './PhaseTimer';
import { PhasePerimeter } from './PhasePerimeter';
import { HowToPlay } from './HowToPlay';
import { SeerRevealModal } from './SeerRevealModal';
import { ActionToast, type ToastState, type ToastTone } from './ActionToast';
import { ChatFeed } from './ChatFeed';
import { SceneAtmosphere } from './SceneAtmosphere';

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
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PHASE_BANNER_CFG: Record<string, { bg: string; borderColor: string; textColor: string; instrColor: string }> = {
  night:  { bg: 'rgba(10,5,25,0.92)',  borderColor: 'rgba(109,40,217,0.50)', textColor: '#a78bfa', instrColor: '#c4b5fd' },
  day:    { bg: 'rgba(25,14,2,0.92)',  borderColor: 'rgba(180,83,9,0.50)',   textColor: '#fbbf24', instrColor: '#fde68a' },
  voting: { bg: 'rgba(25,4,4,0.92)',   borderColor: 'rgba(185,28,28,0.50)',  textColor: '#f87171', instrColor: '#fca5a5' },
};

/** Round number as a Roman numeral (Cinzel renders these beautifully). */
function toRoman(n: number): string {
  if (n <= 0 || n > 3999) return String(n);
  const M: [number, string][] = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let out = '';
  for (const [v, s] of M) while (n >= v) { out += s; n -= v; }
  return out;
}

const PHASE_ICON: Record<string, React.ReactNode> = {
  // Crescent moon with a few stars
  night: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor">
      <path d="M20.2 14.6A8 8 0 1 1 10 4.1a6.3 6.3 0 0 0 10.2 10.5z" />
      <circle cx="16.8" cy="5.4" r="0.95" opacity="0.85" />
      <circle cx="20.4" cy="8.6" r="0.6" opacity="0.7" />
      <circle cx="14.2" cy="3.4" r="0.55" opacity="0.6" />
    </svg>
  ),
  // Sun — filled disc with rays
  day: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
      <path d="M12 2.4v2.3M12 19.3v2.3M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.4 12h2.3M19.3 12h2.3M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </svg>
  ),
  // Scales of judgment
  voting: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.2v17.6M7 20.8h10M4.2 7.2l7.8-2 7.8 2" />
      <path d="M4.2 7.2 1.9 12.4a2.4 2.4 0 0 0 4.6 0L4.2 7.2zM19.8 7.2l-2.3 5.2a2.4 2.4 0 0 0 4.6 0L19.8 7.2z" />
    </svg>
  ),
};

const PHASE_HUD_COLOR: Record<string, string> = {
  night: '#a78bfa', day: '#fbbf24', voting: '#f87171', ended: '#fbbf24',
};

const PHASE_ATMOSPHERE: Record<string, string> = {
  night:  'rgba(8,0,30,0.48)',
  day:    'rgba(30,15,0,0.30)',
  voting: 'rgba(30,0,0,0.42)',
};

const PHASE_HUD_GLOW: Record<string, string> = {
  night:  '0 4px 32px rgba(0,0,0,0.75), 0 0 24px rgba(109,40,217,0.14)',
  day:    '0 4px 32px rgba(0,0,0,0.75), 0 0 24px rgba(180,83,9,0.12)',
  voting: '0 4px 32px rgba(0,0,0,0.75), 0 0 24px rgba(185,28,28,0.14)',
};

const PHASE_BAR_ACCENT: Record<string, string> = {
  night:  'rgba(109,40,217,0.60)',
  day:    'rgba(180,83,9,0.60)',
  voting: 'rgba(185,28,28,0.60)',
};

const ROLE_HUD_ICON: Record<string, React.ReactNode> = {
  werewolf: (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M5 10.5c.6.8 1.7 1.4 3 1.4s2.4-.6 3-1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="5.8" cy="7.5" r="1.1" fill="currentColor"/>
      <circle cx="10.2" cy="7.5" r="1.1" fill="currentColor"/>
      <path d="M4 5.5C5 4 6.4 3.2 8 3.2s3 .8 4 2.3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M3 9.5C2 8 2 6 3 4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity=".5"/>
      <path d="M13 9.5C14 8 14 6 13 4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity=".5"/>
    </svg>
  ),
  seer: (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <ellipse cx="8" cy="9" rx="5.5" ry="3.5" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="8" cy="9" r="2" fill="currentColor"/>
      <circle cx="8" cy="9" r="0.8" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.8"/>
      <path d="M8 2v1.5M5.2 3.7l.9.9M10.8 3.7l-.9.9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  ),
  doctor: (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  villager: (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M3.5 14c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  hunter: (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M5 13V8L3 5.5h4L8 2l1 3.5h4L11 8v5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M5.5 10.5h5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  ),
  witch: (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M3 14c.5-3 2.5-5 5-5s4.5 2 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M8 9V6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M5.5 6.5h5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M6.5 6.5L8 2.5l1.5 4" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  ),
  bodyguard: (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M8 1.5L2.5 4v3.5c0 3.5 2.5 5.8 5.5 6.5 3-.7 5.5-3 5.5-6.5V4L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  jester: (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11 3.7 5.5 6.4 8.7 8 3.5 9.6 8.7 12.3 5.5 13 11z" />
      <path d="M3.4 13h9.2" />
      <circle cx="3.6" cy="4.8" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="8" cy="2.6" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="12.4" cy="4.8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
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
    confirmLabel: 'Protect',
    btnBg: 'rgba(6,78,59,0.90)',   btnBorder: 'rgba(52,211,153,0.65)', btnText: '#a7f3d0',
    selBg: 'rgba(6,53,37,0.55)',   selBorder: 'rgba(5,150,105,0.55)', selText: '#6ee7b7',
  },
  bodyguard: {
    confirmLabel: 'Guard',
    btnBg: 'rgba(30,58,138,0.90)', btnBorder: 'rgba(96,165,250,0.65)', btnText: '#bfdbfe',
    selBg: 'rgba(23,37,84,0.55)',  selBorder: 'rgba(37,99,235,0.55)',  selText: '#93c5fd',
  },
  hunter_shoot: {
    confirmLabel: 'Shoot',
    btnBg: 'rgba(124,45,18,0.90)', btnBorder: 'rgba(251,146,60,0.65)', btnText: '#fed7aa',
    selBg: 'rgba(67,20,7,0.55)',   selBorder: 'rgba(234,88,12,0.55)',  selText: '#fdba74',
  },
};

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

function barStyle(phase: string): React.CSSProperties {
  return {
    backgroundColor: 'rgba(3,5,7,0.96)',
    border: '1px solid rgba(146,64,14,0.45)',
    borderTop: `2px solid ${PHASE_BAR_ACCENT[phase] ?? 'rgba(146,64,14,0.50)'}`,
    borderRadius: '10px',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minHeight: '56px',
  };
}

// ── GameView ──────────────────────────────────────────────────────────────────

export function GameView({
  room, playerId, myRole, werewolfIds, isConnected,
  onLeave, onNightAction, onCastVote, onAdvanceDay,
  onRestart, onReturnToLobby,
  onHostPauseTimer, onHostResumeTimer, onHostExtendTimer, onHostEndPhase,
  onHostRestartGame, onHostReturnToLobby,
}: Props) {
  const T = useT();
  const M = useMessage();
  const socket = useSocket();
  const { play: playSfx } = useSoundEffect();
  const reducedMotion = useReducedMotion();
  const [actionSubmitted, setActionSubmitted] = useState(false);
  const [selectedTarget, setSelectedTarget]   = useState<string | null>(null);
  const [roleOpen, setRoleOpen]   = useState(false);
  const [hostOpen, setHostOpen]   = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
  const [chatOpen, setChatOpen]   = useState(false);
  const [chatSeen, setChatSeen]   = useState(0);
  const [showRoleReveal, setShowRoleReveal] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [seerReveal, setSeerReveal] = useState<{ targetName: string; role: Role; key: number } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [announce, setAnnounce] = useState<{ text: string; key: number } | null>(null);
  const announceKeyRef   = useRef<string>('');
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (text: string, tone: ToastTone = 'default') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ text, tone, key: Date.now() });
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  };
  const [phaseTransition, setPhaseTransition] = useState<'night' | 'day' | 'voting' | null>(null);
  const phaseTransTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reactionsMap, setReactionsMap] = useState<Record<string, { emoji: string; key: number }>>({});
  // Witch panel state
  const witchNightInfo      = useGameStore(s => s.witchNightInfo);
  const witchActionSubmitted = useGameStore(s => s.witchActionSubmitted);
  const setWitchActionSubmitted = useGameStore(s => s.setWitchActionSubmitted);
  const setWitchNightInfo   = useGameStore(s => s.setWitchNightInfo);
  // Witch sub-state: choose to poison (shows player grid)
  const [witchPoisonMode, setWitchPoisonMode] = useState(false);
  const prevPhaseRef = useRef(room.phase);
  const prevRoleRef  = useRef<Role | null>(myRole);
  const isHost       = room.hostId === playerId;
  const seerLog      = useGameStore(s => s.seerLog);
  const chatMessages = useGameStore(s => s.chatMessages);
  const wolfVotes    = useGameStore(s => s.wolfVotes);

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
      setWitchPoisonMode(false);
      if (room.phase === 'night' || room.phase === 'day' || room.phase === 'voting') {
        setPhaseTransition(room.phase);
        if (phaseTransTimerRef.current) clearTimeout(phaseTransTimerRef.current);
        phaseTransTimerRef.current = setTimeout(() => setPhaseTransition(null), reducedMotion ? 700 : 2500);
        playSfx(room.phase === 'night' ? 'phase_night' : room.phase === 'day' ? 'phase_day' : 'phase_voting');
      }
    }
  }, [room.phase, playSfx, reducedMotion]);

  // Emoji reaction socket listener
  useEffect(() => {
    if (!socket) return;
    const handleReaction = ({ playerId, emoji }: { playerId: string; emoji: string }) => {
      const key = Date.now();
      setReactionsMap(prev => ({ ...prev, [playerId]: { emoji, key } }));
      setTimeout(() => {
        setReactionsMap(prev => {
          const next = { ...prev };
          if (next[playerId]?.key === key) delete next[playerId];
          return next;
        });
      }, 2800);
    };
    socket.on('reaction', handleReaction);
    return () => { socket.off('reaction', handleReaction); };
  }, [socket]);

  // Keep the unread counter cleared while the chat drawer is open
  useEffect(() => {
    if (chatOpen) setChatSeen(chatMessages.length);
  }, [chatOpen, chatMessages.length]);

  // Seer inspection reveal — pop a dramatic modal when a fresh result lands.
  // The round guard stops replayed history (on reconnect) from re-triggering old reveals.
  const shownSeerKeysRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (myRole !== 'seer' || seerLog.length === 0) return;
    const latest = seerLog[seerLog.length - 1];
    const key = `${latest.round}-${latest.targetId}`;
    if (shownSeerKeysRef.current.has(key)) return;
    shownSeerKeysRef.current.add(key);
    if (latest.round === room.round) {
      setSeerReveal({ targetName: latest.targetName, role: latest.role, key: Date.now() });
    }
  }, [seerLog, myRole, room.round]);

  useEffect(() => {
    if (prevRoleRef.current === null && myRole !== null) {
      setShowRoleReveal(true);
    }
    prevRoleRef.current = myRole;
  }, [myRole]);

  const handleNightAction = (id: string) => { onNightAction(id); setActionSubmitted(true); showToast(T('toast.actionSubmitted')); playSfx('action_submit'); };
  const handleCastVote    = (id: string) => { onCastVote(id);    setActionSubmitted(true); showToast(T('toast.voteCast')); playSfx('vote_cast'); };
  const handleHunterShoot = (targetId: string | null) => {
    socket?.emit('hunter_shoot', { targetId });
    setSelectedTarget(null);
    showToast(targetId ? T('toast.shotFired') : T('toast.shotSkipped'), targetId ? 'danger' : 'default');
  };
  const handleWitchAction = (save: boolean, poisonTargetId: string | null) => {
    socket?.emit('witch_action', { save, poisonTargetId });
    setWitchActionSubmitted(true);
    setWitchPoisonMode(false);
    setSelectedTarget(null);
    showToast(
      save ? T('toast.witchSaved') : poisonTargetId ? T('toast.witchPoisoned') : T('toast.witchPassed'),
      save ? 'safe' : poisonTargetId ? 'danger' : 'default',
    );
  };

  const me         = room.players.find(p => p.id === playerId);
  const imAlive    = me?.isAlive ?? false;
  const aliveCount = room.players.filter(p => p.isAlive).length;
  const deadCount  = room.players.length - aliveCount;
  const votedCount = room.publicVotes?.hasVoted.length ?? 0;
  const hasVotedAlready   = room.publicVotes?.hasVoted.includes(playerId) ?? false;
  const isActionSubmitted = actionSubmitted || hasVotedAlready;
  const showTimer         = !!(room.phaseEndAt || room.timerPaused);

  // Hunter shot mode: override normal targeting
  const isHunterPending  = room.hunterPendingShot === playerId;
  const isOtherHunterPending = !!room.hunterPendingShot && room.hunterPendingShot !== playerId;

  const validTargetIds = useMemo(() => {
    // Hunter pending shot: show valid targets regardless of phase/submitted state
    if (isHunterPending) {
      return room.players.filter(p => p.isAlive && p.id !== playerId).map(p => p.id);
    }
    // Someone else is the pending Hunter — everything is frozen until they shoot
    if (room.hunterPendingShot) return [];
    // Note: targets stay clickable after submitting so you can change/undo your choice
    if (!imAlive) return [];
    // Witch poison mode: all alive players except self
    if (witchPoisonMode && myRole === 'witch' && room.phase === 'night') {
      return room.players.filter(p => p.isAlive && p.id !== playerId).map(p => p.id);
    }
    if (room.phase === 'night') {
      if (myRole === 'werewolf')   return room.players.filter(p => p.isAlive && !werewolfIds.includes(p.id)).map(p => p.id);
      if (myRole === 'seer')       return room.players.filter(p => p.isAlive && p.id !== playerId).map(p => p.id);
      if (myRole === 'doctor')     return room.players.filter(p => p.isAlive).map(p => p.id);
      if (myRole === 'bodyguard')  return room.players.filter(p => p.isAlive).map(p => p.id);
      return [];
    }
    if (room.phase === 'voting') return room.players.filter(p => p.isAlive && p.id !== playerId).map(p => p.id);
    return [];
  }, [isHunterPending, isActionSubmitted, imAlive, witchPoisonMode, room.phase, room.players, myRole, werewolfIds, playerId]);

  const onPlayerCardClick = (targetId: string) => {
    if (!validTargetIds.includes(targetId)) return;
    // Hunter shot / witch poison keep the deliberate select-then-confirm flow
    if (isHunterPending || witchPoisonMode) {
      setSelectedTarget(prev => prev === targetId ? null : targetId);
      return;
    }
    // Click your current choice again:
    //  · voting → cancel / abstain
    //  · night  → no-op (you must act; change by clicking another card)
    if (isActionSubmitted && selectedTarget === targetId) {
      if (room.phase === 'voting') {
        socket?.emit('cancel_vote');
        setSelectedTarget(null);
        setActionSubmitted(false);
        showToast(T('toast.cancelled'));
      }
      return;
    }
    // Click a (different) valid target → act / switch
    if (room.phase === 'night')  handleNightAction(targetId);
    else if (room.phase === 'voting') handleCastVote(targetId);
    setSelectedTarget(targetId);
  };

  const handleCardConfirm = (targetId: string) => {
    if (isHunterPending) { handleHunterShoot(targetId); return; }
    if (witchPoisonMode && myRole === 'witch') { handleWitchAction(false, targetId); return; }
  };

  const actionType = (() => {
    if (isHunterPending) return 'kill' as const;
    if (!imAlive) return null;
    if (room.phase === 'voting') return 'vote' as const;
    if (room.phase === 'night') {
      if (myRole === 'werewolf')  return 'kill'    as const;
      if (myRole === 'seer')      return 'inspect' as const;
      if (myRole === 'doctor')    return 'protect' as const;
      if (myRole === 'bodyguard') return 'protect' as const;
      if (myRole === 'witch' && witchPoisonMode) return 'kill' as const;
    }
    return null;
  })();

  const banner             = PHASE_BANNER_CFG[room.phase];
  const selectedPlayerName = selectedTarget ? (room.players.find(p => p.id === selectedTarget)?.name ?? null) : null;
  const phaseHudColor      = PHASE_HUD_COLOR[room.phase] ?? '#fbbf24';
  const roleInfo           = myRole ? ROLE_INFO[myRole] : null;
  const nc         = isHunterPending ? NIGHT_CFG['hunter_shoot'] : (myRole ? (NIGHT_CFG[myRole] ?? null) : null);

  // Vote seals: day → public tally; night → live werewolf kill-vote tally (wolves only)
  const voteCounts = room.phase === 'voting'
    ? (room.publicVotes?.tally ?? {})
    : (room.phase === 'night' && myRole === 'werewolf' && imAlive)
      ? wolfVotes
      : {};

  // Chat
  const chatWolfMode = room.phase === 'night' && myRole === 'werewolf' && imAlive;
  const chatDeadMode = !imAlive && room.phase !== 'lobby'; // the dead speak in the graveyard
  const canChat = chatDeadMode || (imAlive && (chatWolfMode || room.phase === 'day' || room.phase === 'voting'));
  const chatDisabledReason = room.phase === 'night' ? T('chat.disabledNight')
    : T('chat.disabledDefault');
  const unreadChat = chatOpen ? 0 : Math.max(0, chatMessages.length - chatSeen);

  // ── Sound cues ─────────────────────────────────────────────────────────────
  const prevAliveSfxRef = useRef(aliveCount);
  useEffect(() => {
    if (aliveCount < prevAliveSfxRef.current) playSfx('player_die');
    prevAliveSfxRef.current = aliveCount;
  }, [aliveCount, playSfx]);

  const turnCuedRef = useRef(false);
  useEffect(() => {
    const myTurn = room.phase === 'night' && !isHunterPending && imAlive && !!nc && !witchPoisonMode && !isActionSubmitted;
    if (myTurn && !turnCuedRef.current) { playSfx('your_turn'); turnCuedRef.current = true; }
    else if (!myTurn) turnCuedRef.current = false;
  }, [room.phase, isHunterPending, imAlive, nc, witchPoisonMode, isActionSubmitted, playSfx]);

  useEffect(() => {
    if (!room.phaseEndAt || room.timerPaused) return;
    const now = Date.now();
    const timers: ReturnType<typeof setTimeout>[] = [];
    const urgentMs = room.phaseEndAt - now - 10000;
    if (urgentMs > 0) timers.push(setTimeout(() => playSfx('timer_urgent'), urgentMs));
    // Ticking in the final 5 seconds
    for (let s = 5; s >= 1; s--) {
      const ms = room.phaseEndAt - now - s * 1000;
      if (ms > 0) timers.push(setTimeout(() => playSfx('timer_tick'), ms));
    }
    return () => timers.forEach(clearTimeout);
  }, [room.phaseEndAt, room.timerPaused, playSfx]);

  const endCuedRef = useRef(false);
  useEffect(() => {
    if (room.phase === 'ended' && !endCuedRef.current) {
      endCuedRef.current = true;
      playSfx(room.winner === 'village' ? 'game_over_village' : 'game_over_wolf');
    } else if (room.phase !== 'ended') {
      endCuedRef.current = false;
    }
  }, [room.phase, room.winner, playSfx]);

  // Surface a new announcement as a floating toast (auto-dismiss)
  useEffect(() => {
    const a = room.lastAnnouncement;
    if (!a) { announceKeyRef.current = ''; return; }
    const id = a.code + JSON.stringify(a.params ?? {});
    if (id === announceKeyRef.current) return;
    announceKeyRef.current = id;
    setAnnounce({ text: M(a), key: Date.now() });
    if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
    announceTimerRef.current = setTimeout(() => setAnnounce(null), 5500);
  }, [room.lastAnnouncement, M]);

  return (
    <div className="relative z-10 flex flex-col overflow-hidden lg:pr-80" style={{ height: '100dvh' }}>

      {/* ── Chat + log sidebar (desktop, always visible) ── */}
      <aside
        className="hidden lg:flex flex-col fixed right-0 top-0 bottom-0 w-80 z-20"
        style={{ borderLeft: '1px solid rgba(146,64,14,0.45)', boxShadow: '-10px 0 30px rgba(0,0,0,0.55)' }}
      >
        {/* Utility header — the top-bar chrome lives here on desktop */}
        <div
          className="shrink-0 flex flex-col gap-2 px-3 pt-2.5 pb-2"
          style={{ background: 'linear-gradient(180deg, rgba(14,11,7,0.98) 0%, rgba(6,5,3,0.98) 100%)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[9px] font-cinzel uppercase tracking-widest shrink-0" style={{ color: '#a16207' }}>{T('lobby.room')}</span>
              <span className="font-mono font-bold text-sm tracking-[0.28em] truncate" style={{ color: '#fbbf24', textShadow: '0 0 10px rgba(251,191,36,0.4)' }}>{room.code}</span>
              <CopyButton text={room.code} />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <StatusDot connected={isConnected} />
              <span className={`text-[9px] font-cinzel uppercase tracking-wider ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {isConnected ? T('lobby.connected') : T('lobby.offline')}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <AudioControls />
            <LangToggle />
            {isHost && (
              <button
                onClick={() => setHostOpen(true)}
                title={T('hud.hostControls')}
                className="p-1.5 transition-all duration-150 hover:brightness-125"
                style={{ border: '1px solid rgba(120,65,10,0.40)', borderRadius: '7px' }}
              >
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="#d97706" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="2.5" />
                  <path strokeLinecap="round" d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M11.5 3.1l-1.4 1.4M3.1 11.5l1.4-1.4" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setHowToOpen(true)}
              title={T('howto.button')}
              className="p-1.5 transition-all duration-150 hover:brightness-125"
              style={{ border: '1px solid rgba(120,65,10,0.40)', borderRadius: '7px' }}
            >
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="#d97706" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6.5" />
                <path strokeLinecap="round" d="M6.1 6.1a2 2 0 0 1 3.8.6c0 1.3-1.9 1.7-1.9 1.7" />
                <circle cx="8" cy="11.5" r="0.5" fill="#d97706" stroke="none" />
              </svg>
            </button>
            <button
              onClick={onLeave}
              title={T('hud.leave')}
              className="p-1.5 transition-colors"
              style={{ border: '1px solid rgba(146,64,14,0.50)', borderRadius: '7px', color: '#d97706' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={e => (e.currentTarget.style.color = '#d97706')}
            >
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 14H3.5A1.5 1.5 0 0 1 2 12.5v-9A1.5 1.5 0 0 1 3.5 2H6" />
                <path d="M10.5 11 14 7.5 10.5 4M14 7.5H6" />
              </svg>
            </button>
          </div>

          {/* Ornamental divider — hairline · diamond · hairline */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(217,119,6,0.45))' }} />
            <span className="w-1.5 h-1.5 rotate-45 shrink-0" style={{ backgroundColor: 'rgba(217,119,6,0.55)', boxShadow: '0 0 6px rgba(217,119,6,0.35)' }} />
            <span className="flex-1 h-px" style={{ background: 'linear-gradient(270deg, transparent, rgba(217,119,6,0.45))' }} />
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <ChatFeed
            messages={chatMessages}
            events={room.eventLog}
            playerId={playerId}
            canChat={canChat}
            wolfMode={chatWolfMode}
            deadMode={chatDeadMode}
            disabledReason={chatDisabledReason}
            onSend={(text) => socket?.emit('chat_send', { text })}
            showReactions={(room.phase === 'day' || room.phase === 'voting') && imAlive}
            onReact={(emoji) => socket?.emit('send_reaction', { emoji })}
          />
        </div>
      </aside>

      {/* ── Phase atmosphere tint ── */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{ backgroundColor: PHASE_ATMOSPHERE[room.phase] ?? 'transparent', zIndex: 0 }}
      />

      {/* ── Animated scene atmosphere (moonlight, fog, dust, vignette) ── */}
      <SceneAtmosphere phase={room.phase} />

      {/* ── Top scrim (desktop) — grounds the floating HUD so it doesn't look detached ── */}
      <div
        className="hidden lg:block fixed top-0 left-0 right-80 pointer-events-none"
        style={{
          height: '160px',
          background: 'linear-gradient(to bottom, rgba(6,4,11,0.78) 0%, rgba(6,4,11,0.42) 38%, rgba(6,4,11,0.14) 68%, transparent 100%)',
          zIndex: 5,
        }}
      />

      {/* ── Phase countdown as a glowing frame around the play field (desktop) ── */}
      {(room.phase === 'night' || room.phase === 'day' || room.phase === 'voting') && (
        <PhasePerimeter
          phase={room.phase}
          phaseEndAt={room.phaseEndAt}
          paused={room.timerPaused}
          pausedTimeRemaining={room.pausedTimeRemaining}
        />
      )}

      {/* ── Game over overlay ── */}
      {room.phase === 'ended' && (
        <GameOverScreen room={room} playerId={playerId} onLeave={onLeave} onRestart={onRestart} onReturnToLobby={onReturnToLobby} />
      )}

      {/* ── Phase transition overlay (tap anywhere to skip) ── */}
      {phaseTransition && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center gap-5 cursor-pointer"
          style={{ zIndex: 100 }}
          onClick={() => { if (phaseTransTimerRef.current) clearTimeout(phaseTransTimerRef.current); setPhaseTransition(null); }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: phaseTransition === 'night'
                ? 'radial-gradient(ellipse at 50% 40%, rgba(25,8,55,0.96) 0%, rgba(4,2,14,0.98) 100%)'
                : phaseTransition === 'day'
                ? 'radial-gradient(ellipse at 50% 40%, rgba(55,25,0,0.94) 0%, rgba(18,8,0,0.96) 100%)'
                : 'radial-gradient(ellipse at 50% 40%, rgba(40,5,5,0.94) 0%, rgba(14,2,2,0.97) 100%)',
              animation: 'phase-overlay-fade 2.5s ease-in-out forwards',
            }}
          />
          <div className="relative z-10" style={{ animation: 'phase-text-appear 2.5s ease-in-out forwards' }}>
            {phaseTransition === 'night' && (
              <svg viewBox="0 0 64 64" style={{ width: 80, height: 80 }} fill="none">
                <path d="M52 33A20 20 0 1 1 28 11a16 16 0 1 0 24 22z" fill="#c4b5fd" fillOpacity="0.88"/>
                <circle cx="40" cy="14" r="2" fill="#e9d5ff" opacity="0.7"/>
                <circle cx="16" cy="24" r="1.5" fill="#ddd6fe" opacity="0.55"/>
                <circle cx="52" cy="46" r="1.2" fill="#ddd6fe" opacity="0.45"/>
                <circle cx="48" cy="22" r="0.9" fill="#f5f3ff" opacity="0.40"/>
              </svg>
            )}
            {phaseTransition === 'day' && (
              <svg viewBox="0 0 64 64" style={{ width: 80, height: 80 }} fill="none" strokeLinecap="round">
                <circle cx="32" cy="32" r="14" fill="#fbbf24" fillOpacity="0.90"/>
                <path d="M32 6v8M32 50v8M6 32h8M50 32h8M13.4 13.4l5.7 5.7M44.9 44.9l5.7 5.7M44.9 19.1l5.7-5.7M13.4 50.6l5.7-5.7" stroke="#fbbf24" strokeWidth="2.5"/>
              </svg>
            )}
            {phaseTransition === 'voting' && (
              <svg viewBox="0 0 64 64" style={{ width: 80, height: 80 }} fill="none">
                <path d="M12 24l20-6 20 6M32 18v38M18 24l-6 22h12l-6-22zM46 24l-6 22h12l-6-22z" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 54h40" stroke="#f87171" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </div>
          <div className="relative z-10 text-center" style={{ animation: 'phase-text-appear 2.5s ease-in-out forwards' }}>
            <p
              className="font-cinzel font-bold text-3xl uppercase tracking-[0.28em]"
              style={{
                color: phaseTransition === 'night' ? '#c4b5fd' : phaseTransition === 'day' ? '#fbbf24' : '#f87171',
                textShadow: phaseTransition === 'night'
                  ? '0 0 28px rgba(139,92,246,0.85), 0 0 55px rgba(109,40,217,0.55)'
                  : phaseTransition === 'day'
                  ? '0 0 28px rgba(251,191,36,0.85), 0 0 55px rgba(217,119,6,0.55)'
                  : '0 0 28px rgba(239,68,68,0.85), 0 0 55px rgba(185,28,28,0.55)',
              }}
            >
              {T(`phase.${phaseTransition}`)}
            </p>
            <p className="font-cinzel text-sm tracking-widest mt-2" style={{
              color: phaseTransition === 'night' ? 'rgba(196,181,253,0.55)'
                : phaseTransition === 'day' ? 'rgba(251,191,36,0.55)'
                : 'rgba(248,113,113,0.55)',
            }}>
              {T('hud.round', { n: toRoman(room.round) })}
            </p>
          </div>
          <span
            className="absolute bottom-6 left-0 right-0 text-center text-[10px] font-cinzel uppercase tracking-[0.3em] pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.30)', animation: 'phase-text-appear 2.5s ease-in-out forwards' }}
          >
            {T('overlay.tapSkip')}
          </span>
        </div>
      )}

      {/* ── Top HUD (mobile/tablet — desktop uses the floating HUD below) ─── */}
      <div className="shrink-0 px-3 pt-3 pb-2 relative z-10 lg:hidden">
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(14,11,7,0.97) 0%, rgba(3,5,7,0.97) 100%)',
            border: '1px solid rgba(146,64,14,0.55)',
            borderTop: `2px solid ${PHASE_BAR_ACCENT[room.phase] ?? 'rgba(146,64,14,0.6)'}`,
            borderRadius: '10px',
            boxShadow: `${PHASE_HUD_GLOW[room.phase] ?? '0 4px 32px rgba(0,0,0,0.75)'}, inset 0 1px 0 rgba(255,240,210,0.06)`,
          }}
          className="flex items-center gap-2 px-3 py-2"
        >
          {/* Room code — desktop shows it in the chat-sidebar header instead */}
          <div className="flex items-center gap-1.5 shrink-0 lg:hidden">
            <span className="text-[9px] font-cinzel uppercase tracking-widest hidden sm:inline" style={{ color: '#a16207' }}>{T('lobby.room')}</span>
            <span className="font-mono font-bold text-base tracking-[0.35em]" style={{ color: '#fbbf24', textShadow: '0 0 12px rgba(251,191,36,0.45)' }}>
              {room.code}
            </span>
            <CopyButton text={room.code} />
          </div>

          <div className="w-px h-4 shrink-0 lg:hidden" style={{ backgroundColor: 'rgba(146,64,14,0.35)' }} />

          {/* Phase + round */}
          <div className="flex items-center gap-1.5 shrink-0" style={{ color: phaseHudColor, textShadow: `0 0 10px ${phaseHudColor}66` }}>
            {PHASE_ICON[room.phase]}
            <span className="font-cinzel text-xs tracking-widest uppercase font-semibold">
              {room.phase === 'ended' ? T('hud.gameOver') : `${T(`phase.${room.phase}`)} · ${toRoman(room.round)}`}
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

          {/* Host: call the vote (day) */}
          {isHost && room.phase === 'day' && (
            <button
              onClick={onAdvanceDay}
              className="shrink-0 px-3.5 py-1.5 text-[11px] font-cinzel font-bold uppercase tracking-widest rounded-lg transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
              style={{
                background: 'linear-gradient(180deg, rgba(146,64,14,0.94) 0%, rgba(110,48,0,0.94) 100%)',
                border: '1px solid rgba(217,119,6,0.7)',
                color: '#fde68a',
                boxShadow: '0 0 14px rgba(217,119,6,0.3), inset 0 1px 0 rgba(255,220,150,0.15)',
              }}
            >
              {T('bar.day.callVote')}
            </button>
          )}

          {/* Night: compact turn status (glowing cards show the actual targets) */}
          {room.phase === 'night' && !isHunterPending && imAlive && nc && !witchPoisonMode && (
            <span
              className={`shrink-0 text-[10px] font-cinzel font-bold uppercase tracking-widest ${isActionSubmitted ? '' : 'animate-pulse'}`}
              style={{ color: isActionSubmitted ? '#4ade80' : (roleInfo?.accentColor ?? '#d97706') }}
            >
              {isActionSubmitted ? `✓ ${T('turn.waiting')}` : T('turn.yourTurn')}
            </span>
          )}

          {/* Voting progress */}
          {room.phase === 'voting' && (
            <span className="shrink-0 text-[10px] font-cinzel font-bold uppercase tracking-widest tabular-nums" style={{ color: '#f87171' }}>
              {T('hud.votedCount', { voted: votedCount, total: aliveCount })}
            </span>
          )}

          <div className="flex-1" />

          {/* Role badge — opens role drawer */}
          {roleInfo && myRole && (
            <button
              onClick={() => setRoleOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 shrink-0 transition-all duration-150 hover:brightness-125 active:scale-[0.97]"
              style={{
                background: `linear-gradient(135deg, ${roleInfo.accentColor}28 0%, rgba(0,0,0,0.55) 100%)`,
                border: `1px solid ${roleInfo.accentColor}70`,
                borderRadius: '8px',
                boxShadow: `0 0 18px ${roleInfo.accentColor}28, inset 0 1px 0 ${roleInfo.accentColor}18`,
              }}
            >
              <div
                className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full"
                style={{
                  backgroundColor: `${roleInfo.accentColor}25`,
                  border: `1px solid ${roleInfo.accentColor}60`,
                  color: roleInfo.accentColor,
                }}
              >
                {ROLE_HUD_ICON[myRole]}
              </div>
              <div className="flex flex-col items-start leading-tight hidden sm:flex">
                <span className="text-[7px] font-cinzel uppercase tracking-[0.18em]" style={{ color: `${roleInfo.accentColor}99` }}>
                  {T('hud.yourRole')}
                </span>
                <span className="text-[12px] font-cinzel font-bold uppercase tracking-wide" style={{ color: roleInfo.accentColor, textShadow: `0 0 8px ${roleInfo.accentColor}66` }}>
                  {T(`role.${myRole}.name`)}
                </span>
              </div>
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

          <div className="w-px h-4 shrink-0 lg:hidden" style={{ backgroundColor: 'rgba(146,64,14,0.30)' }} />

          {/* Connection + Audio + Lang — desktop shows these in the chat-sidebar header */}
          <div className="flex items-center gap-2 shrink-0 lg:hidden">
            <StatusDot connected={isConnected} />
            <AudioControls />
            <LangToggle />
          </div>

          {/* Host controls icon — host only (mobile HUD; desktop uses the sidebar header) */}
          {isHost && (
            <button
              onClick={() => setHostOpen(true)}
              title="Host Controls"
              style={{ border: '1px solid rgba(120,65,10,0.40)', borderRadius: '7px' }}
              className="p-1.5 shrink-0 transition-all duration-150 hover:brightness-125 lg:hidden"
            >
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="#d97706" strokeWidth="1.5">
                <circle cx="8" cy="8" r="2.5" />
                <path strokeLinecap="round" d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M11.5 3.1l-1.4 1.4M3.1 11.5l1.4-1.4" />
              </svg>
            </button>
          )}

          {/* Chat icon — mobile only (desktop shows the always-on sidebar) */}
          <button
            onClick={() => setChatOpen(true)}
            title={chatWolfMode ? T('chat.wolfTitle') : T('chat.title')}
            className="p-1.5 shrink-0 lg:hidden transition-all duration-150 hover:brightness-125"
            style={{ border: `1px solid ${chatWolfMode ? 'rgba(185,28,28,0.45)' : 'rgba(120,65,10,0.40)'}`, borderRadius: '7px', position: 'relative' }}
          >
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke={chatWolfMode ? '#ef4444' : '#d97706'} strokeWidth="1.5">
              <path strokeLinejoin="round" d="M14 8a5.5 5.5 0 0 1-7.9 5L2.5 14l1-3.6A5.5 5.5 0 1 1 14 8z" />
            </svg>
            {unreadChat > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 flex items-center justify-center rounded-full text-[8px] font-bold"
                style={{ backgroundColor: chatWolfMode ? '#b91c1c' : '#92400e', color: '#fde68a' }}
              >
                {unreadChat > 9 ? '9+' : unreadChat}
              </span>
            )}
          </button>

          {/* How to play icon — mobile HUD; desktop uses the sidebar header */}
          <button
            onClick={() => setHowToOpen(true)}
            title={T('howto.button')}
            className="p-1.5 shrink-0 transition-all duration-150 hover:brightness-125 lg:hidden"
            style={{ border: '1px solid rgba(120,65,10,0.40)', borderRadius: '7px' }}
          >
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="#d97706" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6.5" />
              <path strokeLinecap="round" d="M6.1 6.1a2 2 0 0 1 3.8.6c0 1.3-1.9 1.7-1.9 1.7" />
              <circle cx="8" cy="11.5" r="0.5" fill="#d97706" stroke="none" />
            </svg>
          </button>

          {/* Leave — mobile HUD; desktop uses the sidebar header */}
          <button
            onClick={onLeave}
            className="px-2.5 py-1.5 text-[10px] font-cinzel uppercase tracking-widest rounded-lg shrink-0 hidden sm:block lg:hidden transition-colors"
            style={{ border: '1px solid rgba(146,64,14,0.50)', color: '#d97706' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#d97706')}
          >
            {T('hud.leave')}
          </button>
        </div>
      </div>

      {/* ── Floating game HUD (desktop) — no solid bar, elements sit on the scene ── */}
      <div className="hidden lg:block shrink-0 px-5 pt-4 pb-1 relative z-10">
        <div className="flex items-start justify-between gap-4">

          {/* Left: role pill (opens role drawer) */}
          <div className="shrink-0 w-44">
            {roleInfo && myRole && (
              <button
                onClick={() => setRoleOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 transition-all duration-150 hover:brightness-125 active:scale-[0.97]"
                style={{
                  background: `linear-gradient(135deg, ${roleInfo.accentColor}22 0%, rgba(0,0,0,0.34) 100%)`,
                  border: `1px solid ${roleInfo.accentColor}4d`,
                  borderRadius: '10px',
                  boxShadow: `0 0 15px ${roleInfo.accentColor}1f, inset 0 1px 0 ${roleInfo.accentColor}14`,
                }}
              >
                <div
                  className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full"
                  style={{ backgroundColor: `${roleInfo.accentColor}25`, border: `1px solid ${roleInfo.accentColor}60`, color: roleInfo.accentColor }}
                >
                  {ROLE_HUD_ICON[myRole]}
                </div>
                <div className="flex flex-col items-start leading-tight min-w-0">
                  <span className="text-[7px] font-cinzel uppercase tracking-[0.18em]" style={{ color: `${roleInfo.accentColor}99` }}>
                    {T('hud.yourRole')}
                  </span>
                  <span className="text-[12px] font-cinzel font-bold uppercase tracking-wide truncate" style={{ color: roleInfo.accentColor, textShadow: `0 0 8px ${roleInfo.accentColor}66` }}>
                    {T(`role.${myRole}.name`)}
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* Center: phase + timer hero cluster */}
          <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <div className="flex items-center gap-3 w-full max-w-md">
            {/* Winged hairline — ties the emblem into the header */}
            <span className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${phaseHudColor}4d)` }} />
            <div
              className="flex items-center gap-2.5 px-4 py-1.5 rounded-full shrink-0"
              style={{
                background: `linear-gradient(180deg, ${phaseHudColor}1a 0%, rgba(0,0,0,0.34) 100%)`,
                border: `1px solid ${phaseHudColor}38`,
                boxShadow: `0 0 16px ${phaseHudColor}1c, inset 0 1px 0 rgba(255,255,255,0.04)`,
              }}
            >
              <span className="flex items-center gap-1.5" style={{ color: phaseHudColor, textShadow: `0 0 10px ${phaseHudColor}66` }}>
                {PHASE_ICON[room.phase]}
                <span className="font-cinzel text-sm tracking-[0.18em] uppercase font-bold">
                  {room.phase === 'ended' ? T('hud.gameOver') : `${T(`phase.${room.phase}`)} · ${toRoman(room.round)}`}
                </span>
              </span>
              {showTimer && (
                <>
                  <span className="w-px h-4" style={{ backgroundColor: `${phaseHudColor}44` }} />
                  <PhaseTimer
                    phase={room.phase}
                    phaseEndAt={room.phaseEndAt}
                    paused={room.timerPaused}
                    pausedTimeRemaining={room.pausedTimeRemaining}
                    compact
                  />
                </>
              )}

              {/* Host: call the vote (day) — inline so it costs no extra row */}
              {isHost && room.phase === 'day' && (
                <>
                  <span className="w-px h-4" style={{ backgroundColor: `${phaseHudColor}44` }} />
                  <button
                    onClick={onAdvanceDay}
                    className="flex items-center gap-1 -my-0.5 -mr-1.5 pl-2 pr-2.5 py-1 text-[10px] font-cinzel font-bold uppercase tracking-widest rounded-full transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
                    style={{
                      background: 'linear-gradient(180deg, rgba(146,64,14,0.94) 0%, rgba(110,48,0,0.94) 100%)',
                      border: '1px solid rgba(217,119,6,0.7)',
                      color: '#fde68a',
                      boxShadow: '0 0 12px rgba(217,119,6,0.3)',
                    }}
                  >
                    <svg viewBox="0 0 16 16" className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 5l6-2 6 2M8 3v10M4 5l-1.5 5h3L4 5zM12 5l-1.5 5h3L12 5z" />
                    </svg>
                    {T('bar.day.callVote')}
                  </button>
                </>
              )}
            </div>
            <span className="flex-1 h-px" style={{ background: `linear-gradient(270deg, transparent, ${phaseHudColor}4d)` }} />
            </div>

            {/* Night turn status */}
            {room.phase === 'night' && !isHunterPending && imAlive && nc && !witchPoisonMode && (
              <span
                className={`mt-0.5 text-[10px] font-cinzel font-bold uppercase tracking-widest ${isActionSubmitted ? '' : 'animate-pulse'}`}
                style={{ color: isActionSubmitted ? '#4ade80' : (roleInfo?.accentColor ?? '#d97706') }}
              >
                {isActionSubmitted ? `✓ ${T('turn.waiting')}` : T('turn.yourTurn')}
              </span>
            )}

            {/* Voting progress — how many have cast a vote */}
            {room.phase === 'voting' && (
              <span className="mt-0.5 text-[10px] font-cinzel font-bold uppercase tracking-widest tabular-nums" style={{ color: '#f87171' }}>
                {T('hud.votedCount', { voted: votedCount, total: aliveCount })}
              </span>
            )}
          </div>

          {/* Right: alive / dead pill */}
          <div className="shrink-0 w-44 flex justify-end">
            <div
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full"
              style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.5) 0%, rgba(0,0,0,0.32) 100%)', border: '1px solid rgba(146,64,14,0.3)', boxShadow: 'inset 0 1px 0 rgba(255,240,210,0.04)' }}
            >
              <div className="flex items-center gap-1">
                <svg viewBox="0 0 16 16" className="w-3 h-3" fill="#4ade80"><circle cx="8" cy="4.5" r="2.5"/><path d="M3 14a5 5 0 0 1 10 0z"/></svg>
                <span className="text-[12px] font-semibold tabular-nums" style={{ color: '#4ade80' }}>{aliveCount}</span>
              </div>
              <span className="w-px h-4" style={{ backgroundColor: 'rgba(146,64,14,0.35)' }} />
              <div className="flex items-center gap-1">
                <svg viewBox="0 0 16 16" className="w-3 h-3" fill="#ef4444"><path d="M8 1a5 5 0 0 0-3 9v2h6v-2a5 5 0 0 0-3-9zM6 6.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm4 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/><path d="M6 13h4v1.5H6z"/></svg>
                <span className="text-[12px] font-semibold tabular-nums" style={{ color: '#ef4444' }}>{deadCount}</span>
              </div>
            </div>
          </div>

        </div>
      </div>


      {/* ── Banner area (announcements now surface as a floating toast) ──────── */}
      <div className="shrink-0 px-3 space-y-1.5 pb-1 relative z-10">


        {/* Hunter pending — this player is the hunter */}
        {isHunterPending && (
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'rgba(30,8,0,0.92)', border: '1px solid rgba(234,88,12,0.50)', borderLeft: '3px solid rgba(251,146,60,0.80)', boxShadow: '0 2px 12px rgba(0,0,0,0.55)' }}
          >
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="#ea580c">
              <path d="M5 13V8L3 5.5h4L8 2l1 3.5h4L11 8v5" strokeLinejoin="round" strokeLinecap="round"/>
            </svg>
            <p className="text-[11px] font-cinzel leading-snug flex-1" style={{ color: '#fed7aa' }}>
              {T('hunter.myShot')}
            </p>
          </div>
        )}

        {/* Hunter pending — another player is the hunter */}
        {isOtherHunterPending && (
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'rgba(30,8,0,0.85)', border: '1px solid rgba(234,88,12,0.35)', boxShadow: '0 2px 12px rgba(0,0,0,0.50)' }}
          >
            <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 shrink-0 animate-pulse" fill="rgba(234,88,12,0.70)">
              <circle cx="10" cy="10" r="8"/>
            </svg>
            <p className="text-[11px] italic leading-snug flex-1" style={{ color: '#fdba74' }}>
              {T('hunter.otherPending')}
            </p>
          </div>
        )}

      </div>

      {/* ── Player grid — full width ──────────────────────────────────────── */}
      <div className="flex-1 min-h-0 px-3 overflow-y-auto relative z-10">
        <GamePlayerGrid
          players={room.players}
          currentPlayerId={playerId}
          werewolfIds={werewolfIds}
          voteCounts={voteCounts}
          currentPlayerSubmitted={isActionSubmitted}
          myRole={myRole}
          seerRevealedMap={seerRevealedMap}
          validTargetIds={validTargetIds}
          selectedTargetId={selectedTarget}
          onPlayerCardClick={onPlayerCardClick}
          actionType={actionType}
          onConfirmAction={(isHunterPending || witchPoisonMode) ? handleCardConfirm : undefined}
          onCancelAction={(isHunterPending || witchPoisonMode) ? () => setSelectedTarget(null) : undefined}
          reactionsMap={reactionsMap}
        />
      </div>

      {/* ── Witch night panel ─────────────────────────────────────────────── */}
      {myRole === 'witch' && room.phase === 'night' && witchNightInfo !== null && !witchActionSubmitted && !witchPoisonMode && (
        <div className="shrink-0 px-3 pb-2 pt-1 relative z-10">
          <div
            style={{
              backgroundColor: 'rgba(3,5,7,0.96)',
              border: '1px solid rgba(147,51,234,0.55)',
              borderTop: '2px solid rgba(147,51,234,0.70)',
              borderRadius: '10px',
              padding: '10px 14px',
            }}
          >
            <p className="text-[9px] font-cinzel uppercase tracking-widest mb-2" style={{ color: 'rgba(147,51,234,0.80)' }}>{T('witch.title')}</p>
            <p className="text-[11px] font-cinzel italic mb-3" style={{ color: '#ddd6fe' }}>
              {witchNightInfo.attackedPlayerId
                ? T('witch.attacked', { name: witchNightInfo.attackedPlayerName ?? '' })
                : T('witch.noAttack')}
            </p>
            <div className="flex gap-2 flex-wrap">
              {!witchNightInfo.savePotionUsed && witchNightInfo.attackedPlayerId !== null && (
                <button
                  onClick={() => handleWitchAction(true, null)}
                  className="px-3 py-1.5 text-[11px] font-cinzel uppercase tracking-wide rounded-lg transition-all hover:brightness-110 active:scale-[0.97]"
                  style={{ backgroundColor: 'rgba(6,78,59,0.85)', border: '1px solid rgba(52,211,153,0.60)', color: '#a7f3d0' }}
                >
                  {T('witch.saveName', { name: witchNightInfo.attackedPlayerName ?? '' })}
                </button>
              )}
              {!witchNightInfo.poisonPotionUsed && (
                <button
                  onClick={() => setWitchPoisonMode(true)}
                  className="px-3 py-1.5 text-[11px] font-cinzel uppercase tracking-wide rounded-lg transition-all hover:brightness-110 active:scale-[0.97]"
                  style={{ backgroundColor: 'rgba(88,28,135,0.85)', border: '1px solid rgba(147,51,234,0.60)', color: '#e9d5ff' }}
                >
                  {T('witch.poisonBtn')}
                </button>
              )}
              <button
                onClick={() => handleWitchAction(false, null)}
                className="px-3 py-1.5 text-[11px] font-cinzel uppercase tracking-wide rounded-lg transition-all hover:brightness-110 active:scale-[0.97]"
                style={{ backgroundColor: 'rgba(20,14,40,0.85)', border: '1px solid rgba(109,40,217,0.35)', color: '#a78bfa' }}
              >
                {T('witch.doNothing')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Witch poison mode instruction */}
      {witchPoisonMode && myRole === 'witch' && (
        <div className="shrink-0 px-3 pb-1 relative z-10">
          <div style={{ backgroundColor: 'rgba(3,5,7,0.96)', border: '1px solid rgba(147,51,234,0.50)', borderTop: '2px solid rgba(147,51,234,0.60)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', minHeight: '46px' }}>
            <p className="flex-1 text-[11px] font-cinzel italic" style={{ color: '#c4b5fd' }}>
              {T('witch.poisonMode')}
            </p>
            <button
              onClick={() => { setWitchPoisonMode(false); setSelectedTarget(null); }}
              className="shrink-0 px-3 py-1.5 text-[10px] font-cinzel uppercase tracking-wide rounded-lg"
              style={{ backgroundColor: 'rgba(20,14,40,0.85)', border: '1px solid rgba(109,40,217,0.35)', color: '#7c3aed' }}
            >
              {T('witch.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Hunter shot action bar */}
      {isHunterPending && (
        <div className="shrink-0 px-3 pb-3 pt-2 relative z-10">
          <div style={barStyle(room.phase)}>
            {selectedTarget ? (
              <>
                <CheckIcon color="#fdba74" />
                <span className="flex-1 text-[12px] font-cinzel uppercase tracking-wide" style={{ color: '#fdba74' }}>
                  {selectedPlayerName}
                </span>
                <button
                  onClick={() => handleHunterShoot(selectedTarget)}
                  className="shrink-0 px-3 py-1.5 text-[11px] font-cinzel uppercase tracking-widest rounded-lg transition-all hover:brightness-110 active:scale-[0.97]"
                  style={{ backgroundColor: 'rgba(124,45,18,0.90)', border: '1px solid rgba(251,146,60,0.65)', color: '#fed7aa' }}
                >
                  {T('hunter.shoot')}
                </button>
                <button
                  onClick={() => handleHunterShoot(null)}
                  className="shrink-0 px-3 py-1.5 text-[10px] font-cinzel uppercase tracking-widest rounded-lg"
                  style={{ border: '1px solid rgba(120,65,10,0.40)', color: '#78350f' }}
                >
                  {T('hunter.skip')}
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-[11px] font-cinzel italic" style={{ color: '#92400e' }}>
                  {T('hunter.selectTarget')}
                </span>
                <button
                  onClick={() => handleHunterShoot(null)}
                  className="shrink-0 px-3 py-1.5 text-[10px] font-cinzel uppercase tracking-widest rounded-lg"
                  style={{ border: '1px solid rgba(120,65,10,0.40)', color: '#78350f' }}
                >
                  {T('hunter.skipShot')}
                </button>
              </>
            )}
          </div>
        </div>
      )}


      {/* ── Drawers ──────────────────────────────────────────────────────── */}

      {/* Role Details */}
      <Drawer open={roleOpen} onClose={() => setRoleOpen(false)} title={T('hud.yourRole')}>
        <div className="p-3 flex flex-col gap-3">
          <RolePanel myRole={myRole} werewolfIds={werewolfIds} players={room.players} playerId={playerId} />

          {/* Seer inspection log */}
          {myRole === 'seer' && seerLog.length > 0 && (
            <div className="space-y-1.5 pt-1" style={{ borderTop: '1px solid rgba(109,40,217,0.25)' }}>
              <p className="text-[9px] uppercase tracking-widest font-cinzel" style={{ color: '#7c3aed' }}>{T('rolepanel.inspectionLog')}</p>
              {[...seerLog].reverse().map((entry, i) => {
                const info = ROLE_INFO[entry.role];
                return (
                  <div key={i} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs" style={{ backgroundColor: 'rgba(46,16,101,0.25)', border: '1px solid rgba(109,40,217,0.22)' }}>
                    <span className="font-cinzel shrink-0 text-[9px]" style={{ color: '#7c3aed' }}>R{entry.round}</span>
                    <span className="flex-1 truncate" style={{ color: '#fde68a' }}>{entry.targetName}</span>
                    <span className="font-cinzel font-bold text-[10px] shrink-0 tracking-wider" style={{ color: info.accentColor }}>
                      {T(`role.${entry.role}.name`).toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Drawer>

      {/* Host Controls */}
      <Drawer open={hostOpen} onClose={() => setHostOpen(false)} title={T('hud.hostControls')}>
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

      {/* Role reveal animation overlay */}
      {showRoleReveal && myRole && (
        <RoleRevealOverlay
          myRole={myRole}
          onDismiss={() => setShowRoleReveal(false)}
        />
      )}

      {/* How to play */}
      {howToOpen && <HowToPlay onClose={() => setHowToOpen(false)} />}

      {/* Chat drawer — mobile only (desktop uses the sidebar) */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" onClick={() => setChatOpen(false)}>
          <div className="flex-1 bg-black/50 backdrop-blur-[1px]" />
          <div className="relative w-80 max-w-[85vw]" onClick={e => e.stopPropagation()}>
            <ChatFeed
              messages={chatMessages}
              events={room.eventLog}
              playerId={playerId}
              canChat={canChat}
              wolfMode={chatWolfMode}
            deadMode={chatDeadMode}
              disabledReason={chatDisabledReason}
              onSend={(text) => socket?.emit('chat_send', { text })}
              showReactions={(room.phase === 'day' || room.phase === 'voting') && imAlive}
              onReact={(emoji) => socket?.emit('send_reaction', { emoji })}
              onClose={() => setChatOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Seer inspection reveal */}
      {seerReveal && (
        <SeerRevealModal
          key={seerReveal.key}
          targetName={seerReveal.targetName}
          role={seerReveal.role}
          onDismiss={() => setSeerReveal(null)}
        />
      )}

      {/* Action feedback toast */}
      {toast && <ActionToast toast={toast} />}

      {/* Announcement toast (who died / dawn) — floats then auto-dismisses */}
      {announce && (
        <div className="fixed top-14 lg:top-20 left-1/2 -translate-x-1/2 z-[70] px-4 w-full max-w-md pointer-events-none">
          <div
            key={announce.key}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg"
            style={{
              backgroundColor: 'rgba(20,8,0,0.96)',
              border: '1px solid rgba(180,83,9,0.50)',
              borderLeft: '3px solid rgba(217,119,6,0.80)',
              boxShadow: '0 6px 26px rgba(0,0,0,0.7), 0 0 18px rgba(217,119,6,0.22)',
              animation: 'announce-in 0.4s ease-out',
            }}
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4 shrink-0" fill="rgba(217,119,6,0.9)">
              <path d="M10 2a6 6 0 0 0-6 6c0 2.5 1.5 4.7 3.7 5.6V15h4.6v-1.4A6 6 0 0 0 10 2zm-1 11v1h2v-1H9zm1-9a4 4 0 0 1 4 4 4 4 0 0 1-2.6 3.7l-.4.1V13h-2v-1.2l-.4-.1A4 4 0 0 1 6 8a4 4 0 0 1 4-4z"/>
            </svg>
            <p className="text-[12px] italic leading-snug flex-1" style={{ color: '#fde68a' }}>{announce.text}</p>
          </div>
        </div>
      )}
    </div>
  );
}
