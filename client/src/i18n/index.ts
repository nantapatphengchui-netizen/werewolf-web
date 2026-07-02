'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { th } from './th';
import { en } from './en';

export type Lang = 'th' | 'en';

const DICTS: Record<Lang, Record<string, string>> = { th, en };

// Module-level translate — reads lang from store at call time
export function t(
  key: string,
  params?: Record<string, string | number>,
  lang?: Lang,
): string {
  const activeLang = lang ?? (useLangStore.getState().lang as Lang);
  const dict = DICTS[activeLang];
  let str = dict[key] ?? en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{{${k}}}`, String(v));
    }
  }
  return str;
}

// ── Zustand store with localStorage persistence ───────────────────────────────

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: 'th' as Lang,
      setLang: (lang) => set({ lang }),
    }),
    { name: 'ww_lang' },
  ),
);

// ── React hook — re-renders on lang change ────────────────────────────────────

export function useT() {
  const lang = useLangStore((s) => s.lang);
  return (key: string, params?: Record<string, string | number>) =>
    t(key, params, lang);
}

// ── Server-generated messages (event log / announcements) ─────────────────────
// A param named `role` holds a Role key and is translated to its localized name.

export function formatMessage(
  msg: { code: string; params?: Record<string, string | number> } | null | undefined,
  lang?: Lang,
): string {
  if (!msg) return '';
  let params = msg.params;
  if (params && typeof params.role === 'string') {
    params = { ...params, role: t(`role.${params.role}.name`, undefined, lang) };
  }
  return t(msg.code, params, lang);
}

export function useMessage() {
  const lang = useLangStore((s) => s.lang);
  return (msg: { code: string; params?: Record<string, string | number> } | null | undefined) =>
    formatMessage(msg, lang);
}
