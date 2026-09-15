import React from 'react';
import { PhoneCall, AlertTriangle, X, Hospital, MapPin, ShieldAlert, HeartPulse } from 'lucide-react';
import { Hospital as HospitalType, Language } from '../../types';
import { getTranslation } from '../../locales';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  hospitals: HospitalType[];
  userDistrict: string;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  language,
  hospitals,
  userDistrict
}) => {
  const t = getTranslation(language);

  if (!isOpen) return null;

  // Filter emergency-equipped hospitals
  const emergencyHospitals = hospitals
    .filter(h => h.beds.some(b => b.category === 'EMERGENCY' || b.category === 'ICU'))
    .slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#FEF7F8] rounded-3xl border-2 border-red-500/40 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="emergency-title"
      >
        {/* Urgent Header Banner */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-4 sm:p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl animate-pulse">
              <ShieldAlert className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 id="emergency-title" className="text-xl sm:text-2xl font-black tracking-tight">
                {t.emergencyHelp}
              </h2>
              <p className="text-xs sm:text-sm text-red-100 font-medium">
                {t.emergencySubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close emergency modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Quick Dial Helplines Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 108 Ambulance */}
            <a
              href="tel:108"
              className="flex flex-col items-center justify-center p-4 bg-red-50 border-2 border-red-300 hover:border-red-500 rounded-2xl shadow-sm text-center group transition active:scale-98 min-h-[88px]"
            >
              <div className="flex items-center gap-2 text-red-700 font-black text-2xl group-hover:scale-105 transition">
                <PhoneCall className="w-6 h-6 animate-bounce" />
                <span>108</span>
              </div>
              <span className="text-xs font-bold text-red-800 mt-1">{t.call108}</span>
              <span className="text-[11px] text-red-600 font-medium">Free Emergency Transit</span>
            </a>

            {/* 104 Medical Advice */}
            <a
              href="tel:104"
              className="flex flex-col items-center justify-center p-4 bg-teal-50 border-2 border-teal-300 hover:border-[#22819A] rounded-2xl shadow-sm text-center group transition active:scale-98 min-h-[88px]"
            >
              <div className="flex items-center gap-2 text-[#22819A] font-black text-2xl group-hover:scale-105 transition">
                <HeartPulse className="w-6 h-6" />
                <span>104</span>
              </div>
              <span className="text-xs font-bold text-[#22819A] mt-1">{t.call104}</span>
              <span className="text-[11px] text-teal-700 font-medium">Doctor on Call 24x7</span>
            </a>

            {/* 112 National Emergency */}
            <a
              href="tel:112"
              className="flex flex-col items-center justify-center p-4 bg-blue-50 border-2 border-blue-300 hover:border-blue-500 rounded-2xl shadow-sm text-center group transition active:scale-98 min-h-[88px]"
            >
              <div className="flex items-center gap-2 text-blue-700 font-black text-2xl group-hover:scale-105 transition">
                <ShieldAlert className="w-6 h-6" />
                <span>112</span>
              </div>
              <span className="text-xs font-bold text-blue-900 mt-1">{t.call112}</span>
              <span className="text-[11px] text-blue-600 font-medium">Police / Fire / Health</span>
            </a>
          </div>

          {/* Warning Note */}
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="font-medium">
              In severe conditions like chest pain, uncontrolled bleeding, snake bites, or head injuries, stay calm and dial <strong>108</strong> immediately for an equipped life-support ambulance.
            </p>
          </div>

          {/* Nearest Emergency Hospitals */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Hospital className="w-4 h-4 text-red-600" />
                <span>{t.nearestCasualty} ({userDistrict})</span>
              </h3>
            </div>

            <div className="space-y-3">
              {emergencyHospitals.map((hosp) => {
                const casualtyBed = hosp.beds.find(b => b.category === 'EMERGENCY');
                const icuBed = hosp.beds.find(b => b.category === 'ICU');

                return (
                  <div
                    key={hosp.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">{hosp.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                          24x7 Trauma
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{hosp.address} ({hosp.distanceKm || 3.2} km)</span>
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs font-semibold">
                        {casualtyBed && (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            Casualty: {casualtyBed.availableBeds} beds free
                          </span>
                        )}
                        {icuBed && (
                          <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                            ICU: {icuBed.availableBeds} beds free
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${hosp.emergencyPhone || hosp.phone}`}
                        className="px-4 py-2 min-h-[44px] bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition active:scale-95"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Call Emergency</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 min-h-[44px] bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm rounded-xl transition shadow"
          >
            Close Emergency Panel
          </button>
        </div>
      </div>
    </div>
  );
};
