export type Role = 'werewolf' | 'villager' | 'seer' | 'doctor';

export interface RoleInfo {
  name: string;
  alignment: 'village' | 'werewolf';
  description: string;
  nightAction: string | null;
  accentColor: string;
  bgClass: string;
}

export const ROLE_INFO: Record<Role, RoleInfo> = {
  werewolf: {
    name: 'Werewolf',
    alignment: 'werewolf',
    description: 'You are a Werewolf. Eliminate the villagers and avoid suspicion.',
    nightAction: 'Each night, choose a villager to eliminate.',
    accentColor: '#dc2626',
    bgClass: 'bg-red-950',
  },
  seer: {
    name: 'Seer',
    alignment: 'village',
    description: 'You are the Seer. Each night you may investigate one player to learn their role.',
    nightAction: 'Investigate a player to reveal their true nature.',
    accentColor: '#7c3aed',
    bgClass: 'bg-violet-950',
  },
  doctor: {
    name: 'Doctor',
    alignment: 'village',
    description: 'You are the Doctor. Each night you may protect one player from being eliminated.',
    nightAction: 'Choose a player to shield from the werewolves tonight.',
    accentColor: '#059669',
    bgClass: 'bg-emerald-950',
  },
  villager: {
    name: 'Villager',
    alignment: 'village',
    description: 'You are a Villager. Use reason and cunning to find and eliminate all werewolves.',
    nightAction: null,
    accentColor: '#d97706',
    bgClass: 'bg-amber-950',
  },
};

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
  phaseEndAt: number | null;
  readyPlayers: string[];
  eventLog: GameEvent[];
  isLocked: boolean;
  timerPaused: boolean;
  pausedTimeRemaining: number | null;
}
