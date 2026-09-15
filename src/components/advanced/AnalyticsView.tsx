import React from 'react';
import { BarChart3, TrendingUp, Activity, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Language } from '../../types';
import { getTranslation } from '../../locales';

interface AnalyticsViewProps {
  language: Language;
  userDistrict: string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  language,
  userDistrict
}) => {
  const t = getTranslation(language);

  const districtBedStats = [
    { district: 'Coimbatore', occupancy: 78, totalBeds: 540, freeBeds: 118 },
    { district: 'Madurai', occupancy: 84, totalBeds: 620, freeBeds: 99 },
    { district: 'Salem', occupancy: 71, totalBeds: 380, freeBeds: 110 },
    { district: 'Tiruchirappalli', occupancy: 65, totalBeds: 450, freeBeds: 157 },
    { district: 'Erode', occupancy: 60, totalBeds: 290, freeBeds: 116 },
    { district: 'Tirunelveli', occupancy: 74, totalBeds: 330, freeBeds: 85 }
  ];

  const topDemandMedicines = [
    { name: 'Paracetamol 500mg', searches: 1420, availabilityRate: 98, status: 'HIGH_STOCK' },
    { name: 'Amoxicillin 500mg', searches: 980, availabilityRate: 85, status: 'NORMAL' },
    { name: 'Insulin Human Mixtard', searches: 750, availabilityRate: 68, status: 'LIMITED' },
    { name: 'ORS Oral Electrolytes', searches: 1100, availabilityRate: 99, status: 'HIGH_STOCK' },
    { name: 'Snake Polyvalent Antivenom', searches: 320, availabilityRate: 92, status: 'NORMAL' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-white/90 backdrop-blur-md rounded-3xl border border-[#CDD4DD]/80 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Rural Healthcare Resource Intelligence
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Regional bed occupancy ratios and essential medicine fulfillment rates
            </p>
          </div>
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Average Bed Occupancy</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">72.4%</span>
            <span className="text-xs font-bold text-emerald-600">Stable</span>
          </div>
          <span className="text-[11px] text-slate-500">Across 6 rural health zones</span>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">108 Referral Triage</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">14.2 min</span>
            <span className="text-xs font-bold text-slate-400">Avg ETA</span>
          </div>
          <span className="text-[11px] text-slate-500">From PHC to Tertiary bed</span>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Essential Drug Stock</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#22819A]">93.8%</span>
            <span className="text-xs font-bold text-emerald-600">+4% MoM</span>
          </div>
          <span className="text-[11px] text-slate-500">Verified at partner medicals</span>
        </div>

        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Active IoT Beds</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600">42</span>
            <span className="text-xs font-bold text-indigo-700">Nodes</span>
          </div>
          <span className="text-[11px] text-slate-500">Live telemetry active</span>
        </div>
      </div>

      {/* Bed Occupancy by District */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Hospital Bed Capacity by District</h3>

        <div className="space-y-3">
          {districtBedStats.map((item) => (
            <div key={item.district} className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span className={item.district === userDistrict ? 'text-[#22819A] font-black' : ''}>
                  {item.district} {item.district === userDistrict ? '(Selected)' : ''}
                </span>
                <span className="text-slate-500">
                  {item.freeBeds} Free Beds / {item.totalBeds} Total ({item.occupancy}% Occupied)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.occupancy > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${item.occupancy}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Medicine Demand Fulfillment */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Top In-Demand Medicines Availability</h3>

        <div className="space-y-3">
          {topDemandMedicines.map((med) => (
            <div
              key={med.name}
              className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 text-sm block">{med.name}</span>
                <span className="text-slate-500">{med.searches} citizen queries this week</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="font-extrabold text-slate-700 block">{med.availabilityRate}% in stock</span>
                  <span className="text-[10px] font-bold text-emerald-700">92+ Partner Pharmacies</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
