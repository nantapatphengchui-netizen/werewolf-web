import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './types/events';
import { RoomManager } from './game/RoomManager';
import { registerHandlers, cancelHostTransfer, resumeTimers } from './socket/handlers';
import { loadState, saveState, persistenceEnabled } from './persistence';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
// Railway/Render inject PORT automatically; SERVER_PORT is the local/manual override.
const PORT = Number(process.env.PORT ?? process.env.SERVER_PORT ?? 3001);

// Support comma-separated list of allowed origins, e.g.
// CLIENT_ORIGIN=https://mygame.vercel.app,http://localhost:3000
const rawOrigin = process.env.CLIENT_ORIGIN ?? process.env.CLIENT_URL ?? 'http://localhost:3000';
const allowedOrigins: string[] = rawOrigin.split(',').map(s => s.trim()).filter(Boolean);

const startedAt = Date.now();

const app = express();

// ── HTTP middleware ──────────────────────────────────────────────────────────

app.use(cors({
  origin: (origin, cb) => {
    // Allow non-browser clients (curl, health-checks) and listed origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin "${origin}" not allowed`));
  },
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// ── HTTP routes ──────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: NODE_ENV,
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    rooms: rooms.roomCount(),
    timestamp: new Date().toISOString(),
  });
});

// ── Socket.IO ────────────────────────────────────────────────────────────────

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  httpServer,
  {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
    },
    // Allow both polling (initial handshake) and WebSocket upgrade
    transports: ['polling', 'websocket'],
    pingTimeout: 60_000,
    pingInterval: 25_000,
    // Prevent oversized payloads
    maxHttpBufferSize: 1e5,
  }
);

const rooms = new RoomManager();

// ── Persistence: rehydrate on boot, then flush periodically ────────────────────

async function rehydrate(): Promise<void> {
  const snapshot = await loadState();
  if (snapshot) {
    const n = rooms.restoreAll(snapshot);
    resumeTimers(io, rooms);
    console.log(`[persist] restored ${n} room(s) from Redis`);
  }
}

if (persistenceEnabled) {
  rehydrate().catch(e => console.error('[persist] rehydrate failed:', e));
  // Write-through snapshot; saveState no-ops when nothing changed
  setInterval(() => { void saveState(rooms.snapshotAll()); }, 3000);
}

io.on('connection', socket => {
  const authPid = socket.handshake.auth && typeof socket.handshake.auth.persistentId === 'string'
    ? socket.handshake.auth.persistentId.trim()
    : '';
  const persistentId = authPid || socket.id;
  socket.data.playerId = persistentId;

  if (NODE_ENV !== 'production') {
    console.log(`[connect] ${socket.id} → pid:${persistentId}`);
  }

  const reconnect = rooms.tryReconnect(persistentId, socket.id);
  if (reconnect) {
    const { room, role, werewolfIds } = reconnect;
    socket.join(room.code);
    socket.emit('room_joined', { room, playerId: persistentId });
    if (role) {
      socket.emit('role_assigned', {
        role,
        werewolfIds: role === 'werewolf' ? werewolfIds : [],
      });
    }
    // Replay the Seer's inspection history so their notebook survives a reconnect
    if (role === 'seer') {
      for (const sr of rooms.getSeerHistory(persistentId)) {
        socket.emit('seer_result', { round: sr.round, targetId: sr.targetId, targetName: sr.targetName, role: sr.role });
      }
    }
    // Re-send a still-pending Witch decision so they can still act after reconnecting
    const witchInfo = rooms.getPendingWitchInfo(persistentId);
    if (witchInfo) {
      socket.emit('witch_night_info', {
        attackedPlayerId:   witchInfo.attackedPlayerId,
        attackedPlayerName: witchInfo.attackedPlayerName,
        savePotionUsed:     witchInfo.savePotionUsed,
        poisonPotionUsed:   witchInfo.poisonPotionUsed,
      });
    }
    // Replay recent chat — wolf lines only to a living wolf, dead lines only to the dead
    const me = room.players.find(p => p.id === persistentId);
    const isLivingWolf = !!me?.isAlive && role === 'werewolf';
    const isDead = !!me && !me.isAlive;
    for (const m of rooms.getChatLog(room.code)) {
      if (m.channel === 'wolf' && !isLivingWolf) continue;
      if (m.channel === 'dead' && !isDead) continue;
      socket.emit('chat_message', m);
    }
    cancelHostTransfer(room.code);
    io.to(room.code).emit('room_updated', { room });
    if (NODE_ENV !== 'production') {
      console.log(`[reconnect] pid:${persistentId} → room:${room.code}`);
    }
  }

  registerHandlers(io, socket, rooms);
});

// ── Start ────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log('');
  console.log('  Werewolf Game Server');
  console.log(`  env   : ${NODE_ENV}`);
  console.log(`  port  : ${PORT}`);
  console.log(`  cors  : ${allowedOrigins.join(', ')}`);
  console.log(`  health: http://localhost:${PORT}/health`);
  console.log('');
});

// ── Graceful shutdown ────────────────────────────────────────────────────────

function shutdown(signal: string) {
  console.log(`\n[shutdown] ${signal} received — closing server…`);
  // Persist the latest state so an in-progress game survives the redeploy/restart
  const finalSave = persistenceEnabled
    ? saveState(rooms.snapshotAll()).catch(e => console.error('[persist] final save failed:', e))
    : Promise.resolve();
  finalSave.finally(() => {
    io.close(() => {
      httpServer.close(() => {
        console.log('[shutdown] done');
        process.exit(0);
      });
    });
  });
  // Force-exit after 10s if connections hang
  setTimeout(() => process.exit(1), 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
