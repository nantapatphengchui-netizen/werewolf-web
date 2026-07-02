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

export interface ChatMessage {
  id: string;
  channel: 'public' | 'wolf';
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface WitchNightInfo {
  attackedPlayerId:   string | null;
  attackedPlayerName: string | null;
  savePotionUsed:     boolean;
  poisonPotionUsed:   boolean;
}

interface GameStore {
  room: RoomState | null;
  playerId: string | null;
  myRole: Role | null;
  werewolfIds: string[];
  seerLog: SeerEntry[];
  dayReactions: DayReaction[];
  chatMessages: ChatMessage[];
  witchNightInfo: WitchNightInfo | null;
  witchActionSubmitted: boolean;
  error: string | null;
  isConnected: boolean;

  setRoom: (room: RoomState, playerId: string) => void;
  updateRoom: (room: RoomState) => void;
  setMyRole: (role: Role, werewolfIds: string[]) => void;
  addSeerResult: (entry: SeerEntry) => void;
  addDayReaction: (r: DayReaction) => void;
  clearDayReactions: () => void;
  addChatMessage: (m: ChatMessage) => void;
  setWitchNightInfo: (info: WitchNightInfo | null) => void;
  setWitchActionSubmitted: (v: boolean) => void;
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
  chatMessages: [],
  witchNightInfo: null,
  witchActionSubmitted: false,
  error: null,
  isConnected: false,

  setRoom:    (room, playerId) => set({ room, playerId, error: null }),
  updateRoom: (room) => set({ room }),
  setMyRole:  (myRole, werewolfIds) => set({ myRole, werewolfIds }),
  addSeerResult: (entry) => set(s => {
    // Ignore duplicates — the server replays the seer's history on reconnect
    if (s.seerLog.some(e => e.round === entry.round && e.targetId === entry.targetId)) return s;
    return { seerLog: [...s.seerLog, entry] };
  }),
  addDayReaction: (r) => set(s => {
    const deduped = s.dayReactions.filter(x => !(x.fromName === r.fromName && x.targetName === r.targetName));
    return { dayReactions: [...deduped.slice(-2), r] };
  }),
  clearDayReactions: () => set({ dayReactions: [] }),
  addChatMessage: (m) => set(s => (
    s.chatMessages.some(x => x.id === m.id)
      ? s
      : { chatMessages: [...s.chatMessages.slice(-199), m] }
  )),
  setWitchNightInfo:     (witchNightInfo) => set({ witchNightInfo }),
  setWitchActionSubmitted: (witchActionSubmitted) => set({ witchActionSubmitted }),
  setError:     (error) => set({ error }),
  setConnected: (isConnected) => set({ isConnected }),
  clearGameState: () => set({
    myRole: null, werewolfIds: [], seerLog: [], dayReactions: [], chatMessages: [],
    witchNightInfo: null, witchActionSubmitted: false,
  }),
  clearRoom: () => set({
    room: null, playerId: null, myRole: null, werewolfIds: [], seerLog: [], dayReactions: [], chatMessages: [],
    witchNightInfo: null, witchActionSubmitted: false,
  }),
}));
