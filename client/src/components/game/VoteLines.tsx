'use client';

import { useState, useEffect, type RefObject } from 'react';

interface Seg { id: string; x1: number; y1: number; x2: number; y2: number; cx: number; cy: number; own: boolean }

interface Props {
  /** Scroll/positioning container that holds the player cards */
  containerRef: RefObject<HTMLElement | null>;
  /** voterId → targetId */
  votes: Record<string, string>;
  /** the local player's id — their vote line is highlighted */
  playerId: string;
}

/**
 * Draws a gentle amber arc from each voter's card to the card they voted for,
 * during the day vote. Desktop only. pointer-events-none so it never blocks.
 */
export function VoteLines({ containerRef, votes, playerId }: Props) {
  const [segs, setSegs] = useState<Seg[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const compute = () => {
      const crect = container.getBoundingClientRect();
      setSize({ w: container.scrollWidth, h: container.scrollHeight });
      const center = (id: string) => {
        const el = container.querySelector(`[data-player-id="${id}"]`);
        if (!el) return null;
        const r = (el as HTMLElement).getBoundingClientRect();
        return {
          x: r.left - crect.left + container.scrollLeft + r.width / 2,
          y: r.top - crect.top + container.scrollTop + r.height / 2,
        };
      };
      const out: Seg[] = [];
      for (const [voter, target] of Object.entries(votes)) {
        if (voter === target) continue;
        const a = center(voter);
        const b = center(target);
        if (!a || !b) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const off = Math.min(46, len * 0.16);
        out.push({
          id: voter,
          x1: a.x, y1: a.y, x2: b.x, y2: b.y,
          cx: (a.x + b.x) / 2 - (dy / len) * off,
          cy: (a.y + b.y) / 2 + (dx / len) * off,
          own: voter === playerId,
        });
      }
      setSegs(out);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(container);
    window.addEventListener('resize', compute);
    return () => { ro.disconnect(); window.removeEventListener('resize', compute); };
  }, [containerRef, votes, playerId]);

  if (segs.length === 0 || size.w === 0) return null;

  return (
    <svg
      className="hidden lg:block absolute top-0 left-0 pointer-events-none"
      width={size.w}
      height={size.h}
      style={{ zIndex: 24 }}
    >
      <defs>
        <marker id="voteArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#fbbf24" />
        </marker>
        <marker id="voteArrowOwn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#fde68a" />
        </marker>
      </defs>
      {segs.map(s => (
        <g key={s.id}>
          <path
            d={`M${s.x1},${s.y1} Q${s.cx},${s.cy} ${s.x2},${s.y2}`}
            fill="none"
            stroke={s.own ? '#fde68a' : '#fbbf24'}
            strokeWidth={s.own ? 2.4 : 1.6}
            strokeLinecap="round"
            strokeOpacity={s.own ? 0.95 : 0.62}
            markerEnd={s.own ? 'url(#voteArrowOwn)' : 'url(#voteArrow)'}
            style={{ filter: `drop-shadow(0 0 4px ${s.own ? 'rgba(253,230,138,0.7)' : 'rgba(251,191,36,0.45)'})` }}
          />
          <circle cx={s.x1} cy={s.y1} r={s.own ? 3.4 : 2.6} fill={s.own ? '#fde68a' : '#fbbf24'} fillOpacity={s.own ? 0.95 : 0.7} />
        </g>
      ))}
    </svg>
  );
}
