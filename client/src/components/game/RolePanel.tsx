'use client';

import { useState, type ReactNode } from 'react';
import type { Role } from '@/types/game';
import { ROLE_INFO } from '@/types/game';
import { DarkPanel } from '@/components/ui/DarkPanel';
import { RoleSkillIcon } from './RoleSkillIcon';
import { useT } from '@/i18n';

function WerewolfIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <path d="M14 8 Q10 20 16 36" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M24 6 Q22 20 24 38" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M34 8 Q38 20 32 36" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M14 36 Q24 44 34 36" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function SeerIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <ellipse cx="24" cy="24" rx="18" ry="11" stroke={color} strokeWidth="2.5" />
      <circle cx="24" cy="24" r="7" stroke={color} strokeWidth="2.5" />
      <circle cx="24" cy="24" r="3" fill={color} />
      <path d="M24 6v4M24 38v4M6 24h4M38 24h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DoctorIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <rect x="10" y="20" width="28" height="8" rx="4" fill={color} />
      <rect x="20" y="10" width="8" height="28" rx="4" fill={color} />
      <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function VillagerIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <circle cx="24" cy="14" r="8" stroke={color} strokeWidth="2.5" />
      <path d="M8 44 Q8 30 24 30 Q40 30 40 44" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function HunterIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <path d="M16 40V24L10 16H22L24 8L26 16H38L32 24V40" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M17 31H31" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function WitchIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <path d="M10 42c1.5-9 7.5-15 14-15s12.5 6 14 15" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 27V19" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M16 19h16" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M20 19L24 7l4 12" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

function BodyguardIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
      <path d="M24 4L8 10v12c0 10 7.5 18 16 20C32.5 40 40 32 40 22V10L24 4z" stroke={color} strokeWidth="2.5" strokeLinejoin="round"/>
    </svg>
  );
}

const ROLE_ICONS: Record<Role, (color: string) => ReactNode> = {
  werewolf:  c => <WerewolfIcon color={c} />,
  seer:      c => <SeerIcon color={c} />,
  doctor:    c => <DoctorIcon color={c} />,
  villager:  c => <VillagerIcon color={c} />,
  hunter:    c => <HunterIcon color={c} />,
  witch:     c => <WitchIcon color={c} />,
  bodyguard: c => <BodyguardIcon color={c} />,
};

interface Props {
  myRole: Role | null;
  werewolfIds: string[];
  players: { id: string; name: string; isAlive: boolean }[];
  playerId: string;
}

type Tab = 'role' | 'info';

export function RolePanel({ myRole, werewolfIds, players, playerId }: Props) {
  const T = useT();
  const [tab, setTab] = useState<Tab>('role');

  if (!myRole) {
    return (
      <DarkPanel className="flex items-center justify-center p-5 min-h-[100px]">
        <p className="text-xs animate-pulse" style={{ color: '#a16207' }}>{T('rolepanel.noRole')}</p>
      </DarkPanel>
    );
  }

  const info      = ROLE_INFO[myRole];
  const iconEl    = ROLE_ICONS[myRole](info.accentColor);
  const teammates = myRole === 'werewolf'
    ? players.filter(p => werewolfIds.includes(p.id) && p.id !== playerId)
    : [];

  const TAB_LABELS: Record<Tab, string> = {
    role: T('rolepanel.roleTab'),
    info: T('rolepanel.infoTab'),
  };

  return (
    <DarkPanel className="flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2" style={{ borderBottom: '1px solid rgba(120,65,10,0.28)' }}>
        <p className="text-[9px] uppercase tracking-[0.3em] font-cinzel" style={{ color: '#a16207' }}>{T('rolepanel.yourRole')}</p>
        <div className="flex gap-0.5">
          {(['role', 'info'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={tab === t
                ? { backgroundColor: 'rgba(120,53,0,0.45)', color: '#fde68a', borderRadius: '6px', padding: '3px 10px' }
                : { color: '#a16207',                        borderRadius: '6px', padding: '3px 10px' }
              }
              className="text-[9px] font-cinzel tracking-[0.2em] uppercase transition-all duration-150 hover:brightness-125"
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Role tab */}
      {tab === 'role' && (
        <div className="p-4 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(12,8,3,0.80)', border: `1px solid ${info.accentColor}44` }}
          >
            {iconEl}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-cinzel text-sm font-bold tracking-wider leading-tight" style={{ color: info.accentColor }}>
              {T(`role.${myRole}.name`).toUpperCase()}
            </p>
            <p className="text-[10px] uppercase tracking-widest mt-0.5 mb-1.5 font-cinzel" style={{ color: info.accentColor + '99' }}>
              {T(info.alignment === 'werewolf' ? 'alignment.werewolf' : 'alignment.village')}
            </p>
            <p className="text-[11px] leading-snug" style={{ color: '#ca8a04' }}>
              {T(`role.${myRole}.description`)}
            </p>
          </div>
        </div>
      )}

      {/* Info tab */}
      {tab === 'info' && (
        <div className="p-4 space-y-3">
          {myRole === 'werewolf' && (
            <div>
              <p className="text-[9px] uppercase tracking-widest mb-1.5 font-cinzel" style={{ color: '#a16207' }}>{T('rolepanel.wolfPack')}</p>
              {teammates.length > 0 ? (
                <div className="space-y-1">
                  {teammates.map(t => (
                    <div key={t.id} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#dc2626' }} />
                      <span className="text-xs" style={{ color: '#fca5a5' }}>{t.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: '#a16207' }}>{T('rolepanel.soloWolf')}</p>
              )}
            </div>
          )}
          {myRole !== 'werewolf' && (
            <div>
              <p className="text-[9px] uppercase tracking-widest mb-1 font-cinzel" style={{ color: '#a16207' }}>{T('rolepanel.allies')}</p>
              <p className="text-xs leading-snug" style={{ color: '#ca8a04' }}>{T('rolepanel.alliesDesc')}</p>
            </div>
          )}
          <div>
            <p className="text-[9px] uppercase tracking-widest mb-1.5 font-cinzel" style={{ color: '#a16207' }}>{T('rolepanel.nightAction')}</p>
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(12,8,3,0.8)', border: `1px solid ${info.accentColor}44` }}
              >
                <RoleSkillIcon role={myRole} size={20} color={info.accentColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-cinzel font-bold uppercase tracking-wide" style={{ color: info.accentColor }}>
                  {T(`skill.${myRole}`)}
                </p>
                <p className="text-[10px] leading-snug" style={{ color: '#ca8a04' }}>
                  {info.nightAction ? T(`role.${myRole}.nightAction`) : T('rolepanel.noNightAction')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DarkPanel>
  );
}
