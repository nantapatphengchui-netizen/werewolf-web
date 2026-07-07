import type { Player, RoomState, GamePhase, Role, GameEvent, GameMessage, GameSettings } from '../types/game';
import { assignRoles, maxWolvesFor } from './roles/roleAssigner';

const MIN_PLAYERS = 5;
const MAX_PLAYERS = 12;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_EVENT_LOG = 30;
const MAX_CHAT_LOG  = 60;

export const PHASE_DURATIONS: Record<string, number> = {
  night:  45_000,
  day:   120_000,
  voting: 60_000,
};

export function defaultSettings(): GameSettings {
  return {
    werewolfCount: 2,
    roles: { seer: true, doctor: true, bodyguard: true, witch: true, hunter: true, jester: false },
    timers: { night: PHASE_DURATIONS.night, day: PHASE_DURATIONS.day, voting: PHASE_DURATIONS.voting },
  };
}

const clampMs = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === 'number' && isFinite(v) ? Math.round(v) : fallback;
  return Math.min(max, Math.max(min, n));
};

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeEventId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Tally with random tie-break — used for the werewolves' nightly kill. */
function tallyVotes(votes: Map<string, string>): string | null {
  if (votes.size === 0) return null;
  const counts = new Map<string, number>();
  for (const targetId of votes.values()) counts.set(targetId, (counts.get(targetId) ?? 0) + 1);
  const max = Math.max(...counts.values());
  const candidates = [...counts.entries()].filter(([, c]) => c === max).map(([id]) => id);
  return pickRandom(candidates);
}

/** Tally with NO tie-break — a tie yields null. Used for the village exile vote. */
function tallyVotesStrict(votes: Map<string, string>): string | null {
  if (votes.size === 0) return null;
  const counts = new Map<string, number>();
  for (const targetId of votes.values()) counts.set(targetId, (counts.get(targetId) ?? 0) + 1);
  const max = Math.max(...counts.values());
  const candidates = [...counts.entries()].filter(([, c]) => c === max).map(([id]) => id);
  return candidates.length === 1 ? candidates[0] : null;
}

// ── Shared result types ───────────────────────────────────────────────────────

export type SeerResultData = {
  seerId: string;
  targetId: string;
  targetName: string;
  role: Role;
  round: number;
};

export type HunterPendingInfo = {
  hunterId: string;
  availableTargetIds: string[];
};

export type WitchNightInfo = {
  witchId: string;
  attackedPlayerId: string | null;
  attackedPlayerName: string | null;
  savePotionUsed: boolean;
  poisonPotionUsed: boolean;
};

export interface ChatMessage {
  id: string;
  channel: 'public' | 'wolf' | 'dead';
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

/** Full serialisable snapshot of all game state (for Redis persistence). */
export interface PersistSnapshot {
  rooms: RoomState[];
  roleMap: [string, Role][];
  seerResults: [string, SeerResultData[]][];
  bodyguardLastProtected: [string, string][];
  witchSaveUsed: [string, boolean][];
  witchPoisonUsed: [string, boolean][];
  nightVotes: [string, [string, string][]][];
  seerChoices: [string, string][];
  doctorChoices: [string, string][];
  bodyguardChoices: [string, string][];
  witchAction: [string, { save: boolean; poisonTargetId: string | null }][];
  witchPhase1Done: [string, boolean][];
  dayVotes: [string, [string, string][]][];
  chatLog: [string, ChatMessage[]][];
}

// ── RoomManager ───────────────────────────────────────────────────────────────

export class RoomManager {
  private rooms          = new Map<string, RoomState>();
  private playerRoomMap  = new Map<string, string>();  // persistentId → roomCode
  private roleMap        = new Map<string, Role>();

  private socketToPlayer = new Map<string, string>();  // socketId → persistentId
  private playerToSocket = new Map<string, string>();  // persistentId → socketId

  // Night action stores
  private nightVotes     = new Map<string, Map<string, string>>(); // roomCode → (pid → targetId)
  private seerChoices    = new Map<string, string>();              // roomCode → targetId
  private doctorChoices  = new Map<string, string>();              // roomCode → targetId
  private bodyguardChoices       = new Map<string, string>();      // roomCode → targetId
  private bodyguardLastProtected = new Map<string, string>();      // roomCode → targetId (from prev night)

  // Witch state
  private witchSaveUsed   = new Map<string, boolean>();            // roomCode → used
  private witchPoisonUsed = new Map<string, boolean>();            // roomCode → used
  private witchAction     = new Map<string, { save: boolean; poisonTargetId: string | null }>(); // roomCode → action
  private witchPhase1Done = new Map<string, boolean>();            // roomCode → info already sent

  // Day votes
  private dayVotes = new Map<string, Map<string, string>>();       // roomCode → (pid → targetId)

  // Seer inspection history (for reconnect replay), keyed by seer's persistentId
  private seerResults = new Map<string, SeerResultData[]>();

  // Recent chat, keyed by roomCode — capped ring buffer for reconnect/restart replay
  private chatLog = new Map<string, ChatMessage[]>();

  // ── Socket tracking ──────────────────────────────────────────────────────────

  getSocketId(persistentId: string): string | undefined { return this.playerToSocket.get(persistentId); }
  roomCount(): number { return this.rooms.size; }

  // ── Room lifecycle ───────────────────────────────────────────────────────────

  createRoom(socketId: string, persistentId: string, hostName: string): RoomState {
    let code = generateCode();
    while (this.rooms.has(code)) code = generateCode();

    const host: Player = { id: persistentId, name: hostName, isHost: true, isConnected: true, isAlive: true };
    const room: RoomState = {
      code, hostId: persistentId, players: [host], phase: 'lobby',
      maxPlayers: MAX_PLAYERS, minPlayers: MIN_PLAYERS, createdAt: Date.now(),
      round: 0, lastAnnouncement: null, winner: null, publicVotes: null,
      phaseEndAt: null, readyPlayers: [], eventLog: [], isLocked: false,
      timerPaused: false, pausedTimeRemaining: null, hunterPendingShot: null,
      settings: defaultSettings(),
    };

    this.rooms.set(code, room);
    this.playerRoomMap.set(persistentId, code);
    this.socketToPlayer.set(socketId, persistentId);
    this.playerToSocket.set(persistentId, socketId);
    return room;
  }

  joinRoom(roomCode: string, socketId: string, persistentId: string, playerName: string): RoomState | { error: string } {
    const code = roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return { error: 'Room not found.' };
    if (room.phase !== 'lobby') return { error: 'Game already in progress.' };
    if (room.isLocked) return { error: 'Room is locked. The host is not accepting new players.' };
    if (room.players.length >= room.maxPlayers) return { error: 'Room is full.' };
    if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) return { error: 'That name is already taken in this room.' };
    if (this.playerRoomMap.has(persistentId)) return { error: 'You are already in a room.' };

    const player: Player = { id: persistentId, name: playerName, isHost: false, isConnected: true, isAlive: true };
    room.players.push(player);
    this.playerRoomMap.set(persistentId, code);
    this.socketToPlayer.set(socketId, persistentId);
    this.playerToSocket.set(persistentId, socketId);
    return room;
  }

