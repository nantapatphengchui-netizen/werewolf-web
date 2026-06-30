import type { Player, RoomState, GamePhase, Role, GameEvent } from '../types/game';
import { assignRoles } from './roles/roleAssigner';

const MIN_PLAYERS = 5;
const MAX_PLAYERS = 12;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const MAX_EVENT_LOG = 30;

export const PHASE_DURATIONS: Record<string, number> = {
  night:  45_000,
  day:   120_000,
  voting: 60_000,
};

function generateCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeEventId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function tallyVotes(votes: Map<string, string>): string | null {
  if (votes.size === 0) return null;
  const counts = new Map<string, number>();
  for (const targetId of votes.values()) {
    counts.set(targetId, (counts.get(targetId) ?? 0) + 1);
  }
  const max = Math.max(...counts.values());
  const candidates = [...counts.entries()].filter(([, c]) => c === max).map(([id]) => id);
  return pickRandom(candidates);
}

type SeerResultData = {
  seerId: string;
  targetId: string;
  targetName: string;
  role: Role;
  round: number;
};

export class RoomManager {
  private rooms = new Map<string, RoomState>();
  private playerRoomMap = new Map<string, string>(); // persistentId → roomCode
  private roleMap = new Map<string, Role>();

  private socketToPlayer = new Map<string, string>(); // socketId → persistentId
  private playerToSocket = new Map<string, string>(); // persistentId → socketId

  private nightVotes = new Map<string, Map<string, string>>(); // roomCode → (pid → targetId)
  private seerChoices = new Map<string, string>();             // roomCode → targetId
  private doctorChoices = new Map<string, string>();           // roomCode → targetId
  private dayVotes = new Map<string, Map<string, string>>();   // roomCode → (pid → targetId)

  // ── Socket tracking ──────────────────────────────────────────────────────────

  getSocketId(persistentId: string): string | undefined {
    return this.playerToSocket.get(persistentId);
  }

  roomCount(): number {
    return this.rooms.size;
  }

  // ── Room lifecycle ───────────────────────────────────────────────────────────

  createRoom(socketId: string, persistentId: string, hostName: string): RoomState {
    let code = generateCode();
    while (this.rooms.has(code)) code = generateCode();

    const host: Player = { id: persistentId, name: hostName, isHost: true, isConnected: true, isAlive: true };

    const room: RoomState = {
      code,
      hostId: persistentId,
      players: [host],
      phase: 'lobby',
      maxPlayers: MAX_PLAYERS,
      minPlayers: MIN_PLAYERS,
      createdAt: Date.now(),
      round: 0,
      lastAnnouncement: null,
      winner: null,
      publicVotes: null,
      phaseEndAt: null,
      readyPlayers: [],
      eventLog: [],
      isLocked: false,
      timerPaused: false,
      pausedTimeRemaining: null,
      suspicionMap: {},
    };

    this.rooms.set(code, room);
    this.playerRoomMap.set(persistentId, code);
    this.socketToPlayer.set(socketId, persistentId);
    this.playerToSocket.set(persistentId, socketId);
    return room;
  }

  joinRoom(
    roomCode: string,
    socketId: string,
    persistentId: string,
    playerName: string
  ): RoomState | { error: string } {
    const code = roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return { error: 'Room not found.' };
    if (room.phase !== 'lobby') return { error: 'Game already in progress.' };
    if (room.isLocked) return { error: 'Room is locked. The host is not accepting new players.' };
    if (room.players.length >= room.maxPlayers) return { error: 'Room is full.' };
    if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
      return { error: 'That name is already taken in this room.' };
    }
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
    if (!room) {
      this.playerRoomMap.delete(persistentId);
      return { roomCode, room: null };
    }

    room.players = room.players.filter(p => p.id !== persistentId);
    room.readyPlayers = room.readyPlayers.filter(id => id !== persistentId);
    this.playerRoomMap.delete(persistentId);
    this.roleMap.delete(persistentId);
    this.nightVotes.get(roomCode)?.delete(persistentId);
    this.dayVotes.get(roomCode)?.delete(persistentId);

    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      this.nightVotes.delete(roomCode);
      this.seerChoices.delete(roomCode);
      this.doctorChoices.delete(roomCode);
      this.dayVotes.delete(roomCode);
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

