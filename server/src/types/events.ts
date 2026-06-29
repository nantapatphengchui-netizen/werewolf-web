import type { RoomState, Role } from './game';

export interface ServerToClientEvents {
  room_joined: (payload: { room: RoomState; playerId: string }) => void;
  room_updated: (payload: { room: RoomState }) => void;
  game_started: (payload: { room: RoomState }) => void;
  role_assigned: (payload: { role: Role; werewolfIds: string[] }) => void;
  seer_result: (payload: { round: number; targetId: string; targetName: string; role: Role }) => void;
  error: (payload: { message: string }) => void;
  kicked: () => void;
}

export interface ClientToServerEvents {
  create_room: (payload: { playerName: string }) => void;
  join_room: (payload: { roomCode: string; playerName: string }) => void;
  leave_room: () => void;
  start_game: () => void;
  player_ready: () => void;
  night_action: (payload: { targetId: string }) => void;
  cast_vote: (payload: { targetId: string }) => void;
  advance_day: () => void;
  restart_game: () => void;
  return_to_lobby: () => void;
  // Host admin actions
  host_kick_player: (payload: { targetId: string }) => void;
  host_lock_room: () => void;
  host_unlock_room: () => void;
  host_reset_ready: () => void;
  host_pause_timer: () => void;
  host_resume_timer: () => void;
  host_extend_timer: (payload: { extraSeconds: number }) => void;
  host_end_phase: () => void;
  host_restart_game: () => void;
  host_return_to_lobby: () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  playerId: string;
}
