interface Props {
  index: number;
}

export function EmptySlot({ index }: Props) {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl border border-dashed border-amber-900/10 bg-black/12">
      {/* Faint ghost avatar */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/avatar-hooded.png"
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover object-[50%_18%] grayscale opacity-[0.055]"
      />

      {/* Bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />

      {/* Slot number */}
      <span className="absolute top-1.5 left-2 text-[9px] text-amber-950/25 font-cinzel tabular-nums leading-none">
        {index + 1}
      </span>

      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1 h-1 rounded-full bg-amber-900/12" />
      </div>

      {/* Waiting label */}
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <span className="text-[8px] text-amber-950/22 font-cinzel uppercase tracking-[0.22em] leading-none">
          Waiting
        </span>
      </div>
    </div>
  );
}
