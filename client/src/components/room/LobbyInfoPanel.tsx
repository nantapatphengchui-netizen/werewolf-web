'use client';

import { useState } from 'react';
import type { Player } from '@/types/game';
import { HostAdminPanel } from './HostAdminPanel';
import { StatusDot } from '@/components/ui/StatusDot';
import { AudioControls } from '@/components/ui/AudioControls';
import { LangToggle } from '@/components/ui/LangToggle';
import { HowToPlay } from '@/components/game/HowToPlay';
import { useT } from '@/i18n';

interface Props {
  code: string;
  playerCount: number;
  maxPlayers: number;
  minPlayers: number;
  readyCount: number;
  isConnected: boolean;
  onLeave: () => void;
  // Ready / start
  isHost: boolean;
  canStart: boolean;
  isReady: boolean;
  onReady: () => void;
  onStartGame: () => void;
  // Host admin passthrough
  players: Player[];
  hostId: string;
  isLocked: boolean;
  onKick: (targetId: string) => void;
  onLock: () => void;
  onUnlock: () => void;
  onResetReady: () => void;
  onAddBot: () => void;
  onFillBots: (target: number) => void;
  onRemoveBots: () => void;
}

/** Big invite-code block with copy affordance. */
function InviteCode({ code }: { code: string }) {
  const T = useT();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement('textarea');
      el.value = code; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="text-center">
      <span className="text-[9px] font-cinzel uppercase tracking-[0.28em] text-amber-600/80">
        {T('lobby.inviteCode')}
      </span>
      <button
        onClick={copy}
        title={T('lobby.inviteCode')}
        className="mt-1.5 w-full flex items-center justify-center gap-2 group"
      >
        <span
          className="font-mono font-bold text-[26px] leading-none tracking-[0.32em]"
          style={{ color: '#fbbf24', textShadow: '0 0 18px rgba(251,191,36,0.5)' }}
        >
          {code}
        </span>
        {copied ? (
          <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-amber-600/70 group-hover:text-amber-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
      <p className="mt-1.5 text-[9px] font-cinzel tracking-wide text-amber-700/60 leading-snug">
        {copied ? T('lobby.copied') : T('lobby.shareHint')}
      </p>
    </div>
  );
}

/** Donut ring showing filled seats out of max. */
function CountRing({ count, max, enough }: { count: number; max: number; enough: boolean }) {
  const T = useT();
  const r = 34, c = 2 * Math.PI * r;
  const frac = max > 0 ? count / max : 0;
  const ring = enough ? '#4ade80' : '#f59e0b';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[86px] h-[86px]">
        <svg viewBox="0 0 86 86" className="w-full h-full -rotate-90">
          <circle cx="43" cy="43" r={r} fill="none" stroke="rgba(146,64,14,0.22)" strokeWidth="6" />
          <circle
            cx="43" cy="43" r={r} fill="none" stroke={ring} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.4s ease', filter: `drop-shadow(0 0 5px ${ring}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="font-cinzel font-bold text-xl tabular-nums" style={{ color: '#fde68a' }}>{count}</span>
          <span className="font-cinzel text-[10px] tabular-nums text-amber-600/80">/ {max}</span>
        </div>
      </div>
      <span className="text-[8px] font-cinzel uppercase tracking-[0.24em] text-amber-700/70">
        {T('lobby.players')}
      </span>
    </div>
  );
}

