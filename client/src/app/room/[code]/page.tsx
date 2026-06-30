'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { useGameStore } from '@/store/gameStore';
import { RoomHeader } from '@/components/room/RoomHeader';
import { PlayerGrid } from '@/components/room/PlayerGrid';
import { HostControls } from '@/components/room/HostControls';
import { HostAdminPanel } from '@/components/room/HostAdminPanel';
import { GameView } from '@/components/game/GameView';
import { useAudioPhaseStore } from '@/store/audioPhaseStore';

const PHASE_TINT: Record<string, string> = {
  lobby:  'bg-black/55',
  night:  'bg-indigo-950/55',
  day:    'bg-amber-950/25',
  voting: 'bg-red-950/35',
  ended:  'bg-black/75',
};

function Background({ phase }: { phase: string }) {
  const tint = PHASE_TINT[phase] ?? 'bg-black/55';
  return (
    <div className="fixed inset-0 -z-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/bg.png" alt="" className="w-full h-full object-cover object-center" draggable={false} />
      <div className="absolute inset-0 bg-black/40" />
      <div className={`absolute inset-0 transition-colors duration-1000 ${tint}`} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.5)_100%)]" />
    </div>
  );
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = ((params.code as string) ?? '').toUpperCase();

  const {
    room, playerId, error, isConnected,
    startGame, leaveRoom, playerReady,
    nightAction, castVote, advanceDay,
    restartGame, returnToLobby,
    hostKickPlayer, hostLockRoom, hostUnlockRoom, hostResetReady,
    hostPauseTimer, hostResumeTimer, hostExtendTimer, hostEndPhase,
    hostRestartGame, hostReturnToLobby,
  } = useRoom();
  const myRole      = useGameStore(s => s.myRole);
  const werewolfIds = useGameStore(s => s.werewolfIds);
  const setAudioPhase = useAudioPhaseStore(s => s.setPhase);

  useEffect(() => {
    if (!isConnected) return;
    const timer = setTimeout(() => {
      if (!room) router.replace('/');
    }, 1500);
    return () => clearTimeout(timer);
  }, [room, isConnected, router]);

  useEffect(() => {
    if (room) setAudioPhase(room.phase);
  }, [room?.phase, setAudioPhase]);

  if (!room) return null;

  const handleLeave = () => {
    leaveRoom();
    router.replace('/');
  };

  const isLobby = room.phase === 'lobby';
  const isHost  = room.hostId === playerId;
  const canStart = room.players.length >= room.minPlayers &&
                   room.readyPlayers.length === room.players.length;
  const isReady  = room.readyPlayers.includes(playerId ?? '');

  return (
    <>
      {/* ── Game screen ─────────────────────────────────────────────────────── */}
      {!isLobby && (
        <main className="relative min-h-screen flex flex-col">
          <Background phase={room.phase} />
          <GameView
            room={room}
            playerId={playerId ?? ''}
            myRole={myRole}
            werewolfIds={werewolfIds}
            isConnected={isConnected}
            onLeave={handleLeave}
            onNightAction={nightAction}
            onCastVote={castVote}
            onAdvanceDay={advanceDay}
            onRestart={restartGame}
            onReturnToLobby={returnToLobby}
            onHostPauseTimer={hostPauseTimer}
            onHostResumeTimer={hostResumeTimer}
            onHostExtendTimer={hostExtendTimer}
            onHostEndPhase={hostEndPhase}
            onHostRestartGame={hostRestartGame}
            onHostReturnToLobby={hostReturnToLobby}
          />
        </main>
      )}

      {/* ── Lobby screen ─────────────────────────────────────────────────────── */}
      {isLobby && (
        <main className="relative flex flex-col" style={{ height: '100dvh' }}>
          <Background phase="lobby" />

          <div className="relative z-10 flex flex-col h-full overflow-hidden">

            {/* ── Top bar ── */}
            <div className="shrink-0 px-3 pt-3 pb-2">
              <RoomHeader
                code={code}
                playerCount={room.players.length}
                maxPlayers={room.maxPlayers}
                minPlayers={room.minPlayers}
                isConnected={isConnected}
                onLeave={handleLeave}
              />
            </div>

            {/* ── Scrollable player grid ── */}
            <div className="flex-1 overflow-y-auto px-3 pb-2 min-h-0">
              {/* Lobby label row */}
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-cinzel text-xs text-amber-600/50 tracking-[0.35em] uppercase">
                  Lobby
                </h2>
                {room.isLocked && (
                  <svg viewBox="0 0 16 16" className="w-3 h-3 text-amber-700/50" fill="currentColor">
                    <path d="M11 7V5a3 3 0 0 0-6 0v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1zm-4-2a1 1 0 0 1 2 0v2H7V5z" />
                  </svg>
                )}
                <span className="ml-auto text-amber-900/50 text-[10px] tracking-wide">
                  {room.isLocked ? 'Room locked' : 'Waiting for players...'}
                </span>
              </div>

              <PlayerGrid
                players={room.players}
                maxPlayers={room.maxPlayers}
                currentPlayerId={playerId ?? ''}
                readyPlayers={room.readyPlayers}
              />

              {error && (
                <div className="mt-3 text-center text-red-400 text-sm bg-red-950/30 border border-red-900/40 rounded px-4 py-2.5">
                  {error}
                </div>
              )}

              {isHost && (
                <div className="mt-3">
                  <HostAdminPanel
                    players={room.players}
                    hostId={room.hostId}
                    isLocked={room.isLocked}
                    onKick={hostKickPlayer}
                    onLock={hostLockRoom}
                    onUnlock={hostUnlockRoom}
                    onResetReady={hostResetReady}
                  />
                </div>
              )}
            </div>

            {/* ── Sticky bottom action bar ── */}
            <div className="shrink-0 px-3 pb-3 pt-1">
              <HostControls
                isHost={isHost}
                canStart={canStart}
                playerCount={room.players.length}
                minPlayers={room.minPlayers}
                readyCount={room.readyPlayers.length}
                isReady={isReady}
                onStartGame={startGame}
                onReady={playerReady}
              />
            </div>

          </div>
        </main>
      )}
    </>
  );
}
