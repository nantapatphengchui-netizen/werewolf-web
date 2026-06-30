interface Props {
  index: number;
}

export function EmptySlot({ index }: Props) {
  return (
    <div className="relative aspect-[3/4] rounded-lg border border-dashed border-amber-900/20 bg-black/10">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-35">
        <span className="font-cinzel text-xs text-amber-900">{index + 1}</span>
        <span className="text-[9px] text-amber-900/70 uppercase tracking-widest">Waiting</span>
      </div>
    </div>
  );
}
