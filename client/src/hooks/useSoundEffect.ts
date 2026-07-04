'use client';

import { useCallback, useRef } from 'react';
import { useAudioContext } from '@/providers/AudioProvider';

export type SoundEvent =
  | 'phase_night'
  | 'phase_day'
  | 'phase_voting'
  | 'game_over_village'
  | 'game_over_wolf'
  | 'action_submit'
  | 'vote_cast'
  | 'player_die'
  | 'your_turn'
  | 'ready_up'
  | 'timer_urgent'
  | 'timer_tick';

// ── Synthesised cues (no audio assets needed) ─────────────────────────────────
// Each cue is a tiny sequence of oscillator notes with a quick attack/decay.
type Note = { f: number; t: number; d: number; type?: OscillatorType; g?: number };

const PATTERNS: Record<SoundEvent, Note[]> = {
  your_turn:     [{ f: 587, t: 0,    d: 0.13, type: 'sine' }, { f: 880, t: 0.10, d: 0.22, type: 'sine' }],
  action_submit: [{ f: 523, t: 0,    d: 0.09, type: 'triangle' }, { f: 784, t: 0.07, d: 0.15, type: 'triangle' }],
  vote_cast:     [{ f: 196, t: 0,    d: 0.16, type: 'square', g: 0.45 }, { f: 147, t: 0.05, d: 0.22, type: 'square', g: 0.45 }],
  player_die:    [{ f: 220, t: 0,    d: 0.5,  type: 'sawtooth', g: 0.42 }, { f: 104, t: 0.14, d: 0.62, type: 'sawtooth', g: 0.42 }],
  timer_urgent:  [{ f: 1046, t: 0,   d: 0.08, type: 'square', g: 0.5 }, { f: 1046, t: 0.17, d: 0.08, type: 'square', g: 0.5 }],
  timer_tick:    [{ f: 880, t: 0,    d: 0.05, type: 'square', g: 0.3 }],
  phase_night:   [{ f: 392, t: 0,    d: 0.32, type: 'sine' }],
  phase_day:     [{ f: 659, t: 0,    d: 0.30, type: 'sine' }],
  phase_voting:  [{ f: 494, t: 0,    d: 0.26, type: 'triangle' }],
  ready_up:      [{ f: 659, t: 0,    d: 0.10, type: 'sine' }],
  game_over_village: [{ f: 523, t: 0, d: 0.20 }, { f: 659, t: 0.16, d: 0.20 }, { f: 784, t: 0.32, d: 0.38 }],
  game_over_wolf:    [{ f: 415, t: 0, d: 0.26, type: 'sawtooth', g: 0.4 }, { f: 311, t: 0.20, d: 0.52, type: 'sawtooth', g: 0.4 }],
};

let sharedCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedCtx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      sharedCtx = new AC();
    }
    if (sharedCtx.state === 'suspended') sharedCtx.resume().catch(() => {});
    return sharedCtx;
  } catch {
    return null;
  }
}

/** Short synthesised UI/game cues. Respects the music mute toggle. */
export function useSoundEffect() {
  const { muted, volume } = useAudioContext();
  const mutedRef = useRef(muted);
  const volRef   = useRef(volume);
  mutedRef.current = muted;
  volRef.current   = volume;

  const play = useCallback((event: SoundEvent) => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const notes = PATTERNS[event];
    if (!notes) return;

    const master = Math.min(0.9, (volRef.current ?? 0.35) + 0.18); // a touch above the music floor
    const now = ctx.currentTime;

    for (const n of notes) {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type ?? 'sine';
      osc.frequency.value = n.f;

      const peak = Math.max(0.001, (n.g ?? 0.32) * master);
      const t0   = now + n.t;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.d);

      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + n.d + 0.03);
    }
  }, []);

  return { play };
}
