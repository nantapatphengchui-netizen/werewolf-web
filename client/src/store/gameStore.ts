import { create } from 'zustand';
import type { RoomState, Role } from '@/types/game';

export interface SeerEntry {
  round: number;
  targetId: string;
  targetName: string;
  role: Role;
}

export interface DayReaction {
  id: string;
  fromName: string;
  targetName: string;
}

interface GameStore {
  room: RoomState | null;
  playerId: string | null;
  myRole: Role | null;
  werewolfIds: string[];
  seerLog: SeerEntry[];
  dayReactions: DayReaction[];
  error: string | null;
  isConnected: boolean;

  setRoom: (room: RoomState, playerId: string) => void;
  updateRoom: (room: RoomState) => void;
  setMyRole: (role: Role, werewolfIds: string[]) => void;
  addSeerResult: (entry: SeerEntry) => void;
  addDayReaction: (r: DayReaction) => void;
  clearDayReactions: () => void;
  setError: (error: string | null) => void;
  setConnected: (connected: boolean) => void;
  clearGameState: () => void;
  clearRoom: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  room: null,
  playerId: null,
  myRole: null,
  werewolfIds: [],
  seerLog: [],
  dayReactions: [],
  error: null,
  isConnected: false,

  setRoom: (room, playerId) => set({ room, playerId, error: null }),
  updateRoom: (room) => set({ room }),
  setMyRole: (myRole, werewolfIds) => set({ myRole, werewolfIds }),
  addSeerResult: (entry) => set(s => ({ seerLog: [...s.seerLog, entry] })),
  addDayReaction: (r) => set(s => {
    const deduped = s.dayReactions.filter(x => !(x.fromName === r.fromName && x.targetName === r.targetName));
    return { dayReactions: [...deduped.slice(-2), r] };
  }),
  clearDayReactions: () => set({ dayReactions: [] }),
  setError: (error) => set({ error }),
  setConnected: (isConnected) => set({ isConnected }),
  clearGameState: () => set({ myRole: null, werewolfIds: [], seerLog: [], dayReactions: [] }),
  clearRoom: () => set({ room: null, playerId: null, myRole: null, werewolfIds: [], seerLog: [], dayReactions: [] }),
}));
