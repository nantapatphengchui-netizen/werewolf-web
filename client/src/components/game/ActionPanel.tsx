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

const SELECTION_STYLE: Record<RowColor, React.CSSProperties> = {
  red:     { backgroundColor: 'rgba(69,10,10,0.55)',   border: '1px solid rgba(185,28,28,0.55)',   color: '#fca5a5' },
  amber:   { backgroundColor: 'rgba(69,35,5,0.55)',    border: '1px solid rgba(180,83,9,0.55)',    color: '#fde68a' },
  violet:  { backgroundColor: 'rgba(46,16,101,0.55)',  border: '1px solid rgba(109,40,217,0.55)',  color: '#c4b5fd' },
  emerald: { backgroundColor: 'rgba(6,53,37,0.55)',    border: '1px solid rgba(5,150,105,0.55)',   color: '#6ee7b7' },
};

const CONFIRM_STYLE: Record<RowColor, React.CSSProperties> = {
  red:     { backgroundColor: 'rgba(127,29,29,0.90)',  border: '1px solid rgba(239,68,68,0.65)',   color: '#fca5a5' },
  amber:   { backgroundColor: 'rgba(120,53,0,0.90)',   border: '1px solid rgba(217,119,6,0.65)',   color: '#fde68a' },
  violet:  { backgroundColor: 'rgba(76,29,149,0.90)',  border: '1px solid rgba(139,92,246,0.65)',  color: '#ddd6fe' },
  emerald: { backgroundColor: 'rgba(6,78,59,0.90)',    border: '1px solid rgba(52,211,153,0.65)',  color: '#a7f3d0' },
};

const DISABLED_STYLE: React.CSSProperties = {
  backgroundColor: 'rgba(12,10,8,0.70)',
  border: '1px solid rgba(68,64,60,0.35)',
  color: '#78716c',
};

function SelectionDisplay({ name, color }: { name: string; color: RowColor }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-lg px-3 py-2" style={SELECTION_STYLE[color]}>
      <svg viewBox="0 0 16 16" className="w-3 h-3 shrink-0" fill="none">
        <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-xs font-cinzel uppercase tracking-wider truncate">{name}</span>
    </div>
  );
}

function ConfirmButton({ label, color, disabled, onClick }: {
  label: string; color: RowColor; disabled: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={disabled ? DISABLED_STYLE : CONFIRM_STYLE[color]}
      className="w-full py-2.5 text-xs font-cinzel tracking-widest uppercase rounded-lg transition-all duration-150 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98]"
    >
      {label}
    </button>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(12,8,3,0.70)', border: '1px solid rgba(120,65,10,0.30)' }}>
      {children}
    </div>
  );
}

function SubmittedBadge({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(6,35,18,0.70)', border: '1px solid rgba(52,211,153,0.35)' }}>
      <div className="flex items-center justify-center gap-2 mb-0.5">
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
          <path d="M3 8l4 4 6-6" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-xs font-semibold" style={{ color: '#4ade80' }}>{label}</p>
      </div>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: '#16a34a' }}>{sub}</p>}
    </div>
  );
}

