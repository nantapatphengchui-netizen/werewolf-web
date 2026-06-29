'use client';

import { useState, useEffect } from 'react';
import type { GamePhase } from '@/types/game';

interface Props {
  phaseEndAt: number | null;
  phase: GamePhase;
  paused?: boolean;
  pausedTimeRemaining?: number | null;
}

const PHASE_TOTAL: Record<string, number> = {
  night:  45,
  day:   120,
  voting: 60,
};

const COLORS: Record<string, { bar: string; text: string; warn: string }> = {
  night:  { bar: 'bg-violet-600',  text: 'text-violet-400',  warn: 'bg-red-700' },
  day:    { bar: 'bg-amber-500',   text: 'text-amber-400',   warn: 'bg-red-600' },
  voting: { bar: 'bg-red-600',     text: 'text-red-400',     warn: 'bg-red-800' },
};

function formatSecs(secs: number): string {
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return mins > 0 ? `${mins}:${String(s).padStart(2, '0')}` : `${s}s`;
}

export function PhaseTimer({ phaseEndAt, phase, paused = false, pausedTimeRemaining = null }: Props) {
  const [secsLeft, setSecsLeft] = useState<number | null>(null);
  const total = PHASE_TOTAL[phase];
  const c = COLORS[phase];

  useEffect(() => {
    if (paused) {
      if (pausedTimeRemaining != null) {
        setSecsLeft(Math.max(0, Math.ceil(pausedTimeRemaining / 1000)));
      }
      return;
    }
    if (!phaseEndAt) { setSecsLeft(null); return; }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((phaseEndAt - Date.now()) / 1000));
      setSecsLeft(remaining);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [phaseEndAt, paused, pausedTimeRemaining]);

  if (!total || !c) return null;

  // Paused state: show frozen bar with ⏸ label
  if (paused && secsLeft !== null) {
    const pct = Math.max(0, Math.min(100, (secsLeft / total) * 100));
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-700/40 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] font-mono tabular-nums text-amber-700/80 flex items-center gap-1">
          <span className="text-[9px]">⏸</span>
          {formatSecs(secsLeft)}
        </span>
      </div>
    );
  }

  if (secsLeft === null) return null;

  const pct = Math.max(0, Math.min(100, (secsLeft / total) * 100));
  const isUrgent = secsLeft <= 10;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isUrgent ? c.warn : c.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[11px] font-mono tabular-nums min-w-[28px] text-right ${
        isUrgent ? 'text-red-400 font-bold' : c.text
      }`}>
        {formatSecs(secsLeft)}
      </span>
    </div>
  );
}
