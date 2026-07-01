'use client';

import { useLangStore, type Lang } from '@/i18n';

export function LangToggle() {
  const { lang, setLang } = useLangStore();
  const next: Lang = lang === 'th' ? 'en' : 'th';

  return (
    <button
      onClick={() => setLang(next)}
      title={next.toUpperCase()}
      className="px-2 py-1 text-[10px] font-cinzel tracking-widest uppercase rounded transition-colors"
      style={{
        border: '1px solid rgba(120,65,10,0.45)',
        color: '#d97706',
        backgroundColor: 'rgba(12,8,3,0.60)',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = '#fbbf24')}
      onMouseLeave={e => (e.currentTarget.style.color = '#d97706')}
    >
      {lang === 'th' ? 'EN' : 'TH'}
    </button>
  );
}
