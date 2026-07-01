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

// Bar color (not text — these are bg classes, opacity fraction is fine on bg)
const BAR_COLOR: Record<string, { bar: string; urgent: string; text: string; urgentText: string }> = {
  night:  { bar: '#7c3aed', urgent: '#dc2626', text: '#a78bfa', urgentText: '#f87171' },
  day:    { bar: '#d97706', urgent: '#ef4444', text: '#fbbf24', urgentText: '#f87171' },
  voting: { bar: '#dc2626', urgent: '#991b1b', text: '#f87171', urgentText: '#ef4444' },
};

function formatSecs(secs: number): string {
  const mins = Math.floor(secs / 60);
  const s    = secs % 60;
  return mins > 0 ? `${mins}:${String(s).padStart(2, '0')}` : `${s}s`;
}

export function PhaseTimer({ phaseEndAt, phase, paused = false, pausedTimeRemaining = null }: Props) {
  const [secsLeft, setSecsLeft] = useState<number | null>(null);
  const total = PHASE_TOTAL[phase];
  const c     = BAR_COLOR[phase];

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
          <span className="font-cinzel uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#a16207' }}>
            <span>⏸</span><span>Paused</span>
          </span>
          <span className="font-mono tabular-nums" style={{ color: '#d97706' }}>{formatSecs(secsLeft)}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.50)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: 'rgba(120,65,10,0.55)' }} />
        </div>
      </div>
    );
  }

  if (secsLeft === null) return null;

  const pct      = Math.max(0, Math.min(100, (secsLeft / total) * 100));
  const isUrgent = secsLeft <= 10;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-cinzel uppercase tracking-widest" style={{ color: '#a16207' }}>Time remaining</span>
        <span
          className={`font-mono tabular-nums font-semibold ${isUrgent ? 'animate-pulse' : ''}`}
          style={{ color: isUrgent ? c.urgentText : c.text }}
        >
          {formatSecs(secsLeft)}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.50)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: isUrgent ? c.urgent : c.bar }}
        />
      </div>
    </div>
  );
}
