'use client';

import type { GamePhase } from '@/types/game';

// Phase-tinted "moonlight" wash from the top of the play area
const MOONLIGHT: Record<string, string> = {
  night:  'rgba(130,150,225,0.18)',
  day:    'rgba(255,214,140,0.15)',
  voting: 'rgba(224,90,90,0.16)',
  ended:  'rgba(130,150,225,0.10)',
  lobby:  'rgba(130,150,225,0.10)',
};

const FOG: Record<string, string> = {
  night:  'rgba(46,34,78,0.40)',
  day:    'rgba(60,44,20,0.34)',
  voting: 'rgba(60,20,20,0.38)',
  ended:  'rgba(20,16,30,0.40)',
  lobby:  'rgba(30,24,48,0.34)',
};

// Per-phase darkness wash — night swallows the room, day is bright
const DARK: Record<string, number> = {
  night:  0.52,
  day:    0.08,
  voting: 0.30,
  ended:  0.62,
  lobby:  0.22,
};

// Fixed set (deterministic — avoids SSR hydration mismatch)
const MOTES = [
  { l: '6%',  t: '78%', s: 2.5, d: '15s', delay: '0s',   dx: '16px',  o: 0.55 },
  { l: '14%', t: '40%', s: 1.5, d: '19s', delay: '3s',   dx: '-10px', o: 0.40 },
  { l: '22%', t: '88%', s: 3,   d: '13s', delay: '6s',   dx: '22px',  o: 0.6  },
  { l: '31%', t: '20%', s: 1.5, d: '22s', delay: '1.5s', dx: '-14px', o: 0.35 },
  { l: '39%', t: '62%', s: 2,   d: '17s', delay: '8s',   dx: '10px',  o: 0.5  },
  { l: '47%', t: '30%', s: 2.5, d: '20s', delay: '4s',   dx: '-18px', o: 0.45 },
  { l: '54%', t: '82%', s: 1.5, d: '16s', delay: '10s',  dx: '14px',  o: 0.4  },
  { l: '61%', t: '48%', s: 3,   d: '14s', delay: '2s',   dx: '-12px', o: 0.6  },
  { l: '69%', t: '24%', s: 2,   d: '21s', delay: '7s',   dx: '18px',  o: 0.4  },
  { l: '76%', t: '70%', s: 2.5, d: '18s', delay: '5s',   dx: '-16px', o: 0.5  },
  { l: '84%', t: '36%', s: 1.5, d: '23s', delay: '9s',   dx: '12px',  o: 0.35 },
  { l: '91%', t: '84%', s: 3,   d: '15s', delay: '3.5s', dx: '-20px', o: 0.55 },
  { l: '18%', t: '58%', s: 2,   d: '18s', delay: '11s',  dx: '10px',  o: 0.45 },
  { l: '66%', t: '90%', s: 2,   d: '16s', delay: '6.5s', dx: '-14px', o: 0.5  },
] as const;

export function SceneAtmosphere({ phase }: { phase: GamePhase }) {
  const moon = MOONLIGHT[phase] ?? MOONLIGHT.night;
  const fog  = FOG[phase] ?? FOG.night;
  const dark = DARK[phase] ?? 0.30;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Phase darkness wash (night is darkest) — sits under the glow so motes still shine */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(3,2,12,${dark})`, transition: 'background-color 1.4s ease' }}
      />

      {/* Moonlight shaft from the top */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(130% 65% at 50% -12%, ${moon} 0%, transparent 58%)`,
          animation: 'moonlight-breathe 9s ease-in-out infinite',
        }}
      />

      {/* Rolling ground fog */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background: `radial-gradient(150% 90% at 50% 130%, ${fog} 0%, transparent 62%)`,
          animation: 'fog-drift 26s ease-in-out infinite',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background: `radial-gradient(120% 80% at 25% 120%, ${fog} 0%, transparent 55%)`,
          animation: 'fog-drift 34s ease-in-out infinite reverse',
        }}
      />

      {/* Floating dust motes */}
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: m.l,
            top: m.t,
            width: m.s,
            height: m.s,
            backgroundColor: 'rgba(232,222,192,0.85)',
            boxShadow: '0 0 5px 1px rgba(232,222,192,0.5)',
            ['--mote-dx' as string]: m.dx,
            ['--mote-o' as string]: String(m.o),
            animation: `mote-drift ${m.d} linear ${m.delay} infinite`,
          } as React.CSSProperties}
        />
      ))}

      {/* Night — a thicker, denser fog bank rolling along the ground */}
      {phase === 'night' && (
        <div
          className="absolute inset-x-0 bottom-0 h-3/4"
          style={{
            background: 'radial-gradient(165% 105% at 50% 138%, rgba(38,28,66,0.55) 0%, rgba(24,18,44,0.30) 40%, transparent 66%)',
            animation: 'fog-drift 30s ease-in-out infinite',
          }}
        />
      )}

      {/* Depth vignette — darkens the edges of the play area */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 85% 75% at 50% 45%, transparent 55%, rgba(0,0,0,0.5) 100%)' }}
      />

      {/* Voting — the walls throb an angry red */}
      {phase === 'voting' && (
        <div
          className="absolute inset-0"
          style={{
            boxShadow: 'inset 0 0 110px 14px rgba(150,10,10,0.45)',
            animation: 'vote-edge-pulse 1.5s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}
