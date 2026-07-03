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
        // Near-opaque flat seat — kills the bright village art behind so an
        // empty slot never reads as a window into the scene
        backgroundColor: 'rgba(9,7,5,0.965)',
        border: '1.5px dashed rgba(146,64,14,0.30)',
      }}
    >
      {/* Subtle top-lit vignette so the flat fill still has depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(146,64,14,0.10), transparent 62%)' }}
      />
      {/* Slot number */}
      <span className="absolute top-1.5 left-2 z-10 text-[9px] text-amber-800/60 font-cinzel tabular-nums leading-none">
        {index + 1}
      </span>

      {/* Empty-seat glyph */}
      <div
        className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-200 group-hover:border-amber-700/50"
        style={{ border: '1.5px dashed rgba(146,64,14,0.35)' }}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-800/55" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 6v12M6 12h12" />
        </svg>
      </div>

      {/* Label */}
      <span className="relative z-10 text-[8px] text-amber-800/60 font-cinzel uppercase tracking-[0.22em] leading-none">
        {T('lobby.waitingSeat')}
      </span>
    </div>
  );
}