  leaveRoom(persistentId: string): { roomCode: string | null; room: RoomState | null } {
    const roomCode = this.playerRoomMap.get(persistentId);
    if (!roomCode) return { roomCode: null, room: null };

    const socketId = this.playerToSocket.get(persistentId);
    if (socketId) this.socketToPlayer.delete(socketId);
    this.playerToSocket.delete(persistentId);

    const room = this.rooms.get(roomCode);
    if (!room) { this.playerRoomMap.delete(persistentId); return { roomCode, room: null }; }

    room.players = room.players.filter(p => p.id !== persistentId);
    room.readyPlayers = room.readyPlayers.filter(id => id !== persistentId);
    this.playerRoomMap.delete(persistentId);
    this.roleMap.delete(persistentId);
    this.seerResults.delete(persistentId);
    this.nightVotes.get(roomCode)?.delete(persistentId);
    this.dayVotes.get(roomCode)?.delete(persistentId);

    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      this.clearNightMaps(roomCode);
      this.dayVotes.delete(roomCode);
      this.chatLog.delete(roomCode);
      return { roomCode, room: null };
    }

    if (room.hostId === persistentId) {
      const nextHost = room.players.find(p => p.isConnected) ?? room.players[0];
      nextHost.isHost = true;
      room.hostId = nextHost.id;
    }

