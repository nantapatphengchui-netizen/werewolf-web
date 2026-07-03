import { useT } from '@/i18n';

interface Props {
  index: number;
}

export function EmptySlot({ index }: Props) {
  const T = useT();
  return (
    <div
      className="group relative w-full h-full overflow-hidden rounded-xl flex flex-col items-center justify-center gap-2"
      style={{
        // Flat, opaque seat — no village art bleeding through
        backgroundColor: 'rgba(10,8,5,0.72)',
        border: '1.5px dashed rgba(146,64,14,0.30)',
      }}
    >
      {/* Slot number */}
      <span className="absolute top-1.5 left-2 text-[9px] text-amber-800/60 font-cinzel tabular-nums leading-none">
        {index + 1}
      </span>

      {/* Empty-seat glyph */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200 group-hover:border-amber-700/50"
        style={{ border: '1.5px dashed rgba(146,64,14,0.35)' }}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-800/55" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 6v12M6 12h12" />
        </svg>
      </div>

      {/* Label */}
      <span className="text-[8px] text-amber-800/60 font-cinzel uppercase tracking-[0.22em] leading-none">
        {T('lobby.waitingSeat')}
      </span>
    </div>
  );
}
