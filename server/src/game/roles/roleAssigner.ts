import type { Role, GameSettings } from '../../types/game';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Most wolves a game of n players can safely start with (wolves must be a minority). */
export function maxWolvesFor(playerCount: number): number {
  return Math.max(1, Math.ceil(playerCount / 2) - 1);
}

/**
 * Build the role list from the host's settings:
 * werewolves (clamped), then enabled specials in priority order while
 * players remain, and villagers to fill.
 */
export function assignRoles(playerIds: string[], settings: GameSettings): Map<string, Role> {
  const count  = playerIds.length;
  const wolves = Math.min(Math.max(1, Math.round(settings.werewolfCount)), maxWolvesFor(count));

  const roles: Role[] = Array<Role>(wolves).fill('werewolf');

  // Specials in priority order — only while there's still room beyond the wolves
  const SPECIAL_PRIORITY: (keyof GameSettings['roles'])[] = ['seer', 'doctor', 'bodyguard', 'witch', 'hunter', 'jester'];
  for (const special of SPECIAL_PRIORITY) {
    if (roles.length >= count) break;
    if (settings.roles[special]) roles.push(special as Role);
  }

  while (roles.length < count) roles.push('villager');

  const shuffledRoles = shuffle(roles);
  const shuffledIds   = shuffle(playerIds);

  const result = new Map<string, Role>();
  shuffledIds.forEach((id, i) => result.set(id, shuffledRoles[i]));
  return result;
}
