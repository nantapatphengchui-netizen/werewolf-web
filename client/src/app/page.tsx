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
        {/* Ken Burns — slow zoom + drift */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bg.png"
          alt=""
          className="w-full h-full object-cover object-center"
          draggable={false}
          style={{ animation: 'kenburns 30s ease-in-out infinite', transformOrigin: 'center center' }}
        />
        {/* Dark base overlay */}
        <div className="absolute inset-0 bg-black/40" />
        {/* Fog drift layer */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_30%_60%,rgba(80,40,10,0.18)_0%,transparent_70%)]"
          style={{ animation: 'fog-drift 18s ease-in-out infinite' }}
        />
        {/* Breathing vignette */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.65)_100%)]"
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
