import type { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '../types/events';
import type { GamePhase } from '../types/game';
import { RoomManager, PHASE_DURATIONS } from '../game/RoomManager';

type IO   = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type Sock = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const TEST_BOTS_ENABLED = process.env.ENABLE_TEST_BOTS === 'true';

// ── Bot auto-action timers ────────────────────────────────────────────────────

const botTimers = new Map<string, ReturnType<typeof setTimeout>>();

// Per-socket timestamp of the last chat message, for throttling
const chatThrottle = new Map<string, number>();

function clearBotTimer(roomCode: string): void {
  const t = botTimers.get(roomCode);
  if (t !== undefined) { clearTimeout(t); botTimers.delete(roomCode); }
}

function scheduleBotActions(roomCode: string, phase: GamePhase, io: IO, rooms: RoomManager): void {
  clearBotTimer(roomCode);
  if (!TEST_BOTS_ENABLED || !rooms.hasBots(roomCode)) return;
  if (phase !== 'night' && phase !== 'voting') return;

  botTimers.set(roomCode, setTimeout(() => {
    botTimers.delete(roomCode);

    if (phase === 'night') {
      const result = rooms.runBotNightActions(roomCode);
      if (result.resolved && result.room) {
        clearPhaseTimer(roomCode);
        // Send witch night info if needed
        if (result.witchNeedsInfo) {
          const { witchId, attackedPlayerId, attackedPlayerName, savePotionUsed, poisonPotionUsed } = result.witchNeedsInfo;
          const witchSocketId = rooms.getSocketId(witchId);
          const witchSocket = witchSocketId ? io.sockets.sockets.get(witchSocketId) : undefined;
          if (witchSocket && !witchSocket.data.playerId.startsWith('bot_')) {
            witchSocket.emit('witch_night_info', { attackedPlayerId, attackedPlayerName, savePotionUsed, poisonPotionUsed });
          }
          // witch is a bot — it already auto-acted, so this branch shouldn't normally fire
        }
        io.to(roomCode).emit('room_updated', { room: result.room });
        if (result.seerResult) {
          const { seerId, targetId: tid, targetName, role, round } = result.seerResult;
          const seerPlayer = result.room.players.find(p => p.id === seerId);
          if (!seerPlayer?.isBot) {
            const seerSocket = rooms.getSocketId(seerId);
            const sock = seerSocket ? io.sockets.sockets.get(seerSocket) : undefined;
            sock?.emit('seer_result', { round, targetId: tid, targetName, role });
          }
        }
        if (result.hunterPendingInfo) {
          emitHunterPending(result.hunterPendingInfo.hunterId, result.hunterPendingInfo.availableTargetIds, roomCode, io, rooms);
        } else if (result.room.phaseEndAt) {
          schedulePhaseTimer(roomCode, result.room.phase, result.room.phaseEndAt, io, rooms);
        }
      }
    } else if (phase === 'voting') {
      const result = rooms.runBotVotes(roomCode);
      if (result.room) {
        if (result.resolved) clearPhaseTimer(roomCode);
        io.to(roomCode).emit('room_updated', { room: result.room });
        if (result.resolved) {
          if (result.hunterPendingInfo) {
            emitHunterPending(result.hunterPendingInfo.hunterId, result.hunterPendingInfo.availableTargetIds, roomCode, io, rooms);
          } else if (result.room.phaseEndAt) {
            schedulePhaseTimer(roomCode, result.room.phase, result.room.phaseEndAt, io, rooms);
          }
        }
      }
    }
  }, 2000));
}

// ── Phase timers ─────────────────────────────────────────────────────────────

const phaseTimers = new Map<string, ReturnType<typeof setTimeout>>();

function schedulePhaseTimer(roomCode: string, phase: GamePhase, endAt: number, io: IO, rooms: RoomManager): void {
  clearPhaseTimer(roomCode);
  if (phase === 'lobby' || phase === 'ended') return;

  scheduleBotActions(roomCode, phase, io, rooms);

  const delay = Math.max(0, endAt - Date.now());

  phaseTimers.set(roomCode, setTimeout(() => {
    phaseTimers.delete(roomCode);

    if (phase === 'night') {
      const result = rooms.forceNightResolve(roomCode);
      if (result.ok && result.room) {
        io.to(roomCode).emit('room_updated', { room: result.room });
        if (result.seerResult) {
          const { seerId, targetId: tid, targetName, role, round } = result.seerResult;
          const seerSocketId = rooms.getSocketId(seerId);
          const seerSocket = seerSocketId ? io.sockets.sockets.get(seerSocketId) : undefined;
          seerSocket?.emit('seer_result', { round, targetId: tid, targetName, role });
        }
        if (result.hunterPendingInfo) {
          emitHunterPending(result.hunterPendingInfo.hunterId, result.hunterPendingInfo.availableTargetIds, roomCode, io, rooms);
        } else if (result.room.phaseEndAt) {
          schedulePhaseTimer(roomCode, result.room.phase, result.room.phaseEndAt, io, rooms);
        }
        console.log(`[timer] night expired → ${result.room.phase} in ${roomCode}`);
      }
    } else if (phase === 'day') {
      const result = rooms.forceAdvanceDay(roomCode);
      if (result.ok && result.room) {
        io.to(roomCode).emit('room_updated', { room: result.room });
        if (result.room.phaseEndAt) schedulePhaseTimer(roomCode, 'voting', result.room.phaseEndAt, io, rooms);
        console.log(`[timer] day expired → voting in ${roomCode}`);
      }
    } else if (phase === 'voting') {
      const result = rooms.forceResolveVoting(roomCode);
      if (result.ok && result.room) {
        io.to(roomCode).emit('room_updated', { room: result.room });
        if (result.hunterPendingInfo) {
          emitHunterPending(result.hunterPendingInfo.hunterId, result.hunterPendingInfo.availableTargetIds, roomCode, io, rooms);
        } else if (result.room.phaseEndAt) {
          schedulePhaseTimer(roomCode, result.room.phase, result.room.phaseEndAt, io, rooms);
        }
        console.log(`[timer] voting expired → ${result.room.phase} in ${roomCode}`);
      }
    }
  }, delay));
}

export function clearPhaseTimer(roomCode: string): void {
  const t = phaseTimers.get(roomCode);
  if (t !== undefined) { clearTimeout(t); phaseTimers.delete(roomCode); }
}

// ── Hunter shot timeout ───────────────────────────────────────────────────────

const hunterTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Arm (or re-arm) the 30s auto-skip timer for a pending hunter shot. */
function scheduleHunterTimeout(roomCode: string, io: IO, rooms: RoomManager): void {
  const existing = hunterTimers.get(roomCode);
  if (existing !== undefined) clearTimeout(existing);

  hunterTimers.set(roomCode, setTimeout(() => {
    hunterTimers.delete(roomCode);
    const result = rooms.skipHunterShot(roomCode);
    if (result.ok && result.room) {
      io.to(roomCode).emit('room_updated', { room: result.room });
      if (result.room.phaseEndAt) schedulePhaseTimer(roomCode, result.room.phase, result.room.phaseEndAt, io, rooms);
      console.log(`[hunter] auto-skipped shot in ${roomCode}`);
    }
  }, 30_000));
}

function emitHunterPending(
  hunterId: string,
  availableTargetIds: string[],
  roomCode: string,
  io: IO,
  rooms: RoomManager
): void {
  // Notify hunter (skip if bot)
  const hunterSocketId = rooms.getSocketId(hunterId);
  const hunterSocket   = hunterSocketId ? io.sockets.sockets.get(hunterSocketId) : undefined;
  if (hunterSocket) {
    hunterSocket.emit('hunter_shot_pending', { hunterId, availableTargetIds });
  }
  scheduleHunterTimeout(roomCode, io, rooms);
}

/** After a restart, re-arm phase and hunter timers from restored room state. */
export function resumeTimers(io: IO, rooms: RoomManager): void {
  for (const room of rooms.getAllRooms()) {
    if (room.hunterPendingShot) {
      scheduleHunterTimeout(room.code, io, rooms);
      continue;
    }
    if (!room.timerPaused && room.phaseEndAt &&
        (room.phase === 'night' || room.phase === 'day' || room.phase === 'voting')) {
      schedulePhaseTimer(room.code, room.phase, room.phaseEndAt, io, rooms);
    }
  }
}

function clearHunterTimer(roomCode: string): void {
  const t = hunterTimers.get(roomCode);
  if (t !== undefined) { clearTimeout(t); hunterTimers.delete(roomCode); }
}

// ── Host transfer timers ─────────────────────────────────────────────────────

const hostTransferTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleHostTransfer(roomCode: string, io: IO, rooms: RoomManager): void {
  const existing = hostTransferTimers.get(roomCode);
  if (existing !== undefined) clearTimeout(existing);
  hostTransferTimers.set(roomCode, setTimeout(() => {
    hostTransferTimers.delete(roomCode);
    const room = rooms.transferHost(roomCode);
    if (room) { io.to(roomCode).emit('room_updated', { room }); console.log(`[room] Host auto-transferred in ${roomCode}`); }
  }, 30_000));
}

export function cancelHostTransfer(roomCode: string): void {
  const t = hostTransferTimers.get(roomCode);
  if (t !== undefined) { clearTimeout(t); hostTransferTimers.delete(roomCode); }
}

// ── Handler registration ─────────────────────────────────────────────────────

export function registerHandlers(io: IO, socket: Sock, rooms: RoomManager): void {

  socket.on('create_room', ({ playerName }) => {
    const name = playerName?.trim();
    if (!name || name.length < 1 || name.length > 20) { socket.emit('error', { message: 'Name must be 1–20 characters.' }); return; }
    const pid  = socket.data.playerId;
    const room = rooms.createRoom(socket.id, pid, name);
    socket.join(room.code);
    socket.emit('room_joined', { room, playerId: pid });
    console.log(`[room] created ${room.code} by "${name}"`);
  });

  socket.on('join_room', ({ roomCode, playerName }) => {
    const name = playerName?.trim();
    const code = roomCode?.trim().toUpperCase();
    if (!name || name.length < 1 || name.length > 20) { socket.emit('error', { message: 'Name must be 1–20 characters.' }); return; }
    if (!code || code.length < 4) { socket.emit('error', { message: 'Invalid room code.' }); return; }
    const pid    = socket.data.playerId;
    const result = rooms.joinRoom(code, socket.id, pid, name);
    if ('error' in result) { socket.emit('error', { message: result.error }); return; }
    socket.join(result.code);
    socket.emit('room_joined', { room: result, playerId: pid });
    socket.to(result.code).emit('room_updated', { room: result });
    console.log(`[room] "${name}" joined ${result.code}`);
  });

  socket.on('leave_room', () => {
    const pid = socket.data.playerId;
    const { roomCode, room } = rooms.leaveRoom(pid);
    if (roomCode) { socket.leave(roomCode); if (!room) clearPhaseTimer(roomCode); }
    if (room) io.to(room.code).emit('room_updated', { room });
    console.log(`[room] ${pid} left ${roomCode ?? 'unknown'}`);
  });

  socket.on('player_ready', () => {
    const pid    = socket.data.playerId;
    const result = rooms.toggleReady(pid);
    if (!result.ok) { socket.emit('error', { message: result.error! }); return; }
    if (result.room) io.to(result.room.code).emit('room_updated', { room: result.room });
  });

  socket.on('start_game', () => {
    const pid   = socket.data.playerId;
    const check = rooms.canStartGame(pid);
    if (!check.ok) { socket.emit('error', { message: check.error }); return; }
    const result = rooms.startGame(pid);
    if (!result) return;
    const { room, roleMap } = result;
    const werewolfIds = rooms.getWerewolfIds(room.code);
    io.to(room.code).emit('game_started', { room });
    for (const [persistentId, role] of roleMap) {
      const socketId     = rooms.getSocketId(persistentId);
      const targetSocket = socketId ? io.sockets.sockets.get(socketId) : undefined;
      if (targetSocket) targetSocket.emit('role_assigned', { role, werewolfIds: role === 'werewolf' ? werewolfIds : [] });
    }
    if (room.phaseEndAt) schedulePhaseTimer(room.code, room.phase, room.phaseEndAt, io, rooms);
    console.log(`[game] started in ${room.code} — roles assigned to ${roleMap.size} players`);
  });

  socket.on('night_action', ({ targetId }) => {
    const pid    = socket.data.playerId;
    const result = rooms.submitNightAction(pid, targetId);
    if (!result.ok) { socket.emit('error', { message: result.error! }); return; }

    // Broadcast the live wolf kill-vote tally to the living pack (unless the night just resolved)
    if (result.wolfVoteTally && !result.room) {
      for (const wolfId of result.wolfVoteTally.wolfIds) {
        const wsid  = rooms.getSocketId(wolfId);
        const wsock = wsid ? io.sockets.sockets.get(wsid) : undefined;
        wsock?.emit('wolf_votes', { tally: result.wolfVoteTally.tally });
      }
    }

    // Witch needs to be informed before full resolution
    if (result.witchNeedsInfo) {
      const { witchId, attackedPlayerId, attackedPlayerName, savePotionUsed, poisonPotionUsed } = result.witchNeedsInfo;
      const witchSocketId = rooms.getSocketId(witchId);
      const witchSocket   = witchSocketId ? io.sockets.sockets.get(witchSocketId) : undefined;
      witchSocket?.emit('witch_night_info', { attackedPlayerId, attackedPlayerName, savePotionUsed, poisonPotionUsed });
      return; // night not yet resolved; don't do anything else yet
    }

    if (result.room) {
      clearPhaseTimer(result.room.code);
      io.to(result.room.code).emit('room_updated', { room: result.room });
      if (result.seerResult) {
        const { seerId, targetId: tid, targetName, role, round } = result.seerResult;
        const seerSocketId = rooms.getSocketId(seerId);
        const seerSocket   = seerSocketId ? io.sockets.sockets.get(seerSocketId) : undefined;
        seerSocket?.emit('seer_result', { round, targetId: tid, targetName, role });
      }
      if (result.hunterPendingInfo) {
        emitHunterPending(result.hunterPendingInfo.hunterId, result.hunterPendingInfo.availableTargetIds, result.room.code, io, rooms);
      } else if (result.room.phaseEndAt) {
        schedulePhaseTimer(result.room.code, result.room.phase, result.room.phaseEndAt, io, rooms);
      }
      console.log(`[game] night resolved in ${result.room.code} → phase:${result.room.phase}`);
    }
  });

  socket.on('witch_action', ({ save, poisonTargetId }) => {
    const pid    = socket.data.playerId;
    const result = rooms.submitWitchAction(pid, { save, poisonTargetId });
    if (!result.ok) { socket.emit('error', { message: result.error! }); return; }

    if (result.room) {
      clearPhaseTimer(result.room.code);
      io.to(result.room.code).emit('room_updated', { room: result.room });
      if (result.seerResult) {
        const { seerId, targetId: tid, targetName, role, round } = result.seerResult;
        const seerSocketId = rooms.getSocketId(seerId);
        const seerSocket   = seerSocketId ? io.sockets.sockets.get(seerSocketId) : undefined;
        seerSocket?.emit('seer_result', { round, targetId: tid, targetName, role });
      }
      if (result.hunterPendingInfo) {
        emitHunterPending(result.hunterPendingInfo.hunterId, result.hunterPendingInfo.availableTargetIds, result.room.code, io, rooms);
      } else if (result.room.phaseEndAt) {
        schedulePhaseTimer(result.room.code, result.room.phase, result.room.phaseEndAt, io, rooms);
      }
      console.log(`[game] witch action resolved in ${result.room.code}`);
    }
  });

  socket.on('hunter_shoot', ({ targetId }) => {
    const pid    = socket.data.playerId;
    const result = rooms.submitHunterShot(pid, targetId);
    if (!result.ok) { socket.emit('error', { message: result.error! }); return; }
    if (result.room) {
      clearHunterTimer(result.room.code);
      io.to(result.room.code).emit('room_updated', { room: result.room });
      if (result.room.phaseEndAt) schedulePhaseTimer(result.room.code, result.room.phase, result.room.phaseEndAt, io, rooms);
      console.log(`[hunter] shot resolved in ${result.room.code} → phase:${result.room.phase}`);
    }
  });

  socket.on('advance_day', () => {
    const pid    = socket.data.playerId;
    const result = rooms.advanceDay(pid);
    if (!result.ok) { socket.emit('error', { message: result.error! }); return; }
    if (result.room) {
      clearPhaseTimer(result.room.code);
      io.to(result.room.code).emit('room_updated', { room: result.room });
      if (result.room.phaseEndAt) schedulePhaseTimer(result.room.code, 'voting', result.room.phaseEndAt, io, rooms);
      console.log(`[game] day advanced to voting in ${result.room.code}`);
    }
  });

  socket.on('cast_vote', ({ targetId }) => {
    const pid    = socket.data.playerId;
    const result = rooms.submitVote(pid, targetId);
    if (!result.ok) { socket.emit('error', { message: result.error! }); return; }
    if (result.room) {
      const phaseChanged = result.room.phase !== 'voting';
      if (phaseChanged) clearPhaseTimer(result.room.code);
      io.to(result.room.code).emit('room_updated', { room: result.room });
      if (phaseChanged) {
        if (result.hunterPendingInfo) {
          emitHunterPending(result.hunterPendingInfo.hunterId, result.hunterPendingInfo.availableTargetIds, result.room.code, io, rooms);
        } else if (result.room.phaseEndAt) {
          schedulePhaseTimer(result.room.code, result.room.phase, result.room.phaseEndAt, io, rooms);
        }
      }
      if (phaseChanged) console.log(`[game] voting resolved in ${result.room.code} → phase:${result.room.phase}`);
    }
  });

  socket.on('restart_game', () => {
    const pid    = socket.data.playerId;
    const result = rooms.restartGame(pid);
    if (!result) return;
    if ('error' in result) { socket.emit('error', { message: result.error }); return; }
    const { room, roleMap } = result;
    const werewolfIds = rooms.getWerewolfIds(room.code);
    io.to(room.code).emit('game_started', { room });
    for (const [persistentId, role] of roleMap) {
      const socketId = rooms.getSocketId(persistentId);
      const s = socketId ? io.sockets.sockets.get(socketId) : undefined;
      if (s) s.emit('role_assigned', { role, werewolfIds: role === 'werewolf' ? werewolfIds : [] });
    }
    if (room.phaseEndAt) schedulePhaseTimer(room.code, room.phase, room.phaseEndAt, io, rooms);
    console.log(`[game] restarted in ${room.code}`);
  });

  socket.on('return_to_lobby', () => {
    const pid    = socket.data.playerId;
    const result = rooms.returnToLobby(pid);
    if (!result) return;
    if ('error' in result) { socket.emit('error', { message: result.error }); return; }
    clearPhaseTimer(result.code);
    io.to(result.code).emit('room_updated', { room: result });
    console.log(`[room] ${result.code} returned to lobby`);
  });

  // ── Host admin handlers ──────────────────────────────────────────────────────

  socket.on('host_kick_player', ({ targetId }) => {
    const pid    = socket.data.playerId;
    const result = rooms.kickPlayer(pid, targetId);
    if (!result.ok) { socket.emit('error', { message: result.error! }); return; }
    if (result.room) {
      if (result.kickedSocketId) {
        const kickedSocket = io.sockets.sockets.get(result.kickedSocketId);
        if (kickedSocket) { kickedSocket.emit('kicked'); kickedSocket.leave(result.room.code); }
      }
      io.to(result.room.code).emit('room_updated', { room: result.room });
      console.log(`[host] kicked ${targetId} from ${result.room.code}`);
    }
  });

  socket.on('host_lock_room', () => {
    const pid    = socket.data.playerId;
    const result = rooms.lockRoom(pid);
    if (!result.ok) { socket.emit('error', { message: result.error! }); return; }
    if (result.room) io.to(result.room.code).emit('room_updated', { room: result.room });
  });

  socket.on('host_unlock_room', () => {
    const pid    = socket.data.playerId;
    const result = rooms.unlockRoom(pid);
    if (!result.ok) { socket.emit('error', { message: result.error! }); return; }
    if (result.room) io.to(result.room.code).emit('room_updated', { room: result.room });
  });

  socket.on('host_reset_ready', () => {
    const pid    = socket.data.playerId;
    const result = rooms.resetReady(pid);
    if (!result.ok) { socket.emit('error', { message: result.error! }); return; }
    if (result.room) io.to(result.room.code).emit('room_updated', { room: result.room });
  });

  socket.on('host_pause_timer', () => {
    const pid    = socket.data.playerId;
    const result = rooms.pauseTimer(pid);
    if (!result.ok) { socket.emit('error', { message: result.error! }); return; }
    if (result.room) { clearPhaseTimer(result.room.code); io.to(result.room.code).emit('room_updated', { room: result.room }); }
  });

  socket.on('host_resume_timer', () => {
    const pid    = socket.data.playerId;
    const result = rooms.resumeTimer(pid);
    if (!result.ok) { socket.emit('error', { message: result.error! }); return; }
    if (result.room) {
      io.to(result.room.code).emit('room_updated', { room: result.room });
      if (result.room.phaseEndAt) schedulePhaseTimer(result.room.code, result.room.phase as any, result.room.phaseEndAt, io, rooms);
    }
  });

  socket.on('host_extend_timer', ({ extraSeconds }) => {
    const pid     = socket.data.playerId;
    const clamped = Math.min(Math.max(extraSeconds, 1), 300);
    const result  = rooms.extendTimer(pid, clamped);
    if (!result.ok) { socket.emit('error', { message: result.error! }); return; }
    if (result.room) {
      if (!result.room.timerPaused && result.room.phaseEndAt) schedulePhaseTimer(result.room.code, result.room.phase as any, result.room.phaseEndAt, io, rooms);
      io.to(result.room.code).emit('room_updated', { room: result.room });
    }
  });

  socket.on('host_end_phase', () => {
    const pid    = socket.data.playerId;
    const result = rooms.hostEndPhase(pid);
    if (!result.ok) { socket.emit('error', { message: result.error! }); return; }
    if (result.room) {
      clearPhaseTimer(result.room.code);
      io.to(result.room.code).emit('room_updated', { room: result.room });
      if (result.seerResult) {
        const { seerId, targetId: tid, targetName, role, round } = result.seerResult;
        const seerSocketId = rooms.getSocketId(seerId);
        const seerSocket   = seerSocketId ? io.sockets.sockets.get(seerSocketId) : undefined;
        seerSocket?.emit('seer_result', { round, targetId: tid, targetName, role });
      }
      if (result.hunterPendingInfo) {
        emitHunterPending(result.hunterPendingInfo.hunterId, result.hunterPendingInfo.availableTargetIds, result.room.code, io, rooms);
      } else if (result.room.phaseEndAt) {
        schedulePhaseTimer(result.room.code, result.room.phase as any, result.room.phaseEndAt, io, rooms);
      }
    }
  });

  socket.on('host_restart_game', () => {
    const pid    = socket.data.playerId;
    const result = rooms.hostRestartGame(pid);
    if (!result) return;
    if ('error' in result) { socket.emit('error', { message: result.error }); return; }
    const { room, roleMap } = result;
    clearPhaseTimer(room.code);
    clearHunterTimer(room.code);
    const werewolfIds = rooms.getWerewolfIds(room.code);
    io.to(room.code).emit('game_started', { room });
    for (const [persistentId, role] of roleMap) {
      const socketId = rooms.getSocketId(persistentId);
      const s = socketId ? io.sockets.sockets.get(socketId) : undefined;
      if (s) s.emit('role_assigned', { role, werewolfIds: role === 'werewolf' ? werewolfIds : [] });
    }
    if (room.phaseEndAt) schedulePhaseTimer(room.code, room.phase, room.phaseEndAt, io, rooms);
    console.log(`[host] game force-restarted in ${room.code}`);
  });

  socket.on('host_return_to_lobby', () => {
    const pid    = socket.data.playerId;
    const result = rooms.hostReturnToLobby(pid);
    if (!result) return;
    if ('error' in result) { socket.emit('error', { message: result.error }); return; }
    clearPhaseTimer(result.code);
    clearBotTimer(result.code);
    clearHunterTimer(result.code);
    io.to(result.code).emit('room_updated', { room: result });
    console.log(`[host] force-returned ${result.code} to lobby`);
  });

  socket.on('send_reaction', ({ emoji }) => {
    const pid  = socket.data.playerId;
    const room = rooms.getRoomByPlayer(pid);
    if (!room) return;
    if (room.phase !== 'day' && room.phase !== 'voting') return;
    const sender = room.players.find(p => p.id === pid);
    if (!sender?.isAlive) return;
    const ALLOWED = ['shock','wolf','eyes','knife','pray','laugh'];
    if (!ALLOWED.includes(emoji)) return;
    io.to(room.code).emit('reaction', { playerId: pid, emoji });
  });

  socket.on('chat_send', ({ text }) => {
    const pid  = socket.data.playerId;
    const room = rooms.getRoomByPlayer(pid);
    if (!room) return;

    // Light anti-spam throttle (400ms between messages per socket)
    const now  = Date.now();
    const last = chatThrottle.get(socket.id) ?? 0;
    if (now - last < 400) return;

    const clean = (text ?? '').replace(/\s+/g, ' ').trim().slice(0, 300);
    if (!clean) return;
    const sender = room.players.find(p => p.id === pid);
    if (!sender) return;

    const base = { id: Math.random().toString(36).slice(2, 10), senderId: pid, senderName: sender.name, text: clean, timestamp: now };

    if (room.phase === 'night') {
      // Only living werewolves may talk at night — private wolf channel
      if (!sender.isAlive || rooms.getRole(pid) !== 'werewolf') return;
      chatThrottle.set(socket.id, now);
      const msg = { channel: 'wolf' as const, ...base };
      rooms.addChatMessage(room.code, msg);
      for (const wolfId of rooms.getWerewolfIds(room.code)) {
        const wolf = room.players.find(p => p.id === wolfId);
        if (!wolf?.isAlive) continue;
        const wsid = rooms.getSocketId(wolfId);
        const wsock = wsid ? io.sockets.sockets.get(wsid) : undefined;
        wsock?.emit('chat_message', msg);
      }
    } else if (room.phase === 'day' || room.phase === 'voting') {
      // Public discussion — only the living may speak; everyone (incl. dead) sees it
      if (!sender.isAlive) return;
      chatThrottle.set(socket.id, now);
      const msg = { channel: 'public' as const, ...base };
      rooms.addChatMessage(room.code, msg);
      io.to(room.code).emit('chat_message', msg);
    }
  });

  // ── Test bot handlers ────────────────────────────────────────────────────────

  socket.on('host_add_bot', () => {
    if (!TEST_BOTS_ENABLED) { socket.emit('error', { message: 'Test bots are not enabled.' }); return; }
    const pid    = socket.data.playerId;
    const result = rooms.addBot(pid);
    if (!result.ok) { socket.emit('error', { message: result.error! }); return; }
    if (result.room) io.to(result.room.code).emit('room_updated', { room: result.room });
  });

  socket.on('host_fill_bots', ({ target }) => {
    if (!TEST_BOTS_ENABLED) { socket.emit('error', { message: 'Test bots are not enabled.' }); return; }
    const pid    = socket.data.playerId;
    const result = rooms.fillBots(pid, target);
    if (!result.ok) { socket.emit('error', { message: result.error! }); return; }
    if (result.room) io.to(result.room.code).emit('room_updated', { room: result.room });
  });

  socket.on('host_remove_bots', () => {
    if (!TEST_BOTS_ENABLED) { socket.emit('error', { message: 'Test bots are not enabled.' }); return; }
    const pid    = socket.data.playerId;
    const result = rooms.removeBots(pid);
    if (!result.ok) { socket.emit('error', { message: result.error! }); return; }
    if (result.room) io.to(result.room.code).emit('room_updated', { room: result.room });
  });

  socket.on('disconnect', () => {
    chatThrottle.delete(socket.id);
    const result = rooms.markOffline(socket.id);
    if (result) {
      const { room, wasHost } = result;
      io.to(room.code).emit('room_updated', { room });
      if (wasHost) scheduleHostTransfer(room.code, io, rooms);
      console.log(`[disconnect] ${socket.data.playerId} (room:${room.code}, wasHost:${wasHost})`);
    } else {
      console.log(`[disconnect] ${socket.id} (not in room)`);
    }
  });
}
