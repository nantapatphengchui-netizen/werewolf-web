import type { RoomState, Role } from './game';

export interface ServerToClientEvents {
  room_joined:          (payload: { room: RoomState; playerId: string }) => void;
  room_updated:         (payload: { room: RoomState }) => void;
  game_started:         (payload: { room: RoomState }) => void;
  role_assigned:        (payload: { role: Role; werewolfIds: string[] }) => void;
  seer_result:          (payload: { round: number; targetId: string; targetName: string; role: Role }) => void;
  error:                (payload: { message: string }) => void;
  kicked:               () => void;
  day_reaction_sent:    (payload: { fromId: string; fromName: string; targetId: string; targetName: string }) => void;
  hunter_shot_pending:  (payload: { hunterId: string; availableTargetIds: string[] }) => void;
  witch_night_info:     (payload: {
    attackedPlayerId:   string | null;
    attackedPlayerName: string | null;
    savePotionUsed:     boolean;
    poisonPotionUsed:   boolean;
  }) => void;
}

export interface ClientToServerEvents {
  create_room:          (payload: { playerName: string }) => void;
  join_room:            (payload: { roomCode: string; playerName: string }) => void;
  leave_room:           () => void;
  start_game:           () => void;
  player_ready:         () => void;
  night_action:         (payload: { targetId: string }) => void;
  cast_vote:            (payload: { targetId: string }) => void;
  advance_day:          () => void;
  restart_game:         () => void;
  return_to_lobby:      () => void;
  hunter_shoot:         (payload: { targetId: string | null }) => void;
  witch_action:         (payload: { save: boolean; poisonTargetId: string | null }) => void;
  // Host admin actions
  host_kick_player:     (payload: { targetId: string }) => void;
  host_add_bot:         () => void;
  host_fill_bots:       (payload: { target: number }) => void;
  host_remove_bots:     () => void;
  host_lock_room:       () => void;
  host_unlock_room:     () => void;
  host_reset_ready:     () => void;
  host_pause_timer:     () => void;
  host_resume_timer:    () => void;
  host_extend_timer:    (payload: { extraSeconds: number }) => void;
  host_end_phase:       () => void;
  host_restart_game:    () => void;
  host_return_to_lobby: () => void;
  // Social deduction actions
  day_mark_suspicion:      (payload: { targetId: string }) => void;
  day_mark_trust:          (payload: { targetId: string }) => void;
  day_reaction:            (payload: { targetId: string }) => void;
  host_toggle_guided_day:  () => void;
}
