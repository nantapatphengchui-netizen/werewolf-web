'use client';

import { useState, useEffect, useRef } from 'react';
import type { GamePhase } from '@/types/game';

interface Props {
  phase: GamePhase;
  phaseEndAt: number | null;
  paused?: boolean;
  pausedTimeRemaining?: number | null;
}

const PHASE_TOTAL: Record<string, number> = { night: 45, day: 120, voting: 60 };
const PHASE_COLOR: Record<string, string> = { night: '#7c3aed', day: '#d97706', voting: '#dc2626' };

/**
 * A glowing border that hugs the game-area edge and drains clockwise as the
 * phase timer runs down. Desktop only (frames the play field, not the chat
 * sidebar). pathLength normalises the dash so it works at any viewport size.
 */
export function PhasePerimeter({ phase, phaseEndAt, paused = false, pausedTimeRemaining = null }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [ms, setMs]     = useState<number | null>(null);

  const total = PHASE_TOTAL[phase];
  const color = PHASE_COLOR[phase];

  // Track the framed area's pixel size
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  // Countdown tick
  useEffect(() => {
    if (paused) { setMs(pausedTimeRemaining); return; }
    if (!phaseEndAt) { setMs(null); return; }
    const tick = () => setMs(Math.max(0, phaseEndAt - Date.now()));
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [phaseEndAt, paused, pausedTimeRemaining]);

  const active = !!total && !!color && ms !== null;
  const secs   = (ms ?? 0) / 1000;
  const pct    = active ? Math.max(0, Math.min(1, secs / total)) : 0;
  const urgent = active && secs <= 10 && !paused;

  const inset = 3;
  const rx    = 16;
  const w = Math.max(0, size.w - inset * 2);
  const h = Math.max(0, size.h - inset * 2);
  const stroke = urgent ? '#ef4444' : color;

  return (
    <div
      ref={wrapRef}
      className="hidden lg:block pointer-events-none"
      style={{ position: 'fixed', top: 0, left: 0, bottom: 0, right: '20rem', zIndex: 15 }}
    >
      {active && size.w > 0 && (
        <svg width={size.w} height={size.h} className="absolute inset-0 block">
          {/* Faint full frame so the edge is always hinted */}
          <rect
            x={inset} y={inset} width={w} height={h} rx={rx} fill="none"
            stroke={stroke} strokeOpacity={0.12} strokeWidth={2}
          />
          {/* Draining timer stroke */}
          <rect
            x={inset} y={inset} width={w} height={h} rx={rx} fill="none"
            stroke={stroke}
            strokeWidth={urgent ? 4 : 3}
            strokeLinecap="round"
            pathLength={1000}
            strokeDasharray={1000}
            strokeDashoffset={1000 * (1 - pct)}
            style={{
              filter: `drop-shadow(0 0 7px ${urgent ? 'rgba(239,68,68,0.85)' : `${color}bb`})`,
              transition: 'stroke-dashoffset 0.25s linear, stroke 0.5s ease, stroke-width 0.4s ease',
              opacity: paused ? 0.4 : 0.92,
              animation: urgent ? 'perimeter-pulse 0.9s ease-in-out infinite' : undefined,
            }}
          />
        </svg>
      )}
    </div>
  );
}
