interface Props {
  index: number;
}

export function EmptySlot({ index }: Props) {
  return (
    <div className="relative flex flex-col items-center rounded-lg border border-dashed border-amber-900/25 bg-black/15 p-2 opacity-45">
      {/* Number badge */}
      <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-gray-800/80 border border-gray-700/50 flex items-center justify-center">
        <span className="text-gray-600 text-[10px] font-bold font-cinzel leading-none">
          {index + 1}
        </span>
      </div>

      {/* Empty avatar outline */}
      <div className="w-20 h-28 mt-1 rounded border border-amber-900/15 bg-black/20 flex items-center justify-center">
        <svg viewBox="0 0 80 104" className="w-full h-full opacity-15" fill="none">
          <ellipse cx="40" cy="28" rx="18" ry="21" stroke="#7c5c2a" strokeWidth="1.5" strokeDasharray="5 3" />
          <path
            d="M14 56 Q10 92 22 102 L58 102 Q70 92 66 56 Q54 47 40 43 Q26 47 14 56Z"
            stroke="#7c5c2a"
            strokeWidth="1.5"
            strokeDasharray="5 3"
          />
        </svg>
      </div>

      <p className="mt-2 text-amber-900/60 text-xs uppercase tracking-widest">Waiting...</p>
      <div className="h-4" />
    </div>
  );
}
