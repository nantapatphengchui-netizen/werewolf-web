'use client';

import { useState } from 'react';
import { DarkPanel } from '@/components/ui/DarkPanel';

type Mode = 'select' | 'create' | 'join';

interface Props {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  error: string | null;
  isConnected: boolean;
  onClearError: () => void;
}

export function CreateJoinForm({
  onCreateRoom,
  onJoinRoom,
  error,
  isConnected,
  onClearError,
}: Props) {
  const [mode, setMode] = useState<Mode>('select');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) onCreateRoom(playerName.trim());
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && roomCode.trim()) onJoinRoom(roomCode.trim(), playerName.trim());
  };

  const goBack = () => {
    setMode('select');
    setRoomCode('');
    onClearError();
  };

  return (
    <DarkPanel className="p-8 w-full max-w-sm mx-auto">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-1">
          <span className="block h-px w-8 bg-amber-800/60" />
          <span className="text-amber-700 text-xs tracking-[0.4em] uppercase">Online</span>
          <span className="block h-px w-8 bg-amber-800/60" />
        </div>
        <h1 className="font-cinzel text-5xl font-bold text-amber-300 tracking-widest drop-shadow-[0_0_12px_rgba(217,119,6,0.4)]">
          WEREWOLF
        </h1>
        <p className="text-amber-800 text-xs tracking-[0.35em] uppercase mt-1">
          A Game of Deception
        </p>
        {!isConnected && (
          <p className="mt-3 text-amber-700/60 text-xs animate-pulse">Connecting to server...</p>
        )}
      </div>

      {/* Select mode */}
      {mode === 'select' && (
        <div className="space-y-3">
          <button
            onClick={() => setMode('create')}
            className="w-full py-3 bg-amber-800/70 hover:bg-amber-700/70 border border-amber-600/50 text-amber-100 font-semibold rounded tracking-widest uppercase text-sm transition-all duration-150 active:scale-95"
          >
            Create Room
          </button>
          <button
            onClick={() => setMode('join')}
            className="w-full py-3 bg-transparent hover:bg-amber-950/50 border border-amber-800/50 hover:border-amber-700/60 text-amber-400 font-semibold rounded tracking-widest uppercase text-sm transition-all duration-150 active:scale-95"
          >
            Join Room
          </button>
        </div>
      )}

      {/* Create mode */}
      {mode === 'create' && (
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-amber-600 text-xs uppercase tracking-widest mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => { setPlayerName(e.target.value); onClearError(); }}
              maxLength={20}
              placeholder="Enter your name..."
              autoFocus
              className="w-full bg-black/40 border border-amber-900/60 focus:border-amber-600/80 text-amber-100 placeholder-amber-900/70 rounded px-4 py-2.5 outline-none transition-colors text-sm"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/30 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!playerName.trim()}
            className="w-full py-3 bg-amber-800/70 hover:bg-amber-700/70 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-600/50 text-amber-100 font-semibold rounded tracking-widest uppercase text-sm transition-all duration-150 active:scale-95"
          >
            Create Room
          </button>
          <button
            type="button"
            onClick={goBack}
            className="w-full py-2 text-amber-800 hover:text-amber-600 text-xs uppercase tracking-widest transition-colors"
          >
            ← Back
          </button>
        </form>
      )}

      {/* Join mode */}
      {mode === 'join' && (
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-amber-600 text-xs uppercase tracking-widest mb-1.5">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); onClearError(); }}
              maxLength={6}
              placeholder="XXXXXX"
              autoFocus
              className="w-full bg-black/40 border border-amber-900/60 focus:border-amber-600/80 text-amber-200 placeholder-amber-900/60 rounded px-4 py-2.5 outline-none transition-colors text-center tracking-[0.6em] text-lg font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-amber-600 text-xs uppercase tracking-widest mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => { setPlayerName(e.target.value); onClearError(); }}
              maxLength={20}
              placeholder="Enter your name..."
              className="w-full bg-black/40 border border-amber-900/60 focus:border-amber-600/80 text-amber-100 placeholder-amber-900/70 rounded px-4 py-2.5 outline-none transition-colors text-sm"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/30 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!playerName.trim() || roomCode.length < 4}
            className="w-full py-3 bg-amber-800/70 hover:bg-amber-700/70 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-600/50 text-amber-100 font-semibold rounded tracking-widest uppercase text-sm transition-all duration-150 active:scale-95"
          >
            Join Room
          </button>
          <button
            type="button"
            onClick={goBack}
            className="w-full py-2 text-amber-800 hover:text-amber-600 text-xs uppercase tracking-widest transition-colors"
          >
            ← Back
          </button>
        </form>
      )}

      <p className="text-center text-amber-900/70 text-xs mt-6">
        8–12 players required to start
      </p>
    </DarkPanel>
  );
}
