type SoundEvent =
  | 'phase_night'
  | 'phase_day'
  | 'phase_voting'
  | 'game_over_village'
  | 'game_over_wolf'
  | 'action_submit'
  | 'vote_cast'
  | 'player_die'
  | 'ready_up'
  | 'timer_urgent';

// Placeholder: swap void for actual Audio playback when assets are ready.
export function useSoundEffect() {
  const play = (_event: SoundEvent) => {
    // audio clips will be wired here
  };
  return { play };
}
