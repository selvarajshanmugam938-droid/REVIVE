import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutGrid,
  Map,
  ShieldAlert,
  Mic,
  MoreHorizontal,
  Store,
  HeartHandshake,
  ShieldCheck,
  Cpu,
  User,
  X
} from 'lucide-react';
import { AppMode, Language } from '../../types';
import { getTranslation } from '../../locales';

interface MobileBottomBarProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onOpenVoice: () => void;
  onOpenEmergency: () => void;
  language: Language;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  currentMode,
  onModeChange,
  onOpenVoice,
  onOpenEmergency,
  language
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const t = getTranslation(language);

  // Close sheet on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreMenuOpen]);

  const isStaffMode = ['PHARMACY', 'HOSPITAL', 'ADMIN', 'HARDWARE'].includes(currentMode);

  return (
    <>
      {/* Mobile More Modes Bottom Sheet */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150">
          <div
            ref={moreMenuRef}
            className="w-full bg-white rounded-t-3xl border-t border-slate-200 p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Healthcare Desks & Tools</h3>
                <p className="text-[11px] text-slate-500">Specialized portals & telemetry hardware</p>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  onModeChange('HARDWARE');
                  setIsMoreMenuOpen(false);
                }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col gap-2 ${
                  currentMode === 'HARDWARE'
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Cpu className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">REVIVE Box</span>
                  <span className="text-[10px] text-slate-500">ESP32 Offline Kiosk</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onModeChange('PHARMACY');
                  setIsMoreMenuOpen(false);
                }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col gap-2 ${
                  currentMode === 'PHARMACY'
                    ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <Store className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Pharmacy Desk</span>
                  <span className="text-[10px] text-slate-500">Stock updates</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onModeChange('HOSPITAL');
                  setIsMoreMenuOpen(false);
                }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col gap-2 ${
                  currentMode === 'HOSPITAL'
                    ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                  <HeartHandshake className="w-4 h-4 text-rose-700" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Hospital Desk</span>
                  <span className="text-[10px] text-slate-500">Organs & Blood</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onModeChange('ADMIN');
                  setIsMoreMenuOpen(false);
                }}
                className={`p-3 rounded-2xl border text-left transition flex flex-col gap-2 ${
                  currentMode === 'ADMIN'
                    ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/20'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4 text-purple-700" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block">Admin Portal</span>
                  <span className="text-[10px] text-slate-500">Audits & Reports</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Fixed Bottom App Bar */}
      <nav
        aria-label="Mobile Navigation Bar"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-2xl px-2 py-1 safe-area-bottom transition-all"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 items-center">
          {/* Tab 1: Quick Access (Basic Dashboard) */}
          <button
            onClick={() => onModeChange('BASIC')}
            className={`flex flex-col items-center justify-center py-1 min-h-[48px] rounded-xl transition ${
              currentMode === 'BASIC'
                ? 'text-blue-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className={`p-1 rounded-full transition ${currentMode === 'BASIC' ? 'bg-blue-100 text-blue-700' : ''}`}>
              <LayoutGrid className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight mt-0.5 truncate">
              {language === 'ta' ? 'அணுகல்' : language === 'hi' ? 'सुविधाएं' : 'Access'}
            </span>
          </button>

          {/* Tab 2: GIS Map */}
          <button
            onClick={() => onModeChange('ADVANCED')}
            className={`flex flex-col items-center justify-center py-1 min-h-[48px] rounded-xl transition ${
              currentMode === 'ADVANCED'
                ? 'text-blue-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className={`p-1 rounded-full transition ${currentMode === 'ADVANCED' ? 'bg-blue-100 text-blue-700' : ''}`}>
              <Map className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight mt-0.5 truncate">
              {language === 'ta' ? 'வரைபடம்' : language === 'hi' ? 'मैप' : 'GIS Map'}
            </span>
          </button>

          {/* Tab 3: Raised Emergency 108 Action Orb */}
          <div className="flex flex-col items-center justify-center -mt-5">
            <button
              onClick={onOpenEmergency}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-red-700 to-rose-500 hover:from-red-800 hover:to-rose-600 text-white flex flex-col items-center justify-center shadow-lg shadow-rose-600/40 border-2 border-white active:scale-95 transition"
              aria-label="Emergency 108 Dispatch"
            >
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              <span className="text-[9px] font-black tracking-tighter leading-none mt-0.5">108</span>
            </button>
            <span className="text-[9px] font-extrabold text-rose-600 leading-none mt-1">
              SOS
            </span>
          </div>

          {/* Tab 4: Voice AI Consultation */}
          <button
            onClick={onOpenVoice}
            className="flex flex-col items-center justify-center py-1 min-h-[48px] rounded-xl text-slate-500 hover:text-blue-700 font-medium transition"
          >
            <div className="p-1 rounded-full bg-blue-50 text-blue-700">
              <Mic className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight mt-0.5 truncate">
              {language === 'ta' ? 'குரல் AI' : language === 'hi' ? 'आवाज' : 'Voice AI'}
            </span>
          </button>

          {/* Tab 5: Desks & Tools */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center py-1 min-h-[48px] rounded-xl transition ${
              isStaffMode
                ? 'text-purple-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className={`p-1 rounded-full transition ${isStaffMode ? 'bg-purple-100 text-purple-700' : ''}`}>
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-tight mt-0.5 truncate">
              {isStaffMode ? currentMode : 'Desks'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
