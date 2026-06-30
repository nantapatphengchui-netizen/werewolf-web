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
    hostAddBot, hostFillBots, hostRemoveBots,
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
        <main className="relative flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
          <Background phase="lobby" />

          <div className="relative z-10 flex flex-col h-full">

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

            {/* ── Player grid ── */}
            <div className="flex-1 min-h-0 px-3 pb-1 flex flex-col overflow-y-auto lg:overflow-hidden">
              <div className="flex-1 min-h-0">
                <PlayerGrid
                  players={room.players}
                  maxPlayers={room.maxPlayers}
                  currentPlayerId={playerId ?? ''}
                  readyPlayers={room.readyPlayers}
                />
              </div>

              {error && (
                <div className="shrink-0 mt-2 text-center text-red-400 text-sm bg-red-950/30 border border-red-900/40 rounded px-4 py-2.5">
                  {error}
                </div>
              )}
            </div>

            {/* ── Bottom action bar ──
                HostAdminPanel floats above the bar on desktop (absolute bottom-full left-0).
                On mobile it sits above HostControls in normal flow. ── */}
            <div className="shrink-0 pl-3 pr-24 pb-3 pt-1 relative">
              {isHost && (
                <div className="mb-2 lg:mb-0 lg:absolute lg:left-0 lg:bottom-full lg:pb-1.5 lg:w-64">
                  <HostAdminPanel
                    players={room.players}
                    hostId={room.hostId}
                    isLocked={room.isLocked}
                    onKick={hostKickPlayer}
                    onLock={hostLockRoom}
                    onUnlock={hostUnlockRoom}
                    onResetReady={hostResetReady}
                    onAddBot={hostAddBot}
                    onFillBots={hostFillBots}
                    onRemoveBots={hostRemoveBots}
                  />
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
            </div>

          </div>
        </main>
      )}
    </>
  );
}
