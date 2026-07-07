export type Role = 'werewolf' | 'villager' | 'seer' | 'doctor' | 'hunter' | 'witch' | 'bodyguard' | 'jester';

/** Host-configurable game options (lobby only). */
export interface GameSettings {
  /** desired werewolf count — clamped to a safe max at game start */
  werewolfCount: number;
  /** which optional roles may appear (villager/werewolf are always in play) */
  roles: {
    seer: boolean;
    doctor: boolean;
    bodyguard: boolean;
    witch: boolean;
    hunter: boolean;
    jester: boolean;
  };
  /** phase lengths in ms */
  timers: {
    night: number;
    day: number;
    voting: number;
  };
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
  isAlive: boolean;
  isBot?: boolean;
  revealedRole?: Role;
}

export type GamePhase = 'lobby' | 'night' | 'day' | 'voting' | 'ended';

export interface PublicVotes {
  hasVoted: string[];
  tally: Record<string, number>;
}

/** i18n-friendly message: a translation key + interpolation params. */
export interface GameMessage {
  code: string;
  params?: Record<string, string | number>;
}

export interface GameEvent {
  id: string;
  code: string;
  params?: Record<string, string | number>;
  timestamp: number;
}

export interface RoomState {
  code: string;
  hostId: string;
  players: Player[];
  phase: GamePhase;
  maxPlayers: number;
  minPlayers: number;
  createdAt: number;
  round: number;
  lastAnnouncement: GameMessage | null;
  winner: 'village' | 'werewolf' | 'jester' | null;
  settings: GameSettings;
  publicVotes: PublicVotes | null;
  phaseEndAt: number | null;
  readyPlayers: string[];
  eventLog: GameEvent[];
  isLocked: boolean;
  timerPaused: boolean;
  pausedTimeRemaining: number | null;
  /** hunterId waiting to fire their final shot; null when not pending */
  hunterPendingShot: string | null;
}
