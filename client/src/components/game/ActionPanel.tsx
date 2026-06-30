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
  selectedTarget: string | null;
  onNightAction: (targetId: string) => void;
  onCastVote: (targetId: string) => void;
  onAdvanceDay: () => void;
}

type RowColor = 'red' | 'amber' | 'violet' | 'emerald';

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

function SelectionDisplay({ name, color }: { name: string; color: RowColor }) {
  const styles: Record<RowColor, string> = {
    red:     'bg-red-950/25 border-red-800/35 text-red-300',
    amber:   'bg-amber-950/25 border-amber-800/35 text-amber-300',
    violet:  'bg-violet-950/25 border-violet-800/35 text-violet-300',
    emerald: 'bg-emerald-950/25 border-emerald-800/35 text-emerald-300',
  };
  return (
    <div className={`flex items-center justify-center gap-2 rounded px-3 py-2 border ${styles[color]}`}>
      <svg viewBox="0 0 16 16" className="w-3 h-3 shrink-0" fill="none">
        <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-xs font-cinzel uppercase tracking-wider truncate">{name}</span>
    </div>
  );
}

export function ActionPanel({
  room,
  playerId,
  myRole,
  isHost,
  werewolfIds,
  selectedTarget,
  onNightAction,
  onCastVote,
  onAdvanceDay,
}: Props) {
  const seerLog = useGameStore(s => s.seerLog);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSubmitted(false);
  }, [room.phase]);

  const me = room.players.find(p => p.id === playerId);
  const imAlive = me?.isAlive ?? false;
  const { phase } = room;

  const hasVotedAlready = room.publicVotes?.hasVoted.includes(playerId) ?? false;
  const isSubmitted = submitted || hasVotedAlready;

  const selectedPlayerName = selectedTarget
    ? (room.players.find(p => p.id === selectedTarget)?.name ?? null)
    : null;

  function handleNight() {
    if (!selectedTarget || submitted) return;
    onNightAction(selectedTarget);
    setSubmitted(true);
  }

  function handleVote() {
    if (!selectedTarget || isSubmitted) return;
    onCastVote(selectedTarget);
    setSubmitted(true);
  }

  const nightConfig: Record<string, { label: string; color: RowColor; confirmLabel: string }> = {
    werewolf: { label: 'Killing',    color: 'red',     confirmLabel: 'Confirm Kill'    },
    seer:     { label: 'Inspecting', color: 'violet',  confirmLabel: 'Inspect'         },
    doctor:   { label: 'Protecting', color: 'emerald', confirmLabel: 'Confirm Protect' },
  };
  const nc = myRole ? nightConfig[myRole] : null;

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
            {selectedPlayerName ? (
              <SelectionDisplay name={selectedPlayerName} color={nc.color} />
            ) : (
              <p className="text-amber-900/60 text-[10px] text-center font-cinzel uppercase tracking-widest">
                Select a player card
              </p>
            )}
            <ConfirmButton
              label={nc.confirmLabel}
              color={nc.color}
              disabled={!selectedTarget}
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
        isSubmitted ? (
          <SubmittedBadge
            label="Vote cast."
            sub={`${room.publicVotes?.hasVoted.length ?? 0} / ${room.players.filter(p => p.isAlive).length} voted`}
          />
        ) : (
          <>
            {selectedPlayerName ? (
              <SelectionDisplay name={selectedPlayerName} color="amber" />
            ) : (
              <p className="text-amber-900/60 text-[10px] text-center font-cinzel uppercase tracking-widest">
                Select a player card
              </p>
            )}
            <ConfirmButton
              label="Cast Vote"
              color="amber"
              disabled={!selectedTarget}
              onClick={handleVote}
            />
          </>
        )
      )}

      {/* ── Ended ───────────────────────────────────────────────────────── */}
      {phase === 'ended' && (
        <div className="bg-black/30 border border-amber-900/20 rounded p-3 text-center">
          <p className="text-amber-600 text-xs">The game is over.</p>
        </div>
      )}

      {/* ── Seer inspection log ─────────────────────────────────────────── */}
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
