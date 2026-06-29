'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/events';
import { useGameStore } from '@/store/gameStore';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SocketContext = createContext<GameSocket | null>(null);

function getOrCreatePersistentId(): string {
  if (typeof window === 'undefined') return '';
  const KEY = 'ww_pid';
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<GameSocket | null>(null);

  const setRoom = useGameStore((s) => s.setRoom);
  const updateRoom = useGameStore((s) => s.updateRoom);
  const setMyRole = useGameStore((s) => s.setMyRole);
  const addSeerResult = useGameStore((s) => s.addSeerResult);
  const setError = useGameStore((s) => s.setError);
  const setConnected = useGameStore((s) => s.setConnected);
  const clearGameState = useGameStore((s) => s.clearGameState);
  const clearRoom = useGameStore((s) => s.clearRoom);

  useEffect(() => {
    const serverUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ??
      process.env.NEXT_PUBLIC_SERVER_URL ??
      'http://localhost:3001';
    const persistentId = getOrCreatePersistentId();

    const s: GameSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: { persistentId },
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => {
      setConnected(false);
      clearRoom();
    });
    s.on('room_joined', ({ room, playerId }) => setRoom(room, playerId));
    s.on('room_updated', ({ room }) => {
      if (room.phase === 'lobby') clearGameState();
      updateRoom(room);
    });
    s.on('game_started', ({ room }) => {
      clearGameState();
      updateRoom(room);
    });
    s.on('role_assigned', ({ role, werewolfIds }) => setMyRole(role, werewolfIds));
    s.on('seer_result', ({ round, targetId, targetName, role }) =>
      addSeerResult({ round, targetId, targetName, role })
    );
    s.on('error', ({ message }) => setError(message));
    s.on('kicked', () => {
      clearRoom();
      // Room becomes null → room page useEffect redirects to /
    });

    setSocket(s);
    return () => { s.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket(): GameSocket | null {
  return useContext(SocketContext);
}