/** Compact top row: connection · sound · language · help · leave. */
function UtilityBar({ isConnected, onLeave }: { isConnected: boolean; onLeave: () => void }) {
  const T = useT();
  const [showHowTo, setShowHowTo] = useState(false);
  return (
    <div className="flex items-center justify-between gap-1.5">
      <div className="flex items-center gap-1.5 min-w-0">
        <StatusDot connected={isConnected} />
        <span className={`text-[9px] font-cinzel uppercase tracking-wider truncate ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          {isConnected ? T('lobby.connected') : T('lobby.offline')}
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <AudioControls />
        <LangToggle />
        <button
          onClick={() => setShowHowTo(true)}
          title={T('howto.button')}
          className="p-1.5 border border-amber-800/45 rounded-lg text-amber-500 hover:text-amber-300 transition-colors"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6.5" />
            <path strokeLinecap="round" d="M6.1 6.1a2 2 0 0 1 3.8.6c0 1.3-1.9 1.7-1.9 1.7" />
            <circle cx="8" cy="11.5" r="0.5" fill="currentColor" stroke="none" />
          </svg>
        </button>
        <button
          onClick={onLeave}
          title={T('lobby.leave')}
          className="p-1.5 border border-amber-700/55 hover:border-red-600/70 text-amber-400 hover:text-red-400 rounded-lg transition-colors"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 14H3.5A1.5 1.5 0 0 1 2 12.5v-9A1.5 1.5 0 0 1 3.5 2H6" />
            <path d="M10.5 11 14 7.5 10.5 4M14 7.5H6" />
          </svg>
        </button>
      </div>
      {showHowTo && <HowToPlay onClose={() => setShowHowTo(false)} />}
    </div>
  );
}

export function LobbyInfoPanel(props: Props) {
  const T = useT();
  const { code, playerCount, maxPlayers, minPlayers, readyCount, isHost, canStart, isReady } = props;
  const needed    = minPlayers - playerCount;
  const hasEnough = playerCount >= minPlayers;
  const readyFrac = playerCount > 0 ? readyCount / playerCount : 0;

  return (
    <aside
      className="w-full lg:w-[288px] shrink-0 h-full flex flex-col gap-3.5 rounded-2xl p-4 overflow-y-auto"
      style={{
        backgroundColor: 'rgba(6,5,3,0.90)',
        border: '1px solid rgba(146,64,14,0.35)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.6)',
      }}
    >
      <UtilityBar isConnected={props.isConnected} onLeave={props.onLeave} />

      <div className="h-px w-full bg-amber-900/25" />

      <InviteCode code={code} />

      <div className="h-px w-full bg-amber-900/25" />

      {/* Seat count + status */}
      <div className="flex flex-col items-center gap-2.5">
        <CountRing count={playerCount} max={maxPlayers} enough={hasEnough} />
        <span
          className="text-[11px] font-cinzel tracking-wide text-center"
          style={{ color: hasEnough ? '#86efac' : '#fbbf24' }}
        >
          {hasEnough ? T('lobby.readyToStart') : T('lobby.needMore', { n: needed })}
        </span>
      </div>

      {/* Ready progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[9px] font-cinzel uppercase tracking-[0.2em] text-amber-700/75">
            {T('lobby.readyLabel')}
          </span>
          <span className="text-[10px] font-cinzel tabular-nums" style={{ color: '#fde68a' }}>
            {readyCount} / {playerCount}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(146,64,14,0.18)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${readyFrac * 100}%`,
              backgroundColor: '#4ade80',
              boxShadow: '0 0 8px rgba(74,222,128,0.4)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Host / dev controls */}
      <HostAdminPanel
        isHost={props.isHost}
        players={props.players}
        hostId={props.hostId}
        isLocked={props.isLocked}
        onKick={props.onKick}
        onLock={props.onLock}
        onUnlock={props.onUnlock}
        onResetReady={props.onResetReady}
        onAddBot={props.onAddBot}
        onFillBots={props.onFillBots}
        onRemoveBots={props.onRemoveBots}
      />

      {/* ── Ready / Start — pinned to the bottom ── */}
      <div className="mt-auto pt-1 space-y-2">
        {!isHost && (
          <p className="text-center font-cinzel text-[9px] tracking-widest uppercase" style={{ color: '#b45309' }}>
            {T('lobby.waitHost')}
          </p>
        )}
        <button
          onClick={props.onReady}
          style={{
            backgroundColor: isReady ? 'rgb(20,83,45)' : 'rgb(120,50,10)',
            border:          isReady ? '1px solid rgba(74,222,128,0.65)' : '1px solid rgba(217,119,6,0.6)',
            color:           isReady ? '#bbf7d0' : '#fde68a',
          }}
          className="w-full px-5 py-2.5 font-cinzel text-[11px] tracking-[0.2em] uppercase rounded-lg transition-all duration-150 hover:brightness-125 active:scale-95"
        >
          {isReady ? T('lobby.ready') : T('lobby.notReady')}
        </button>
        {isHost && (
          <button
            onClick={props.onStartGame}
            disabled={!canStart}
            style={{
              backgroundColor: canStart ? 'rgb(127,29,29)' : 'rgb(20,18,16)',
              border:          canStart ? '1px solid rgba(239,68,68,0.55)' : '1px solid rgba(87,83,78,0.45)',
              color:           canStart ? '#ffffff' : '#78716c',
            }}
            className={`w-full px-5 py-2.5 font-cinzel text-[11px] tracking-[0.2em] uppercase rounded-lg transition-all duration-150 ${
              canStart ? 'hover:brightness-125 active:scale-95' : 'cursor-not-allowed'
            }`}
          >
            {T('lobby.startGame')}
          </button>
        )}
      </div>
    </aside>
  );
}
