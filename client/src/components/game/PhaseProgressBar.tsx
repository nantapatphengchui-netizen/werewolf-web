'use client';

import { useState, useEffect } from 'react';
import type { GamePhase } from '@/types/game';

interface Props {
  phase: GamePhase;
  phaseEndAt: number | null;
  paused?: boolean;
  pausedTimeRemaining?: number | null;
}

const PHASE_TOTAL: Record<string, number> = { night: 45, day: 120, voting: 60 };
const PHASE_COLOR: Record<string, { bar: string; glow: string }> = {
  night:  { bar: '#7c3aed', glow: 'rgba(124,58,237,0.55)' },
  day:    { bar: '#d97706', glow: 'rgba(217,119,6,0.5)' },
  voting: { bar: '#dc2626', glow: 'rgba(220,38,38,0.6)' },
};

export function PhaseProgressBar({ phase, phaseEndAt, paused = false, pausedTimeRemaining = null }: Props) {
  const [ms, setMs] = useState<number | null>(null);
  const total = PHASE_TOTAL[phase];
  const c     = PHASE_COLOR[phase];

  useEffect(() => {
    if (paused) { setMs(pausedTimeRemaining); return; }
    if (!phaseEndAt) { setMs(null); return; }
    const tick = () => setMs(Math.max(0, phaseEndAt - Date.now()));
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [phaseEndAt, paused, pausedTimeRemaining]);

  if (!total || !c || ms === null) return null;

  const secs   = ms / 1000;
  const pct    = Math.max(0, Math.min(100, (secs / total) * 100));
  const urgent = secs <= 10 && !paused;

  return (
    <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>
      <div
        className={`h-full rounded-full ${urgent ? 'animate-pulse' : ''}`}
        style={{
          width: `${pct}%`,
          backgroundColor: urgent ? '#ef4444' : c.bar,
          boxShadow: `0 0 8px ${urgent ? 'rgba(239,68,68,0.7)' : c.glow}`,
          transition: 'width 0.25s linear, background-color 0.4s ease',
          opacity: paused ? 0.5 : 1,
        }}
      />
    </div>
  );
}