  tryReconnect(
    persistentId: string,
    socketId: string
  ): { room: RoomState; role: Role | null; werewolfIds: string[] } | null {
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
    if (idx === -1) {
      room.readyPlayers.push(persistentId);
    } else {
      room.readyPlayers.splice(idx, 1);
    }

    return { ok: true, room };
  }

  canStartGame(persistentId: string): { ok: true } | { ok: false; error: string } {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return { ok: false, error: 'You are not in a room.' };
    if (room.hostId !== persistentId) return { ok: false, error: 'Only the host can start the game.' };
    if (room.phase !== 'lobby') return { ok: false, error: 'Game already started.' };
    if (room.players.length < room.minPlayers) {
      return { ok: false, error: `Need at least ${room.minPlayers} players (currently ${room.players.length}).` };
    }
    const notReady = room.players.filter(p => !room.readyPlayers.includes(p.id));
    if (notReady.length > 0) {
      return { ok: false, error: `Waiting for ${notReady.length} player${notReady.length !== 1 ? 's' : ''} to ready up.` };
    }
    return { ok: true };
  }

  startGame(persistentId: string): { room: RoomState; roleMap: Map<string, Role> } | null {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return null;

    const roleMap = assignRoles(room.players.map(p => p.id));
    for (const [pid, role] of roleMap) this.roleMap.set(pid, role);

    room.players.forEach(p => { p.isAlive = true; delete p.revealedRole; });
    room.phase = 'night';
    room.round = 1;
    room.lastAnnouncement = null;
    room.winner = null;
    room.publicVotes = null;
    room.readyPlayers = [];
    room.phaseEndAt = Date.now() + PHASE_DURATIONS.night;
    room.timerPaused = false;
    room.pausedTimeRemaining = null;
    room.eventLog = [];

    this.nightVotes.delete(room.code);
    this.seerChoices.delete(room.code);
    this.doctorChoices.delete(room.code);
    this.dayVotes.delete(room.code);
    room.suspicionMap = {};

    this.addEvent(room, 'The game has begun. Roles have been assigned.');
    this.addEvent(room, 'Night falls upon the village. All close their eyes.');

    return { room, roleMap };
  }

  getRole(persistentId: string): Role | undefined { return this.roleMap.get(persistentId); }

  getWerewolfIds(roomCode: string): string[] {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    return room.players.filter(p => this.roleMap.get(p.id) === 'werewolf').map(p => p.id);
  }

  // ── Night phase ──────────────────────────────────────────────────────────────

  submitNightAction(
    persistentId: string,
    targetId: string
  ): { ok: boolean; error?: string; room?: RoomState; seerResult?: SeerResultData } {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return { ok: false, error: 'Not in a room.' };
    if (room.phase !== 'night') return { ok: false, error: 'Not night phase.' };

    const myRole = this.roleMap.get(persistentId);
    const me = room.players.find(p => p.id === persistentId);
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
        this.seerChoices.set(room.code, targetId);
        break;
      case 'doctor':
        this.doctorChoices.set(room.code, targetId);
        break;
      default:
        return { ok: false, error: 'You have no night action.' };
    }

