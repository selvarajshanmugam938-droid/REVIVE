import React from 'react';
import { Activity, ShieldAlert, Pill, Hospital, Droplet, PhoneCall } from 'lucide-react';
import { Language } from '../../types';

interface LiveTelemetryBarProps {
  language: Language;
  onOpenVoice: () => void;
  onOpenEmergency: () => void;
  userDistrict: string;
}

export const LiveTelemetryBar: React.FC<LiveTelemetryBarProps> = ({
  language,
  onOpenVoice,
  onOpenEmergency,
  userDistrict
}) => {
  const getLabel = () => {
    if (language === 'ta') {
      return {
        liveMesh: 'நேரலை சுகாதார கண்காணிப்பு',
        ambulanceStatus: '108 ஆம்புலன்ஸ்: 24/7 தயாராக உள்ளது',
        icuStatus: 'அரசு மருத்துவமனை: 18 ICU படுக்கைகள் தயார்',
        medStatus: 'அத்தியாவசிய மருந்துகள்: 98% இருப்பில் உள்ளது',
        bloodStatus: 'இரத்த வங்கி: 124 அலகுகள் தயார்',
        voiceAction: 'குரல் உதவி',
        emergencyAction: 'அவசர அழைப்பு 108'
      };
    }
    if (language === 'hi') {
      return {
        liveMesh: 'लाइव ग्रामीण स्वास्थ्य ग्रिड',
        ambulanceStatus: '108 एम्बुलेंस: 24/7 तैयार',
        icuStatus: 'सरकारी अस्पताल: 18 आईसीयू बेड उपलब्ध',
        medStatus: 'आवश्यक दवाइयाँ: 98% स्टॉक में',
        bloodStatus: 'ब्लड बैंक: 124 यूनिट उपलब्ध',
        voiceAction: 'आवाज सहायक',
        emergencyAction: 'आपातकालीन 108'
      };
    }
    return {
      liveMesh: 'LIVE RURAL HEALTH GRID',
      ambulanceStatus: '108 Ambulance: Active (ETA ~11 mins)',
      icuStatus: 'District GH: 18 ICU Beds Ready',
      medStatus: 'Vital Medicines: 98% In-Stock Nearby',
      bloodStatus: 'Blood Reserves: 124 Units Verified',
      voiceAction: 'Voice AI Guide',
      emergencyAction: 'Emergency 108'
    };
  };

  const labels = getLabel();

  return (
    <div className="w-full bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 text-white border-b border-blue-700/30 shadow-xs overflow-hidden">
      <div className="w-full px-3 sm:px-6 lg:px-8 py-1.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        {/* Left: Live Pulse Status */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute opacity-75" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 relative z-10" />
          </div>
          <span className="font-extrabold tracking-wider text-[11px] text-emerald-300 uppercase">
            {labels.liveMesh} • {userDistrict}
          </span>
          <span className="hidden md:inline text-white/30">|</span>
        </div>

        {/* Center: Live Ticker Badges */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-0.5 max-w-full text-[11px] text-slate-200">
          <div className="flex items-center gap-1.5 shrink-0 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium">{labels.ambulanceStatus}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
            <Hospital className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="font-medium">{labels.icuStatus}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
            <Pill className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-medium">{labels.medStatus}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
            <Droplet className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="font-medium">{labels.bloodStatus}</span>
          </div>
        </div>

        {/* Right: Quick SOS Call */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenEmergency}
            className="flex items-center gap-1 text-[11px] font-bold text-rose-300 hover:text-rose-100 bg-rose-950/70 hover:bg-rose-900/90 px-2.5 py-1 rounded-full border border-rose-500/40 transition"
          >
            <PhoneCall className="w-3 h-3 text-rose-400" />
            <span>{labels.emergencyAction}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
