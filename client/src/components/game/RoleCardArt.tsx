import type { Role } from '@/types/game';

function WerewolfArt() {
  return (
    <svg viewBox="0 0 80 104" className="w-full h-full" fill="none">
      <rect width="80" height="104" fill="#0f0202" />
      <ellipse cx="40" cy="46" rx="38" ry="52" fill="#1e0404" />
      {/* Body */}
      <path d="M15 57 Q11 93 23 102 L57 102 Q69 93 65 57 Q53 47 40 43 Q27 47 15 57Z" fill="#180303" stroke="#7f1d1d" strokeWidth="1" />
      {/* Head */}
      <ellipse cx="40" cy="27" rx="18" ry="21" fill="#180303" stroke="#7f1d1d" strokeWidth="1" />
      {/* Wolf ears */}
      <path d="M24 13 L19 0 L31 10 Z" fill="#180303" stroke="#7f1d1d" strokeWidth="0.8" />
      <path d="M56 13 L61 0 L49 10 Z" fill="#180303" stroke="#7f1d1d" strokeWidth="0.8" />
      {/* Inner ears */}
      <path d="M25 13 L21 3 L29 10 Z" fill="#3f0000" opacity="0.6" />
      <path d="M55 13 L59 3 L51 10 Z" fill="#3f0000" opacity="0.6" />
      {/* Glowing eyes */}
      <ellipse cx="33" cy="26" rx="4.5" ry="3.5" fill="#7f1d1d" />
      <ellipse cx="47" cy="26" rx="4.5" ry="3.5" fill="#7f1d1d" />
      <ellipse cx="33" cy="26" rx="3" ry="2" fill="#dc2626" />
      <ellipse cx="47" cy="26" rx="3" ry="2" fill="#dc2626" />
      <ellipse cx="32.5" cy="25.5" rx="1.2" ry="0.8" fill="#fca5a5" />
      <ellipse cx="46.5" cy="25.5" rx="1.2" ry="0.8" fill="#fca5a5" />
      {/* Eye glow halos */}
      <ellipse cx="33" cy="26" rx="7" ry="5" fill="#dc2626" opacity="0.12" />
      <ellipse cx="47" cy="26" rx="7" ry="5" fill="#dc2626" opacity="0.12" />
      {/* Snout */}
      <ellipse cx="40" cy="33" rx="7" ry="5" fill="#150202" stroke="#7f1d1d" strokeWidth="0.7" />
      <ellipse cx="40" cy="31.5" rx="3" ry="2" fill="#3f0000" opacity="0.7" />
      {/* Fangs */}
      <path d="M36 37 L34 46 L38 46 Z" fill="#b91c1c" opacity="0.85" />
      <path d="M44 37 L42 46 L46 46 Z" fill="#b91c1c" opacity="0.85" />
      {/* Claw marks */}
      <path d="M21 65 L31 81" stroke="#7f1d1d" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
      <path d="M26 62 L36 78" stroke="#7f1d1d" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
      <path d="M31 60 L41 76" stroke="#7f1d1d" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

function SeerArt() {
  return (
    <svg viewBox="0 0 80 104" className="w-full h-full" fill="none">
      <rect width="80" height="104" fill="#080210" />
      <ellipse cx="40" cy="46" rx="38" ry="52" fill="#120428" />
      {/* Body — flowing robes */}
      <path d="M12 58 Q8 96 22 103 L58 103 Q72 96 68 58 Q55 47 40 43 Q25 47 12 58Z" fill="#0c0320" stroke="#5b21b6" strokeWidth="1" />
      {/* Robe folds */}
      <path d="M40 43 L40 103" stroke="#5b21b6" strokeWidth="0.6" opacity="0.4" />
      <path d="M30 47 Q28 75 26 103" stroke="#5b21b6" strokeWidth="0.5" opacity="0.25" />
      <path d="M50 47 Q52 75 54 103" stroke="#5b21b6" strokeWidth="0.5" opacity="0.25" />
      {/* Head */}
      <ellipse cx="40" cy="27" rx="18" ry="21" fill="#0c0320" stroke="#5b21b6" strokeWidth="1" />
      {/* Third eye — forehead gem */}
      <ellipse cx="40" cy="19" rx="4.5" ry="3.5" fill="#4c1d95" />
      <ellipse cx="40" cy="19" rx="3" ry="2" fill="#7c3aed" />
      <ellipse cx="40" cy="19" rx="1.5" ry="1" fill="#ddd6fe" opacity="0.9" />
      {/* Third eye glow */}
      <ellipse cx="40" cy="19" rx="8" ry="6" fill="#7c3aed" opacity="0.18" />
      {/* Regular eyes */}
      <ellipse cx="33" cy="29" rx="3" ry="2.5" fill="#4c1d95" />
      <ellipse cx="47" cy="29" rx="3" ry="2.5" fill="#4c1d95" />
      <ellipse cx="33" cy="29" rx="1.8" ry="1.5" fill="#7c3aed" opacity="0.8" />
      <ellipse cx="47" cy="29" rx="1.8" ry="1.5" fill="#7c3aed" opacity="0.8" />
      {/* Crystal orb — chest area */}
      <circle cx="40" cy="74" r="10" fill="#0c0320" stroke="#5b21b6" strokeWidth="0.8" />
      <circle cx="40" cy="74" r="7" fill="#12053a" />
      <circle cx="40" cy="74" r="5" fill="#1e0a5e" opacity="0.8" />
      <ellipse cx="38" cy="71" rx="2.5" ry="2" fill="#7c3aed" opacity="0.45" />
      <ellipse cx="37.5" cy="70.5" rx="1" ry="0.8" fill="#c4b5fd" opacity="0.6" />
      {/* Stars */}
      <path d="M17 48 L18 51 L21 52 L18 53 L17 56 L16 53 L13 52 L16 51 Z" fill="#7c3aed" opacity="0.5" />
      <path d="M60 40 L61 43 L64 44 L61 45 L60 48 L59 45 L56 44 L59 43 Z" fill="#7c3aed" opacity="0.45" />
      <circle cx="14" cy="35" r="1.5" fill="#7c3aed" opacity="0.4" />
      <circle cx="67" cy="60" r="1" fill="#7c3aed" opacity="0.35" />
      {/* Aura ring */}
      <ellipse cx="40" cy="40" rx="32" ry="42" fill="none" stroke="#5b21b6" strokeWidth="0.6" opacity="0.22" strokeDasharray="4 5" />
    </svg>
  );
}

function DoctorArt() {
  return (
    <svg viewBox="0 0 80 104" className="w-full h-full" fill="none">
      <rect width="80" height="104" fill="#020f09" />
      <ellipse cx="40" cy="46" rx="38" ry="52" fill="#040f08" />
      {/* Body — coat */}
      <path d="M14 57 Q10 94 22 103 L58 103 Q70 94 66 57 Q54 47 40 43 Q26 47 14 57Z" fill="#071a10" stroke="#065f46" strokeWidth="1" />
      {/* Coat lapels */}
      <path d="M40 43 L32 58 L40 60 L48 58 L40 43Z" fill="#0a2418" stroke="#065f46" strokeWidth="0.6" />
      {/* Coat center line */}
      <path d="M40 60 L40 103" stroke="#065f46" strokeWidth="0.5" opacity="0.4" />
      {/* Head */}
      <ellipse cx="40" cy="27" rx="18" ry="21" fill="#071a10" stroke="#065f46" strokeWidth="1" />
      {/* Eyes */}
      <ellipse cx="34" cy="28" rx="3" ry="2.5" fill="#065f46" />
      <ellipse cx="46" cy="28" rx="3" ry="2.5" fill="#065f46" />
      <ellipse cx="34" cy="28" rx="2" ry="1.5" fill="#059669" opacity="0.9" />
      <ellipse cx="46" cy="28" rx="2" ry="1.5" fill="#059669" opacity="0.9" />
      <ellipse cx="33.5" cy="27.5" rx="0.8" ry="0.6" fill="#6ee7b7" opacity="0.6" />
      <ellipse cx="45.5" cy="27.5" rx="0.8" ry="0.6" fill="#6ee7b7" opacity="0.6" />
      {/* Medical cross on chest */}
      <rect x="35" y="67" width="10" height="18" rx="2" fill="#065f46" />
      <rect x="30" y="72" width="20" height="8" rx="2" fill="#065f46" />
      <rect x="36.5" y="68.5" width="7" height="15" rx="1.5" fill="#059669" opacity="0.6" />
      <rect x="31.5" y="73.5" width="17" height="5" rx="1.5" fill="#059669" opacity="0.6" />
      {/* Cross highlight */}
      <rect x="38" y="70" width="4" height="10" rx="1" fill="#6ee7b7" opacity="0.3" />
      <rect x="33" y="75" width="14" height="3" rx="1" fill="#6ee7b7" opacity="0.3" />
      {/* Protective aura dashes */}
      <ellipse cx="40" cy="50" rx="28" ry="46" fill="none" stroke="#059669" strokeWidth="0.7" strokeDasharray="3 5" opacity="0.3" />
      <ellipse cx="40" cy="50" rx="22" ry="38" fill="none" stroke="#059669" strokeWidth="0.4" opacity="0.15" />
      {/* Glow around head */}
      <ellipse cx="40" cy="27" rx="22" ry="25" fill="none" stroke="#059669" strokeWidth="0.8" opacity="0.2" />
    </svg>
  );
}

function VillagerArt() {
  return (
    <svg viewBox="0 0 80 104" className="w-full h-full" fill="none">
      <rect width="80" height="104" fill="#0c0903" />
      <ellipse cx="40" cy="46" rx="38" ry="52" fill="#161005" />
      {/* Body */}
      <path d="M15 57 Q11 93 23 102 L57 102 Q69 93 65 57 Q53 47 40 43 Q27 47 15 57Z" fill="#1a1206" stroke="#78350f" strokeWidth="1" />
      {/* Simple clothing detail */}
      <path d="M40 43 L40 102" stroke="#78350f" strokeWidth="0.5" opacity="0.35" />
      <path d="M27 50 Q32 52 40 50 Q48 52 53 50" stroke="#78350f" strokeWidth="0.6" opacity="0.3" />
      {/* Head */}
      <ellipse cx="40" cy="28" rx="18" ry="21" fill="#1a1206" stroke="#78350f" strokeWidth="1" />
      {/* Face */}
      <ellipse cx="40" cy="30" rx="11" ry="13" fill="#120d04" />
      <ellipse cx="34.5" cy="29" rx="2.5" ry="2" fill="#92500a" opacity="0.65" />
      <ellipse cx="45.5" cy="29" rx="2.5" ry="2" fill="#92500a" opacity="0.65" />
      {/* Torch — right side */}
      <rect x="59" y="58" width="4" height="26" rx="2" fill="#78350f" />
      {/* Torch flame */}
      <path d="M61 58 Q65 52 62 47 Q60 52 58 48 Q56 53 59 58Z" fill="#d97706" />
      <path d="M61 57 Q64 52 62 48 Q60 52 59 49 Q57 53 60 57Z" fill="#fbbf24" opacity="0.7" />
      <path d="M61 57 Q63 53 61.5 50 Q60 53 60.5 50.5 Q59 53 60 57Z" fill="#fef3c7" opacity="0.5" />
      {/* Warm glow from torch */}
      <ellipse cx="61" cy="52" rx="14" ry="16" fill="#d97706" opacity="0.09" />
      <ellipse cx="61" cy="52" rx="8" ry="10" fill="#fbbf24" opacity="0.08" />
    </svg>
  );
}

export function RoleCardArt({ role }: { role: Role }) {
  switch (role) {
    case 'werewolf': return <WerewolfArt />;
    case 'seer':     return <SeerArt />;
    case 'doctor':   return <DoctorArt />;
    case 'villager': return <VillagerArt />;
  }
}
