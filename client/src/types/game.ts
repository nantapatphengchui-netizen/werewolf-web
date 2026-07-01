export type Role = 'werewolf' | 'villager' | 'seer' | 'doctor' | 'hunter' | 'witch' | 'bodyguard';

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
    description: 'You are a Werewolf. Eliminate the villagers each night and avoid suspicion during the day.',
    nightAction: 'Choose a villager to eliminate tonight.',
    accentColor: '#dc2626',
    bgClass: 'bg-red-950',
  },
  seer: {
    name: 'Seer',
    alignment: 'village',
    description: 'You are the Seer. Each night you may investigate one player to learn their true role.',
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
  hunter: {
    name: 'Hunter',
    alignment: 'village',
    description: 'You are the Hunter. If you are eliminated — by vote or by night — you may take one player with you.',
    nightAction: null,
    accentColor: '#ea580c',
    bgClass: 'bg-orange-950',
  },
  witch: {
    name: 'Witch',
    alignment: 'village',
    description: 'You are the Witch. You hold one save potion and one poison potion — each usable only once per game.',
    nightAction: 'After the werewolves strike, decide whether to save or poison a player.',
    accentColor: '#9333ea',
    bgClass: 'bg-purple-950',
  },
  bodyguard: {
    name: 'Bodyguard',
    alignment: 'village',
    description: 'You are the Bodyguard. Each night you protect one player. You cannot guard the same person two nights in a row.',
    nightAction: 'Choose a player to protect from the werewolves tonight.',
    accentColor: '#2563eb',
    bgClass: 'bg-blue-950',
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
  suspicionMap: Record<string, string[]>;
  hunterPendingShot: string | null;
}
