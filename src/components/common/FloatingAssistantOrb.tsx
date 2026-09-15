import React, { useState } from 'react';
import { Sparkles, Mic, PhoneCall, Bot, X, ArrowUpRight, Activity, Cpu } from 'lucide-react';

interface FloatingAssistantOrbProps {
  onOpenVoice: () => void;
  onOpenEmergency: () => void;
  onOpenSearch: () => void;
  onOpenHardware?: () => void;
}

export const FloatingAssistantOrb: React.FC<FloatingAssistantOrbProps> = ({
  onOpenVoice,
  onOpenEmergency,
  onOpenSearch,
  onOpenHardware
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end pointer-events-auto select-none">
      {/* Expanded Quick Action Capsule */}
      {isOpen && (
        <div className="mb-3 p-4 bg-white/95 backdrop-blur-xl border border-white/80 rounded-3xl shadow-2xl shadow-blue-900/15 max-w-xs w-72 space-y-3 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-700 to-emerald-500 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Virtual Health Assistant</h4>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  AI Active
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenVoice();
              }}
              className="w-full p-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 flex items-center justify-between text-xs font-bold transition group"
            >
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-blue-600 group-hover:scale-110 transition" />
                <span>Voice Consultation</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSearch();
              }}
              className="w-full p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center justify-between text-xs font-bold transition group"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
                <span>Check Medicines & Stock</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {onOpenHardware && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenHardware();
                }}
                className="w-full p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 flex items-center justify-between text-xs font-bold transition group"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
                  <span>REVIVE Box (Hardware Mode)</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenEmergency();
              }}
              className="w-full p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 flex items-center justify-between text-xs font-bold transition group"
            >
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-rose-600 group-hover:scale-110 transition" />
                <span>Emergency 108 SOS</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
            </button>
          </div>
        </div>
      )}

      {/* Floating 3D Health Orb Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="group relative flex items-center gap-2.5 p-2 pr-3.5 bg-white/90 hover:bg-white text-slate-800 backdrop-blur-xl rounded-full border border-white/90 shadow-xl shadow-blue-900/15 hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
        title="Virtual Health Assistant Companion"
      >
        {/* Luminous Pulsating 3D Orb Graphic */}
        <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-blue-700/30 overflow-hidden">
          {/* Inner Light Flare */}
          <div className="absolute top-1 left-1.5 w-3.5 h-2 rounded-full bg-white/60 blur-[1px]" />
          <Sparkles className="w-5 h-5 text-white animate-spin [animation-duration:8s]" />
          <div className="absolute inset-0 rounded-full border border-white/40" />
        </div>

        <div className="text-left">
          <span className="block text-[11px] font-black text-slate-900 tracking-tight leading-none">
            Health Assistant
          </span>
          <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5 leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            AI Online
          </span>
        </div>
      </button>
    </div>
  );
};
