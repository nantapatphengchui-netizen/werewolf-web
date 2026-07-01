'use client';

import { useRef } from 'react';
import type { GameEvent } from '@/types/game';

interface Props {
  events: GameEvent[];
}

export function EventLog({ events }: Props) {
  const seenIdsRef = useRef<Set<string>>(new Set());

  if (events.length === 0) return null;

  const reversed = [...events].reverse();

  return (
    <div className="p-3">
      <div className="relative">
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 pb-4">
          {reversed.map((ev, i) => {
            const isNew = !seenIdsRef.current.has(ev.id);
            if (isNew) seenIdsRef.current.add(ev.id);
            return (
              <div
                key={ev.id}
                className="flex gap-2 items-start text-xs leading-relaxed"
                style={{ animation: isNew ? 'log-entry-slide 0.35s ease-out' : undefined }}
              >
                <span className="shrink-0 mt-0.5 text-[9px] leading-none" style={{ color: i === 0 ? '#d97706' : '#78350f' }}>▸</span>
                <span style={{
                  color: i === 0 ? '#fde68a'
                    : i <= 2 ? '#ca8a04'
                    : '#a16207',
                }}>
                  {ev.text}
                </span>
              </div>
            );
          })}
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6" style={{ background: 'linear-gradient(to top, rgba(3,5,7,0.95), transparent)' }} />
      </div>
    </div>
  );
}
