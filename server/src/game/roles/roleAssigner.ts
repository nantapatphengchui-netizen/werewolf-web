import type { Role } from '../../types/game';

interface RolePreset {
  werewolf: number;
  seer:     number;
  doctor:   number;
  hunter:   number;
  bodyguard:number;
  witch:    number;
  villager: number;
}

// Default role presets keyed by player count (5-12)
const PRESETS: Record<number, RolePreset> = {
  5:  { werewolf:1, seer:1, doctor:1, hunter:0, bodyguard:0, witch:0, villager:2 },
  6:  { werewolf:1, seer:1, doctor:1, hunter:1, bodyguard:0, witch:0, villager:2 },
  7:  { werewolf:2, seer:1, doctor:1, hunter:1, bodyguard:0, witch:0, villager:2 },
  8:  { werewolf:2, seer:1, doctor:1, hunter:1, bodyguard:1, witch:0, villager:2 },
  9:  { werewolf:2, seer:1, doctor:1, hunter:1, bodyguard:1, witch:1, villager:2 },
  10: { werewolf:2, seer:1, doctor:1, hunter:1, bodyguard:1, witch:1, villager:3 },
  11: { werewolf:3, seer:1, doctor:1, hunter:1, bodyguard:1, witch:1, villager:3 },
  12: { werewolf:3, seer:1, doctor:1, hunter:1, bodyguard:1, witch:1, villager:4 },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function assignRoles(playerIds: string[]): Map<string, Role> {
  const count = playerIds.length;
  const preset = PRESETS[count];

  let roles: Role[];

  if (preset) {
    roles = [
      ...Array<Role>(preset.werewolf).fill('werewolf'),
      ...Array<Role>(preset.seer).fill('seer'),
      ...Array<Role>(preset.doctor).fill('doctor'),
      ...Array<Role>(preset.hunter).fill('hunter'),
      ...Array<Role>(preset.bodyguard).fill('bodyguard'),
      ...Array<Role>(preset.witch).fill('witch'),
      ...Array<Role>(preset.villager).fill('villager'),
    ];
  } else {
    // Fallback for counts outside 5-12
    const wolves = count <= 5 ? 1 : count <= 10 ? 2 : 3;
    roles = [
      ...Array<Role>(wolves).fill('werewolf'),
      'seer',
      'doctor',
      ...Array<Role>(count - wolves - 2).fill('villager'),
    ];
  }

  const shuffledRoles = shuffle(roles);
  const shuffledIds   = shuffle(playerIds);

  const result = new Map<string, Role>();
  shuffledIds.forEach((id, i) => result.set(id, shuffledRoles[i]));
  return result;
}
