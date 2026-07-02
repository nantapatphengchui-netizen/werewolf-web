'use client';

import { useState, useEffect } from 'react';
import { DarkPanel } from '@/components/ui/DarkPanel';
import { LangToggle } from '@/components/ui/LangToggle';
import { useT } from '@/i18n';

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
  const T = useT();
  const [mode, setMode] = useState<Mode>('select');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Any server error means our submit didn't take — re-enable the form.
  useEffect(() => { if (error) setSubmitting(false); }, [error]);
  // If the socket drops mid-submit, stop showing the pending state.
  useEffect(() => { if (!isConnected) setSubmitting(false); }, [isConnected]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || submitting) return;
    if (playerName.trim()) { setSubmitting(true); onCreateRoom(playerName.trim()); }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || submitting) return;
    if (playerName.trim() && roomCode.trim()) { setSubmitting(true); onJoinRoom(roomCode.trim(), playerName.trim()); }
  };

  const goBack = () => {
    setMode('select');
    setRoomCode('');
    onClearError();
  };

  const Spinner = () => (
    <span className="inline-block w-3.5 h-3.5 border-2 border-amber-200/40 border-t-amber-100 rounded-full animate-spin align-middle" />
  );

  return (
    <DarkPanel className="relative p-8 w-full max-w-sm mx-auto">
      {/* Language toggle — top-right */}
      <div className="absolute top-3 right-3">
        <LangToggle />
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-1">
          <span className="block h-px w-8 bg-amber-800/60" />
          <span className="text-amber-700 text-xs tracking-[0.4em] uppercase">{T('landing.online')}</span>
          <span className="block h-px w-8 bg-amber-800/60" />
        </div>
        <h1 className="font-cinzel text-5xl font-bold text-amber-300 tracking-widest drop-shadow-[0_0_12px_rgba(217,119,6,0.4)]">
          WEREWOLF
        </h1>
        <p className="text-amber-800 text-xs tracking-[0.35em] uppercase mt-1">
          {T('landing.tagline')}
        </p>
        {!isConnected && (
          <p className="mt-3 text-amber-700/60 text-xs animate-pulse">{T('landing.connecting')}</p>
        )}
      </div>

      {/* Select mode */}
      {mode === 'select' && (
        <div className="space-y-3">
          <button
            onClick={() => setMode('create')}
            className="w-full py-3 bg-amber-800/70 hover:bg-amber-700/70 border border-amber-600/50 text-amber-100 font-semibold rounded tracking-widest uppercase text-sm transition-all duration-150 active:scale-95"
          >
            {T('landing.createRoom')}
          </button>
          <button
            onClick={() => setMode('join')}
            className="w-full py-3 bg-transparent hover:bg-amber-950/50 border border-amber-800/50 hover:border-amber-700/60 text-amber-400 font-semibold rounded tracking-widest uppercase text-sm transition-all duration-150 active:scale-95"
          >
            {T('landing.joinRoom')}
          </button>
        </div>
      )}

      {/* Create mode */}
      {mode === 'create' && (
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-amber-600 text-xs uppercase tracking-widest mb-1.5">
              {T('landing.yourName')}
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => { setPlayerName(e.target.value); onClearError(); }}
              maxLength={20}
              placeholder={T('landing.namePlaceholder')}
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
            disabled={!playerName.trim() || !isConnected || submitting}
            className="w-full py-3 bg-amber-800/70 hover:bg-amber-700/70 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-600/50 text-amber-100 font-semibold rounded tracking-widest uppercase text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-2"
          >
            {submitting ? <><Spinner /> {T('landing.creating')}</>
              : !isConnected ? T('landing.waitConnect')
              : T('landing.createRoom')}
          </button>
          <button
            type="button"
            onClick={goBack}
            className="w-full py-2 text-amber-800 hover:text-amber-600 text-xs uppercase tracking-widest transition-colors"
          >
            {T('landing.back')}
          </button>
        </form>
      )}

      {/* Join mode */}
      {mode === 'join' && (
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-amber-600 text-xs uppercase tracking-widest mb-1.5">
              {T('landing.roomCode')}
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
              {T('landing.yourName')}
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => { setPlayerName(e.target.value); onClearError(); }}
              maxLength={20}
              placeholder={T('landing.namePlaceholder')}
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
            disabled={!playerName.trim() || roomCode.length < 4 || !isConnected || submitting}
            className="w-full py-3 bg-amber-800/70 hover:bg-amber-700/70 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-600/50 text-amber-100 font-semibold rounded tracking-widest uppercase text-sm transition-all duration-150 active:scale-95 flex items-center justify-center gap-2"
          >
            {submitting ? <><Spinner /> {T('landing.joining')}</>
              : !isConnected ? T('landing.waitConnect')
              : T('landing.joinRoom')}
          </button>
          <button
            type="button"
            onClick={goBack}
            className="w-full py-2 text-amber-800 hover:text-amber-600 text-xs uppercase tracking-widest transition-colors"
          >
            {T('landing.back')}
          </button>
        </form>
      )}

      <p className="text-center text-amber-900/70 text-xs mt-6">
        {T('landing.playersRequired')}
      </p>
    </DarkPanel>
  );
}
