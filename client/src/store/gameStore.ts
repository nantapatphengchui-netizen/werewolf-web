import { create } from 'zustand';
import type { RoomState, Role } from '@/types/game';

export interface SeerEntry {
  round: number;
  targetId: string;
  targetName: string;
  role: Role;
}

interface GameStore {
  room: RoomState | null;
  playerId: string | null;
  myRole: Role | null;
  werewolfIds: string[];
  seerLog: SeerEntry[];
  error: string | null;
  isConnected: boolean;

  setRoom: (room: RoomState, playerId: string) => void;
  updateRoom: (room: RoomState) => void;
  setMyRole: (role: Role, werewolfIds: string[]) => void;
  addSeerResult: (entry: SeerEntry) => void;
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
  error: null,
  isConnected: false,

  setRoom: (room, playerId) => set({ room, playerId, error: null }),
  updateRoom: (room) => set({ room }),
  setMyRole: (myRole, werewolfIds) => set({ myRole, werewolfIds }),
  addSeerResult: (entry) => set(s => ({ seerLog: [...s.seerLog, entry] })),
  setError: (error) => set({ error }),
  setConnected: (isConnected) => set({ isConnected }),
  clearGameState: () => set({ myRole: null, werewolfIds: [], seerLog: [] }),
  clearRoom: () => set({ room: null, playerId: null, myRole: null, werewolfIds: [], seerLog: [] }),
}));
