'use client';

import { useState } from 'react';
import type { GamePhase } from '@/types/game';
import { DarkPanel } from '@/components/ui/DarkPanel';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Props {
  phase: GamePhase;
  timerPaused: boolean;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onExtendTimer: (extraSeconds: number) => void;
  onEndPhase: () => void;
  onRestartGame: () => void;
  onReturnToLobby: () => void;
}

type ConfirmAction = 'restart' | 'lobby' | 'endPhase' | null;

const PHASE_LABEL: Partial<Record<GamePhase, string>> = {
  night: 'Night',
  day: 'Day',
  voting: 'Vote',
};

export function HostGameControls({
  phase,
  timerPaused,
  onPauseTimer,
  onResumeTimer,
  onExtendTimer,
  onEndPhase,
  onRestartGame,
  onReturnToLobby,
}: Props) {
  const [confirming, setConfirming] = useState<ConfirmAction>(null);

  const hasTimer = phase === 'night' || phase === 'day' || phase === 'voting';
  if (!hasTimer) return null;

  const handleConfirm = () => {
    if (confirming === 'restart') onRestartGame();
    if (confirming === 'lobby') onReturnToLobby();
    if (confirming === 'endPhase') onEndPhase();
    setConfirming(null);
  };

  return (
    <>
      {confirming && (
        <ConfirmDialog
          title={
            confirming === 'restart' ? 'Restart Game' :
            confirming === 'lobby' ? 'Return to Lobby' :
            `End ${PHASE_LABEL[phase] ?? 'Phase'} Early`
          }
          description={
            confirming === 'restart'
              ? 'All players will keep their spots but get new roles. The current game state will be lost.'
              : confirming === 'lobby'
              ? 'The game will end immediately and everyone will return to the lobby. Progress will be lost.'
              : `End the ${PHASE_LABEL[phase]?.toLowerCase() ?? 'current'} phase immediately and auto-resolve it.`
          }
          confirmLabel={confirming === 'endPhase' ? 'End Phase' : confirming === 'restart' ? 'Restart' : 'Return'}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(null)}
        />
      )}

      <DarkPanel className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-amber-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="5" r="3" />
            <path strokeLinecap="round" d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          </svg>
          <p className="text-amber-600 text-[10px] uppercase tracking-widest">Host Controls</p>
        </div>

        {/* Timer controls */}
        <div className="space-y-2">
          <p className="text-amber-800 text-[10px] uppercase tracking-widest">Phase Timer</p>

          {/* Pause / Resume */}
          <button
            onClick={timerPaused ? onResumeTimer : onPauseTimer}
            className={`w-full flex items-center justify-center gap-2 py-2 text-xs font-cinzel tracking-widest uppercase rounded border transition-colors ${
              timerPaused
                ? 'bg-green-950/40 border-green-800/50 text-green-400 hover:bg-green-900/50'
                : 'bg-amber-950/30 border-amber-900/40 text-amber-600 hover:border-amber-700/50 hover:text-amber-400'
            }`}
          >
            {timerPaused ? (
              <>
                <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor">
                  <path d="M4 3l9 5-9 5V3z" />
                </svg>
                Resume Timer
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" className="w-3 h-3" fill="currentColor">
                  <rect x="3" y="3" width="3" height="10" rx="1" />
                  <rect x="10" y="3" width="3" height="10" rx="1" />
                </svg>
                Pause Timer
              </>
            )}
          </button>

          {/* Extend buttons */}
          <div className="flex gap-1.5">
            {[30, 60, 120].map(secs => (
              <button
                key={secs}
                onClick={() => onExtendTimer(secs)}
                className="flex-1 py-1.5 text-[10px] font-cinzel tracking-widest uppercase rounded border border-amber-900/30 text-amber-800 hover:border-amber-700/50 hover:text-amber-600 bg-black/20 transition-colors"
              >
                +{secs}s
              </button>
            ))}
          </div>

          {/* End phase */}
          <button
            onClick={() => setConfirming('endPhase')}
            className="w-full py-2 text-xs font-cinzel tracking-widest uppercase rounded border border-amber-800/40 text-amber-600 hover:border-amber-600/60 hover:text-amber-400 bg-amber-950/20 transition-colors"
          >
            End {PHASE_LABEL[phase] ?? 'Phase'} Early
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-amber-900/20" />

        {/* Game controls */}
        <div className="space-y-2">
          <p className="text-amber-800 text-[10px] uppercase tracking-widest">Game</p>

          <button
            onClick={() => setConfirming('lobby')}
            className="w-full py-2 text-xs font-cinzel tracking-widest uppercase rounded border border-red-900/30 text-red-800 hover:border-red-700/50 hover:text-red-500 bg-black/20 transition-colors"
          >
            Return to Lobby
          </button>

          <button
            onClick={() => setConfirming('restart')}
            className="w-full py-2 text-xs font-cinzel tracking-widest uppercase rounded border border-amber-900/30 text-amber-800 hover:border-amber-700/50 hover:text-amber-600 bg-black/20 transition-colors"
          >
            Restart Game
          </button>
        </div>
      </DarkPanel>
    </>
  );
}