export function ActionPanel({
  room, playerId, myRole, isHost, werewolfIds,
  selectedTarget, onNightAction, onCastVote, onAdvanceDay,
}: Props) {
  const seerLog  = useGameStore(s => s.seerLog);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { setSubmitted(false); }, [room.phase]);

  const me           = room.players.find(p => p.id === playerId);
  const imAlive      = me?.isAlive ?? false;
  const { phase }    = room;
  const hasVoted     = room.publicVotes?.hasVoted.includes(playerId) ?? false;
  const isSubmitted  = submitted || hasVoted;
  const selectedName = selectedTarget ? (room.players.find(p => p.id === selectedTarget)?.name ?? null) : null;

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

  const headerColor = phase === 'night' ? '#a78bfa' : phase === 'voting' ? '#f87171' : '#fbbf24';
  const headerLabel = phase === 'night' ? 'Night Action' : phase === 'voting' ? 'Cast Your Vote' : phase === 'day' ? 'Discussion' : 'Action';

  return (
    <DarkPanel className="p-4 flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-center font-cinzel font-semibold" style={{ color: headerColor }}>
        {headerLabel}
      </p>

      {/* ── Night ── */}
      {phase === 'night' && nc && imAlive && (
        isSubmitted ? (
          <SubmittedBadge label={`${nc.label} — submitted.`} sub="Awaiting all night actions…" />
        ) : (
          <>
            {selectedName
              ? <SelectionDisplay name={selectedName} color={nc.color} />
              : <p className="text-[10px] text-center font-cinzel uppercase tracking-widest" style={{ color: '#92400e' }}>Select a player card</p>
            }
            <ConfirmButton label={nc.confirmLabel} color={nc.color} disabled={!selectedTarget} onClick={handleNight} />
          </>
        )
      )}
      {phase === 'night' && !imAlive && (
        <InfoBox><p className="text-xs leading-relaxed" style={{ color: '#a16207' }}>You have perished. Watch the night from the shadows.</p></InfoBox>
      )}
      {phase === 'night' && imAlive && !nc && (
        <InfoBox><p className="text-xs leading-relaxed" style={{ color: '#a16207' }}>Night falls. You close your eyes and wait for dawn.</p></InfoBox>
      )}

      {/* ── Day ── */}
      {phase === 'day' && (
        <>
          <InfoBox>
            <p className="text-xs leading-relaxed" style={{ color: '#ca8a04' }}>Discuss with the village. Find the wolves among you.</p>
          </InfoBox>
          {isHost ? (
            <button
              onClick={onAdvanceDay}
              style={{ backgroundColor: 'rgba(120,53,0,0.85)', border: '1px solid rgba(217,119,6,0.60)', color: '#fde68a' }}
              className="w-full py-2.5 text-xs font-cinzel tracking-widest uppercase rounded-lg transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
            >
              Call to Vote
            </button>
          ) : (
            <p className="text-[10px] text-center font-cinzel" style={{ color: '#a16207' }}>
              Waiting for the host to call a vote…
            </p>
          )}
        </>
      )}

      {/* ── Voting ── */}
      {phase === 'voting' && !imAlive && (
        <InfoBox><p className="text-xs" style={{ color: '#a16207' }}>You are dead. Watch the vote unfold.</p></InfoBox>
      )}
      {phase === 'voting' && imAlive && (
        isSubmitted ? (
          <SubmittedBadge
            label="Vote cast."
            sub={`${room.publicVotes?.hasVoted.length ?? 0} / ${room.players.filter(p => p.isAlive).length} voted`}
          />
        ) : (
          <>
            {selectedName
              ? <SelectionDisplay name={selectedName} color="amber" />
              : <p className="text-[10px] text-center font-cinzel uppercase tracking-widest" style={{ color: '#92400e' }}>Select a player card</p>
            }
            <ConfirmButton label="Cast Vote" color="amber" disabled={!selectedTarget} onClick={handleVote} />
          </>
        )
      )}

      {/* ── Ended ── */}
      {phase === 'ended' && (
        <InfoBox><p className="text-xs" style={{ color: '#ca8a04' }}>The game is over.</p></InfoBox>
      )}

      {/* ── Seer inspection log ── */}
      {myRole === 'seer' && seerLog.length > 0 && (
        <div className="pt-3 space-y-1.5" style={{ borderTop: '1px solid rgba(109,40,217,0.25)' }}>
          <p className="text-[9px] uppercase tracking-widest font-cinzel" style={{ color: '#7c3aed' }}>Inspection Log</p>
          {[...seerLog].reverse().map((entry, i) => {
            const info = ROLE_INFO[entry.role];
            return (
              <div key={i} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs" style={{ backgroundColor: 'rgba(46,16,101,0.25)', border: '1px solid rgba(109,40,217,0.22)' }}>
                <span className="font-cinzel shrink-0 text-[9px]" style={{ color: '#7c3aed' }}>R{entry.round}</span>
                <span className="flex-1 truncate" style={{ color: '#fde68a' }}>{entry.targetName}</span>
                <span className="font-cinzel font-bold text-[10px] shrink-0 tracking-wider" style={{ color: info.accentColor }}>
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
