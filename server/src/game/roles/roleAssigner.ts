import type { Role } from '../../types/game';

function werewolfCount(playerCount: number): number {
  if (playerCount <= 5) return 1;
  if (playerCount <= 10) return 2;
  return 3;
}

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
  const wolves = werewolfCount(count);
  const specials = 2; // seer + doctor

  const roles: Role[] = [
    ...Array<Role>(wolves).fill('werewolf'),
    'seer',
    'doctor',
    ...Array<Role>(count - wolves - specials).fill('villager'),
  ];

  const shuffledRoles = shuffle(roles);
  const shuffledIds = shuffle(playerIds);

  const result = new Map<string, Role>();
  shuffledIds.forEach((id, i) => result.set(id, shuffledRoles[i]));
  return result;
}
