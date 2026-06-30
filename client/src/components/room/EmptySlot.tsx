interface Props {
  index: number;
}

export function EmptySlot({ index }: Props) {
  return (
    <div className="relative w-full h-full rounded-lg border border-dashed border-amber-900/15 bg-black/8">
      <span className="absolute top-1 left-1.5 text-[9px] text-amber-950/25 font-cinzel tabular-nums leading-none">
        {index + 1}
      </span>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[9px] text-amber-950/20 font-cinzel uppercase tracking-widest">Waiting</span>
      </div>
    </div>
  );
}
