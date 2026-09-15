import React from 'react';
import { LayoutGrid, Map, Store, Sparkles, HeartHandshake, Cpu, ShieldCheck } from 'lucide-react';
import { AppMode, Language } from '../../types';
import { getTranslation } from '../../locales';

interface ModeSelectorProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  language: Language;
  className?: string;
  compact?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onModeChange,
  language,
  className = '',
  compact = false
}) => {
  const t = getTranslation(language);

  const modes = [
    {
      id: 'BASIC' as AppMode,
      label: language === 'ta' ? 'எளிய பார்வை' : language === 'hi' ? 'त्वरित पहुंच' : 'Quick Access',
      subtitle: language === 'ta' ? 'அத்தியாவசிய இருப்பு' : language === 'hi' ? 'दவா व बेड' : 'Medicine & Beds',
      icon: LayoutGrid,
      badge: 'Fast',
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
    },
    {
      id: 'ADVANCED' as AppMode,
      label: language === 'ta' ? 'GIS வரைபடம்' : language === 'hi' ? 'जीआईएस मैप' : 'GIS & Telemetry',
      subtitle: language === 'ta' ? 'நேரலை ICU' : language === 'hi' ? 'लाइव आईसीयू' : 'Live Map & IoT',
      icon: Map,
      badge: 'Live',
      badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200/80'
    },
    {
      id: 'HARDWARE' as AppMode,
      label: language === 'ta' ? 'REVIVE Box' : language === 'hi' ? 'रिवाइव बॉक्स' : 'REVIVE Box',
      subtitle: language === 'ta' ? 'ESP32 வாய்ஸ்' : language === 'hi' ? 'ईएसपी32 वॉइस' : 'ESP32 Kiosk',
      icon: Cpu,
      badge: 'Box',
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
    },
    {
      id: 'PHARMACY' as AppMode,
      label: language === 'ta' ? 'மருந்தகம்' : language === 'hi' ? 'फार्मेसी' : 'Pharmacy Desk',
      subtitle: language === 'ta' ? 'மருந்து இருப்பு' : language === 'hi' ? 'स्टॉक अपडेट' : 'Jan Aushadhi',
      icon: Store,
      badge: 'Staff',
      badgeColor: 'bg-teal-50 text-teal-700 border border-teal-200/80'
    },
    {
      id: 'HOSPITAL' as AppMode,
      label: language === 'ta' ? 'மருத்துவமனை' : language === 'hi' ? 'अस्पताल' : 'Hospital Desk',
      subtitle: language === 'ta' ? 'உறுப்பு & இரத்தம்' : language === 'hi' ? 'अंग व रक्त' : 'Organs & Blood',
      icon: HeartHandshake,
      badge: 'Organs',
      badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200/80'
    },
    {
      id: 'ADMIN' as AppMode,
      label: language === 'ta' ? 'நிர்வாகம்' : language === 'hi' ? 'प्रशासन' : 'Admin Desk',
      subtitle: language === 'ta' ? 'தணிக்கை & அளவீடு' : language === 'hi' ? 'ऑडिट व नियंत्रण' : 'Audit & Metrics',
      icon: ShieldCheck,
      badge: 'Admin',
      badgeColor: 'bg-purple-50 text-purple-700 border border-purple-200/80'
    }
  ];

  if (compact) {
    return (
      <div
        role="tablist"
        aria-label="Application View Modes"
        className={`flex items-center p-1 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xs w-full overflow-x-auto no-scrollbar ${className}`}
      >
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onModeChange(m.id)}
              className={`flex-1 min-w-[85px] sm:min-w-0 flex items-center justify-center gap-1.5 py-2 px-2.5 min-h-[44px] rounded-xl font-bold text-xs transition-all duration-150 shrink-0 ${
                isActive
                  ? 'bg-blue-700 text-white shadow-sm font-extrabold'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100/70'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span className="truncate">{m.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-0.5 px-0.5 flex sm:justify-center">
      <nav
        role="tablist"
        aria-label="Application View Modes"
        className={`inline-flex items-center gap-1 p-1 sm:p-1.5 bg-white/95 backdrop-blur-xl rounded-full border border-slate-200/90 shadow-md shadow-blue-950/5 shrink-0 ${className}`}
      >
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = currentMode === m.id;

          return (
            <button
              key={m.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onModeChange(m.id)}
              className={`group relative flex items-center gap-1 sm:gap-1.5 lg:gap-2 px-2.5 sm:px-3 lg:px-3.5 py-1.5 min-h-[38px] sm:min-h-[40px] rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-blue-700 text-white shadow-md shadow-blue-700/25 ring-1 ring-blue-600'
                  : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50/60 bg-transparent'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
              }`}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
              </div>

              <div className="text-left hidden md:block">
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className={`font-bold ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {m.label}
                  </span>
                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white border border-white/30' : m.badgeColor
                  }`}>
                    {m.badge}
                  </span>
                </div>
                <span className={`text-[10px] hidden xl:block leading-tight ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                  {m.subtitle}
                </span>
              </div>

              {/* Mobile and tablet visible label */}
              <span className="md:hidden font-bold text-xs">
                {m.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
