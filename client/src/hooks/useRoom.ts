'use client';

import { useCallback } from 'react';
import { useSocket } from '@/providers/SocketProvider';
import { useGameStore } from '@/store/gameStore';

export function useRoom() {
  const socket = useSocket();
  const room = useGameStore((s) => s.room);
  const playerId = useGameStore((s) => s.playerId);
  const error = useGameStore((s) => s.error);
  const isConnected = useGameStore((s) => s.isConnected);
  const setError = useGameStore((s) => s.setError);
  const clearRoom = useGameStore((s) => s.clearRoom);

  const createRoom = useCallback(
    (playerName: string) => {
      setError(null);
      socket?.emit('create_room', { playerName });
    },
    [socket, setError]
  );

  const joinRoom = useCallback(
    (roomCode: string, playerName: string) => {
      setError(null);
      socket?.emit('join_room', { roomCode, playerName });
    },
    [socket, setError]
  );

  const leaveRoom = useCallback(() => {
    socket?.emit('leave_room');
    clearRoom();
  }, [socket, clearRoom]);

  const startGame = useCallback(() => {
    socket?.emit('start_game');
  }, [socket]);

  const playerReady = useCallback(() => {
    socket?.emit('player_ready');
  }, [socket]);

  const nightAction = useCallback(
    (targetId: string) => {
      socket?.emit('night_action', { targetId });
    },
    [socket]
  );

  const castVote = useCallback(
    (targetId: string) => {
      socket?.emit('cast_vote', { targetId });
    },
    [socket]
  );

  const advanceDay = useCallback(() => {
    socket?.emit('advance_day');
  }, [socket]);

  const restartGame = useCallback(() => {
    socket?.emit('restart_game');
  }, [socket]);

  const returnToLobby = useCallback(() => {
    socket?.emit('return_to_lobby');
  }, [socket]);

  // ── Host admin actions ────────────────────────────────────────────────────

  const hostKickPlayer = useCallback(
    (targetId: string) => {
      socket?.emit('host_kick_player', { targetId });
    },
    [socket]
  );

  const hostLockRoom = useCallback(() => {
    socket?.emit('host_lock_room');
  }, [socket]);

  const hostUnlockRoom = useCallback(() => {
    socket?.emit('host_unlock_room');
  }, [socket]);

  const hostResetReady = useCallback(() => {
    socket?.emit('host_reset_ready');
  }, [socket]);

  const hostPauseTimer = useCallback(() => {
    socket?.emit('host_pause_timer');
  }, [socket]);

  const hostResumeTimer = useCallback(() => {
    socket?.emit('host_resume_timer');
  }, [socket]);

  const hostExtendTimer = useCallback(
    (extraSeconds: number) => {
      socket?.emit('host_extend_timer', { extraSeconds });
    },
    [socket]
  );

  const hostEndPhase = useCallback(() => {
    socket?.emit('host_end_phase');
  }, [socket]);

  const hostRestartGame = useCallback(() => {
    socket?.emit('host_restart_game');
  }, [socket]);

  const hostReturnToLobby = useCallback(() => {
    socket?.emit('host_return_to_lobby');
  }, [socket]);

  const clearError = useCallback(() => setError(null), [setError]);

  return {
    room,
    playerId,
    error,
    isConnected,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    playerReady,
    nightAction,
    castVote,
    advanceDay,
    restartGame,
    returnToLobby,
    hostKickPlayer,
    hostLockRoom,
    hostUnlockRoom,
    hostResetReady,
    hostPauseTimer,
    hostResumeTimer,
    hostExtendTimer,
    hostEndPhase,
    hostRestartGame,
    hostReturnToLobby,
    clearError,
  };
}
