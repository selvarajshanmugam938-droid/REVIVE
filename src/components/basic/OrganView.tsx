import React, { useState, useEffect } from 'react';
import { Heart, PhoneCall, MapPin, ShieldAlert, Award, FileText, CheckCircle2, Clock } from 'lucide-react';
import { OrganInventoryItem, OrganType, Language } from '../../types';
import { getTranslation } from '../../locales';

interface OrganViewProps {
  language: Language;
  userDistrict: string;
}

export const OrganView: React.FC<OrganViewProps> = ({
  language,
  userDistrict
}) => {
  const t = getTranslation(language);
  const [items, setItems] = useState<OrganInventoryItem[]>([]);
  const [selectedOrgan, setSelectedOrgan] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const organTypes: { type: OrganType; label: string }[] = [
    { type: 'CORNEA', label: 'Cornea (Eye)' },
    { type: 'KIDNEY', label: 'Kidney (Renal)' },
    { type: 'LIVER', label: 'Liver' },
    { type: 'HEART', label: 'Heart' },
    { type: 'LUNG', label: 'Lungs' },
    { type: 'PANCREAS', label: 'Pancreas' }
  ];

  const fetchOrgans = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        district: userDistrict,
        organType: selectedOrgan !== 'ALL' ? selectedOrgan : ''
      });

      const res = await fetch(`/api/organ-availability?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.warn('Failed to fetch organ availability:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgans();
  }, [userDistrict, selectedOrgan]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE_ALERT':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300 animate-pulse">
            Active Donor Alert
          </span>
        );
      case 'MATCHING_IN_PROGRESS':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            TRANSTAN Cross-Match
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            Waitlist Enrolled
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Header & Organ Selector */}
      <div className="p-4 sm:p-5 bg-white/90 backdrop-blur-md rounded-3xl border border-[#CDD4DD]/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {t.pillarOrgan}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {t.pillarOrganDesc} • TRANSTAN / NOTTO Certified
              </p>
            </div>
          </div>
        </div>

        {/* Organ Selector Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedOrgan('ALL')}
            className={`px-4 py-2 min-h-[44px] rounded-2xl font-bold text-xs sm:text-sm transition-all duration-150 ${
              selectedOrgan === 'ALL'
                ? 'bg-purple-700 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-purple-50 hover:text-purple-700'
            }`}
          >
            All Organs / Tissues
          </button>
          {organTypes.map((org) => {
            const isActive = selectedOrgan === org.type;
            return (
              <button
                key={org.type}
                onClick={() => setSelectedOrgan(org.type)}
                className={`px-4 py-2 min-h-[44px] rounded-2xl font-bold text-xs sm:text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-purple-700 text-white shadow-md'
                    : 'bg-white border border-slate-200 text-slate-800 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                {org.label}
              </button>
            );
          })}
        </div>

        {/* Legal & TRANSTAN Notice */}
        <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-start gap-2.5 text-xs text-purple-900 font-medium">
          <Award className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
          <p>
            All organ allocations are strictly regulated by the <strong>Transplantation Authority of Tamil Nadu (TRANSTAN)</strong> and <strong>NOTTO</strong>. Commercial sale of organs is illegal.
          </p>
        </div>
      </div>

      {/* Centers & Availability List */}
      <div className="space-y-4">
        {loading && (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">Querying verified transplant centers...</p>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <Heart className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No transplant records in this district</h3>
            <p className="text-xs text-slate-500">Contact the state nodal organ registry cell for cross-district allocations.</p>
          </div>
        )}

        {!loading && items.map((item) => (
          <div
            key={item.id}
            className="p-4 sm:p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 hover:border-purple-400 shadow-sm transition-all duration-200 space-y-3 group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-2xl bg-purple-700 text-white font-black text-sm">
                    {item.organType}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-purple-700 transition">
                    {item.centerName}
                  </h3>
                  {getStatusBadge(item.status)}
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{item.address} ({item.district})</span>
                  {item.distanceKm && <span className="font-bold text-purple-700 ml-1">({item.distanceKm} km)</span>}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                  Reg ID: {item.registrationNumber}
                </span>
              </div>
            </div>

            {item.notes && (
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {item.notes}
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <span className="text-xs font-semibold text-slate-500">
                Coordinator: {item.nodalOfficer}
              </span>

              <a
                href={`tel:${item.coordinatorPhone}`}
                className="px-4 py-2 min-h-[44px] bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Coordinator ({item.coordinatorPhone})</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
