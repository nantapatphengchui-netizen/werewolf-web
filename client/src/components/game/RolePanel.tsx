'use client';

import { useState, type ReactNode } from 'react';
import type { Role } from '@/types/game';
import { ROLE_INFO } from '@/types/game';
import { DarkPanel } from '@/components/ui/DarkPanel';

// ── Role icons ──────────────────────────────────────────────────────────────

function WerewolfIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="w-14 h-14" fill="none">
      {/* Claw marks */}
      <path d="M14 8 Q10 20 16 36" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M24 6 Q22 20 24 38" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M34 8 Q38 20 32 36" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      {/* Bottom curve */}
      <path d="M14 36 Q24 44 34 36" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function SeerIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="w-14 h-14" fill="none">
      <ellipse cx="24" cy="24" rx="18" ry="11" stroke={color} strokeWidth="2.5" />
      <circle cx="24" cy="24" r="7" stroke={color} strokeWidth="2.5" />
      <circle cx="24" cy="24" r="3" fill={color} />
      {/* Light rays */}
      <path d="M24 6v4M24 38v4M6 24h4M38 24h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DoctorIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="w-14 h-14" fill="none">
      <rect x="10" y="20" width="28" height="8" rx="4" fill={color} />
      <rect x="20" y="10" width="8" height="28" rx="4" fill={color} />
      <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function VillagerIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="w-14 h-14" fill="none">
      <circle cx="24" cy="14" r="8" stroke={color} strokeWidth="2.5" />
      <path d="M8 44 Q8 30 24 30 Q40 30 40 44" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

const ROLE_ICONS: Record<Role, (color: string) => ReactNode> = {
  werewolf: (c) => <WerewolfIcon color={c} />,
  seer: (c) => <SeerIcon color={c} />,
  doctor: (c) => <DoctorIcon color={c} />,
  villager: (c) => <VillagerIcon color={c} />,
};

// ── Panel ────────────────────────────────────────────────────────────────────

interface Props {
  myRole: Role | null;
  werewolfIds: string[];
  players: { id: string; name: string; isAlive: boolean }[];
  playerId: string;
}

type Tab = 'role' | 'info';

export function RolePanel({ myRole, werewolfIds, players, playerId }: Props) {
  const [tab, setTab] = useState<Tab>('role');

  if (!myRole) {
    return (
      <DarkPanel className="flex items-center justify-center p-5 min-h-[120px]">
        <p className="text-amber-800 text-xs animate-pulse">Role not loaded — reconnecting...</p>
      </DarkPanel>
    );
  }

  const info = ROLE_INFO[myRole];
  const iconEl = ROLE_ICONS[myRole](info.accentColor);

  const teammates = myRole === 'werewolf'
    ? players.filter(p => werewolfIds.includes(p.id) && p.id !== playerId)
    : [];

  return (
    <DarkPanel className="flex flex-col overflow-hidden">
      {/* Header label */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-amber-900/30">
        <p className="text-amber-800 text-[9px] uppercase tracking-[0.3em] font-cinzel">Your Role</p>
        {/* Tabs */}
        <div className="flex gap-0.5">
          {(['role', 'info'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-2.5 py-1 text-[9px] font-cinzel tracking-[0.2em] uppercase rounded transition-colors ${
                tab === t
                  ? 'text-amber-300 bg-amber-900/30'
                  : 'text-amber-800 hover:text-amber-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Role tab */}
      {tab === 'role' && (
        <div className="p-4 flex items-center gap-3">
          {/* Compact icon */}
          <div
            className={`w-14 h-14 rounded-lg ${info.bgClass} border flex items-center justify-center shrink-0`}
            style={{ borderColor: info.accentColor + '50' }}
          >
            <div className="scale-75">
              {iconEl}
            </div>
          </div>

          {/* Role name + team + description */}
          <div className="flex-1 min-w-0">
            <p className="font-cinzel text-base font-bold tracking-wider leading-tight" style={{ color: info.accentColor }}>
              {info.name.toUpperCase()}
            </p>
            <p className="text-[10px] uppercase tracking-widest mt-0.5 mb-1.5" style={{ color: info.accentColor + 'aa' }}>
              {info.alignment === 'werewolf' ? 'Wolf Pack' : 'Village'}
            </p>
            <p className="text-amber-600/70 text-[11px] leading-snug">
              {info.description}
            </p>
          </div>
        </div>
      )}

      {/* Info tab */}
      {tab === 'info' && (
        <div className="p-4 space-y-3">
          {myRole === 'werewolf' && (
            <div>
              <p className="text-amber-800 text-[9px] uppercase tracking-widest mb-1.5">Wolf Pack</p>
              {teammates.length > 0 ? (
                <div className="space-y-1">
                  {teammates.map(t => (
                    <div key={t.id} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600/80 shrink-0" />
                      <span className="text-red-300 text-xs">{t.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-amber-800 text-xs">You hunt alone.</p>
              )}
            </div>
          )}

          {myRole !== 'werewolf' && (
            <div>
              <p className="text-amber-800 text-[9px] uppercase tracking-widest mb-1">Allies</p>
              <p className="text-amber-700/70 text-xs leading-snug">Village — but you don't know who is who.</p>
            </div>
          )}

          <div>
            <p className="text-amber-800 text-[9px] uppercase tracking-widest mb-1">Night Action</p>
            <p className="text-amber-700/70 text-xs leading-snug">
              {info.nightAction ?? 'No night action. Sleep soundly — or try to.'}
            </p>
          </div>
        </div>
      )}
    </DarkPanel>
  );
}
