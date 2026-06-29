import type { Server, Socket } from 'socket.io';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '../types/events';
import type { GamePhase } from '../types/game';
import { RoomManager, PHASE_DURATIONS } from '../game/RoomManager';

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type Sock = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// ── Phase timers (module-level: survive across connections) ──────────────────

const phaseTimers = new Map<string, ReturnType<typeof setTimeout>>();

function schedulePhaseTimer(roomCode: string, phase: GamePhase, endAt: number, io: IO, rooms: RoomManager): void {
  clearPhaseTimer(roomCode);
  if (phase === 'lobby' || phase === 'ended') return;

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
        if (result.room.phaseEndAt) {
          schedulePhaseTimer(roomCode, result.room.phase, result.room.phaseEndAt, io, rooms);
        }
        console.log(`[timer] night expired → ${result.room.phase} in ${roomCode}`);
      }
    } else if (phase === 'day') {
      const result = rooms.forceAdvanceDay(roomCode);
      if (result.ok && result.room) {
        io.to(roomCode).emit('room_updated', { room: result.room });
        if (result.room.phaseEndAt) {
          schedulePhaseTimer(roomCode, 'voting', result.room.phaseEndAt, io, rooms);
        }
        console.log(`[timer] day expired → voting in ${roomCode}`);
      }
    } else if (phase === 'voting') {
      const result = rooms.forceResolveVoting(roomCode);
      if (result.ok && result.room) {
        io.to(roomCode).emit('room_updated', { room: result.room });
        if (result.room.phaseEndAt) {
          schedulePhaseTimer(roomCode, result.room.phase, result.room.phaseEndAt, io, rooms);
        }
        console.log(`[timer] voting expired → ${result.room.phase} in ${roomCode}`);
      }
    }
  }, delay));
}

export function clearPhaseTimer(roomCode: string): void {
  const t = phaseTimers.get(roomCode);
  if (t !== undefined) {
    clearTimeout(t);
    phaseTimers.delete(roomCode);
  }
}

// ── Host transfer timers ─────────────────────────────────────────────────────

const hostTransferTimers = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleHostTransfer(roomCode: string, io: IO, rooms: RoomManager): void {
  const existing = hostTransferTimers.get(roomCode);
  if (existing !== undefined) clearTimeout(existing);

  hostTransferTimers.set(
    roomCode,
    setTimeout(() => {
      hostTransferTimers.delete(roomCode);
      const room = rooms.transferHost(roomCode);
      if (room) {
        io.to(roomCode).emit('room_updated', { room });
        console.log(`[room] Host auto-transferred in ${roomCode}`);
      }
    }, 30_000)
  );
}

export function cancelHostTransfer(roomCode: string): void {
  const t = hostTransferTimers.get(roomCode);
  if (t !== undefined) {
    clearTimeout(t);
    hostTransferTimers.delete(roomCode);
  }
}

// ── Handler registration ─────────────────────────────────────────────────────

