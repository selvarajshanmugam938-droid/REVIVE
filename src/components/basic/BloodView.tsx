import React, { useState, useEffect } from 'react';
import { Droplet, PhoneCall, MapPin, Clock, Filter, AlertCircle, CheckCircle2, ShieldCheck, Heart, Share2 } from 'lucide-react';
import { BloodInventoryItem, BloodGroup, BloodComponentType, Language } from '../../types';
import { getTranslation } from '../../locales';
import { DataFreshnessBadge } from '../common/DataFreshnessBadge';
import { ReportDiscrepancyModal } from '../common/ReportDiscrepancyModal';

interface BloodViewProps {
  language: Language;
  userDistrict: string;
}

export const BloodView: React.FC<BloodViewProps> = ({
  language,
  userDistrict
}) => {
  const t = getTranslation(language);
  const [items, setItems] = useState<BloodInventoryItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedComponent, setSelectedComponent] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [discrepancyData, setDiscrepancyData] = useState<{
    resourceType: 'MEDICINE' | 'BED' | 'BLOOD';
    resourceName: string;
    facilityName: string;
    district: string;
    phone?: string;
  } | null>(null);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const handleWhatsAppShare = (item: BloodInventoryItem) => {
    const text = encodeURIComponent(
      `*REVIVE Blood Bank Alert*\nBlood Group: ${item.bloodGroup} (${item.componentType})\nUnits Ready: ${item.unitsAvailable}\nBlood Bank: ${item.bloodBankName}\nContact: ${item.emergencyContact}\nLocation: ${item.address}, ${item.district}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const fetchBlood = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        district: userDistrict,
        bloodGroup: selectedGroup !== 'ALL' ? selectedGroup : '',
        componentType: selectedComponent !== 'ALL' ? selectedComponent : ''
      });

      const res = await fetch(`/api/blood-availability?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.warn('Failed to fetch blood units:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlood();
  }, [userDistrict, selectedGroup, selectedComponent]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Header & Blood Selector Chips */}
      <div className="p-4 sm:p-5 bg-white/90 backdrop-blur-md rounded-3xl border border-[#CDD4DD]/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-2xl">
              <Droplet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {t.pillarBlood}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {t.pillarBloodDesc} • {userDistrict}
              </p>
            </div>
          </div>
        </div>

        {/* Blood Group Chips (Instant Access) */}
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
            Select Blood Group:
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedGroup('ALL')}
              className={`px-4 py-2 min-h-[44px] rounded-2xl font-bold text-xs sm:text-sm transition-all duration-150 ${
                selectedGroup === 'ALL'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
              }`}
            >
              All Groups
            </button>
            {bloodGroups.map((group) => {
              const isActive = selectedGroup === group;
              return (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`px-4 py-2 min-h-[44px] rounded-2xl font-extrabold text-sm transition-all duration-150 flex items-center gap-1 ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-md scale-105'
                      : 'bg-white border border-slate-200 text-slate-800 hover:border-rose-300 hover:bg-rose-50'
                  }`}
                >
                  <Droplet className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-rose-600'}`} />
                  <span>{group}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Component Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500">Component:</span>
          <select
            value={selectedComponent}
            onChange={(e) => setSelectedComponent(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 min-h-[40px]"
            aria-label="Filter by Blood Component"
          >
            <option value="ALL">All Components</option>
            <option value="WHOLE_BLOOD">Whole Blood</option>
            <option value="PRBC">PRBC (Packed Red Cells)</option>
            <option value="PLATELETS">Platelets (Single / Random)</option>
            <option value="FFP">FFP (Fresh Frozen Plasma)</option>
            <option value="CRYOPRECIPITATE">Cryoprecipitate</option>
          </select>
        </div>
      </div>

      {/* Blood Bank Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && (
          <div className="col-span-full py-16 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">Checking live blood bank inventory...</p>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="col-span-full p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <Heart className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No blood stock found</h3>
            <p className="text-xs text-slate-500">Contact the state helpline (104) for emergency cross-district matching.</p>
          </div>
        )}

        {!loading && items.map((item) => (
          <div
            key={item.id}
            className="p-4 sm:p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 hover:border-rose-400 shadow-sm transition-all duration-200 flex flex-col justify-between gap-3 group"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-2xl bg-rose-600 text-white font-black text-lg shadow-sm">
                      {item.bloodGroup}
                    </span>
                    <span className="text-xs font-bold bg-rose-50 text-rose-800 px-2.5 py-1 rounded-xl border border-rose-200">
                      {item.componentType.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-2.5 group-hover:text-rose-700 transition">
                    {item.bloodBankName}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block uppercase">Ready Units</span>
                  <span className={`text-2xl font-black ${item.unitsAvailable > 5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {item.unitsAvailable}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{item.address} ({item.district})</span>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div className="flex items-center gap-2 font-medium text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tested: HIV / Hep-B / Syphilis Screened</span>
                  </div>
                  <DataFreshnessBadge
                    updatedAt={item.updatedAt}
                    verifiedByPhone={true}
                    onReportDiscrepancy={() => setDiscrepancyData({
                      resourceType: 'BLOOD',
                      resourceName: `${item.bloodGroup} ${item.componentType} Blood Units`,
                      facilityName: item.bloodBankName,
                      district: item.district,
                      phone: item.emergencyContact
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <a
                href={`tel:${item.emergencyContact}`}
                className="flex-1 px-4 py-2.5 min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Blood Bank ({item.emergencyContact})</span>
              </a>

              <button
                type="button"
                onClick={() => handleWhatsAppShare(item)}
                className="p-2.5 min-h-[44px] min-w-[44px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl flex items-center justify-center transition active:scale-95"
                title="Share Blood Info via WhatsApp"
                aria-label="Share Blood Info via WhatsApp"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Discrepancy Reporting Modal */}
      {discrepancyData && (
        <ReportDiscrepancyModal
          isOpen={!!discrepancyData}
          onClose={() => setDiscrepancyData(null)}
          resourceType={discrepancyData.resourceType}
          resourceName={discrepancyData.resourceName}
          facilityName={discrepancyData.facilityName}
          district={discrepancyData.district}
          facilityPhone={discrepancyData.phone}
          onSubmitSuccess={() => {
            setDiscrepancyData(null);
          }}
        />
      )}
    </div>
  );
};
