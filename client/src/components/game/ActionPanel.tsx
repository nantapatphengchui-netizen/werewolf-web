'use client';

import { useState, useEffect } from 'react';
import type { RoomState, Role } from '@/types/game';
import { ROLE_INFO } from '@/types/game';
import { DarkPanel } from '@/components/ui/DarkPanel';
import { useGameStore } from '@/store/gameStore';

interface Props {
  room: RoomState;
  playerId: string;
  myRole: Role | null;
  isHost: boolean;
  werewolfIds: string[];
  onNightAction: (targetId: string) => void;
  onCastVote: (targetId: string) => void;
  onAdvanceDay: () => void;
}

type RowColor = 'red' | 'amber' | 'violet' | 'emerald';

const ROW_SELECTED: Record<RowColor, string> = {
  red:     'border-red-600/70 bg-red-950/40 text-red-300',
  amber:   'border-amber-500/70 bg-amber-950/40 text-amber-200',
  violet:  'border-violet-600/70 bg-violet-950/40 text-violet-300',
  emerald: 'border-emerald-600/70 bg-emerald-950/40 text-emerald-300',
};

function PlayerRow({
  player,
  index,
  selected,
  voteCount,
  color,
  disabled,
  onSelect,
}: {
  player: { id: string; name: string };
  index: number;
  selected: boolean;
  voteCount?: number;
  color: RowColor;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const idleClass = disabled
    ? 'border-amber-900/20 bg-black/10 text-amber-800/50 cursor-default'
    : 'border-amber-900/30 bg-black/20 text-amber-600 hover:border-amber-700/50 hover:text-amber-400 cursor-pointer';

  return (
    <button
      onClick={disabled ? undefined : onSelect}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded border text-xs text-left transition-colors ${
        selected ? ROW_SELECTED[color] : idleClass
      }`}
    >
      <span className="w-5 h-5 rounded-full bg-amber-900/50 text-amber-300 text-[10px] flex items-center justify-center font-cinzel font-bold flex-shrink-0">
        {index + 1}
      </span>
      <span className="flex-1 truncate">{player.name}</span>
      {typeof voteCount === 'number' && voteCount > 0 && (
        <span className="text-red-400 font-bold text-[10px] flex-shrink-0">{voteCount}×</span>
      )}
    </button>
  );
}

function SubmittedBadge({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="bg-green-950/20 border border-green-800/30 rounded-lg p-3 text-center">
      <div className="flex items-center justify-center gap-2 mb-0.5">
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-green-500" fill="none">
          <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-green-400 text-xs font-semibold">{label}</p>
      </div>
      {sub && <p className="text-green-700/70 text-[10px] mt-0.5">{sub}</p>}
    </div>
  );
}

function ConfirmButton({ label, color, disabled, onClick }: {
  label: string;
  color: RowColor;
  disabled: boolean;
  onClick: () => void;
}) {
  const active: Record<RowColor, string> = {
    red:     'bg-red-900/70 border-red-600/80 text-red-100 hover:bg-red-900/90 shadow-[0_0_14px_rgba(239,68,68,0.15)]',
    amber:   'bg-amber-900/70 border-amber-600/80 text-amber-100 hover:bg-amber-900/90 shadow-[0_0_14px_rgba(217,119,6,0.15)]',
    violet:  'bg-violet-900/70 border-violet-600/80 text-violet-100 hover:bg-violet-900/90 shadow-[0_0_14px_rgba(139,92,246,0.15)]',
    emerald: 'bg-emerald-900/70 border-emerald-600/80 text-emerald-100 hover:bg-emerald-900/90 shadow-[0_0_14px_rgba(16,185,129,0.15)]',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-2.5 text-xs font-cinzel tracking-widest uppercase rounded border transition-all ${
        disabled
          ? 'bg-stone-950/50 border-stone-800/25 text-stone-700 cursor-not-allowed'
          : active[color]
      }`}
    >
      {label}
    </button>
  );
}

