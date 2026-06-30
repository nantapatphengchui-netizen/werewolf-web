'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { CreateJoinForm } from '@/components/lobby/CreateJoinForm';
import { useAudioPhaseStore } from '@/store/audioPhaseStore';

export default function HomePage() {
  const router = useRouter();
  const { room, error, isConnected, createRoom, joinRoom, clearError } = useRoom();
  const setAudioPhase = useAudioPhaseStore(s => s.setPhase);

  useEffect(() => { setAudioPhase('lobby'); }, [setAudioPhase]);

  useEffect(() => {
    if (room) {
      router.push(`/room/${room.code}`);
    }
  }, [room, router]);

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4">
      {/* Full-bleed background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bg.png"
          alt=""
          className="w-full h-full object-cover object-center"
          draggable={false}
        />
        {/* Dark base */}
        <div className="absolute inset-0 bg-black/45" />
        {/* Heavy vignette — dark edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.82)_100%)]" />
        {/* Fog layer 1 — bottom, slow drift */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_150%_60%_at_50%_100%,rgba(120,80,20,0.38)_0%,transparent_65%)]"
          style={{ animation: 'fog-drift 20s ease-in-out infinite' }}
        />
        {/* Fog layer 2 — top-left, offset timing */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_15%_10%,rgba(60,30,8,0.32)_0%,transparent_60%)]"
          style={{ animation: 'fog-drift 26s ease-in-out infinite reverse' }}
        />
        {/* Breathing vignette */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)]"
          style={{ animation: 'vignette-breathe 8s ease-in-out infinite' }}
        />
      </div>

      <CreateJoinForm
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        error={error}
        isConnected={isConnected}
        onClearError={clearError}
      />
    </main>
  );
}