export function registerHandlers(io: IO, socket: Sock, rooms: RoomManager): void {
  socket.on('create_room', ({ playerName }) => {
    const name = playerName?.trim();
    if (!name || name.length < 1 || name.length > 20) {
      socket.emit('error', { message: 'Name must be 1–20 characters.' });
      return;
    }
    const pid = socket.data.playerId;
    const room = rooms.createRoom(socket.id, pid, name);
    socket.join(room.code);
    socket.emit('room_joined', { room, playerId: pid });
    console.log(`[room] created ${room.code} by "${name}"`);
  });

  socket.on('join_room', ({ roomCode, playerName }) => {
    const name = playerName?.trim();
    const code = roomCode?.trim().toUpperCase();
    if (!name || name.length < 1 || name.length > 20) {
      socket.emit('error', { message: 'Name must be 1–20 characters.' });
      return;
    }
    if (!code || code.length < 4) {
      socket.emit('error', { message: 'Invalid room code.' });
      return;
    }
    const pid = socket.data.playerId;
    const result = rooms.joinRoom(code, socket.id, pid, name);
    if ('error' in result) {
      socket.emit('error', { message: result.error });
      return;
    }
    socket.join(result.code);
    socket.emit('room_joined', { room: result, playerId: pid });
    socket.to(result.code).emit('room_updated', { room: result });
    console.log(`[room] "${name}" joined ${result.code}`);
  });

  socket.on('leave_room', () => {
    const pid = socket.data.playerId;
    const { roomCode, room } = rooms.leaveRoom(pid);
    if (roomCode) {
      socket.leave(roomCode);
      // Only clear timer when the room was destroyed (no players left)
      if (!room) clearPhaseTimer(roomCode);
    }
    if (room) io.to(room.code).emit('room_updated', { room });
    console.log(`[room] ${pid} left ${roomCode ?? 'unknown'}`);
  });

  socket.on('player_ready', () => {
    const pid = socket.data.playerId;
    const result = rooms.toggleReady(pid);
    if (!result.ok) {
      socket.emit('error', { message: result.error! });
      return;
    }
    if (result.room) {
      io.to(result.room.code).emit('room_updated', { room: result.room });
    }
  });

  socket.on('start_game', () => {
    const pid = socket.data.playerId;
    const check = rooms.canStartGame(pid);
    if (!check.ok) {
      socket.emit('error', { message: check.error });
      return;
    }

    const result = rooms.startGame(pid);
    if (!result) return;

    const { room, roleMap } = result;
    const werewolfIds = rooms.getWerewolfIds(room.code);

    for (const [persistentId, role] of roleMap) {
      const socketId = rooms.getSocketId(persistentId);
      const targetSocket = socketId ? io.sockets.sockets.get(socketId) : undefined;
      if (targetSocket) {
        targetSocket.emit('role_assigned', { role, werewolfIds: role === 'werewolf' ? werewolfIds : [] });
      }
    }

    io.to(room.code).emit('game_started', { room });
    if (room.phaseEndAt) schedulePhaseTimer(room.code, room.phase, room.phaseEndAt, io, rooms);
    console.log(`[game] started in ${room.code} — roles assigned to ${roleMap.size} players`);
  });

  socket.on('night_action', ({ targetId }) => {
    const pid = socket.data.playerId;
    const result = rooms.submitNightAction(pid, targetId);
    if (!result.ok) {
      socket.emit('error', { message: result.error! });
      return;
    }
    if (result.room) {
      clearPhaseTimer(result.room.code);
      io.to(result.room.code).emit('room_updated', { room: result.room });
      if (result.seerResult) {
        const { seerId, targetId: tid, targetName, role, round } = result.seerResult;
        const seerSocketId = rooms.getSocketId(seerId);
        const seerSocket = seerSocketId ? io.sockets.sockets.get(seerSocketId) : undefined;
        seerSocket?.emit('seer_result', { round, targetId: tid, targetName, role });
      }
      if (result.room.phaseEndAt) {
        schedulePhaseTimer(result.room.code, result.room.phase, result.room.phaseEndAt, io, rooms);
      }
      console.log(`[game] night resolved in ${result.room.code} → phase:${result.room.phase}`);
    }
  });

  socket.on('advance_day', () => {
    const pid = socket.data.playerId;
    const result = rooms.advanceDay(pid);
    if (!result.ok) {
      socket.emit('error', { message: result.error! });
      return;
    }
    if (result.room) {
      clearPhaseTimer(result.room.code);
      io.to(result.room.code).emit('room_updated', { room: result.room });
      if (result.room.phaseEndAt) {
        schedulePhaseTimer(result.room.code, 'voting', result.room.phaseEndAt, io, rooms);
      }
      console.log(`[game] day advanced to voting in ${result.room.code}`);
    }
  });

  socket.on('cast_vote', ({ targetId }) => {
    const pid = socket.data.playerId;
    const result = rooms.submitVote(pid, targetId);
    if (!result.ok) {
      socket.emit('error', { message: result.error! });
      return;
    }
    if (result.room) {
      const phaseChanged = result.room.phase !== 'voting';
      if (phaseChanged) clearPhaseTimer(result.room.code);
      io.to(result.room.code).emit('room_updated', { room: result.room });
      if (phaseChanged && result.room.phaseEndAt) {
        schedulePhaseTimer(result.room.code, result.room.phase, result.room.phaseEndAt, io, rooms);
      }
      if (phaseChanged) console.log(`[game] voting resolved in ${result.room.code} → phase:${result.room.phase}`);
    }
  });

  socket.on('restart_game', () => {
    const pid = socket.data.playerId;
    const result = rooms.restartGame(pid);
    if (!result) return;
    if ('error' in result) {
      socket.emit('error', { message: result.error });
      return;
    }
    const { room, roleMap } = result;
    const werewolfIds = rooms.getWerewolfIds(room.code);
    for (const [persistentId, role] of roleMap) {
      const socketId = rooms.getSocketId(persistentId);
      const s = socketId ? io.sockets.sockets.get(socketId) : undefined;
      if (s) s.emit('role_assigned', { role, werewolfIds: role === 'werewolf' ? werewolfIds : [] });
    }
    io.to(room.code).emit('game_started', { room });
    if (room.phaseEndAt) schedulePhaseTimer(room.code, room.phase, room.phaseEndAt, io, rooms);
    console.log(`[game] restarted in ${room.code}`);
  });

  socket.on('return_to_lobby', () => {
    const pid = socket.data.playerId;
    const result = rooms.returnToLobby(pid);
    if (!result) return;
    if ('error' in result) {
      socket.emit('error', { message: result.error });
      return;
    }
    clearPhaseTimer(result.code);
    io.to(result.code).emit('room_updated', { room: result });
    console.log(`[room] ${result.code} returned to lobby`);
  });

  // ── Host admin handlers ──────────────────────────────────────────────────────

  socket.on('host_kick_player', ({ targetId }) => {
    const pid = socket.data.playerId;
    const result = rooms.kickPlayer(pid, targetId);
    if (!result.ok) {
      socket.emit('error', { message: result.error! });
      return;
    }
    if (result.room) {
      // Notify kicked player's socket
      if (result.kickedSocketId) {
        const kickedSocket = io.sockets.sockets.get(result.kickedSocketId);
        if (kickedSocket) {
          kickedSocket.emit('kicked');
          kickedSocket.leave(result.room.code);
        }
      }
      io.to(result.room.code).emit('room_updated', { room: result.room });
      console.log(`[host] kicked ${targetId} from ${result.room.code}`);
    }
  });

  socket.on('host_lock_room', () => {
    const pid = socket.data.playerId;
    const result = rooms.lockRoom(pid);
    if (!result.ok) {
      socket.emit('error', { message: result.error! });
      return;
    }
    if (result.room) io.to(result.room.code).emit('room_updated', { room: result.room });
  });

  socket.on('host_unlock_room', () => {
    const pid = socket.data.playerId;
    const result = rooms.unlockRoom(pid);
    if (!result.ok) {
      socket.emit('error', { message: result.error! });
      return;
    }
    if (result.room) io.to(result.room.code).emit('room_updated', { room: result.room });
  });

  socket.on('host_reset_ready', () => {
    const pid = socket.data.playerId;
    const result = rooms.resetReady(pid);
    if (!result.ok) {
      socket.emit('error', { message: result.error! });
      return;
    }
    if (result.room) io.to(result.room.code).emit('room_updated', { room: result.room });
  });

  socket.on('host_pause_timer', () => {
    const pid = socket.data.playerId;
    const result = rooms.pauseTimer(pid);
    if (!result.ok) {
      socket.emit('error', { message: result.error! });
      return;
    }
    if (result.room) {
      clearPhaseTimer(result.room.code);
      io.to(result.room.code).emit('room_updated', { room: result.room });
      console.log(`[host] timer paused in ${result.room.code}`);
    }
  });

  socket.on('host_resume_timer', () => {
    const pid = socket.data.playerId;
    const result = rooms.resumeTimer(pid);
    if (!result.ok) {
      socket.emit('error', { message: result.error! });
      return;
    }
    if (result.room) {
      io.to(result.room.code).emit('room_updated', { room: result.room });
      if (result.room.phaseEndAt) {
        schedulePhaseTimer(result.room.code, result.room.phase as any, result.room.phaseEndAt, io, rooms);
      }
      console.log(`[host] timer resumed in ${result.room.code}`);
    }
  });

  socket.on('host_extend_timer', ({ extraSeconds }) => {
    const pid = socket.data.playerId;
    const clamped = Math.min(Math.max(extraSeconds, 1), 300); // 1–300s
    const result = rooms.extendTimer(pid, clamped);
    if (!result.ok) {
      socket.emit('error', { message: result.error! });
      return;
    }
    if (result.room) {
      // If not paused, reschedule the timer with the new end time
      if (!result.room.timerPaused && result.room.phaseEndAt) {
        schedulePhaseTimer(result.room.code, result.room.phase as any, result.room.phaseEndAt, io, rooms);
      }
      io.to(result.room.code).emit('room_updated', { room: result.room });
      console.log(`[host] timer extended +${clamped}s in ${result.room.code}`);
    }
  });

  socket.on('host_end_phase', () => {
    const pid = socket.data.playerId;
    const result = rooms.hostEndPhase(pid);
    if (!result.ok) {
      socket.emit('error', { message: result.error! });
      return;
    }
    if (result.room) {
      clearPhaseTimer(result.room.code);
      io.to(result.room.code).emit('room_updated', { room: result.room });
      if (result.seerResult) {
        const { seerId, targetId: tid, targetName, role, round } = result.seerResult;
        const seerSocketId = rooms.getSocketId(seerId);
        const seerSocket = seerSocketId ? io.sockets.sockets.get(seerSocketId) : undefined;
        seerSocket?.emit('seer_result', { round, targetId: tid, targetName, role });
      }
      if (result.room.phaseEndAt) {
        schedulePhaseTimer(result.room.code, result.room.phase as any, result.room.phaseEndAt, io, rooms);
      }
      console.log(`[host] phase ended early in ${result.room.code} → ${result.room.phase}`);
    }
  });

  socket.on('host_restart_game', () => {
    const pid = socket.data.playerId;
    const result = rooms.hostRestartGame(pid);
    if (!result) return;
    if ('error' in result) {
      socket.emit('error', { message: result.error });
      return;
    }
    const { room, roleMap } = result;
    clearPhaseTimer(room.code);
    const werewolfIds = rooms.getWerewolfIds(room.code);
    for (const [persistentId, role] of roleMap) {
      const socketId = rooms.getSocketId(persistentId);
      const s = socketId ? io.sockets.sockets.get(socketId) : undefined;
      if (s) s.emit('role_assigned', { role, werewolfIds: role === 'werewolf' ? werewolfIds : [] });
    }
    io.to(room.code).emit('game_started', { room });
    if (room.phaseEndAt) schedulePhaseTimer(room.code, room.phase, room.phaseEndAt, io, rooms);
    console.log(`[host] game force-restarted in ${room.code}`);
  });

  socket.on('host_return_to_lobby', () => {
    const pid = socket.data.playerId;
    const result = rooms.hostReturnToLobby(pid);
    if (!result) return;
    if ('error' in result) {
      socket.emit('error', { message: result.error });
      return;
    }
    clearPhaseTimer(result.code);
    io.to(result.code).emit('room_updated', { room: result });
    console.log(`[host] force-returned ${result.code} to lobby`);
  });

  socket.on('disconnect', () => {
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
