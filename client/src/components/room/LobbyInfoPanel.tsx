'use client';

import { useState } from 'react';
import type { Player } from '@/types/game';
import { HostAdminPanel } from './HostAdminPanel';
import { useT } from '@/i18n';

interface Props {
  code: string;
  playerCount: number;
  maxPlayers: number;
  minPlayers: number;
  readyCount: number;
  // Host admin passthrough
  isHost: boolean;
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

export function LobbyInfoPanel(props: Props) {
  const T = useT();
  const { code, playerCount, maxPlayers, minPlayers, readyCount } = props;
  const needed    = minPlayers - playerCount;
  const hasEnough = playerCount >= minPlayers;
  const readyFrac = playerCount > 0 ? readyCount / playerCount : 0;

  return (
    <aside
      className="w-full lg:w-[280px] shrink-0 flex flex-col gap-4 rounded-2xl p-4"
      style={{
        backgroundColor: 'rgba(6,5,3,0.90)',
        border: '1px solid rgba(146,64,14,0.35)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.6)',
      }}
    >
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
      <div className="mt-auto pt-1">
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
      </div>
    </aside>
  );
}
