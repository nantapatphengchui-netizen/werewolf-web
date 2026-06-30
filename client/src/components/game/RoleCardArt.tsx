import type { Role } from '@/types/game';

const ROLE_IMAGE: Record<Role, string> = {
  werewolf: '/role-werewolf.png',
  seer:     '/role-seer.png',
  doctor:   '/role-doctor.png',
  villager: '/role-villager.png',
};

export function RoleCardArt({ role }: { role: Role }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={ROLE_IMAGE[role]}
      alt={role}
      draggable={false}
      className="absolute inset-0 w-full h-full object-cover object-top"
    />
  );
}
