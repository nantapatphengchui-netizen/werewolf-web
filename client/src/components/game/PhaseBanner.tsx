import type { ReactNode } from 'react';
import type { GamePhase } from '@/types/game';
import { PhaseTimer } from './PhaseTimer';

interface PhaseTheme {
  label: string;
  subtitle: string;
  labelClass: string;
  subtitleClass: string;
  glowClass: string;
  dividerClass: string;
  Icon: () => ReactNode;
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-violet-300 animate-flicker" fill="currentColor">
      <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-amber-300" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function ScalesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l9-3 9 3M12 3v18M5 6l-2 8h4l-2-8zM19 6l-2 8h4l-2-8z" />
      <path strokeLinecap="round" d="M5 21h14" />
    </svg>
  );
}

const PHASE_THEME: Partial<Record<GamePhase, PhaseTheme>> = {
  night: {
    label: 'NIGHT',
    subtitle: 'The village sleeps. Night actions are in progress.',
    labelClass: 'text-violet-200',
    subtitleClass: 'text-violet-400/70',
    glowClass: 'drop-shadow-[0_0_22px_rgba(139,92,246,0.55)]',
    dividerClass: 'bg-gradient-to-r from-transparent to-violet-900/40',
    Icon: MoonIcon,
  },
  day: {
    label: 'DAY',
    subtitle: 'The village wakes. Discuss and find the wolves.',
    labelClass: 'text-amber-200',
    subtitleClass: 'text-amber-500/75',
    glowClass: 'drop-shadow-[0_0_22px_rgba(217,119,6,0.4)]',
    dividerClass: 'bg-gradient-to-r from-transparent to-amber-800/40',
    Icon: SunIcon,
  },
  voting: {
    label: 'VOTE',
    subtitle: 'The village must decide. Cast your vote to exile.',
    labelClass: 'text-red-300',
    subtitleClass: 'text-red-400/65',
    glowClass: 'drop-shadow-[0_0_22px_rgba(239,68,68,0.45)]',
    dividerClass: 'bg-gradient-to-r from-transparent to-red-900/40',
    Icon: ScalesIcon,
  },
};

interface Props {
  phase: GamePhase;
  round: number;
  phaseEndAt: number | null;
  timerPaused?: boolean;
  pausedTimeRemaining?: number | null;
}

export function PhaseBanner({ phase, round, phaseEndAt, timerPaused = false, pausedTimeRemaining = null }: Props) {
  const theme = PHASE_THEME[phase];
  if (!theme) return null;

  return (
    <div className="text-center select-none py-2 animate-phase-in" key={`${phase}-${round}`}>
      <div className="flex items-center justify-center gap-3 mb-2">
        <span className={`block h-px flex-1 ${theme.dividerClass}`} />
        <theme.Icon />
        <span className={`block h-px flex-1 bg-gradient-to-l from-transparent ${theme.dividerClass.replace('to-', 'to-')}`} />
      </div>

      <h2 className={`font-cinzel text-4xl md:text-5xl font-bold tracking-[0.25em] ${theme.labelClass} ${theme.glowClass}`}>
        {theme.label}
      </h2>
      <p className="text-amber-700 text-xs uppercase tracking-widest mt-1">
        Round {round}
      </p>

      <div className={`mt-3 text-sm leading-relaxed whitespace-pre-line ${theme.subtitleClass}`}>
        {theme.subtitle}
      </div>

      {(phaseEndAt || timerPaused) && (
        <div className="mt-3 px-4">
          <PhaseTimer
            phaseEndAt={phaseEndAt}
            phase={phase}
            paused={timerPaused}
            pausedTimeRemaining={pausedTimeRemaining}
          />
        </div>
      )}
    </div>
  );
}
