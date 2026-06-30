'use client';

import { AudioControls } from './AudioControls';

export function AudioWidget() {
  return (
    <div className="fixed bottom-4 right-4 z-[45] pointer-events-auto">
      <div className="bg-black/65 backdrop-blur-sm border border-amber-900/30 rounded-lg px-3 py-2 flex items-center gap-2">
        <span className="text-amber-900/50 text-[9px] uppercase tracking-widest font-cinzel hidden sm:inline">
          Music
        </span>
        <AudioControls />
      </div>
    </div>
  );
}
