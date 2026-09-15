import React, { useState } from 'react';
import { Map, Scale, Cpu, BarChart3, Hospital, Layers } from 'lucide-react';
import { InteractiveMap } from './InteractiveMap';
import { FacilityComparator } from './FacilityComparator';
import { IoTMonitor } from './IoTMonitor';
import { AnalyticsView } from './AnalyticsView';
import { Hospital as HospitalType, Pharmacy, Language, User } from '../../types';
import { getTranslation } from '../../locales';

interface AdvancedDashboardProps {
  language: Language;
  user: User | null;
  userDistrict: string;
  hospitals: HospitalType[];
  pharmacies: Pharmacy[];
}

export const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({
  language,
  user,
  userDistrict,
  hospitals,
  pharmacies
}) => {
  const t = getTranslation(language);
  const [activeTab, setActiveTab] = useState<'MAP' | 'COMPARATOR' | 'IOT' | 'ANALYTICS'>('MAP');

  const tabs = [
    { id: 'MAP', label: t.interactiveMap, icon: Map },
    { id: 'COMPARATOR', label: t.facilityComparator, icon: Scale },
    { id: 'IOT', label: t.iotDashboard, icon: Cpu },
    { id: 'ANALYTICS', label: 'Resource Intelligence', icon: BarChart3 }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Advanced Navigation Sub-tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white/80 backdrop-blur-md rounded-2xl border border-[#CDD4DD]/80 shadow-sm overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-[#22819A] text-white shadow-md'
                  : 'text-slate-700 hover:text-[#22819A] hover:bg-[#90C2E7]/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'MAP' && (
          <InteractiveMap
            language={language}
            userDistrict={userDistrict}
            hospitals={hospitals}
            pharmacies={pharmacies}
          />
        )}

        {activeTab === 'COMPARATOR' && (
          <FacilityComparator
            language={language}
            hospitals={hospitals}
          />
        )}

        {activeTab === 'IOT' && (
          <IoTMonitor language={language} />
        )}

        {activeTab === 'ANALYTICS' && (
          <AnalyticsView
            language={language}
            userDistrict={userDistrict}
          />
        )}
      </div>
    </div>
  );
};