    return { roomCode, room };
  }

  markOffline(socketId: string): { roomCode: string; room: RoomState; wasHost: boolean } | null {
    const persistentId = this.socketToPlayer.get(socketId);
    if (!persistentId) return null;
    this.socketToPlayer.delete(socketId);
    this.playerToSocket.delete(persistentId);
    const roomCode = this.playerRoomMap.get(persistentId);
    if (!roomCode) return null;
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    const player = room.players.find(p => p.id === persistentId);
    if (player) player.isConnected = false;
    return { roomCode, room, wasHost: room.hostId === persistentId };
  }

  tryReconnect(persistentId: string, socketId: string): { room: RoomState; role: Role | null; werewolfIds: string[] } | null {
    const roomCode = this.playerRoomMap.get(persistentId);
    if (!roomCode) return null;
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    const player = room.players.find(p => p.id === persistentId);
    if (!player) return null;
    player.isConnected = true;
    const oldSocketId = this.playerToSocket.get(persistentId);
    if (oldSocketId) this.socketToPlayer.delete(oldSocketId);
    this.socketToPlayer.set(socketId, persistentId);
    this.playerToSocket.set(persistentId, socketId);
    return { room, role: this.roleMap.get(persistentId) ?? null, werewolfIds: this.getWerewolfIds(roomCode) };
  }

  transferHost(roomCode: string): RoomState | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    const newHost = room.players.find(p => p.isConnected && !p.isBot && p.id !== room.hostId);
    if (!newHost) return null;
    const oldHost = room.players.find(p => p.id === room.hostId);
    if (oldHost) oldHost.isHost = false;
    newHost.isHost = true;
    room.hostId = newHost.id;
    console.log(`[room] Host transferred in ${roomCode} → ${newHost.name}`);
    return room;
  }

  getRoomByPlayer(persistentId: string): RoomState | undefined {
    const code = this.playerRoomMap.get(persistentId);
    return code ? this.rooms.get(code) : undefined;
  }

  // ── Ready system ─────────────────────────────────────────────────────────────

  toggleReady(persistentId: string): { ok: boolean; error?: string; room?: RoomState } {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return { ok: false, error: 'Not in a room.' };
    if (room.phase !== 'lobby') return { ok: false, error: 'Game has already started.' };
    const idx = room.readyPlayers.indexOf(persistentId);
    if (idx === -1) room.readyPlayers.push(persistentId);
    else room.readyPlayers.splice(idx, 1);
    return { ok: true, room };
  }

  canStartGame(persistentId: string): { ok: true } | { ok: false; error: string } {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return { ok: false, error: 'You are not in a room.' };
    if (room.hostId !== persistentId) return { ok: false, error: 'Only the host can start the game.' };
    if (room.phase !== 'lobby') return { ok: false, error: 'Game already started.' };
    if (room.players.length < room.minPlayers) return { ok: false, error: `Need at least ${room.minPlayers} players (currently ${room.players.length}).` };
    const notReady = room.players.filter(p => !room.readyPlayers.includes(p.id));
    if (notReady.length > 0) return { ok: false, error: `Waiting for ${notReady.length} player${notReady.length !== 1 ? 's' : ''} to ready up.` };
    return { ok: true };
  }

  /** Effective phase duration — host settings with a hard fallback. */
  private phaseMs(room: RoomState, phase: 'night' | 'day' | 'voting'): number {
    return room.settings?.timers?.[phase] ?? PHASE_DURATIONS[phase];
  }

  /** Sanitize + apply host game settings (lobby only). */
  updateSettings(hostPid: string, incoming: Partial<GameSettings>): { ok: boolean; error?: string; room?: RoomState } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return check;
    const room = check.room;
    if (room.phase !== 'lobby') return { ok: false, error: 'Settings can only be changed in the lobby.' };

    const cur = room.settings ?? defaultSettings();
    room.settings = {
      werewolfCount: clampMs(incoming.werewolfCount, 1, 4, cur.werewolfCount),
      roles: {
        seer:      !!(incoming.roles?.seer      ?? cur.roles.seer),
        doctor:    !!(incoming.roles?.doctor    ?? cur.roles.doctor),
        bodyguard: !!(incoming.roles?.bodyguard ?? cur.roles.bodyguard),
        witch:     !!(incoming.roles?.witch     ?? cur.roles.witch),
        hunter:    !!(incoming.roles?.hunter    ?? cur.roles.hunter),
        jester:    !!(incoming.roles?.jester    ?? cur.roles.jester),
      },
      timers: {
        night:  clampMs(incoming.timers?.night,  15_000, 180_000, cur.timers.night),
        day:    clampMs(incoming.timers?.day,    30_000, 600_000, cur.timers.day),
        voting: clampMs(incoming.timers?.voting, 15_000, 300_000, cur.timers.voting),
      },
    };
    return { ok: true, room };
  }

  startGame(persistentId: string): { room: RoomState; roleMap: Map<string, Role> } | null {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return null;

    if (!room.settings) room.settings = defaultSettings();
    const roleMap = assignRoles(room.players.map(p => p.id), room.settings);
    for (const [pid, role] of roleMap) this.roleMap.set(pid, role);

    room.players.forEach(p => { p.isAlive = true; delete p.revealedRole; });
    room.phase          = 'night';
    room.round          = 1;
    room.lastAnnouncement = null;
    room.winner         = null;
    room.publicVotes    = null;
    room.readyPlayers   = [];
    room.phaseEndAt     = Date.now() + this.phaseMs(room, 'night');
    room.timerPaused    = false;
    room.pausedTimeRemaining = null;
    room.eventLog       = [];
    room.hunterPendingShot = null;

    this.clearNightMaps(room.code);
    this.dayVotes.delete(room.code);
    this.chatLog.delete(room.code);
    this.witchSaveUsed.delete(room.code);
    this.witchPoisonUsed.delete(room.code);
    this.bodyguardLastProtected.delete(room.code);
    room.players.forEach(p => this.seerResults.delete(p.id));

    this.addEvent(room, 'evt.gameBegun');
    this.addEvent(room, 'evt.nightFalls');
    return { room, roleMap };
  }

  getRole(persistentId: string): Role | undefined { return this.roleMap.get(persistentId); }

  getWerewolfIds(roomCode: string): string[] {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    return room.players.filter(p => this.roleMap.get(p.id) === 'werewolf').map(p => p.id);
  }

  /** Append a chat message to the room's capped ring buffer. */
  addChatMessage(roomCode: string, msg: ChatMessage): void {
    const log = this.chatLog.get(roomCode) ?? [];
    log.push(msg);
    if (log.length > MAX_CHAT_LOG) log.splice(0, log.length - MAX_CHAT_LOG);
    this.chatLog.set(roomCode, log);
  }

  /** Recent chat for a room — replayed on reconnect (caller filters wolf-channel visibility). */
  getChatLog(roomCode: string): ChatMessage[] {
    return this.chatLog.get(roomCode) ?? [];
  }

  /** Seer's past inspection results — replayed to the seer on reconnect. */
  getSeerHistory(persistentId: string): SeerResultData[] {
    if (this.roleMap.get(persistentId) !== 'seer') return [];
    return this.seerResults.get(persistentId) ?? [];
  }

  /** If this player is a Witch with a still-pending night decision, rebuild their prompt. */
  getPendingWitchInfo(persistentId: string): WitchNightInfo | null {
    const roomCode = this.playerRoomMap.get(persistentId);
    if (!roomCode) return null;
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== 'night') return null;
    if (room.hunterPendingShot) return null;
    if (this.roleMap.get(persistentId) !== 'witch') return null;
    const me = room.players.find(p => p.id === persistentId);
    if (!me?.isAlive) return null;
    // Only if the prompt was already sent this night and the witch has not yet acted
    if (!this.witchPhase1Done.get(roomCode)) return null;
    if (this.witchAction.has(roomCode)) return null;
    const saveUsed   = this.witchSaveUsed.get(roomCode)   ?? false;
    const poisonUsed = this.witchPoisonUsed.get(roomCode) ?? false;
    return this.buildWitchNightInfo(room, persistentId, saveUsed, poisonUsed);
  }

  // ── Night phase ──────────────────────────────────────────────────────────────

  submitNightAction(
    persistentId: string,
    targetId: string
  ): {
    ok: boolean; error?: string; room?: RoomState;
    seerResult?: SeerResultData;
    witchNeedsInfo?: WitchNightInfo;
    hunterPendingInfo?: HunterPendingInfo;
    wolfVoteTally?: { tally: Record<string, number>; wolfIds: string[] };
  } {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return { ok: false, error: 'Not in a room.' };
    if (room.phase !== 'night') return { ok: false, error: 'Not night phase.' };
    if (room.hunterPendingShot) return { ok: false, error: 'Waiting for the Hunter\'s final shot.' };

    const myRole = this.roleMap.get(persistentId);
    const me     = room.players.find(p => p.id === persistentId);
    if (!me?.isAlive) return { ok: false, error: 'You are dead.' };

    const target = room.players.find(p => p.id === targetId);
    if (!target) return { ok: false, error: 'Invalid target.' };
    if (!target.isAlive) return { ok: false, error: 'Cannot target a dead player.' };

    switch (myRole) {
      case 'werewolf':
        if (this.roleMap.get(targetId) === 'werewolf') return { ok: false, error: 'Cannot target a fellow werewolf.' };
        if (!this.nightVotes.has(room.code)) this.nightVotes.set(room.code, new Map());
        this.nightVotes.get(room.code)!.set(persistentId, targetId);
        break;
      case 'seer':
        if (targetId === persistentId) return { ok: false, error: 'Cannot inspect yourself.' };
        this.seerChoices.set(room.code, targetId);
        break;
      case 'doctor':
        this.doctorChoices.set(room.code, targetId);
        break;
      case 'bodyguard': {
        const lastProtected = this.bodyguardLastProtected.get(room.code);
        if (targetId === lastProtected) return { ok: false, error: 'Cannot protect the same player two nights in a row.' };
        this.bodyguardChoices.set(room.code, targetId);
        break;
      }
      default:
        return { ok: false, error: 'You have no night action.' };
    }

    // Live werewolf kill-vote tally, broadcast to the pack so they can coordinate
    const wolfVoteTally = myRole === 'werewolf' ? this.buildWolfVoteTally(room.code) : undefined;

    // Check if witch needs to be informed before full resolution
    const witch = room.players.find(p => p.isAlive && this.roleMap.get(p.id) === 'witch');
    if (witch && this.isPhase1NightReady(room) && !this.witchPhase1Done.get(room.code)) {
      const saveUsed   = this.witchSaveUsed.get(room.code)   ?? false;
      const poisonUsed = this.witchPoisonUsed.get(room.code) ?? false;
      if (!saveUsed || !poisonUsed) {
        this.witchPhase1Done.set(room.code, true);
        const witchInfo = this.buildWitchNightInfo(room, witch.id, saveUsed, poisonUsed);
        return { ok: true, witchNeedsInfo: witchInfo, wolfVoteTally };
      }
    }

    if (this.isNightReady(room)) {
      const resolution = this.resolveNight(room);
      return { ok: true, room, ...resolution, wolfVoteTally };
    }
    return { ok: true, wolfVoteTally };
  }

  private buildWolfVoteTally(roomCode: string): { tally: Record<string, number>; wolfIds: string[] } {
    const votes = this.nightVotes.get(roomCode);
    const tally: Record<string, number> = {};
    if (votes) for (const targetId of votes.values()) tally[targetId] = (tally[targetId] ?? 0) + 1;
    return { tally, wolfIds: this.getWerewolfIds(roomCode) };
  }

  submitWitchAction(
    persistentId: string,
    action: { save: boolean; poisonTargetId: string | null }
  ): {
    ok: boolean; error?: string; room?: RoomState;
    seerResult?: SeerResultData;
    hunterPendingInfo?: HunterPendingInfo;
  } {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return { ok: false, error: 'Not in a room.' };
    if (room.phase !== 'night') return { ok: false, error: 'Not night phase.' };
    if (room.hunterPendingShot) return { ok: false, error: 'Waiting for the Hunter\'s final shot.' };
    if (this.roleMap.get(persistentId) !== 'witch') return { ok: false, error: 'You are not the Witch.' };

    const me = room.players.find(p => p.id === persistentId);
    if (!me?.isAlive) return { ok: false, error: 'You are dead.' };
    if (this.witchAction.has(room.code)) return { ok: false, error: 'Already submitted your night action.' };

    const saveUsed   = this.witchSaveUsed.get(room.code)   ?? false;
    const poisonUsed = this.witchPoisonUsed.get(room.code) ?? false;
    if (action.save && saveUsed) return { ok: false, error: 'Save potion already used.' };
    if (action.poisonTargetId && poisonUsed) return { ok: false, error: 'Poison potion already used.' };
    if (action.poisonTargetId) {
      const target = room.players.find(p => p.id === action.poisonTargetId);
      if (!target?.isAlive) return { ok: false, error: 'Cannot poison a dead player.' };
      if (action.poisonTargetId === persistentId) return { ok: false, error: 'Cannot poison yourself.' };
    }

    this.witchAction.set(room.code, action);

    if (this.isNightReady(room)) {
      const resolution = this.resolveNight(room);
      return { ok: true, room, ...resolution };
    }
    return { ok: true };
  }

  submitHunterShot(
    persistentId: string,
    targetId: string | null
  ): { ok: boolean; error?: string; room?: RoomState } {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return { ok: false, error: 'Not in a room.' };
    if (room.hunterPendingShot !== persistentId) return { ok: false, error: 'No pending hunter shot.' };
    if (room.phase === 'ended') return { ok: false, error: 'Game is already over.' };

    room.hunterPendingShot = null;

    if (targetId) {
      const target = room.players.find(p => p.id === targetId && p.isAlive);
      if (!target) return { ok: false, error: 'Invalid target.' };
      target.isAlive = false;
      target.revealedRole = this.roleMap.get(targetId);
      this.addEvent(room, 'evt.hunterShotHit', { name: target.name });
    } else {
      this.addEvent(room, 'evt.hunterShotSkip');
    }

    const winner = this.checkWin(room);
    if (winner) {
      room.phase  = 'ended';
      room.winner = winner;
      room.phaseEndAt = null;
      this.addEvent(room, winner === 'village' ? 'evt.villageWon' : 'evt.wolvesWon');
      this.revealAllRoles(room);
    } else {
      // Start the phase timer (phase is already set to day or night by prior resolution)
      room.phaseEndAt          = Date.now() + this.phaseMs(room, room.phase as 'night' | 'day' | 'voting');
      room.timerPaused         = false;
      room.pausedTimeRemaining = null;
    }

    return { ok: true, room };
  }

  skipHunterShot(roomCode: string): { ok: boolean; room?: RoomState } {
    const room = this.rooms.get(roomCode);
    if (!room || !room.hunterPendingShot) return { ok: false };
    room.hunterPendingShot = null;
    this.addEvent(room, 'evt.hunterShotExpired');
    if (room.phase !== 'ended') {
      room.phaseEndAt          = Date.now() + this.phaseMs(room, room.phase as 'night' | 'day' | 'voting');
      room.timerPaused         = false;
      room.pausedTimeRemaining = null;
    }
    return { ok: true, room };
  }

  forceNightResolve(roomCode: string): { ok: boolean; room?: RoomState; seerResult?: SeerResultData; hunterPendingInfo?: HunterPendingInfo } {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== 'night') return { ok: false };

    // Auto-fill werewolf votes
    const wolves = room.players.filter(p => p.isAlive && this.roleMap.get(p.id) === 'werewolf');
    if (!this.nightVotes.has(roomCode)) this.nightVotes.set(roomCode, new Map());
    const wolfVotes = this.nightVotes.get(roomCode)!;
    for (const wolf of wolves) {
      if (!wolfVotes.has(wolf.id)) {
        const validTargets = room.players.filter(p => p.isAlive && this.roleMap.get(p.id) !== 'werewolf');
        if (validTargets.length > 0) wolfVotes.set(wolf.id, pickRandom(validTargets).id);
      }
    }

    // Skip witch (treat as do nothing)
    if (!this.witchAction.has(roomCode)) {
      const witch = room.players.find(p => p.isAlive && this.roleMap.get(p.id) === 'witch');
      if (witch) this.witchAction.set(roomCode, { save: false, poisonTargetId: null });
    }

    const resolution = this.resolveNight(room);
    return { ok: true, room, ...resolution };
  }

  // ── Night readiness checks ───────────────────────────────────────────────────

  /** Phase-1: all roles except Witch have submitted */
  private isPhase1NightReady(room: RoomState): boolean {
    const wolves    = room.players.filter(p => p.isAlive && this.roleMap.get(p.id) === 'werewolf');
    const seer      = room.players.find(p => p.isAlive && this.roleMap.get(p.id) === 'seer');
    const doctor    = room.players.find(p => p.isAlive && this.roleMap.get(p.id) === 'doctor');
    const bodyguard = room.players.find(p => p.isAlive && this.roleMap.get(p.id) === 'bodyguard');
    const wolfVotes = this.nightVotes.get(room.code);
    if (!wolves.every(w => wolfVotes?.has(w.id))) return false;
    if (seer      && !this.seerChoices.has(room.code))      return false;
    if (doctor    && !this.doctorChoices.has(room.code))    return false;
    if (bodyguard && !this.bodyguardChoices.has(room.code)) return false;
    return true;
  }

  /** Full readiness: phase-1 complete AND witch has acted (or has no potions) */
  private isNightReady(room: RoomState): boolean {
    if (!this.isPhase1NightReady(room)) return false;
    const witch = room.players.find(p => p.isAlive && this.roleMap.get(p.id) === 'witch');
    if (witch) {
      const saveUsed   = this.witchSaveUsed.get(room.code)   ?? false;
      const poisonUsed = this.witchPoisonUsed.get(room.code) ?? false;
      if (!saveUsed || !poisonUsed) {
        // witch still has at least one potion and has not yet acted
        if (!this.witchAction.has(room.code)) return false;
      }
    }
    return true;
  }

  private buildWitchNightInfo(room: RoomState, witchId: string, saveUsed: boolean, poisonUsed: boolean): WitchNightInfo {
    const wolfVotes          = this.nightVotes.get(room.code);
    const intendedKillId     = wolfVotes ? tallyVotes(wolfVotes) : null;
    const doctorProtectedId  = this.doctorChoices.get(room.code);
    const guardProtectedId   = this.bodyguardChoices.get(room.code);
    const tentativeKillId    =
      intendedKillId && intendedKillId !== doctorProtectedId && intendedKillId !== guardProtectedId
        ? intendedKillId : null;
    const tentativeTarget = tentativeKillId ? room.players.find(p => p.id === tentativeKillId) : null;
    return {
      witchId,
      attackedPlayerId:   tentativeTarget?.id   ?? null,
      attackedPlayerName: tentativeTarget?.name ?? null,
      savePotionUsed:   saveUsed,
      poisonPotionUsed: poisonUsed,
    };
  }

  // ── Night resolution ─────────────────────────────────────────────────────────

  private resolveNight(room: RoomState): { seerResult?: SeerResultData; hunterPendingInfo?: HunterPendingInfo } {
    const killVotes          = this.nightVotes.get(room.code);
    const seerTargetId       = this.seerChoices.get(room.code);
    const doctorProtectedId  = this.doctorChoices.get(room.code);
    const guardProtectedId   = this.bodyguardChoices.get(room.code);
    const witchAct           = this.witchAction.get(room.code);

    // Track potion usage before clearing
    if (witchAct?.save)           this.witchSaveUsed.set(room.code, true);
    if (witchAct?.poisonTargetId) this.witchPoisonUsed.set(room.code, true);

    // Update bodyguard "last protected"
    if (guardProtectedId) this.bodyguardLastProtected.set(room.code, guardProtectedId);

    this.clearNightMaps(room.code);
    room.timerPaused         = false;
    room.pausedTimeRemaining = null;

    // ── Determine deaths ──────────────────────────────────────────────────────

    const intendedKillId = killVotes ? tallyVotes(killVotes) : null;

    // Wolf victim: killed only if not protected by doctor OR bodyguard, OR saved by witch
    let wolfKillId: string | null = null;
    if (intendedKillId) {
      const doctorSaved    = intendedKillId === doctorProtectedId;
      const bodyguardSaved = intendedKillId === guardProtectedId;
      // Witch saves only if they chose to AND the victim wasn't already protected
      const witchSavedTarget = witchAct?.save && !doctorSaved && !bodyguardSaved;
      if (!doctorSaved && !bodyguardSaved && !witchSavedTarget) wolfKillId = intendedKillId;
    }

    // Witch poison victim (different from wolf kill)
    const poisonKillId = witchAct?.poisonTargetId ?? null;

    // Collect unique deaths in order
    const deathIds: string[] = [];
    if (wolfKillId) deathIds.push(wolfKillId);
    if (poisonKillId && poisonKillId !== wolfKillId) deathIds.push(poisonKillId);

    // Apply deaths, detect Hunter
    let hunterPendingInfo: HunterPendingInfo | undefined;
    const killedNames: string[] = [];
    for (const deadId of deathIds) {
      const deadPlayer = room.players.find(p => p.id === deadId);
      if (deadPlayer && deadPlayer.isAlive) {
        deadPlayer.isAlive = false;
        killedNames.push(deadPlayer.name);
        if (this.roleMap.get(deadId) === 'hunter' && !hunterPendingInfo) {
          const availableTargetIds = room.players.filter(p => p.isAlive).map(p => p.id);
          hunterPendingInfo = { hunterId: deadId, availableTargetIds };
        }
      }
    }

    // ── Seer result ────────────────────────────────────────────────────────────

    let seerResult: SeerResultData | undefined;
    if (seerTargetId) {
      const seer   = room.players.find(p => this.roleMap.get(p.id) === 'seer' && p.isAlive);
      const target = room.players.find(p => p.id === seerTargetId);
      const role   = this.roleMap.get(seerTargetId);
      if (seer && target && role) {
        seerResult = { seerId: seer.id, targetId: seerTargetId, targetName: target.name, role, round: room.round };
        const hist = this.seerResults.get(seer.id) ?? [];
        hist.push(seerResult);
        this.seerResults.set(seer.id, hist);
      }
    }

    // ── Win check (before hunter shot) ────────────────────────────────────────

    const winner = this.checkWin(room);

    const survivedAttack = intendedKillId !== null && wolfKillId === null;
    const deadNames = killedNames.join(', ');
    const nightAnn = (hunter: boolean): GameMessage => {
      if (killedNames.length === 0) return { code: survivedAttack ? 'ann.dawnSurvived' : 'ann.dawnNoDeath' };
      if (killedNames.length === 1) return { code: hunter ? 'ann.dawnOneDeadHunter' : 'ann.dawnOneDead', params: { name: killedNames[0] } };
      return { code: hunter ? 'ann.dawnManyDeadHunter' : 'ann.dawnManyDead', params: { names: deadNames } };
    };
    const addDeadEvent = () => {
      if (killedNames.length) this.addEvent(room, 'evt.foundDead', { names: deadNames });
      else this.addEvent(room, 'evt.quietNight');
    };

    if (winner) {
      // Game over — no hunter shot
      room.phase  = 'ended';
      room.winner = winner;
      room.phaseEndAt = null;
      room.lastAnnouncement = nightAnn(false);
      addDeadEvent();
      this.addEvent(room, winner === 'village' ? 'evt.villageWon' : 'evt.wolvesWon');
      this.revealAllRoles(room);
      return { seerResult };
    }

    // ── Transition to day (with or without hunter pause) ──────────────────────

    room.phase         = 'day';
    room.lastAnnouncement = nightAnn(!!hunterPendingInfo);
    addDeadEvent();
    this.addEvent(room, 'evt.dawnDiscuss');

    if (hunterPendingInfo) {
      room.hunterPendingShot = hunterPendingInfo.hunterId;
      room.phaseEndAt        = null; // timer starts AFTER hunter resolves
    } else {
      room.phaseEndAt        = Date.now() + this.phaseMs(room, 'day');
    }

    return { seerResult, hunterPendingInfo };
  }

  // ── Day → Voting ─────────────────────────────────────────────────────────────

  advanceDay(persistentId: string): { ok: boolean; error?: string; room?: RoomState } {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return { ok: false, error: 'Not in a room.' };
    if (room.hostId !== persistentId) return { ok: false, error: 'Only the host can call a vote.' };
    if (room.phase !== 'day') return { ok: false, error: 'Not day phase.' };
    if (room.hunterPendingShot) return { ok: false, error: 'Waiting for the Hunter\'s final shot.' };
    return this.transitionToVoting(room);
  }

  forceAdvanceDay(roomCode: string): { ok: boolean; room?: RoomState } {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== 'day') return { ok: false };
    return this.transitionToVoting(room);
  }

  private transitionToVoting(room: RoomState): { ok: boolean; room: RoomState } {
    room.phase        = 'voting';
    room.publicVotes  = { hasVoted: [], tally: {} };
    room.lastAnnouncement = null;
    room.phaseEndAt   = Date.now() + this.phaseMs(room, 'voting');
    room.timerPaused  = false;
    room.pausedTimeRemaining = null;
    this.dayVotes.delete(room.code);
    this.addEvent(room, 'evt.gatherVotes');
    return { ok: true, room };
  }

  // ── Voting phase ─────────────────────────────────────────────────────────────

  submitVote(
    persistentId: string,
    targetId: string
  ): { ok: boolean; error?: string; room?: RoomState; hunterPendingInfo?: HunterPendingInfo } {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return { ok: false, error: 'Not in a room.' };
    if (room.phase !== 'voting') return { ok: false, error: 'Not voting phase.' };
    const voter = room.players.find(p => p.id === persistentId);
    if (!voter?.isAlive) return { ok: false, error: 'Only alive players can vote.' };
    const target = room.players.find(p => p.id === targetId);
    if (!target) return { ok: false, error: 'Invalid target.' };
    if (!target.isAlive) return { ok: false, error: 'Cannot vote for a dead player.' };
    if (targetId === persistentId) return { ok: false, error: 'Cannot vote for yourself.' };

    if (!this.dayVotes.has(room.code)) this.dayVotes.set(room.code, new Map());
    if (!room.publicVotes) room.publicVotes = { hasVoted: [], tally: {} };

    // Allow changing an existing vote — drop the previous target from the tally first
    const prev = this.dayVotes.get(room.code)!.get(persistentId);
    if (prev === targetId) return { ok: true, room }; // no change
    if (prev !== undefined) {
      room.publicVotes.tally[prev] = Math.max(0, (room.publicVotes.tally[prev] ?? 1) - 1);
      if (room.publicVotes.tally[prev] === 0) delete room.publicVotes.tally[prev];
    } else {
      room.publicVotes.hasVoted.push(persistentId);
    }
    this.dayVotes.get(room.code)!.set(persistentId, targetId);
    room.publicVotes.tally[targetId] = (room.publicVotes.tally[targetId] ?? 0) + 1;

    const alivePlayers = room.players.filter(p => p.isAlive);
    if (alivePlayers.every(p => room.publicVotes!.hasVoted.includes(p.id))) {
      const hunterPendingInfo = this.resolveVoting(room);
      return { ok: true, room, hunterPendingInfo };
    }
    return { ok: true, room };
  }

  /** Cancel a player's day vote (abstain). */
  cancelVote(persistentId: string): { ok: boolean; error?: string; room?: RoomState } {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return { ok: false, error: 'Not in a room.' };
    if (room.phase !== 'voting') return { ok: false, error: 'Not voting phase.' };
    const prev = this.dayVotes.get(room.code)?.get(persistentId);
    if (prev === undefined) return { ok: true, room }; // nothing to cancel
    this.dayVotes.get(room.code)!.delete(persistentId);
    if (room.publicVotes) {
      room.publicVotes.hasVoted = room.publicVotes.hasVoted.filter(id => id !== persistentId);
      room.publicVotes.tally[prev] = Math.max(0, (room.publicVotes.tally[prev] ?? 1) - 1);
      if (room.publicVotes.tally[prev] === 0) delete room.publicVotes.tally[prev];
    }
    return { ok: true, room };
  }

  forceResolveVoting(roomCode: string): { ok: boolean; room?: RoomState; hunterPendingInfo?: HunterPendingInfo } {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== 'voting') return { ok: false };
    const hunterPendingInfo = this.resolveVoting(room);
    return { ok: true, room, hunterPendingInfo };
  }

  private resolveVoting(room: RoomState): HunterPendingInfo | undefined {
    const votes = this.dayVotes.get(room.code);
    this.dayVotes.delete(room.code);
    room.timerPaused         = false;
    room.pausedTimeRemaining = null;

    const eliminatedId = votes ? tallyVotesStrict(votes) : null;
    const eliminated   = eliminatedId ? room.players.find(p => p.id === eliminatedId) : null;
    if (eliminated) {
      eliminated.isAlive     = false;
      eliminated.revealedRole = this.roleMap.get(eliminatedId!);
    }

    room.publicVotes = null;

    // Jester wins alone the moment the village hangs them — game over on the spot
    if (eliminated && this.roleMap.get(eliminatedId!) === 'jester') {
      room.phase      = 'ended';
      room.winner     = 'jester';
      room.phaseEndAt = null;
      room.lastAnnouncement = { code: 'ann.jesterWin', params: { name: eliminated.name } };
      this.addEvent(room, 'evt.exiled', { name: eliminated.name, role: 'jester' });
      this.addEvent(room, 'evt.jesterWon', { name: eliminated.name });
      this.revealAllRoles(room);
      return undefined;
    }

    const winner = this.checkWin(room);
    const exileParams = eliminated
      ? { name: eliminated.name, role: eliminated.revealedRole ?? 'villager' }
      : null;
    const addExileEvent = () => {
      if (exileParams) this.addEvent(room, 'evt.exiled', exileParams);
      else this.addEvent(room, 'evt.voteTied');
    };

    if (winner) {
      room.phase   = 'ended';
      room.winner  = winner;
      room.phaseEndAt = null;
      room.lastAnnouncement = exileParams
        ? { code: 'ann.exiledWin', params: exileParams }
        : { code: 'ann.noAgreement' };
      addExileEvent();
      this.addEvent(room, winner === 'village' ? 'evt.villageWon' : 'evt.wolvesWon');
      this.revealAllRoles(room);
      return undefined;
    }

    // Check Hunter trigger AFTER win check
    const isHunter = eliminated && this.roleMap.get(eliminatedId!) === 'hunter';
    room.round++;
    room.phase = 'night';

    if (isHunter) {
      const availableTargetIds = room.players.filter(p => p.isAlive).map(p => p.id);
      room.hunterPendingShot = eliminatedId!;
      room.phaseEndAt        = null; // timer starts after hunter resolves
      room.lastAnnouncement  = { code: 'ann.exiledHunter', params: exileParams! };
      addExileEvent();
      this.addEvent(room, 'evt.hunterReadies');
      return { hunterId: eliminatedId!, availableTargetIds };
    }

    room.phaseEndAt = Date.now() + this.phaseMs(room, 'night');
    room.lastAnnouncement = exileParams
      ? { code: 'ann.exiledNight', params: exileParams }
      : { code: 'ann.tieNight' };
    addExileEvent();
    this.addEvent(room, 'evt.nightFallsAgain');
    return undefined;
  }

  // ── Post-game controls ───────────────────────────────────────────────────────

  restartGame(persistentId: string): { room: RoomState; roleMap: Map<string, Role> } | { error: string } | null {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return null;
    if (room.hostId !== persistentId) return { error: 'Only the host can restart the game.' };
    if (room.phase !== 'ended') return { error: 'Game is not over yet.' };
    if (room.players.length < room.minPlayers) return { error: `Need at least ${room.minPlayers} players to restart.` };
    return this.doStartNewRound(room);
  }

  returnToLobby(persistentId: string): RoomState | { error: string } | null {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return null;
    if (room.hostId !== persistentId) return { error: 'Only the host can return to lobby.' };
    if (room.phase !== 'ended') return { error: 'Game is not over yet.' };
    this.clearRoomGameState(room);
    return room;
  }

  // ── Host admin controls ──────────────────────────────────────────────────────

  private requireHost(persistentId: string): { ok: false; error: string } | { ok: true; room: RoomState } {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return { ok: false, error: 'Not in a room.' };
    if (room.hostId !== persistentId) return { ok: false, error: 'Only the host can do that.' };
    return { ok: true, room };
  }

  kickPlayer(hostPid: string, targetPid: string): { ok: boolean; error?: string; room?: RoomState; kickedSocketId?: string } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return check;
    const room = check.room;
    if (room.phase !== 'lobby') return { ok: false, error: 'Can only kick players in the lobby.' };
    if (targetPid === hostPid) return { ok: false, error: 'Cannot kick yourself.' };
    const target = room.players.find(p => p.id === targetPid);
    if (!target) return { ok: false, error: 'Player not found.' };
    const kickedSocketId = this.playerToSocket.get(targetPid);
    const socketId = this.playerToSocket.get(targetPid);
    if (socketId) this.socketToPlayer.delete(socketId);
    this.playerToSocket.delete(targetPid);
    room.players = room.players.filter(p => p.id !== targetPid);
    room.readyPlayers = room.readyPlayers.filter(id => id !== targetPid);
    this.playerRoomMap.delete(targetPid);
    this.roleMap.delete(targetPid);
    this.seerResults.delete(targetPid);
    this.addEvent(room, 'evt.playerKicked', { name: target.name });
    return { ok: true, room, kickedSocketId };
  }

  lockRoom(hostPid: string): { ok: boolean; error?: string; room?: RoomState } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return check;
    const room = check.room;
    if (room.phase !== 'lobby') return { ok: false, error: 'Can only lock the room in lobby.' };
    if (room.isLocked) return { ok: true, room };
    room.isLocked = true;
    this.addEvent(room, 'evt.roomLocked');
    return { ok: true, room };
  }

  unlockRoom(hostPid: string): { ok: boolean; error?: string; room?: RoomState } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return check;
    const room = check.room;
    if (!room.isLocked) return { ok: true, room };
    room.isLocked = false;
    this.addEvent(room, 'evt.roomUnlocked');
    return { ok: true, room };
  }

  resetReady(hostPid: string): { ok: boolean; error?: string; room?: RoomState } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return check;
    const room = check.room;
    if (room.phase !== 'lobby') return { ok: false, error: 'Can only reset ready states in lobby.' };
    room.readyPlayers = [];
    return { ok: true, room };
  }

  // ── Test bot controls ────────────────────────────────────────────────────────

  private readonly BOT_NAMES = [
    'Aldric', 'Brennan', 'Caelan', 'Dorian', 'Emric', 'Fenris',
    'Gareth', 'Hadwin', 'Isolde', 'Jorvyn', 'Kestrel', 'Lorian',
    'Maren', 'Niven', 'Oswin', 'Percival', 'Quillon', 'Renwick',
    'Sable', 'Thane', 'Urien', 'Vance', 'Wulfric', 'Xander',
  ];

  hasBots(roomCode: string): boolean { return this.rooms.get(roomCode)?.players.some(p => p.isBot) ?? false; }

  addBot(hostPid: string): { ok: boolean; error?: string; room?: RoomState } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return check;
    const room = check.room;
    if (room.phase !== 'lobby') return { ok: false, error: 'Can only add bots in lobby.' };
    if (room.players.length >= room.maxPlayers) return { ok: false, error: 'Room is full.' };
    const usedNames = new Set(room.players.map(p => p.name));
    const available = this.BOT_NAMES.filter(n => !usedNames.has(n));
    const name = available.length > 0 ? pickRandom(available) : `Bot-${Math.floor(Math.random() * 1000)}`;
    const botId = `bot_${Math.random().toString(36).slice(2, 10)}`;
    const bot: Player = { id: botId, name, isHost: false, isConnected: true, isAlive: true, isBot: true };
    room.players.push(bot);
    room.readyPlayers.push(botId);
    this.playerRoomMap.set(botId, room.code);
    return { ok: true, room };
  }

  fillBots(hostPid: string, target: number): { ok: boolean; error?: string; room?: RoomState } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return check;
    const room = check.room;
    if (room.phase !== 'lobby') return { ok: false, error: 'Can only add bots in lobby.' };
    const clamped = Math.min(target, room.maxPlayers);
    while (room.players.length < clamped) { const res = this.addBot(hostPid); if (!res.ok) break; }
    return { ok: true, room };
  }

  removeBots(hostPid: string): { ok: boolean; error?: string; room?: RoomState } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return check;
    const room = check.room;
    if (room.phase !== 'lobby') return { ok: false, error: 'Can only remove bots in lobby.' };
    const botIds = room.players.filter(p => p.isBot).map(p => p.id);
    for (const botId of botIds) {
      room.players = room.players.filter(p => p.id !== botId);
      room.readyPlayers = room.readyPlayers.filter(id => id !== botId);
      this.playerRoomMap.delete(botId);
      this.roleMap.delete(botId);
    }
    return { ok: true, room };
  }

  runBotNightActions(roomCode: string): { resolved: boolean; room?: RoomState; seerResult?: SeerResultData; witchNeedsInfo?: WitchNightInfo; hunterPendingInfo?: HunterPendingInfo } {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== 'night') return { resolved: false };

    for (const bot of room.players.filter(p => p.isAlive && p.isBot)) {
      const role = this.roleMap.get(bot.id);
      if (!role) continue;
      switch (role) {
        case 'werewolf': {
          if (!this.nightVotes.has(roomCode)) this.nightVotes.set(roomCode, new Map());
          if (!this.nightVotes.get(roomCode)!.has(bot.id)) {
            const targets = room.players.filter(p => p.isAlive && this.roleMap.get(p.id) !== 'werewolf');
            if (targets.length > 0) this.nightVotes.get(roomCode)!.set(bot.id, pickRandom(targets).id);
          }
          break;
        }
        case 'seer':
          if (!this.seerChoices.has(roomCode)) {
            const targets = room.players.filter(p => p.isAlive && p.id !== bot.id);
            if (targets.length > 0) this.seerChoices.set(roomCode, pickRandom(targets).id);
          }
          break;
        case 'doctor':
          if (!this.doctorChoices.has(roomCode)) {
            const targets = room.players.filter(p => p.isAlive);
            if (targets.length > 0) this.doctorChoices.set(roomCode, pickRandom(targets).id);
          }
          break;
        case 'bodyguard': {
          if (!this.bodyguardChoices.has(roomCode)) {
            const lastProtected = this.bodyguardLastProtected.get(roomCode);
            const targets = room.players.filter(p => p.isAlive && p.id !== lastProtected);
            const fallback = room.players.filter(p => p.isAlive);
            const pool = targets.length > 0 ? targets : fallback;
            if (pool.length > 0) this.bodyguardChoices.set(roomCode, pickRandom(pool).id);
          }
          break;
        }
        case 'witch':
          // Bot witch does nothing
          if (!this.witchAction.has(roomCode)) this.witchAction.set(roomCode, { save: false, poisonTargetId: null });
          break;
      }
    }

    if (this.isNightReady(room)) {
      const resolution = this.resolveNight(room);
      return { resolved: true, room, ...resolution };
    }
    return { resolved: false };
  }

  runBotVotes(roomCode: string): { resolved: boolean; room?: RoomState; hunterPendingInfo?: HunterPendingInfo } {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== 'voting') return { resolved: false };

    for (const bot of room.players.filter(p => p.isAlive && p.isBot)) {
      if (room.publicVotes?.hasVoted.includes(bot.id)) continue;
      const targets = room.players.filter(p => p.isAlive && p.id !== bot.id);
      if (targets.length === 0) continue;
      const target = pickRandom(targets);
      if (!this.dayVotes.has(roomCode)) this.dayVotes.set(roomCode, new Map());
      this.dayVotes.get(roomCode)!.set(bot.id, target.id);
      if (!room.publicVotes) room.publicVotes = { hasVoted: [], tally: {} };
      room.publicVotes.hasVoted.push(bot.id);
      room.publicVotes.tally[target.id] = (room.publicVotes.tally[target.id] ?? 0) + 1;
    }

    const alive = room.players.filter(p => p.isAlive);
    if (alive.every(p => room.publicVotes!.hasVoted.includes(p.id))) {
      const hunterPendingInfo = this.resolveVoting(room);
      return { resolved: true, room, hunterPendingInfo };
    }
    return { resolved: false, room };
  }

  // ── Timer controls ───────────────────────────────────────────────────────────

  pauseTimer(hostPid: string): { ok: boolean; error?: string; room?: RoomState } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return check;
    const room = check.room;
    if (!['night', 'day', 'voting'].includes(room.phase)) return { ok: false, error: 'No active timer.' };
    if (room.timerPaused) return { ok: false, error: 'Timer is already paused.' };
    if (!room.phaseEndAt) return { ok: false, error: 'No timer running.' };
    room.pausedTimeRemaining = Math.max(0, room.phaseEndAt - Date.now());
    room.phaseEndAt          = null;
    room.timerPaused         = true;
    this.addEvent(room, 'evt.timerPaused');
    return { ok: true, room };
  }

  resumeTimer(hostPid: string): { ok: boolean; error?: string; room?: RoomState } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return check;
    const room = check.room;
    if (!room.timerPaused) return { ok: false, error: 'Timer is not paused.' };
    const remaining = room.pausedTimeRemaining
      ?? (room.phase !== 'lobby' && room.phase !== 'ended' ? this.phaseMs(room, room.phase) : 60_000);
    room.phaseEndAt          = Date.now() + remaining;
    room.timerPaused         = false;
    room.pausedTimeRemaining = null;
    this.addEvent(room, 'evt.timerResumed');
    return { ok: true, room };
  }

  extendTimer(hostPid: string, extraSeconds: number): { ok: boolean; error?: string; room?: RoomState } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return check;
    const room = check.room;
    if (!['night', 'day', 'voting'].includes(room.phase)) return { ok: false, error: 'No active timer.' };
    const extraMs = extraSeconds * 1000;
    if (room.timerPaused) {
      room.pausedTimeRemaining = (room.pausedTimeRemaining ?? 0) + extraMs;
    } else {
      if (!room.phaseEndAt) return { ok: false, error: 'No timer running.' };
      room.phaseEndAt += extraMs;
    }
    this.addEvent(room, 'evt.timerExtended', { seconds: extraSeconds });
    return { ok: true, room };
  }

  hostEndPhase(hostPid: string): { ok: boolean; error?: string; room?: RoomState; seerResult?: SeerResultData; hunterPendingInfo?: HunterPendingInfo } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return { ok: false, error: check.error };
    const room = check.room;
    if (room.hunterPendingShot) return { ok: false, error: 'Cannot end the phase while the Hunter\'s shot is pending.' };
    if (room.phase === 'night') {
      this.addEvent(room, 'evt.hostEndedNight');
      return this.forceNightResolve(room.code);
    }
    if (room.phase === 'day') {
      this.addEvent(room, 'evt.hostCalledVote');
      return this.forceAdvanceDay(room.code);
    }
    if (room.phase === 'voting') {
      this.addEvent(room, 'evt.hostClosedVote');
      return { ...this.forceResolveVoting(room.code) };
    }
    return { ok: false, error: 'Not in an active game phase.' };
  }

  hostRestartGame(hostPid: string): { room: RoomState; roleMap: Map<string, Role> } | { error: string } | null {
    const room = this.getRoomByPlayer(hostPid);
    if (!room) return null;
    if (room.hostId !== hostPid) return { error: 'Only the host can restart the game.' };
    if (room.phase === 'lobby') return { error: 'Game has not started yet.' };
    if (room.players.length < room.minPlayers) return { error: `Need at least ${room.minPlayers} players.` };
    return this.doStartNewRound(room);
  }

  hostReturnToLobby(hostPid: string): RoomState | { error: string } | null {
    const room = this.getRoomByPlayer(hostPid);
    if (!room) return null;
    if (room.hostId !== hostPid) return { error: 'Only the host can return to lobby.' };
    if (room.phase === 'lobby') return { error: 'Already in lobby.' };
    this.clearRoomGameState(room);
    return room;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private doStartNewRound(room: RoomState): { room: RoomState; roleMap: Map<string, Role> } {
    if (!room.settings) room.settings = defaultSettings();
    const roleMap = assignRoles(room.players.map(p => p.id), room.settings);
    for (const [pid, role] of roleMap) this.roleMap.set(pid, role);
    room.players.forEach(p => { p.isAlive = true; delete p.revealedRole; });
    room.phase            = 'night';
    room.round            = 1;
    room.winner           = null;
    room.lastAnnouncement = null;
    room.publicVotes      = null;
    room.readyPlayers     = [];
    room.phaseEndAt       = Date.now() + this.phaseMs(room, 'night');
    room.timerPaused      = false;
    room.pausedTimeRemaining = null;
    room.eventLog         = [];
    room.hunterPendingShot = null;
    this.clearNightMaps(room.code);
    this.dayVotes.delete(room.code);
    this.witchSaveUsed.delete(room.code);
    this.witchPoisonUsed.delete(room.code);
    this.bodyguardLastProtected.delete(room.code);
    this.chatLog.delete(room.code);
    room.players.forEach(p => this.seerResults.delete(p.id));
    this.addEvent(room, 'evt.newGame');
    this.addEvent(room, 'evt.nightFalls');
    return { room, roleMap };
  }

  private clearNightMaps(roomCode: string): void {
    this.nightVotes.delete(roomCode);
    this.seerChoices.delete(roomCode);
    this.doctorChoices.delete(roomCode);
    this.bodyguardChoices.delete(roomCode);
    this.witchAction.delete(roomCode);
    this.witchPhase1Done.delete(roomCode);
  }

  private clearRoomGameState(room: RoomState): void {
    for (const player of room.players) {
      this.roleMap.delete(player.id);
      this.seerResults.delete(player.id);
      delete player.revealedRole;
      player.isAlive = true;
    }
    this.clearNightMaps(room.code);
    this.dayVotes.delete(room.code);
    this.chatLog.delete(room.code);
    this.witchSaveUsed.delete(room.code);
    this.witchPoisonUsed.delete(room.code);
    this.bodyguardLastProtected.delete(room.code);
    room.phase            = 'lobby';
    room.round            = 0;
    room.winner           = null;
    room.lastAnnouncement = null;
    room.publicVotes      = null;
    room.readyPlayers     = [];
    room.phaseEndAt       = null;
    room.timerPaused      = false;
    room.pausedTimeRemaining = null;
    room.hunterPendingShot = null;
  }

  private checkWin(room: RoomState): 'village' | 'werewolf' | null {
    const aliveWolves    = room.players.filter(p => p.isAlive && this.roleMap.get(p.id) === 'werewolf').length;
    const aliveVillagers = room.players.filter(p => p.isAlive && this.roleMap.get(p.id) !== 'werewolf').length;
    if (aliveWolves === 0) return 'village';
    if (aliveWolves >= aliveVillagers) return 'werewolf';
    return null;
  }

  private revealAllRoles(room: RoomState): void {
    for (const player of room.players) player.revealedRole = this.roleMap.get(player.id);
  }

  // ── Persistence ────────────────────────────────────────────────────────────

  getAllRooms(): RoomState[] { return [...this.rooms.values()]; }

  snapshotAll(): PersistSnapshot {
    const flat  = <V>(m: Map<string, V>): [string, V][] => [...m.entries()];
    const nested = (m: Map<string, Map<string, string>>): [string, [string, string][]][] =>
      [...m.entries()].map(([c, inner]) => [c, [...inner.entries()]]);
    return {
      rooms:                  [...this.rooms.values()],
      roleMap:                flat(this.roleMap),
      seerResults:            flat(this.seerResults),
      bodyguardLastProtected: flat(this.bodyguardLastProtected),
      witchSaveUsed:          flat(this.witchSaveUsed),
      witchPoisonUsed:        flat(this.witchPoisonUsed),
      nightVotes:             nested(this.nightVotes),
      seerChoices:            flat(this.seerChoices),
      doctorChoices:          flat(this.doctorChoices),
      bodyguardChoices:       flat(this.bodyguardChoices),
      witchAction:            flat(this.witchAction),
      witchPhase1Done:        flat(this.witchPhase1Done),
      dayVotes:               nested(this.dayVotes),
      chatLog:                flat(this.chatLog),
    };
  }

  restoreAll(s: PersistSnapshot): number {
    // Wipe everything (including ephemeral socket maps — those rebuild on reconnect)
    this.rooms.clear();          this.playerRoomMap.clear();
    this.roleMap.clear();        this.seerResults.clear();
    this.bodyguardLastProtected.clear();
    this.witchSaveUsed.clear();  this.witchPoisonUsed.clear();
    this.nightVotes.clear();     this.seerChoices.clear();
    this.doctorChoices.clear();  this.bodyguardChoices.clear();
    this.witchAction.clear();    this.witchPhase1Done.clear();
    this.dayVotes.clear();       this.chatLog.clear();
    this.socketToPlayer.clear(); this.playerToSocket.clear();

    for (const room of s.rooms) {
      if (!room.settings) room.settings = defaultSettings(); // snapshots from before settings existed
      this.rooms.set(room.code, room);
      for (const p of room.players) {
        p.isConnected = false; // no live sockets after a restart; reconnect flips this
        this.playerRoomMap.set(p.id, room.code);
      }
    }
    for (const [k, v] of s.roleMap)                this.roleMap.set(k, v);
    for (const [k, v] of s.seerResults)            this.seerResults.set(k, v);
    for (const [k, v] of s.bodyguardLastProtected) this.bodyguardLastProtected.set(k, v);
    for (const [k, v] of s.witchSaveUsed)          this.witchSaveUsed.set(k, v);
    for (const [k, v] of s.witchPoisonUsed)        this.witchPoisonUsed.set(k, v);
    for (const [c, arr] of s.nightVotes)           this.nightVotes.set(c, new Map(arr));
    for (const [k, v] of s.seerChoices)            this.seerChoices.set(k, v);
    for (const [k, v] of s.doctorChoices)          this.doctorChoices.set(k, v);
    for (const [k, v] of s.bodyguardChoices)       this.bodyguardChoices.set(k, v);
    for (const [k, v] of s.witchAction)            this.witchAction.set(k, v);
    for (const [k, v] of s.witchPhase1Done)        this.witchPhase1Done.set(k, v);
    for (const [c, arr] of s.dayVotes)             this.dayVotes.set(c, new Map(arr));
    for (const [c, arr] of s.chatLog ?? [])        this.chatLog.set(c, arr);

    return this.rooms.size;
  }

  private addEvent(room: RoomState, code: string, params?: Record<string, string | number>): void {
    room.eventLog.push({ id: makeEventId(), code, params, timestamp: Date.now() });
    if (room.eventLog.length > MAX_EVENT_LOG) room.eventLog = room.eventLog.slice(room.eventLog.length - MAX_EVENT_LOG);
  }
}
