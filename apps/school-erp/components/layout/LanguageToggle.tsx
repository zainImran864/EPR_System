'use client';

import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguageStore } from '@/app/store/useLanguageStore';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguageStore();

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm active:scale-95"
      title={language === 'en' ? 'Switch to Urdu (اردو)' : 'Switch to English'}
    >
      <Languages className="w-3.5 h-3.5 text-brand-gold" />
      <span>{language === 'en' ? 'اردو' : 'English'}</span>
    </button>
  );
}
