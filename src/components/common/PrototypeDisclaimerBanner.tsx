import React from 'react';
import { Sparkles, Info, Wifi, WifiOff, X, HelpCircle, ShieldCheck } from 'lucide-react';
import { Language } from '../../types';

interface PrototypeDisclaimerBannerProps {
  language?: Language;
  onOpenAbout: () => void;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline?: () => void;
  onToggleSimulateOffline?: () => void;
}

export const PrototypeDisclaimerBanner: React.FC<PrototypeDisclaimerBannerProps> = ({
  language,
  onOpenAbout,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  onToggleSimulateOffline
}) => {
  const handleToggleOffline = onToggleSimulatedOffline || onToggleSimulateOffline || (() => {});
  const [isDismissed, setIsDismissed] = React.useState(false);

  if (isDismissed) return null;

  return (
    <aside
      aria-label="Prototype Demonstration Banner"
      className="bg-gradient-to-r from-slate-900 via-[#1a384c] to-slate-900 text-white px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2 border-b border-slate-700/80 shadow-inner text-xs z-30"
    >
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Left info */}
        <div className="flex items-center gap-2 text-center md:text-left flex-wrap justify-center md:justify-start">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] tracking-wide border border-emerald-500/30 shrink-0">
            <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
            <span>SIH 2026 PROTOTYPE</span>
          </span>
          <span className="text-slate-300 text-[11px] leading-tight">
            Active demonstration environment • Real-time resource grid. Call provider to verify before travel.
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleOffline}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition border ${
              isSimulatedOffline
                ? 'bg-amber-500/30 text-amber-200 border-amber-400/50'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/10'
            }`}
            title="Toggle offline simulated mode to test low-connectivity behavior"
          >
            {isSimulatedOffline ? (
              <>
                <WifiOff className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Offline Simulation: ON</span>
              </>
            ) : (
              <>
                <Wifi className="w-3 h-3 text-slate-300" />
                <span>Simulate Offline</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenAbout}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#22819A]/40 hover:bg-[#22819A]/60 text-cyan-200 border border-cyan-400/30 flex items-center gap-1 transition"
          >
            <HelpCircle className="w-3 h-3" />
            <span>About REVIVE</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
            aria-label="Dismiss prototype notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
