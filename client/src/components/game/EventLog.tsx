import type { GameEvent } from '@/types/game';
import { DarkPanel } from '@/components/ui/DarkPanel';

interface Props {
  events: GameEvent[];
}

export function EventLog({ events }: Props) {
  if (events.length === 0) return null;

  const reversed = [...events].reverse();

  return (
    <DarkPanel className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <svg viewBox="0 0 16 16" className="w-3 h-3 text-amber-700 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" d="M2 4h12M2 8h8M2 12h5" />
        </svg>
        <p className="text-amber-700 text-[10px] uppercase tracking-widest">Event Log</p>
      </div>

      <div className="relative">
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1 pb-4">
          {reversed.map((ev, i) => (
            <div
              key={ev.id}
              className={`flex gap-2 items-start text-xs leading-relaxed ${
                i === 0 ? 'text-amber-200/95'
                : i <= 2 ? 'text-amber-500/65'
                : 'text-amber-800/45'
              }`}
            >
              <span className={`shrink-0 mt-0.5 text-[9px] leading-none ${i === 0 ? 'text-amber-500' : 'text-amber-900/60'}`}>▸</span>
              <span className={i === 0 ? 'font-medium' : ''}>{ev.text}</span>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
    </DarkPanel>
  );
}
