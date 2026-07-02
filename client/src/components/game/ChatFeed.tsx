'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import type { ChatMessage } from '@/store/gameStore';
import type { GameEvent } from '@/types/game';
import { useT, useMessage } from '@/i18n';

interface Props {
  messages: ChatMessage[];
  events: GameEvent[];
  playerId: string;
  canChat: boolean;
  wolfMode: boolean;
  disabledReason: string;
  onSend: (text: string) => void;
  onClose?: () => void; // present only in the mobile drawer
}

type FeedItem =
  | { kind: 'log'; ts: number; ev: GameEvent }
  | { kind: 'chat'; ts: number; msg: ChatMessage };

export function ChatFeed({ messages, events, playerId, canChat, wolfMode, disabledReason, onSend, onClose }: Props) {
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

  const accent = wolfMode ? '#ef4444' : '#d97706';

  return (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg, rgba(11,9,6,0.98) 0%, rgba(3,4,6,0.98) 55%, rgba(6,5,10,0.98) 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${accent}33` }}>
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke={accent} strokeWidth="1.6">
            <path d="M17 9.5a6.5 6.5 0 0 1-9.3 5.9L3 16.5l1.2-4.4A6.5 6.5 0 1 1 17 9.5z" strokeLinejoin="round" />
          </svg>
          <p className="font-cinzel text-[11px] uppercase tracking-widest" style={{ color: accent }}>
            {wolfMode ? T('chat.wolfTitle') : T('chat.title')}
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
      <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-1.5">
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
            const nameColor = isWolf ? '#f87171' : '#fbbf24';
            return (
              <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1 px-1">
                  {isWolf && <span className="text-[9px]">🐺</span>}
                  <span className="text-[9px] font-cinzel font-bold uppercase tracking-wide" style={{ color: nameColor }}>
                    {mine ? T('chat.you') : m.senderName}
                  </span>
                </div>
                <div
                  className="max-w-[85%] px-2.5 py-1.5 rounded-lg text-[12px] font-medium leading-snug break-words"
                  style={{
                    backgroundColor: isWolf ? 'rgba(80,10,10,0.55)' : mine ? 'rgba(120,53,0,0.55)' : 'rgba(30,26,20,0.9)',
                    border: `1px solid ${isWolf ? 'rgba(185,28,28,0.4)' : 'rgba(120,65,10,0.35)'}`,
                    color: '#f5e6c8',
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

      {/* Input */}
      <div className="shrink-0 p-2.5" style={{ borderTop: `1px solid ${accent}33` }}>
        {canChat ? (
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
              maxLength={300}
              placeholder={wolfMode ? T('chat.placeholderWolf') : T('chat.placeholder')}
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
