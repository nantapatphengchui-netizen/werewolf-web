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

const COLORS: Record<string, { bar: string; urgentBar: string; text: string; urgentText: string }> = {
  night:  { bar: 'bg-violet-600',  urgentBar: 'bg-red-600',  text: 'text-violet-300', urgentText: 'text-red-400' },
  day:    { bar: 'bg-amber-500',   urgentBar: 'bg-red-500',  text: 'text-amber-300',  urgentText: 'text-red-400' },
  voting: { bar: 'bg-red-600',     urgentBar: 'bg-red-800',  text: 'text-red-300',    urgentText: 'text-red-500' },
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
      if (pausedTimeRemaining != null) setSecsLeft(Math.max(0, Math.ceil(pausedTimeRemaining / 1000)));
      return;
    }
    if (!phaseEndAt) { setSecsLeft(null); return; }
    const tick = () => setSecsLeft(Math.max(0, Math.ceil((phaseEndAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [phaseEndAt, paused, pausedTimeRemaining]);

  if (!total || !c) return null;

  if (paused && secsLeft !== null) {
    const pct = Math.max(0, Math.min(100, (secsLeft / total) * 100));
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
            <span>⏸</span>
            <span>Paused</span>
          </span>
          <span className="font-mono tabular-nums text-amber-600">{formatSecs(secsLeft)}</span>
        </div>
        <div className="h-2 bg-black/50 rounded-full overflow-hidden">
          <div className="h-full bg-amber-800/35 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  }

  if (secsLeft === null) return null;

  const pct = Math.max(0, Math.min(100, (secsLeft / total) * 100));
  const isUrgent = secsLeft <= 10;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-amber-800/60 uppercase tracking-widest">Time remaining</span>
        <span className={`font-mono tabular-nums font-semibold ${isUrgent ? c.urgentText + ' animate-pulse' : c.text}`}>
          {formatSecs(secsLeft)}
        </span>
      </div>
      <div className="h-2 bg-black/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isUrgent ? c.urgentBar : c.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
