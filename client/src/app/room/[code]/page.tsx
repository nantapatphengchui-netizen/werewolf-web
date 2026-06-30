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
import { AudioProvider } from '@/providers/AudioProvider';
import { AudioControls } from '@/components/ui/AudioControls';

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
  const myRole     = useGameStore(s => s.myRole);
  const werewolfIds = useGameStore(s => s.werewolfIds);

  useEffect(() => {
    if (!isConnected) return;
    const timer = setTimeout(() => {
      if (!room) router.replace('/');
    }, 1500);
    return () => clearTimeout(timer);
  }, [room, isConnected, router]);

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
    <AudioProvider phase={room.phase}>
      {/* Fixed music widget — visible in both lobby and game, below modals */}
      <div className="fixed bottom-4 right-4 z-[45] pointer-events-auto">
        <div className="bg-black/65 backdrop-blur-sm border border-amber-900/30 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-amber-900/50 text-[9px] uppercase tracking-widest font-cinzel hidden sm:inline">
            Music
          </span>
          <AudioControls />
        </div>
      </div>

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
        <main className="relative min-h-screen flex flex-col">
          <Background phase="lobby" />

          <div className="relative z-10 flex flex-col min-h-screen p-4 gap-4">
            <RoomHeader
              code={code}
              playerCount={room.players.length}
              maxPlayers={room.maxPlayers}
              minPlayers={room.minPlayers}
              isConnected={isConnected}
              onLeave={handleLeave}
            />

            <div className="text-center py-2">
              <h2 className="font-cinzel text-2xl text-amber-500/70 tracking-[0.4em] uppercase flex items-center justify-center gap-3">
                Lobby
                {room.isLocked && (
                  <svg viewBox="0 0 16 16" className="w-4 h-4 text-amber-600/60" fill="currentColor">
                    <path d="M11 7V5a3 3 0 0 0-6 0v2H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-1zm-4-2a1 1 0 0 1 2 0v2H7V5z" />
                  </svg>
                )}
              </h2>
              <p className="text-amber-800 text-xs mt-1 tracking-wide">
                {room.isLocked ? 'Room is locked — no new players can join' : 'Waiting for players to join...'}
              </p>
            </div>

            <div className="flex-1">
              <PlayerGrid
                players={room.players}
                maxPlayers={room.maxPlayers}
                currentPlayerId={playerId ?? ''}
                readyPlayers={room.readyPlayers}
              />
            </div>

            {error && (
              <div className="text-center text-red-400 text-sm bg-red-950/30 border border-red-900/40 rounded px-4 py-2.5">
                {error}
              </div>
            )}

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

            {isHost && (
              <HostAdminPanel
                players={room.players}
                hostId={room.hostId}
                isLocked={room.isLocked}
                onKick={hostKickPlayer}
                onLock={hostLockRoom}
                onUnlock={hostUnlockRoom}
                onResetReady={hostResetReady}
              />
            )}
          </div>
        </main>
      )}
    </AudioProvider>
  );
}
