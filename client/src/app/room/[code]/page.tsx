'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRoom } from '@/hooks/useRoom';
import { useGameStore } from '@/store/gameStore';
import { RoomHeader } from '@/components/room/RoomHeader';
import { PlayerGrid } from '@/components/room/PlayerGrid';
import { HostControls } from '@/components/room/HostControls';
import { HostAdminPanel } from '@/components/room/HostAdminPanel';
import { LobbyInfoPanel } from '@/components/room/LobbyInfoPanel';
import { GameView } from '@/components/game/GameView';
import { ConnectionOverlay } from '@/components/game/ConnectionOverlay';
import { useAudioPhaseStore } from '@/store/audioPhaseStore';

const PHASE_TINT: Record<string, string> = {
  lobby:  'bg-black/38',
  night:  'bg-indigo-950/55',
  day:    'bg-amber-950/25',
  voting: 'bg-red-950/35',
  ended:  'bg-black/75',
};

function Background({ phase }: { phase: string }) {
  const tint = PHASE_TINT[phase] ?? 'bg-black/55';
  const imgRef = useRef<HTMLImageElement>(null);

  // Subtle mouse parallax — the village drifts against the cursor for depth.
  // Desktop only, honours prefers-reduced-motion; transform-only via rAF easing.
  useEffect(() => {
    if (
      !window.matchMedia('(pointer: fine)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) return;

    let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
    const step = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      if (imgRef.current) imgRef.current.style.transform = `scale(1.06) translate(${cx.toFixed(2)}px, ${cy.toFixed(2)}px)`;
      raf = (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) ? requestAnimationFrame(step) : 0;
    };
    const onMove = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * -16;
      ty = (e.clientY / window.innerHeight - 0.5) * -10;
      if (!raf) raf = requestAnimationFrame(step);
    };
    window.addEventListener('mousemove', onMove);
    return () => { window.removeEventListener('mousemove', onMove); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imgRef} src="/bg.png" alt="" className="w-full h-full object-cover object-center" draggable={false} style={{ transform: 'scale(1.06)' }} />
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
    hostKickPlayer, hostLockRoom, hostUnlockRoom, hostResetReady, hostUpdateSettings,
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

  const handleLeave = () => {
    leaveRoom();
    router.replace('/');
  };

  // No room yet: either a transient drop (show reconnecting) or the initial load
  // before room_joined arrives (show loading). The effect above redirects home if
  // we're connected but still have no room after a short grace period.
  if (!room) {
    return (
      <>
        <Background phase="lobby" />
        <ConnectionOverlay mode={isConnected ? 'loading' : 'reconnecting'} onLeave={handleLeave} />
      </>
    );
  }

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

            {/* ── Top bar (mobile/tablet — desktop folds this into the info panel) ── */}
            <div className="shrink-0 px-3 pt-3 pb-2 lg:hidden">
              <RoomHeader
                code={code}
                playerCount={room.players.length}
                maxPlayers={room.maxPlayers}
                minPlayers={room.minPlayers}
                isConnected={isConnected}
                onLeave={handleLeave}
              />
            </div>

            {/* ── Body: roster (left) + info panel (right, desktop) ── */}
            <div className="flex-1 min-h-0 px-3 pb-1 lg:pt-3 lg:pb-3 flex flex-col lg:flex-row gap-3 overflow-y-auto lg:overflow-hidden">
              {/* Roster */}
              <div className="flex-1 min-h-0 flex flex-col">
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

              {/* Info panel — full control hub (desktop) */}
              <div className="hidden lg:block shrink-0">
                <LobbyInfoPanel
                  code={code}
                  playerCount={room.players.length}
                  maxPlayers={room.maxPlayers}
                  minPlayers={room.minPlayers}
                  readyCount={room.readyPlayers.length}
                  isConnected={isConnected}
                  onLeave={handleLeave}
                  isHost={isHost}
                  canStart={canStart}
                  isReady={isReady}
                  onReady={playerReady}
                  onStartGame={startGame}
                  players={room.players}
                  hostId={room.hostId}
                  isLocked={room.isLocked}
                  settings={room.settings}
                  onUpdateSettings={isHost ? hostUpdateSettings : undefined}
                  onKick={hostKickPlayer}
                  onLock={hostLockRoom}
                  onUnlock={hostUnlockRoom}
                  onResetReady={hostResetReady}
                  onAddBot={hostAddBot}
                  onFillBots={hostFillBots}
                  onRemoveBots={hostRemoveBots}
                />
              </div>
            </div>

            {/* ── Utility row: Host Tools + Dev Bots (mobile/tablet — desktop uses the panel) ── */}
            <div className="shrink-0 px-3 py-1 lg:hidden">
              <HostAdminPanel
                isHost={isHost}
                players={room.players}
                hostId={room.hostId}
                isLocked={room.isLocked}
                settings={room.settings}
                onUpdateSettings={isHost ? hostUpdateSettings : undefined}
                onKick={hostKickPlayer}
                onLock={hostLockRoom}
                onUnlock={hostUnlockRoom}
                onResetReady={hostResetReady}
                onAddBot={hostAddBot}
                onFillBots={hostFillBots}
                onRemoveBots={hostRemoveBots}
              />
            </div>

            {/* ── Bottom command bar (mobile/tablet — desktop folds this into the info panel) ── */}
            <div className="shrink-0 px-3 pb-3 pt-0 lg:hidden">
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