export function ActionPanel({
  room,
  playerId,
  myRole,
  isHost,
  werewolfIds,
  onNightAction,
  onCastVote,
  onAdvanceDay,
}: Props) {
  const seerLog = useGameStore(s => s.seerLog);

  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
  }, [room.phase]);

  const me = room.players.find(p => p.id === playerId);
  const imAlive = me?.isAlive ?? false;
  const { phase } = room;

  // ── Target lists ──────────────────────────────────────────────────────────
  const wolfTargets   = room.players.filter(p => p.isAlive && !werewolfIds.includes(p.id));
  const seerTargets   = room.players.filter(p => p.isAlive && p.id !== playerId);
  const doctorTargets = room.players.filter(p => p.isAlive);
  const voteTargets   = room.players.filter(p => p.isAlive && p.id !== playerId);

  const hasVotedAlready = room.publicVotes?.hasVoted.includes(playerId) ?? false;
  const isSubmitted = submitted || hasVotedAlready;

  function handleNight() {
    if (!selected || submitted) return;
    onNightAction(selected);
    setSubmitted(true);
  }

  function handleVote() {
    if (!selected || isSubmitted) return;
    onCastVote(selected);
    setSubmitted(true);
  }

  // ── Night action label / color per role ───────────────────────────────────
  const nightConfig: Record<string, { label: string; color: RowColor; confirmLabel: string; prompt: string }> = {
    werewolf: { label: 'Killing',   color: 'red',     confirmLabel: 'Confirm Kill',    prompt: 'Choose a target to eliminate tonight.' },
    seer:     { label: 'Inspecting', color: 'violet',  confirmLabel: 'Inspect',         prompt: 'Choose a player to investigate.' },
    doctor:   { label: 'Protecting', color: 'emerald', confirmLabel: 'Confirm Protect', prompt: 'Choose a player to protect tonight.' },
  };
  const nc = myRole ? nightConfig[myRole] : null;

  const nightTargetList = myRole === 'werewolf' ? wolfTargets
    : myRole === 'seer' ? seerTargets
    : myRole === 'doctor' ? doctorTargets
    : [];

  const headerAccent = phase === 'night' ? 'text-violet-400'
    : phase === 'voting' ? 'text-red-400'
    : 'text-amber-500';

  const headerLabel = phase === 'night' ? 'Night Action'
    : phase === 'voting' ? 'Cast Your Vote'
    : phase === 'day' ? 'Discussion'
    : 'Action';

  return (
    <DarkPanel className="p-4 flex flex-col gap-3">
      <p className={`text-[10px] uppercase tracking-widest text-center font-cinzel font-semibold ${headerAccent}`}>
        {headerLabel}
      </p>

      {/* ── Night ───────────────────────────────────────────────────────── */}
      {phase === 'night' && nc && imAlive && (
        submitted ? (
          <SubmittedBadge
            label={`${nc.label} — submitted.`}
            sub="Awaiting all night actions..."
          />
        ) : (
          <>
            <p className="text-amber-800 text-xs text-center">{nc.prompt}</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {nightTargetList.map(p => (
                <PlayerRow
                  key={p.id}
                  player={p}
                  index={room.players.indexOf(p)}
                  selected={selected === p.id}
                  color={nc.color}
                  onSelect={() => setSelected(p.id)}
                />
              ))}
            </div>
            <ConfirmButton
              label={nc.confirmLabel}
              color={nc.color}
              disabled={!selected}
              onClick={handleNight}
            />
          </>
        )
      )}

      {phase === 'night' && !imAlive && (
        <div className="bg-black/30 border border-amber-900/20 rounded p-3 text-center">
          <p className="text-amber-800 text-xs leading-relaxed">
            You have perished. Watch the night from the shadows.
          </p>
        </div>
      )}

      {phase === 'night' && imAlive && !nc && (
        <div className="bg-black/30 border border-amber-900/20 rounded p-3 text-center">
          <p className="text-amber-800 text-xs leading-relaxed">
            Night falls. You close your eyes and wait for dawn.
          </p>
        </div>
      )}

      {/* ── Day ─────────────────────────────────────────────────────────── */}
      {phase === 'day' && (
        <>
          <div className="bg-black/30 border border-amber-900/20 rounded p-3 text-center">
            <p className="text-amber-700 text-xs leading-relaxed">
              Discuss with the village. Find the wolves among you.
            </p>
          </div>
          {isHost ? (
            <button
              onClick={onAdvanceDay}
              className="w-full py-2.5 bg-amber-900/40 border border-amber-700/50 text-amber-300 text-xs font-cinzel tracking-widest uppercase rounded hover:bg-amber-900/60 transition-colors"
            >
              Call to Vote
            </button>
          ) : (
            <p className="text-amber-800/50 text-[10px] text-center">
              Waiting for the host to call a vote...
            </p>
          )}
        </>
      )}

      {/* ── Voting ──────────────────────────────────────────────────────── */}
      {phase === 'voting' && !imAlive && (
        <div className="bg-black/30 border border-amber-900/20 rounded p-3 text-center">
          <p className="text-amber-800 text-xs">You are dead. Watch the vote unfold.</p>
        </div>
      )}

      {phase === 'voting' && imAlive && (
        <>
          {isSubmitted ? (
            <SubmittedBadge
              label="Vote cast."
              sub={`${room.publicVotes?.hasVoted.length ?? 0} / ${room.players.filter(p => p.isAlive).length} voted`}
            />
          ) : (
            <p className="text-amber-800 text-xs text-center">Vote to exile a player from the village.</p>
          )}

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {voteTargets.map(p => (
              <PlayerRow
                key={p.id}
                player={p}
                index={room.players.indexOf(p)}
                selected={!isSubmitted && selected === p.id}
                voteCount={room.publicVotes?.tally[p.id]}
                color="amber"
                disabled={isSubmitted}
                onSelect={() => setSelected(p.id)}
              />
            ))}
          </div>

          {!isSubmitted && (
            <ConfirmButton
              label="Cast Vote"
              color="amber"
              disabled={!selected}
              onClick={handleVote}
            />
          )}
        </>
      )}

      {/* ── Ended ───────────────────────────────────────────────────────── */}
      {phase === 'ended' && (
        <div className="bg-black/30 border border-amber-900/20 rounded p-3 text-center">
          <p className="text-amber-600 text-xs">The game is over.</p>
        </div>
      )}

      {/* ── Seer inspection log (persists across all phases) ────────────── */}
      {myRole === 'seer' && seerLog.length > 0 && (
        <div className="border-t border-violet-900/30 pt-3 space-y-1.5">
          <p className="text-violet-700 text-[10px] uppercase tracking-widest">
            Inspection Log
          </p>
          {[...seerLog].reverse().map((entry, i) => {
            const info = ROLE_INFO[entry.role];
            return (
              <div
                key={i}
                className="flex items-center gap-2 bg-black/20 border border-violet-900/25 rounded px-2.5 py-1.5 text-xs"
              >
                <span className="text-amber-800/70 font-cinzel shrink-0">R{entry.round}</span>
                <span className="flex-1 text-amber-200 truncate">{entry.targetName}</span>
                <span
                  className="font-cinzel font-bold text-[10px] shrink-0 tracking-wider"
                  style={{ color: info.accentColor }}
                >
                  {info.name.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </DarkPanel>
  );
}
