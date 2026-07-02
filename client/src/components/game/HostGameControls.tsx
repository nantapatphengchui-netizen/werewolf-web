'use client';

import { useState } from 'react';
import type { GamePhase } from '@/types/game';
import { DarkPanel } from '@/components/ui/DarkPanel';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useT } from '@/i18n';

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

function HostBtn({
  onClick,
  children,
  danger,
  active,
}: {
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  active?: boolean;
}) {
  const style: React.CSSProperties = danger
    ? { backgroundColor: 'rgba(50,10,10,0.75)', border: '1px solid rgba(185,28,28,0.45)', color: '#f87171' }
    : active
    ? { backgroundColor: 'rgba(6,53,37,0.75)',  border: '1px solid rgba(52,211,153,0.50)', color: '#6ee7b7' }
    : { backgroundColor: 'rgba(12,8,3,0.70)',   border: '1px solid rgba(120,65,10,0.42)', color: '#ca8a04' };

  return (
    <button
      onClick={onClick}
      style={style}
      className="w-full py-2 text-[11px] font-cinzel tracking-wider uppercase rounded-lg transition-all duration-150 hover:brightness-125 active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

export function HostGameControls({
  phase, timerPaused,
  onPauseTimer, onResumeTimer, onExtendTimer, onEndPhase, onRestartGame, onReturnToLobby,
}: Props) {
  const T = useT();
  const [confirming, setConfirming] = useState<ConfirmAction>(null);

  const hasTimer = phase === 'night' || phase === 'day' || phase === 'voting';
  if (!hasTimer) return null;

  const phaseLabel = T(`phase.${phase}`);

  const handleConfirm = () => {
    if (confirming === 'restart')  onRestartGame();
    if (confirming === 'lobby')    onReturnToLobby();
    if (confirming === 'endPhase') onEndPhase();
    setConfirming(null);
  };

  return (
    <>
      {confirming && (
        <ConfirmDialog
          title={
            confirming === 'restart'  ? T('confirm.restart.title') :
            confirming === 'lobby'    ? T('confirm.lobby.title') :
            T('confirm.endPhase.title', { phase: phaseLabel })
          }
          description={
            confirming === 'restart'
              ? T('confirm.restart.desc')
              : confirming === 'lobby'
              ? T('confirm.lobby.desc')
              : T('confirm.endPhase.desc', { phase: phaseLabel.toLowerCase() })
          }
          confirmLabel={
            confirming === 'endPhase' ? T('confirm.endPhase.btn') :
            confirming === 'restart'  ? T('confirm.restart.btn') :
            T('confirm.lobby.btn')
          }
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(null)}
        />
      )}

      <DarkPanel className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="#d97706" strokeWidth="1.5">
            <circle cx="8" cy="5" r="3" />
            <path strokeLinecap="round" d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          </svg>
          <p className="text-[10px] uppercase tracking-widest font-cinzel" style={{ color: '#d97706' }}>Host Controls</p>
        </div>

        {/* Timer section */}
        <div className="space-y-2">
          <p className="text-[9px] uppercase tracking-widest font-cinzel" style={{ color: '#a16207' }}>{T('host.timer')}</p>

          <HostBtn onClick={timerPaused ? onResumeTimer : onPauseTimer} active={timerPaused}>
            {timerPaused ? T('host.resumeTimer') : T('host.pauseTimer')}
          </HostBtn>

          <div className="flex gap-1.5">
            {[30, 60, 120].map(s => (
              <button
                key={s}
                onClick={() => onExtendTimer(s)}
                style={{ backgroundColor: 'rgba(12,8,3,0.60)', border: '1px solid rgba(120,65,10,0.38)', color: '#ca8a04', flex: 1 }}
                className="py-1.5 text-[10px] font-cinzel tracking-widest uppercase rounded-lg transition-all duration-150 hover:brightness-125"
              >
                +{s}s
              </button>
            ))}
          </div>

          <HostBtn onClick={() => setConfirming('endPhase')}>
            {T('host.endPhase', { phase: phaseLabel })}
          </HostBtn>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(120,65,10,0.20)' }} />

        {/* Game section */}
        <div className="space-y-2">
          <p className="text-[9px] uppercase tracking-widest font-cinzel" style={{ color: '#a16207' }}>{T('host.game')}</p>
          <HostBtn onClick={() => setConfirming('lobby')} danger>{T('host.toLobby')}</HostBtn>
          <HostBtn onClick={() => setConfirming('restart')}>{T('host.restart')}</HostBtn>
        </div>
      </DarkPanel>
    </>
  );
}
