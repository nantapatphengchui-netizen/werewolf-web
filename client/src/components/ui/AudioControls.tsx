'use client';

import { useAudioContext } from '@/providers/AudioProvider';

function VolumeOnIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 4.5L5.5 7.5H2.5v5h3l4 3V4.5z" />
      <path d="M13 8a3 3 0 0 1 0 4" />
      <path d="M15.5 5.5a6.5 6.5 0 0 1 0 9" />
    </svg>
  );
}

function VolumeOffIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 4.5L5.5 7.5H2.5v5h3l4 3V4.5z" />
      <path d="M14 9l3 3m0-3l-3 3" />
    </svg>
  );
}

export function AudioControls() {
  const { muted, volume, toggleMute, setVolume } = useAudioContext();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleMute}
        title={muted ? 'Enable music (click anywhere to start)' : 'Mute music'}
        className={`w-7 h-7 flex items-center justify-center rounded border transition-colors ${
          muted
            ? 'border-amber-900/30 text-amber-900/50 hover:text-amber-700 hover:border-amber-800/40'
            : 'border-amber-800/40 text-amber-600 hover:text-amber-300 hover:border-amber-600/60'
        }`}
      >
        {muted ? <VolumeOffIcon /> : <VolumeOnIcon />}
      </button>

      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={muted ? 0 : volume}
        disabled={muted}
        onChange={e => setVolume(parseFloat(e.target.value))}
        className={`hidden sm:block w-14 cursor-pointer accent-amber-600 transition-opacity ${
          muted ? 'opacity-20 cursor-not-allowed' : 'opacity-55 hover:opacity-85'
        }`}
        style={{ height: '3px' }}
        title={muted ? 'Unmute to adjust volume' : `Music volume: ${Math.round(volume * 100)}%`}
      />
    </div>
  );
}
