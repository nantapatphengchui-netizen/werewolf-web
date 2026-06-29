'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { CreateJoinForm } from '@/components/lobby/CreateJoinForm';

export default function HomePage() {
  const router = useRouter();
  const { room, error, isConnected, createRoom, joinRoom, clearError } = useRoom();

  useEffect(() => {
    if (room) {
      router.push(`/room/${room.code}`);
    }
  }, [room, router]);

  return (
    <main className="relative min-h-screen flex items-center justify-center px-4">
      {/* Full-bleed background */}
      <div className="fixed inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bg.png"
          alt=""
          className="w-full h-full object-cover object-center"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/45" />
        {/* Subtle vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5)_100%)]" />
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
