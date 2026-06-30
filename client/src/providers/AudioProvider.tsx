'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useAudioPhaseStore } from '@/store/audioPhaseStore';

// ── Track map ─────────────────────────────────────────────────────────────────
// Place audio files in client/public/audio/.
// Recommended format: MP3 (universal) or OGG (Firefox fallback).
// Rename/replace any of these files to swap tracks.
// Missing files are handled gracefully — the UI will not crash.
const TRACKS: Partial<Record<string, string>> = {
  lobby:  '/audio/lobby.mp3',      // Ambient village atmosphere
  night:  '/audio/night.mp3',      // Tense/dark night music
  day:    '/audio/day.mp3',        // Discussion-era village theme
  voting: '/audio/voting.mp3',     // Dramatic voting music
  ended:  '/audio/game-over.mp3',  // Victory or defeat sting
};

const LS_MUTED  = 'ww_music_muted';
const LS_VOLUME = 'ww_music_volume';
const DEFAULT_VOLUME = 0.35;

function readMuted(): boolean {
  try { return localStorage.getItem(LS_MUTED) === 'true'; } catch { return false; }
}

function readVolume(): number {
  try {
    const v = parseFloat(localStorage.getItem(LS_VOLUME) ?? '');
    return isNaN(v) ? DEFAULT_VOLUME : Math.max(0, Math.min(1, v));
  } catch { return DEFAULT_VOLUME; }
}

// ── Context ───────────────────────────────────────────────────────────────────

interface AudioCtxValue {
  muted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (v: number) => void;
}

const AudioCtx = createContext<AudioCtxValue>({
  muted: false,
  volume: DEFAULT_VOLUME,
  toggleMute: () => {},
  setVolume: () => {},
});

export function useAudioContext(): AudioCtxValue {
  return useContext(AudioCtx);
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode;
}

export function AudioProvider({ children }: Props) {
  const phase = useAudioPhaseStore(s => s.phase);
  const [muted,  setMutedState]  = useState(readMuted);
  const [volume, setVolumeState] = useState(readVolume);

  // Refs keep callbacks stable and free from stale-closure bugs
  const audioEl     = useRef<HTMLAudioElement | null>(null);
  const fadeTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadedPhase = useRef('');
  const mutedRef    = useRef(muted);
  const volumeRef   = useRef(volume);
  const interacted  = useRef(false);
  const phaseRef    = useRef(phase);

  useEffect(() => { mutedRef.current  = muted;  }, [muted]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { phaseRef.current  = phase;  }, [phase]);

  // ── Fade helper ───────────────────────────────────────────────────────────

  const clearFade = useCallback(() => {
    if (fadeTimer.current !== null) {
      clearInterval(fadeTimer.current);
      fadeTimer.current = null;
    }
  }, []);

  const fadeTo = useCallback((target: number, ms: number, onDone?: () => void) => {
    clearFade();
    const audio = audioEl.current;
    if (!audio) { onDone?.(); return; }

    const start = audio.volume;
    const steps = Math.max(1, Math.round(ms / 50));
    let i = 0;

    fadeTimer.current = setInterval(() => {
      i++;
      const a = audioEl.current;
      if (!a) { clearFade(); onDone?.(); return; }
      a.volume = start + (target - start) * (i / steps);
      if (i >= steps) { a.volume = target; clearFade(); onDone?.(); }
    }, ms / steps);
  }, [clearFade]);

  // ── Load and play a track ─────────────────────────────────────────────────

  const startTrack = useCallback((trackPhase: string) => {
    const audio = audioEl.current;
    if (!audio) return;

    const src = TRACKS[trackPhase];
    if (!src) return; // Phase has no track — stay silent

    // Register error handler BEFORE setting src so early load failures are caught
    audio.onerror = () => {
      // Audio file is missing or unsupported — fail silently, don't crash
      audio.onerror = null;
      audio.src = '';
      loadedPhase.current = '';
    };

    audio.src = src;
    audio.loop = true;
    audio.volume = 0;

    const promise = audio.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          // Fade in to current volume, or stay silent if muted
          fadeTo(mutedRef.current ? 0 : volumeRef.current, 1000);
        })
        .catch(() => {
          // Autoplay blocked — will retry when user unmutes or next interaction
        });
    }
  }, [fadeTo]);

  // ── Create / destroy the HTMLAudioElement ─────────────────────────────────

  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0;
    audioEl.current = audio;

    return () => {
      clearFade();
      audio.pause();
      audio.onerror = null;
      audio.src = '';
      audioEl.current = null;
    };
  }, [clearFade]);

  // ── Unlock autoplay on first user interaction ─────────────────────────────

  useEffect(() => {
    const onFirstClick = () => {
      interacted.current = true;
      if (!mutedRef.current) {
        const p = phaseRef.current;
        loadedPhase.current = p;
        startTrack(p);
      }
    };
    document.addEventListener('click', onFirstClick, { once: true });
    return () => document.removeEventListener('click', onFirstClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — uses refs to stay current

  // ── Switch track when phase changes ──────────────────────────────────────

  useEffect(() => {
    if (!interacted.current) return;
    if (loadedPhase.current === phase) return;

    const audio = audioEl.current;
    if (!audio) return;

    const prev = loadedPhase.current;
    loadedPhase.current = phase;

    if (prev && !audio.paused) {
      // Fade out current track, then start the new one
      fadeTo(0, 700, () => {
        audio.pause();
        if (!mutedRef.current) startTrack(phase);
      });
    } else {
      if (!mutedRef.current) startTrack(phase);
    }
  }, [phase, fadeTo, startTrack]);

  // ── Public actions ────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    setMutedState(prev => {
      const next = !prev;
      mutedRef.current = next;
      try { localStorage.setItem(LS_MUTED, String(next)); } catch {}

      const audio = audioEl.current;
      if (!audio) return next;

      if (next) {
        fadeTo(0, 400, () => audio.pause());
      } else {
        // Unmuting also counts as a user interaction
        interacted.current = true;
        const p = loadedPhase.current || phaseRef.current;
        if (!audio.src || audio.paused) {
          loadedPhase.current = p;
          startTrack(p);
        } else {
          fadeTo(volumeRef.current, 400);
        }
      }

      return next;
    });
  }, [fadeTo, startTrack]);

  const setVolume = useCallback((v: number) => {
    const c = Math.max(0, Math.min(1, v));
    volumeRef.current = c;
    setVolumeState(c);
    try { localStorage.setItem(LS_VOLUME, String(c)); } catch {}
    if (audioEl.current && !mutedRef.current) audioEl.current.volume = c;
  }, []);

  return (
    <AudioCtx.Provider value={{ muted, volume, toggleMute, setVolume }}>
      {children}
    </AudioCtx.Provider>
  );
}
