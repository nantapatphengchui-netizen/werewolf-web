export type Role = 'werewolf' | 'villager' | 'seer' | 'doctor';

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

export interface GameEvent {
  id: string;
  text: string;
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
  lastAnnouncement: string | null;
  winner: 'village' | 'werewolf' | null;
  publicVotes: PublicVotes | null;
  phaseEndAt: number | null;          // server timestamp (ms) when phase timer expires; null when paused
  readyPlayers: string[];             // persistentIds of lobby-ready players
  eventLog: GameEvent[];              // public game events, oldest first (max 30)
  isLocked: boolean;                  // when true, new players cannot join
  timerPaused: boolean;               // when true, phase timer is paused
  pausedTimeRemaining: number | null; // ms remaining when timer was paused
}
