import React, { useState } from 'react';
import { Hospital, Language } from '../../types';
import { getTranslation } from '../../locales';
import { Scale, Check, X, PhoneCall, Navigation, MapPin } from 'lucide-react';

interface FacilityComparatorProps {
  language: Language;
  hospitals: Hospital[];
}

export const FacilityComparator: React.FC<FacilityComparatorProps> = ({
  language,
  hospitals
}) => {
  const t = getTranslation(language);
  const [selectedHospIds, setSelectedHospIds] = useState<string[]>(
    hospitals.slice(0, 2).map(h => h.id)
  );

  const toggleSelect = (id: string) => {
    if (selectedHospIds.includes(id)) {
      if (selectedHospIds.length > 1) {
        setSelectedHospIds(selectedHospIds.filter(item => item !== id));
      }
    } else {
      if (selectedHospIds.length < 3) {
        setSelectedHospIds([...selectedHospIds, id]);
      } else {
        setSelectedHospIds([selectedHospIds[1], selectedHospIds[2], id]);
      }
    }
  };

  const comparedHospitals = hospitals.filter(h => selectedHospIds.includes(h.id));

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-white/90 backdrop-blur-md rounded-3xl border border-[#CDD4DD]/80 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-sky-100 text-sky-700 rounded-2xl">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {t.facilityComparator}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Compare bed counts, emergency capabilities, and transit distances
            </p>
          </div>
        </div>

        {/* Hospital Selector Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {hospitals.map((h) => {
            const isSelected = selectedHospIds.includes(h.id);
            return (
              <button
                key={h.id}
                onClick={() => toggleSelect(h.id)}
                className={`px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#22819A] text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                <span className="truncate max-w-[160px]">{h.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Grid Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {comparedHospitals.map((hosp) => {
          const totalAvailable = hosp.beds.reduce((a, b) => a + b.availableBeds, 0);
          const icuBed = hosp.beds.find(b => b.category === 'ICU');
          const emergencyBed = hosp.beds.find(b => b.category === 'EMERGENCY');
          const oxygenBed = hosp.beds.find(b => b.category === 'OXYGEN_SUPPORTED');

          return (
            <div
              key={hosp.id}
              className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-[#22819A]/40 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      {hosp.type}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1.5">{hosp.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{hosp.distanceKm} km from user</span>
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-2.5 pt-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Total Available Beds</span>
                    <span className="font-black text-emerald-600 text-sm">{totalAvailable} Beds</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">ICU Beds Free</span>
                    <span className="font-bold text-slate-800">
                      {icuBed ? `${icuBed.availableBeds} / ${icuBed.totalBeds}` : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Emergency / Casualty</span>
                    <span className="font-bold text-slate-800">
                      {emergencyBed ? `${emergencyBed.availableBeds} Beds` : 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">Oxygen Supply Beds</span>
                    <span className="font-bold text-slate-800">
                      {oxygenBed ? `${oxygenBed.availableBeds} Beds` : 'Available'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500 font-medium">108 Ambulance Hub</span>
                    <span className="font-bold text-slate-800">
                      {hosp.ambulanceAvailable ? '✅ Yes' : '❌ No'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Doctor Availability</span>
                    <span className="font-bold text-emerald-700">24x7 Emergency Resident</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <a
                  href={`tel:${hosp.phone}`}
                  className="flex-1 px-3 py-2 min-h-[44px] bg-[#22819A] hover:bg-[#1a667b] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call Hospital</span>
                </a>

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${hosp.lat},${hosp.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#22819A]" />
                  <span>Map</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
