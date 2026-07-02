'use client';

import type { Role } from '@/types/game';

interface IconProps { color: string; size: number }

/** Werewolf — claw strike */
function ClawSkill({ color, size }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <path d="M6 3 Q4.2 10 6.5 17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M11 2.5 Q9.6 10 11 17.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 3 Q17.8 10 15.5 17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="6.5" cy="18" r="1.1" fill={color} />
      <circle cx="11" cy="18.5" r="1.1" fill={color} />
      <circle cx="15.5" cy="18" r="1.1" fill={color} />
    </svg>
  );
}

/** Seer — all-seeing eye */
function EyeSkill({ color, size }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <path d="M2 12 Q12 4.5 22 12 Q12 19.5 2 12Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3.4" fill={color} />
      <circle cx="13.1" cy="10.9" r="1" fill="rgba(255,255,255,0.85)" />
      <path d="M12 2.5v2M12 19.5v2M3 6l1.4 1.4M20.6 16.6L19 15" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/** Doctor — healing heart */
function HealSkill({ color, size }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <path d="M12 20.5S3.5 15.5 3.5 9.2A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 8.5 2.2c0 6.3-8.5 11.3-8.5 11.3z"
            stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 8.2v4.6M9.7 10.5h4.6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Bodyguard — shield + check */
function ShieldSkill({ color, size }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <path d="M12 2.5 4.5 5.3v6.2c0 5 3.4 8 7.5 9.5 4.1-1.5 7.5-4.5 7.5-9.5V5.3L12 2.5z"
            stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.5 12l2.4 2.4L15.5 9.5" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Hunter — crosshair revenge shot */
function CrosshairSkill({ color, size }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.2" fill={color} />
      <path d="M12 1.5v4.5M12 18v4.5M1.5 12H6M18 12h4.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Witch — potion flask */
function PotionSkill({ color, size }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <path d="M9.5 3h5M10 3v4.2l-3.4 6.6A4 4 0 0 0 10.2 20h3.6a4 4 0 0 0 3.6-6.2L14 7.2V3"
            stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M7.7 13.5h8.6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10.5" cy="16" r="0.9" fill={color} />
      <circle cx="13.5" cy="17" r="0.7" fill={color} />
    </svg>
  );
}

/** Villager — magnifying glass (deduce through discussion & votes) */
function SearchSkill({ color, size }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none">
      <circle cx="10" cy="10" r="6.5" stroke={color} strokeWidth="1.8" />
      <path d="M14.8 14.8L21 21" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

const SKILL_ICON: Record<Role, (p: IconProps) => React.ReactNode> = {
  werewolf:  p => <ClawSkill {...p} />,
  seer:      p => <EyeSkill {...p} />,
  doctor:    p => <HealSkill {...p} />,
  bodyguard: p => <ShieldSkill {...p} />,
  hunter:    p => <CrosshairSkill {...p} />,
  witch:     p => <PotionSkill {...p} />,
  villager:  p => <SearchSkill {...p} />,
};

export function RoleSkillIcon({ role, size = 22, color }: { role: Role; size?: number; color: string }) {
  return <>{SKILL_ICON[role]({ color, size })}</>;
}
