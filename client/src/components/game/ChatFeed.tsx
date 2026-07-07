'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { ChatMessage } from '@/store/gameStore';
import type { GameEvent } from '@/types/game';
import { useT, useMessage } from '@/i18n';

const REACTIONS = ['shock', 'wolf', 'eyes', 'knife', 'pray', 'laugh'] as const;

interface Props {
  messages: ChatMessage[];
  events: GameEvent[];
  playerId: string;
  canChat: boolean;
  wolfMode: boolean;
  deadMode?: boolean;
  disabledReason: string;
  onSend: (text: string) => void;
  showReactions?: boolean;
  onReact?: (emoji: string) => void;
  onClose?: () => void; // present only in the mobile drawer
}

type FeedItem =
  | { kind: 'log'; ts: number; ev: GameEvent }
  | { kind: 'chat'; ts: number; msg: ChatMessage };

export function ChatFeed({ messages, events, playerId, canChat, wolfMode, deadMode = false, disabledReason, onSend, showReactions, onReact, onClose }: Props) {
  const T = useT();
  const M = useMessage();
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [
      ...events.map(e => ({ kind: 'log' as const, ts: e.timestamp, ev: e })),
      ...messages.map(m => ({ kind: 'chat' as const, ts: m.timestamp, msg: m })),
    ];
    items.sort((a, b) => a.ts - b.ts);
    return items;
  }, [events, messages]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [feed.length]);

  const submit = () => {
    const text = draft.trim();
    if (!text || !canChat) return;
    onSend(text);
    setDraft('');
  };

  const accent = deadMode ? '#94a3b8' : wolfMode ? '#ef4444' : '#d97706';

  return (
    <div className="flex flex-col h-full relative" style={{ background: 'linear-gradient(180deg, rgba(11,9,6,0.98) 0%, rgba(3,4,6,0.98) 55%, rgba(6,5,10,0.98) 100%)' }}>
      {/* Watermark — clawed moon emblem grounding the empty space (behind the feed) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
        <svg viewBox="0 0 120 120" style={{ width: 150, height: 150, opacity: 0.06, transition: 'stroke 0.5s' }} fill="none" stroke={accent} strokeLinecap="round">
          <circle cx="60" cy="60" r="43" strokeWidth="2" />
          <circle cx="60" cy="60" r="36" strokeWidth="0.75" opacity="0.6" />
          <path d="M40 26 Q56 60 46 96" strokeWidth="3.5" />
          <path d="M58 20 Q70 60 62 101" strokeWidth="3.5" />
          <path d="M76 27 Q86 60 80 94" strokeWidth="3.5" />
        </svg>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${accent}33` }}>
        <div className="flex items-center gap-2">
          {deadMode ? (
            /* Tombstone — graveyard channel */
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 16V8.5a5 5 0 0 1 10 0V16" />
              <path d="M3.5 16.5h13" />
              <path d="M10 7.5v4M8.3 9h3.4" />
            </svg>
          ) : wolfMode ? (
            /* Paw print — the wolves' private channel */
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill={accent}>
              <ellipse cx="10" cy="13" rx="3.4" ry="3" />
              <ellipse cx="5.2" cy="9.4" rx="1.5" ry="1.9" transform="rotate(-18 5.2 9.4)" />
              <ellipse cx="8.3" cy="6.6" rx="1.5" ry="2" transform="rotate(-6 8.3 6.6)" />
              <ellipse cx="11.7" cy="6.6" rx="1.5" ry="2" transform="rotate(6 11.7 6.6)" />
              <ellipse cx="14.8" cy="9.4" rx="1.5" ry="1.9" transform="rotate(18 14.8 9.4)" />
            </svg>
          ) : (
            /* Village houses — public square */
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 9.5 7 5l4.5 4.5" />
              <path d="M4 9v7h6V9" />
              <path d="M10.5 16h6v-5" />
              <path d="M11 8.5 14 6l3.5 3" />
              <path d="M6.2 16v-3h1.6v3" />
            </svg>
          )}
          <p className="font-cinzel text-[11px] uppercase tracking-widest" style={{ color: accent }}>
            {deadMode ? T('chat.deadTitle') : wolfMode ? T('chat.wolfTitle') : T('chat.title')}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xl leading-none w-6 h-6 flex items-center justify-center"
            style={{ color: '#92400e' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fbbf24')}
            onMouseLeave={e => (e.currentTarget.style.color = '#92400e')}
          >×</button>
        )}
      </div>

      {/* Combined feed: system log + player chat */}
      <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-1.5 relative" style={{ zIndex: 1 }}>
        {feed.length === 0 ? (
          <p className="text-center text-[11px] italic mt-6" style={{ color: '#57534e' }}>{T('chat.empty')}</p>
        ) : (
          feed.map(item => {
            // ── System / event log line — muted, italic, centered ──
            if (item.kind === 'log') {
              return (
                <div key={item.ev.id} className="flex items-center gap-2 py-0.5">
                  <span className="h-px flex-1" style={{ backgroundColor: 'rgba(120,65,10,0.18)' }} />
                  <span
                    className="text-[10px] italic font-cinzel tracking-wide text-center shrink-0 max-w-[80%] truncate"
                    style={{ color: 'rgba(168,138,80,0.72)' }}
                  >
                    {M(item.ev)}
                  </span>
                  <span className="h-px flex-1" style={{ backgroundColor: 'rgba(120,65,10,0.18)' }} />
                </div>
              );
            }
            // ── Player chat message — bold name, coloured, bubble ──
            const m = item.msg;
            const mine = m.senderId === playerId;
            const isWolf = m.channel === 'wolf';
            const isDead = m.channel === 'dead';
            const nameColor = isDead ? '#94a3b8' : isWolf ? '#f87171' : '#fbbf24';
            return (
              <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1 px-1">
                  {isDead && <span className="text-[9px]">🪦</span>}
                  {isWolf && <span className="text-[9px]">🐺</span>}
                  <span className="text-[9px] font-cinzel font-bold uppercase tracking-wide" style={{ color: nameColor }}>
                    {mine ? T('chat.you') : m.senderName}
                  </span>
                </div>
                <div
                  className="max-w-[85%] px-2.5 py-1.5 rounded-lg text-[12px] font-medium leading-snug break-words"
                  style={{
                    backgroundColor: isDead ? 'rgba(42,46,54,0.6)' : isWolf ? 'rgba(80,10,10,0.55)' : mine ? 'rgba(120,53,0,0.55)' : 'rgba(30,26,20,0.9)',
                    border: `1px solid ${isDead ? 'rgba(100,116,139,0.4)' : isWolf ? 'rgba(185,28,28,0.4)' : 'rgba(120,65,10,0.35)'}`,
                    color: isDead ? '#cbd5e1' : '#f5e6c8',
                    fontStyle: isDead ? 'italic' : undefined,
                  }}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Emoji reactions */}
      {showReactions && onReact && (
        <div className="shrink-0 flex justify-center gap-1.5 px-2.5 pt-2" style={{ borderTop: `1px solid ${accent}22` }}>
          {REACTIONS.map(key => (
            <button
              key={key}
              onClick={() => onReact(key)}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 hover:scale-125 active:scale-[0.88] overflow-hidden"
              style={{ backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(120,65,10,0.28)' }}
            >
              <img src={`/emoji-${key}.png`} alt={key} className="w-6 h-6 object-contain" draggable={false} />
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 p-2.5" style={showReactions && onReact ? undefined : { borderTop: `1px solid ${accent}33` }}>
        {canChat ? (
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
              maxLength={300}
              placeholder={deadMode ? T('chat.placeholderDead') : wolfMode ? T('chat.placeholderWolf') : T('chat.placeholder')}
              className="flex-1 min-w-0 bg-black/50 rounded-lg px-3 py-2 outline-none text-[12px]"
              style={{ border: `1px solid ${accent}44`, color: '#f5e6c8' }}
            />
            <button
              onClick={submit}
              disabled={!draft.trim()}
              className="shrink-0 px-3 py-2 rounded-lg text-[11px] font-cinzel uppercase tracking-wide transition-all duration-150 hover:brightness-110 active:scale-[0.96] disabled:opacity-40"
              style={{ backgroundColor: `${accent}cc`, border: `1px solid ${accent}`, color: '#0d0a06' }}
            >
              {T('chat.send')}
            </button>
          </div>
        ) : (
          <p className="text-center text-[11px] italic py-2" style={{ color: '#57534e' }}>
            {disabledReason}
          </p>
        )}
      </div>
    </div>
  );
}
