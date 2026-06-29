'use client';

import { useEffect } from 'react';

interface Props {
  title: string;
  description: string;
  confirmLabel?: string;
  confirmDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  confirmDanger = true,
  onConfirm,
  onCancel,
}: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-phase-in"
      onClick={onCancel}
    >
      <div
        className="bg-[#0d0a06] border border-amber-900/50 rounded-xl shadow-[0_0_60px_rgba(0,0,0,0.8)] max-w-sm w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-cinzel text-lg text-amber-200 tracking-wider mb-2">{title}</h3>
        <p className="text-amber-700 text-sm leading-relaxed mb-6">{description}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-amber-900/40 text-amber-600 font-cinzel text-sm tracking-widest uppercase rounded hover:border-amber-700/60 hover:text-amber-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); }}
            className={`flex-1 py-2.5 font-cinzel text-sm tracking-widest uppercase rounded border transition-colors ${
              confirmDanger
                ? 'bg-red-950/60 border-red-800/60 text-red-300 hover:bg-red-900/70 hover:border-red-600/60'
                : 'bg-amber-950/60 border-amber-700/60 text-amber-200 hover:bg-amber-900/70'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