    if (this.isNightReady(room)) {
      const resolution = this.resolveNight(room);
      return { ok: true, room, ...resolution };
    }
    return { ok: true };
  }

  forceNightResolve(roomCode: string): { ok: boolean; room?: RoomState; seerResult?: SeerResultData } {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== 'night') return { ok: false };

    const wolves = room.players.filter(p => p.isAlive && this.roleMap.get(p.id) === 'werewolf');
    if (!this.nightVotes.has(roomCode)) this.nightVotes.set(roomCode, new Map());
    const wolfVotes = this.nightVotes.get(roomCode)!;

    for (const wolf of wolves) {
      if (!wolfVotes.has(wolf.id)) {
        const validTargets = room.players.filter(p => p.isAlive && this.roleMap.get(p.id) !== 'werewolf');
        if (validTargets.length > 0) wolfVotes.set(wolf.id, pickRandom(validTargets).id);
      }
    }

    const resolution = this.resolveNight(room);
    return { ok: true, room, ...resolution };
  }

  private isNightReady(room: RoomState): boolean {
    const wolves  = room.players.filter(p => p.isAlive && this.roleMap.get(p.id) === 'werewolf');
    const seer    = room.players.find(p => p.isAlive && this.roleMap.get(p.id) === 'seer');
    const doctor  = room.players.find(p => p.isAlive && this.roleMap.get(p.id) === 'doctor');
    const wolfVotes = this.nightVotes.get(room.code);
    if (!wolves.every(w => wolfVotes?.has(w.id))) return false;
    if (seer   && !this.seerChoices.has(room.code))   return false;
    if (doctor && !this.doctorChoices.has(room.code)) return false;
    return true;
  }

  private resolveNight(room: RoomState): { seerResult?: SeerResultData } {
    const killVotes    = this.nightVotes.get(room.code);
    const seerTargetId = this.seerChoices.get(room.code);
    const protectedId  = this.doctorChoices.get(room.code);

    this.nightVotes.delete(room.code);
    this.seerChoices.delete(room.code);
    this.doctorChoices.delete(room.code);

    room.timerPaused = false;
    room.pausedTimeRemaining = null;

    const intendedKillId = killVotes ? tallyVotes(killVotes) : null;
    const actualKillId   = (intendedKillId && intendedKillId !== protectedId) ? intendedKillId : null;

    const killed = actualKillId ? room.players.find(p => p.id === actualKillId) : null;
    if (killed) killed.isAlive = false;

    let seerResult: SeerResultData | undefined;
    if (seerTargetId) {
      const seer   = room.players.find(p => this.roleMap.get(p.id) === 'seer' && p.isAlive);
      const target = room.players.find(p => p.id === seerTargetId);
      const role   = this.roleMap.get(seerTargetId);
      if (seer && target && role) {
        seerResult = { seerId: seer.id, targetId: seerTargetId, targetName: target.name, role, round: room.round };
      }
    }

    const winner = this.checkWin(room);
    if (winner) {
      room.phase  = 'ended';
      room.winner = winner;
      room.phaseEndAt = null;
      room.lastAnnouncement = killed
        ? `${killed.name} was claimed by the night. Their secret died with them.`
        : 'The night has passed.';
      this.addEvent(room, killed ? `${killed.name} was found dead at dawn.` : 'A quiet night passed. No one was harmed.');
      this.addEvent(room, winner === 'village' ? 'The village triumphed. All werewolves are gone.' : 'The werewolves claim the village.');
      this.revealAllRoles(room);
    } else {
      room.phase   = 'day';
      room.phaseEndAt = Date.now() + PHASE_DURATIONS.day;
      room.suspicionMap = {};
      room.lastAnnouncement = killed
        ? `Dawn breaks. ${killed.name} was found dead in the village square. Their role remains unknown.`
        : 'A quiet night passes. No one was found dead.';
      this.addEvent(room, killed ? `${killed.name} was found dead at dawn.` : 'A quiet night passed. No one was harmed.');
      this.addEvent(room, 'Dawn breaks. The village wakes to discuss.');
    }

    return { seerResult };
  }

  // ── Day → Voting ─────────────────────────────────────────────────────────────

  advanceDay(persistentId: string): { ok: boolean; error?: string; room?: RoomState } {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return { ok: false, error: 'Not in a room.' };
    if (room.hostId !== persistentId) return { ok: false, error: 'Only the host can call a vote.' };
    if (room.phase !== 'day') return { ok: false, error: 'Not day phase.' };
    return this.transitionToVoting(room);
  }

  forceAdvanceDay(roomCode: string): { ok: boolean; room?: RoomState } {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== 'day') return { ok: false };
    return this.transitionToVoting(room);
  }

  private transitionToVoting(room: RoomState): { ok: boolean; room: RoomState } {
    room.phase      = 'voting';
    room.publicVotes = { hasVoted: [], tally: {} };
    room.lastAnnouncement = null;
    room.phaseEndAt = Date.now() + PHASE_DURATIONS.voting;
    room.timerPaused = false;
    room.pausedTimeRemaining = null;
    this.dayVotes.delete(room.code);
    this.addEvent(room, 'The village gathers to cast their votes.');
    return { ok: true, room };
  }

  // ── Social deduction ─────────────────────────────────────────────────────────

  markSuspicion(persistentId: string, targetId: string): { ok: boolean; error?: string; room?: RoomState } {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return { ok: false, error: 'Not in a room.' };
    if (room.phase !== 'day') return { ok: false, error: 'Suspicion marks are only available during day phase.' };

    const marker = room.players.find(p => p.id === persistentId);
    if (!marker?.isAlive) return { ok: false, error: 'Only alive players can mark suspicion.' };

    const target = room.players.find(p => p.id === targetId);
    if (!target?.isAlive) return { ok: false, error: 'Cannot mark a dead player.' };
    if (targetId === persistentId) return { ok: false, error: 'Cannot mark yourself as suspicious.' };

    if (!room.suspicionMap) room.suspicionMap = {};
    const markers = room.suspicionMap[targetId] ?? [];
    const alreadyMarked = markers.includes(persistentId);

    if (alreadyMarked) {
      const updated = markers.filter(id => id !== persistentId);
      if (updated.length === 0) delete room.suspicionMap[targetId];
      else room.suspicionMap[targetId] = updated;
    } else {
      const myMarkCount = Object.values(room.suspicionMap).filter(arr => arr.includes(persistentId)).length;
      if (myMarkCount >= 2) return { ok: false, error: 'You can only mark up to 2 players as suspicious.' };
      room.suspicionMap[targetId] = [...markers, persistentId];
    }

    return { ok: true, room };
  }

  // ── Voting phase ─────────────────────────────────────────────────────────────

  submitVote(
    persistentId: string,
    targetId: string
  ): { ok: boolean; error?: string; room?: RoomState } {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return { ok: false, error: 'Not in a room.' };
    if (room.phase !== 'voting') return { ok: false, error: 'Not voting phase.' };

    const voter = room.players.find(p => p.id === persistentId);
    if (!voter?.isAlive) return { ok: false, error: 'Only alive players can vote.' };
    if (room.publicVotes?.hasVoted.includes(persistentId)) return { ok: false, error: 'You have already voted.' };

    const target = room.players.find(p => p.id === targetId);
    if (!target) return { ok: false, error: 'Invalid target.' };
    if (!target.isAlive) return { ok: false, error: 'Cannot vote for a dead player.' };
    if (targetId === persistentId) return { ok: false, error: 'Cannot vote for yourself.' };

    if (!this.dayVotes.has(room.code)) this.dayVotes.set(room.code, new Map());
    this.dayVotes.get(room.code)!.set(persistentId, targetId);

    if (!room.publicVotes) room.publicVotes = { hasVoted: [], tally: {} };
    room.publicVotes.hasVoted.push(persistentId);
    room.publicVotes.tally[targetId] = (room.publicVotes.tally[targetId] ?? 0) + 1;

    const alivePlayers = room.players.filter(p => p.isAlive);
    if (alivePlayers.every(p => room.publicVotes!.hasVoted.includes(p.id))) {
      this.resolveVoting(room);
    }

    return { ok: true, room };
  }

  forceResolveVoting(roomCode: string): { ok: boolean; room?: RoomState } {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== 'voting') return { ok: false };
    this.resolveVoting(room);
    return { ok: true, room };
  }

  private resolveVoting(room: RoomState): void {
    const votes = this.dayVotes.get(room.code);
    this.dayVotes.delete(room.code);

    room.timerPaused = false;
    room.pausedTimeRemaining = null;

    const eliminatedId = votes ? tallyVotes(votes) : null;
    const eliminated   = eliminatedId ? room.players.find(p => p.id === eliminatedId) : null;
    if (eliminated) {
      eliminated.isAlive = false;
      eliminated.revealedRole = this.roleMap.get(eliminatedId!);
    }

    room.publicVotes = null;

    const winner   = this.checkWin(room);
    const roleLabel = eliminated?.revealedRole
      ? `the ${eliminated.revealedRole.charAt(0).toUpperCase() + eliminated.revealedRole.slice(1)}`
      : 'an unknown role';

    if (winner) {
      room.phase   = 'ended';
      room.winner  = winner;
      room.phaseEndAt = null;
      room.lastAnnouncement = eliminated
        ? `The village has spoken. ${eliminated.name} has been exiled — they were ${roleLabel}.`
        : 'The votes were cast. The village could not agree.';
      this.addEvent(room, eliminated ? `${eliminated.name} was exiled (${roleLabel}).` : 'The vote was tied. No one was exiled.');
      this.addEvent(room, winner === 'village' ? 'The village triumphed. All werewolves are gone.' : 'The werewolves claim the village.');
      this.revealAllRoles(room);
    } else {
      room.round++;
      room.phase   = 'night';
      room.phaseEndAt = Date.now() + PHASE_DURATIONS.night;
      room.lastAnnouncement = eliminated
        ? `${eliminated.name} has been exiled from the village. They were ${roleLabel}. Night falls once more.`
        : 'The vote ended in a tie. No one was exiled. Night falls.';
      this.addEvent(room, eliminated ? `${eliminated.name} was exiled (${roleLabel}).` : 'The vote was tied. No one was exiled.');
      this.addEvent(room, 'Night falls once more. All close their eyes.');
    }
  }

  // ── Post-game controls ───────────────────────────────────────────────────────

  restartGame(
    persistentId: string
  ): { room: RoomState; roleMap: Map<string, Role> } | { error: string } | null {
    const room = this.getRoomByPlayer(persistentId);
    if (!room) return null;
    if (room.hostId !== persistentId) return { error: 'Only the host can restart the game.' };
    if (room.phase !== 'ended') return { error: 'Game is not over yet.' };
    if (room.players.length < room.minPlayers) return { error: `Need at least ${room.minPlayers} players to restart.` };

    const roleMap = assignRoles(room.players.map(p => p.id));
    for (const [pid, role] of roleMap) this.roleMap.set(pid, role);

    room.players.forEach(p => { p.isAlive = true; delete p.revealedRole; });
    this.nightVotes.delete(room.code);
    this.seerChoices.delete(room.code);
    this.doctorChoices.delete(room.code);
    this.dayVotes.delete(room.code);

    room.phase   = 'night';
    room.round   = 1;
    room.winner  = null;
    room.lastAnnouncement = null;
    room.publicVotes = null;
    room.readyPlayers = [];
    room.phaseEndAt = Date.now() + PHASE_DURATIONS.night;
    room.timerPaused = false;
    room.pausedTimeRemaining = null;
    room.eventLog = [];

    room.suspicionMap = {};
    this.addEvent(room, 'A new game has begun. Roles have been reassigned.');
    this.addEvent(room, 'Night falls upon the village. All close their eyes.');

    return { room, roleMap };
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

  kickPlayer(
    hostPid: string,
    targetPid: string
  ): { ok: boolean; error?: string; room?: RoomState; kickedSocketId?: string } {
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

    this.addEvent(room, `${target.name} was removed from the room by the host.`);
    return { ok: true, room, kickedSocketId };
  }

  lockRoom(hostPid: string): { ok: boolean; error?: string; room?: RoomState } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return check;
    const room = check.room;
    if (room.phase !== 'lobby') return { ok: false, error: 'Can only lock the room in lobby.' };
    if (room.isLocked) return { ok: true, room }; // idempotent
    room.isLocked = true;
    this.addEvent(room, 'The room has been locked by the host. No new players can join.');
    return { ok: true, room };
  }

  unlockRoom(hostPid: string): { ok: boolean; error?: string; room?: RoomState } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return check;
    const room = check.room;
    if (!room.isLocked) return { ok: true, room }; // idempotent
    room.isLocked = false;
    this.addEvent(room, 'The room has been unlocked by the host.');
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

  hasBots(roomCode: string): boolean {
    return this.rooms.get(roomCode)?.players.some(p => p.isBot) ?? false;
  }

  addBot(hostPid: string): { ok: boolean; error?: string; room?: RoomState } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return check;
    const room = check.room;
    if (room.phase !== 'lobby') return { ok: false, error: 'Can only add bots in lobby.' };
    if (room.players.length >= room.maxPlayers) return { ok: false, error: 'Room is full.' };

    const usedNames = new Set(room.players.map(p => p.name));
    const available = this.BOT_NAMES.filter(n => !usedNames.has(n));
    const name = available.length > 0
      ? pickRandom(available)
      : `Bot-${Math.floor(Math.random() * 1000)}`;

    const botId = `bot_${Math.random().toString(36).slice(2, 10)}`;
    const bot: Player = { id: botId, name, isHost: false, isConnected: true, isAlive: true, isBot: true };
    room.players.push(bot);
    room.readyPlayers.push(botId); // auto-ready
    this.playerRoomMap.set(botId, room.code);

    return { ok: true, room };
  }

  fillBots(hostPid: string, target: number): { ok: boolean; error?: string; room?: RoomState } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return check;
    const room = check.room;
    if (room.phase !== 'lobby') return { ok: false, error: 'Can only add bots in lobby.' };

    const clampedTarget = Math.min(target, room.maxPlayers);
    while (room.players.length < clampedTarget) {
      const res = this.addBot(hostPid);
      if (!res.ok) break;
    }

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

  // Auto-submit random night actions for alive bots; returns resolved=true if night ends
  runBotNightActions(roomCode: string): { resolved: boolean; room?: RoomState; seerResult?: SeerResultData } {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== 'night') return { resolved: false };

    for (const bot of room.players.filter(p => p.isAlive && p.isBot)) {
      const role = this.roleMap.get(bot.id);
      if (!role) continue;

      if (role === 'werewolf') {
        if (!this.nightVotes.has(roomCode)) this.nightVotes.set(roomCode, new Map());
        if (!this.nightVotes.get(roomCode)!.has(bot.id)) {
          const targets = room.players.filter(p => p.isAlive && this.roleMap.get(p.id) !== 'werewolf');
          if (targets.length > 0) this.nightVotes.get(roomCode)!.set(bot.id, pickRandom(targets).id);
        }
      } else if (role === 'seer' && !this.seerChoices.has(roomCode)) {
        const targets = room.players.filter(p => p.isAlive && p.id !== bot.id);
        if (targets.length > 0) this.seerChoices.set(roomCode, pickRandom(targets).id);
      } else if (role === 'doctor' && !this.doctorChoices.has(roomCode)) {
        const targets = room.players.filter(p => p.isAlive);
        if (targets.length > 0) this.doctorChoices.set(roomCode, pickRandom(targets).id);
      }
    }

    if (this.isNightReady(room)) {
      const seerResult = this.resolveNight(room);
      return { resolved: true, room, ...seerResult };
    }

    return { resolved: false };
  }

  // Auto-submit random votes for alive bots; returns resolved=true if voting ends
  runBotVotes(roomCode: string): { resolved: boolean; room?: RoomState } {
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
      this.resolveVoting(room);
      return { resolved: true, room };
    }

    return { resolved: false, room };
  }

  pauseTimer(hostPid: string): { ok: boolean; error?: string; room?: RoomState } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return check;
    const room = check.room;
    if (!['night', 'day', 'voting'].includes(room.phase)) return { ok: false, error: 'No active timer.' };
    if (room.timerPaused) return { ok: false, error: 'Timer is already paused.' };
    if (!room.phaseEndAt) return { ok: false, error: 'No timer running.' };

    room.pausedTimeRemaining = Math.max(0, room.phaseEndAt - Date.now());
    room.phaseEndAt = null;
    room.timerPaused = true;
    this.addEvent(room, 'The phase timer has been paused by the host.');
    return { ok: true, room };
  }

  resumeTimer(hostPid: string): { ok: boolean; error?: string; room?: RoomState } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return check;
    const room = check.room;
    if (!room.timerPaused) return { ok: false, error: 'Timer is not paused.' };

    const remaining = room.pausedTimeRemaining ?? PHASE_DURATIONS[room.phase] ?? 60_000;
    room.phaseEndAt = Date.now() + remaining;
    room.timerPaused = false;
    room.pausedTimeRemaining = null;
    this.addEvent(room, 'The phase timer has been resumed by the host.');
    return { ok: true, room };
  }

  extendTimer(
    hostPid: string,
    extraSeconds: number
  ): { ok: boolean; error?: string; room?: RoomState } {
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
    this.addEvent(room, `The host extended the phase timer by ${extraSeconds} seconds.`);
    return { ok: true, room };
  }

  hostEndPhase(hostPid: string): { ok: boolean; error?: string; room?: RoomState; seerResult?: SeerResultData } {
    const check = this.requireHost(hostPid);
    if (!check.ok) return { ok: false, error: check.error };
    const room = check.room;

    if (room.phase === 'night') {
      this.addEvent(room, 'The host ended the night phase early.');
      return this.forceNightResolve(room.code);
    }
    if (room.phase === 'day') {
      this.addEvent(room, 'The host called a vote early.');
      return this.forceAdvanceDay(room.code);
    }
    if (room.phase === 'voting') {
      this.addEvent(room, 'The host closed the vote early.');
      return { ...this.forceResolveVoting(room.code) };
    }
    return { ok: false, error: 'Not in an active game phase.' };
  }

  hostRestartGame(
    hostPid: string
  ): { room: RoomState; roleMap: Map<string, Role> } | { error: string } | null {
    const room = this.getRoomByPlayer(hostPid);
    if (!room) return null;
    if (room.hostId !== hostPid) return { error: 'Only the host can restart the game.' };
    if (room.phase === 'lobby') return { error: 'Game has not started yet.' };
    if (room.players.length < room.minPlayers) return { error: `Need at least ${room.minPlayers} players.` };

    const roleMap = assignRoles(room.players.map(p => p.id));
    for (const [pid, role] of roleMap) this.roleMap.set(pid, role);

    room.players.forEach(p => { p.isAlive = true; delete p.revealedRole; });
    this.nightVotes.delete(room.code);
    this.seerChoices.delete(room.code);
    this.doctorChoices.delete(room.code);
    this.dayVotes.delete(room.code);

    room.phase = 'night';
    room.round = 1;
    room.winner = null;
    room.lastAnnouncement = null;
    room.publicVotes = null;
    room.readyPlayers = [];
    room.phaseEndAt = Date.now() + PHASE_DURATIONS.night;
    room.timerPaused = false;
    room.pausedTimeRemaining = null;
    room.eventLog = [];

    room.suspicionMap = {};
    this.addEvent(room, 'The host has restarted the game. New roles assigned.');
    this.addEvent(room, 'Night falls upon the village. All close their eyes.');

    return { room, roleMap };
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

  private clearRoomGameState(room: RoomState): void {
    for (const player of room.players) {
      this.roleMap.delete(player.id);
      delete player.revealedRole;
      player.isAlive = true;
    }
    this.nightVotes.delete(room.code);
    this.seerChoices.delete(room.code);
    this.doctorChoices.delete(room.code);
    this.dayVotes.delete(room.code);

    room.phase = 'lobby';
    room.round = 0;
    room.winner = null;
    room.lastAnnouncement = null;
    room.publicVotes = null;
    room.readyPlayers = [];
    room.phaseEndAt = null;
    room.timerPaused = false;
    room.pausedTimeRemaining = null;
    room.suspicionMap = {};
  }

  private checkWin(room: RoomState): 'village' | 'werewolf' | null {
    const aliveWolves     = room.players.filter(p => p.isAlive && this.roleMap.get(p.id) === 'werewolf').length;
    const aliveVillagers  = room.players.filter(p => p.isAlive && this.roleMap.get(p.id) !== 'werewolf').length;
    if (aliveWolves === 0) return 'village';
    if (aliveWolves >= aliveVillagers) return 'werewolf';
    return null;
  }

  private revealAllRoles(room: RoomState): void {
    for (const player of room.players) {
      player.revealedRole = this.roleMap.get(player.id);
    }
  }

  private addEvent(room: RoomState, text: string): void {
    room.eventLog.push({ id: makeEventId(), text, timestamp: Date.now() });
    if (room.eventLog.length > MAX_EVENT_LOG) {
      room.eventLog = room.eventLog.slice(room.eventLog.length - MAX_EVENT_LOG);
    }
  }
}
