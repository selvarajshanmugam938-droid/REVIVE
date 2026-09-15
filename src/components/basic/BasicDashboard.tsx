import React, { useState } from 'react';
import { Pill, Hospital, Droplet, Heart, Share2 } from 'lucide-react';
import { MedicineView } from './MedicineView';
import { BedView } from './BedView';
import { BloodView } from './BloodView';
import { OrganView } from './OrganView';
import { ReferralView } from './ReferralView';
import { User, Language } from '../../types';
import { getTranslation } from '../../locales';

interface BasicDashboardProps {
  language: Language;
  user: User | null;
  userDistrict: string;
  initialTab?: 'MEDICINE' | 'BEDS' | 'BLOOD' | 'ORGANS' | 'REFERRALS';
  onOpenVoice?: () => void;
  onOpenEmergency?: () => void;
}

export const BasicDashboard: React.FC<BasicDashboardProps> = ({
  language,
  user,
  userDistrict,
  initialTab = 'MEDICINE',
  onOpenVoice,
  onOpenEmergency
}) => {
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<'MEDICINE' | 'BEDS' | 'BLOOD' | 'ORGANS' | 'REFERRALS'>(initialTab);

  const tabs = [
    { id: 'MEDICINE', label: t.pillarMedicine, subtitle: 'Pharmacies & Stock', icon: Pill, color: 'text-emerald-600', activeBg: 'bg-emerald-600', activeBorder: 'border-emerald-500' },
    { id: 'BEDS', label: t.pillarBed, subtitle: 'ICU & Oxygen', icon: Hospital, color: 'text-blue-600', activeBg: 'bg-blue-600', activeBorder: 'border-blue-500' },
    { id: 'BLOOD', label: t.pillarBlood, subtitle: 'Ready Blood Units', icon: Droplet, color: 'text-rose-600', activeBg: 'bg-rose-600', activeBorder: 'border-rose-500' },
    { id: 'ORGANS', label: t.pillarOrgan, subtitle: 'Green Corridor', icon: Heart, color: 'text-purple-600', activeBg: 'bg-purple-600', activeBorder: 'border-purple-500' },
    { id: 'REFERRALS', label: t.pillarReferral, subtitle: 'PHC Transfer Passes', icon: Share2, color: 'text-teal-600', activeBg: 'bg-blue-700', activeBorder: 'border-blue-700' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 5-Pillar Touch-Friendly Navigation Tab Bar (Frosted Capsule) */}
      <nav
        aria-label="Healthcare Pillars"
        className="flex items-center overflow-x-auto no-scrollbar sm:grid sm:grid-cols-5 gap-1.5 sm:gap-2 p-1.5 bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-md shadow-blue-950/5"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[105px] sm:min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:py-3 rounded-2xl min-h-[48px] font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer shrink-0 ${
                isActive
                  ? `${tab.activeBg} text-white shadow-md shadow-blue-900/15 scale-[1.01] border ${tab.activeBorder}`
                  : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50/50 border border-transparent'
              }`}
              aria-pressed={isActive}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : tab.color}`} />
              <div className="text-left truncate">
                <span className="block truncate leading-tight">{tab.label}</span>
                <span className={`hidden md:block text-[10px] font-normal leading-none ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                  {tab.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Active Pillar Body */}
      <div>
        {activeTab === 'MEDICINE' && <MedicineView language={language} userDistrict={userDistrict} />}
        {activeTab === 'BEDS' && <BedView language={language} userDistrict={userDistrict} />}
        {activeTab === 'BLOOD' && <BloodView language={language} userDistrict={userDistrict} />}
        {activeTab === 'ORGANS' && <OrganView language={language} userDistrict={userDistrict} />}
        {activeTab === 'REFERRALS' && <ReferralView language={language} user={user} userDistrict={userDistrict} />}
      </div>
    </div>
  );
};
