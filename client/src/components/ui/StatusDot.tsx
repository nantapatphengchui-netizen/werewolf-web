interface Props {
  connected: boolean;
  size?: 'sm' | 'md';
}

export function StatusDot({ connected, size = 'sm' }: Props) {
  const dim = size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5';
  return (
    <span
      className={`inline-block rounded-full ${dim} ${
        connected ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'bg-gray-600'
      }`}
      aria-label={connected ? 'Online' : 'Offline'}
    />
  );
}
