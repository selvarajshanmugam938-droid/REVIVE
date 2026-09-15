import React from 'react';
import { Globe } from 'lucide-react';
import { Language } from '../../types';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  compact = false
}) => {
  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' }
  ];

  if (compact) {
    return (
      <div className="relative inline-flex items-center">
        <select
          value={currentLanguage}
          onChange={(e) => onLanguageChange(e.target.value as Language)}
          className="appearance-none bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-800 font-bold text-xs rounded-full pl-7 pr-6 py-1.5 min-h-[38px] cursor-pointer shadow-2xs transition focus:outline-none focus:ring-1 focus:ring-blue-600"
          aria-label="Select Language"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code} className="text-slate-900 font-medium">
              {lang.native}
            </option>
          ))}
        </select>
        <Globe className="w-3.5 h-3.5 text-blue-700 absolute left-2 pointer-events-none" />
        <div className="absolute right-2 pointer-events-none text-slate-400 text-[9px]">▼</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-white/70 backdrop-blur-md p-1 rounded-2xl border border-[#CDD4DD]/80 shadow-sm">
      {languages.map((lang) => {
        const isActive = currentLanguage === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 flex items-center gap-1.5 ${
              isActive
                ? 'bg-[#22819A] text-white shadow-sm font-semibold'
                : 'text-slate-700 hover:text-[#22819A] hover:bg-[#90C2E7]/15'
            }`}
            aria-pressed={isActive}
          >
            <span>{lang.native}</span>
          </button>
        );
      })}
    </div>
  );
};
