interface Props {
  index: number;
}

export function EmptySlot({ index }: Props) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl border border-amber-900/15 bg-black/18">
      {/* Ghost avatar — visible enough to feel like an empty seat */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/avatar-hooded.png"
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover object-[50%_18%] grayscale opacity-[0.11]"
      />

      {/* Bottom gradient so text stays legible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Slot number */}
      <span className="absolute top-1.5 left-2 text-[9px] text-amber-800/55 font-cinzel tabular-nums leading-none">
        {index + 1}
      </span>

      {/* Center glyph — subtle seat indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border border-amber-900/12 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-900/15" />
        </div>
      </div>

      {/* "Waiting" label */}
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <span className="text-[8px] text-amber-900/30 font-cinzel uppercase tracking-[0.22em] leading-none">
          Waiting
        </span>
      </div>
    </div>
  );
}
