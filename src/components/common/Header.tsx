import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Mic,
  ShieldAlert,
  MapPin,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Sparkles,
  Store,
  CheckCircle2,
  Building2,
  Activity,
  HeartHandshake,
  Cpu
} from 'lucide-react';
import { ReviveLogo } from './ReviveLogo';
import { LanguageSelector } from './LanguageSelector';
import { ModeSelector } from './ModeSelector';
import { User, AppMode, Language, UserRole } from '../../types';
import { getTranslation } from '../../locales';
import { sampleDistricts } from '../../../server/seedData';

interface HeaderProps {
  user: User | null;
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  selectedDistrict: string;
  onDistrictChange: (district: string) => void;
  onOpenSearch: () => void;
  onOpenVoiceAssistant: () => void;
  onOpenEmergency: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onQuickDemoLogin?: (role: UserRole) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentMode,
  onModeChange,
  language,
  onLanguageChange,
  selectedDistrict,
  onDistrictChange,
  onOpenSearch,
  onOpenVoiceAssistant,
  onOpenEmergency,
  onOpenAuth,
  onLogout,
  onQuickDemoLogin
}) => {
  const t = getTranslation(language);
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const districtRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (districtRef.current && !districtRef.current.contains(e.target as Node)) {
        setIsDistrictDropdownOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDistricts = sampleDistricts.filter(d =>
    d.toLowerCase().includes(districtSearch.toLowerCase().trim())
  );

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-xs transition-all">
      {/* =========================================================================
          TIER 1: Primary Brand, Global Search & Account Utility Bar
         ========================================================================= */}
      <div className="w-full border-b border-slate-100">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-2 sm:gap-3">
          
          {/* Left: Brand Identity & Location Capsule */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ReviveLogo size="sm" showTagline={false} />

            {/* District Selector Capsule */}
            <div ref={districtRef} className="relative">
              <button
                onClick={() => setIsDistrictDropdownOpen(!isDistrictDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/90 text-xs font-bold text-slate-800 transition active:scale-95 shadow-2xs"
                aria-expanded={isDistrictDropdownOpen}
                aria-label="Select Tamil Nadu district"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span className="hidden xl:inline font-medium text-slate-500">{t.nearbyIn}:</span>
                <span className="font-extrabold text-blue-700 max-w-[80px] sm:max-w-[110px] truncate">
                  {selectedDistrict}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* District Dropdown Popover */}
              {isDistrictDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 p-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2 py-1 mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Select Healthcare District
                    </span>
                    <input
                      type="text"
                      placeholder="Search district..."
                      value={districtSearch}
                      onChange={(e) => setDistrictSearch(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar">
                    {filteredDistricts.map((dist) => (
                      <button
                        key={dist}
                        onClick={() => {
                          onDistrictChange(dist);
                          setIsDistrictDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs rounded-xl font-medium flex items-center justify-between transition ${
                          selectedDistrict === dist
                            ? 'bg-blue-700 text-white font-bold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{dist}</span>
                        {selectedDistrict === dist && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                    {filteredDistricts.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400">No district found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="hidden md:flex items-center flex-1 min-w-0 max-w-sm lg:max-w-md mx-2">
            <button
              onClick={onOpenSearch}
              className="w-full bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-500 rounded-full px-3.5 py-1.5 text-left text-xs text-slate-500 font-medium flex items-center justify-between shadow-2xs transition group"
              aria-label="Search medicine, beds, blood, organs"
            >
              <div className="flex items-center gap-2 truncate min-w-0">
                <Search className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition shrink-0" />
                <span className="truncate">{t.searchPlaceholder}</span>
              </div>
              <kbd className="hidden xl:inline-block text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200 shrink-0 ml-2">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Quick Action Controls & High-Visibility Login Hub */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile Search Button */}
            <button
              onClick={onOpenSearch}
              className="md:hidden p-2 min-h-[38px] min-w-[38px] rounded-full bg-slate-100 border border-slate-200 text-slate-700 hover:text-blue-700 transition flex items-center justify-center"
              aria-label="Open search"
            >
              <Search className="w-4 h-4 text-blue-600" />
            </button>

            {/* Voice AI Assistant Trigger */}
            <button
              onClick={onOpenVoiceAssistant}
              className="hidden lg:flex px-3 py-1.5 min-h-[38px] rounded-full bg-blue-700 hover:bg-blue-800 active:scale-95 text-white text-xs font-bold items-center gap-1.5 shadow-2xs transition"
              title="Tamil / Hindi / English Voice AI"
              aria-label="Ask Voice Assistant"
            >
              <div className="relative flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping absolute" />
                <Mic className="w-3.5 h-3.5 text-white relative z-10" />
              </div>
              <span className="hidden xl:inline">{t.askRevive}</span>
            </button>

            {/* Emergency 108 SOS */}
            <button
              onClick={onOpenEmergency}
              className="px-2.5 sm:px-3 py-1.5 min-h-[38px] rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-2xs border border-rose-500 transition"
              title="Emergency 108 Dispatch"
              aria-label="Emergency SOS"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-white animate-bounce shrink-0" />
              <span className="tracking-tight font-black">108</span>
            </button>

            {/* Language Selector */}
            <LanguageSelector
              currentLanguage={language}
              onLanguageChange={onLanguageChange}
              compact={true}
            />

            {/* PROMINENT ACCOUNT & LOGIN STATION */}
            <div ref={accountRef} className="relative">
              {user ? (
                /* Signed In State */
                <div>
                  <button
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 min-h-[40px] bg-slate-900 text-white hover:bg-slate-800 rounded-full shadow-xs transition border border-slate-700 active:scale-95"
                    aria-expanded={isAccountMenuOpen}
                    aria-label="User Account Menu"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden lg:flex flex-col text-left">
                      <span className="text-xs font-bold leading-tight truncate max-w-[105px]">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-emerald-300 font-semibold leading-none">
                        {user.role}
                      </span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>

                  {/* Account Dropdown */}
                  {isAccountMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 p-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email || user.phone}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80">
                          {user.role === 'HOSPITAL'
                            ? 'Hospital Organ & Blood Desk'
                            : user.role === 'PHARMACY'
                            ? 'Jan Aushadhi Partner'
                            : user.role === 'ADMIN'
                            ? 'Health System Admin'
                            : 'Registered Citizen'}
                        </span>
                      </div>

                      <div className="py-1 space-y-0.5">
                        {user.role === 'HOSPITAL' && (
                          <button
                            onClick={() => {
                              onModeChange('HOSPITAL');
                              setIsAccountMenuOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-bold text-red-700 hover:bg-red-50 rounded-xl flex items-center gap-2 transition"
                          >
                            <HeartHandshake className="w-3.5 h-3.5 text-red-600" />
                            <span>Hospital Organs & Blood</span>
                          </button>
                        )}
                        {user.role === 'PHARMACY' && (
                          <button
                            onClick={() => {
                              onModeChange('PHARMACY');
                              setIsAccountMenuOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl flex items-center gap-2 transition"
                          >
                            <Store className="w-3.5 h-3.5" />
                            <span>My Pharmacy Desk</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onLogout();
                            setIsAccountMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t.logout}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Signed Out State: Prominent & Accessible */
                <div className="flex items-center gap-1">
                  <button
                    onClick={onOpenAuth}
                    className="px-4 py-1.5 min-h-[40px] bg-slate-900 hover:bg-slate-800 text-white rounded-full font-black text-xs sm:text-sm transition shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    aria-label="Sign in"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.login}</span>
                  </button>

                  {/* 1-Click Test Persona Trigger */}
                  {onQuickDemoLogin && (
                    <button
                      onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                      className="p-2 min-h-[40px] bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-full text-xs font-bold flex items-center justify-center transition"
                      title="Quick Demo Roles"
                      aria-label="Demo accounts menu"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Quick Demo Dropdown */}
                  {isAccountMenuOpen && onQuickDemoLogin && (
                    <div className="absolute right-0 mt-2 w-64 p-2.5 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-2 py-1 mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          1-Click Test Personas
                        </span>
                      </div>
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            onQuickDemoLogin('USER');
                            setIsAccountMenuOpen(false);
                          }}
                          className="w-full p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-left text-xs transition flex items-center gap-2"
                        >
                          <UserIcon className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-800">Citizen / Patient</p>
                            <p className="text-[10px] text-slate-500">Fast medicine & ICU bed finder</p>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            onQuickDemoLogin('PHARMACY');
                            setIsAccountMenuOpen(false);
                          }}
                          className="w-full p-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-left text-xs transition flex items-center gap-2"
                        >
                          <Store className="w-4 h-4 text-[#22819A] shrink-0" />
                          <div>
                            <p className="font-bold text-slate-800">Jan Aushadhi Pharmacist</p>
                            <p className="text-[10px] text-slate-500">Live medicine stock updates</p>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            onQuickDemoLogin('HOSPITAL');
                            setIsAccountMenuOpen(false);
                          }}
                          className="w-full p-2 rounded-xl bg-red-50 hover:bg-red-100 text-left text-xs transition flex items-center gap-2"
                        >
                          <HeartHandshake className="w-4 h-4 text-red-600 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-800">Hospital Medical Officer</p>
                            <p className="text-[10px] text-slate-500">Update organs & blood inventory</p>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            onQuickDemoLogin('ADMIN');
                            setIsAccountMenuOpen(false);
                          }}
                          className="w-full p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-left text-xs transition flex items-center gap-2"
                        >
                          <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-800">System Admin</p>
                            <p className="text-[10px] text-slate-500">State-wide healthcare grid view</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TIER 2: Dedicated, Fully Centered Mode Navigation Deck
          (Gives Modes its own spacious row - never pushed off to the side!)
         ========================================================================= */}
      <div className="w-full bg-slate-50/80 border-b border-slate-200/70 py-1 sm:py-1.5 px-3 sm:px-6 lg:px-8 overflow-x-auto no-scrollbar">
        <div className="w-full flex items-center justify-center">
          <ModeSelector
            currentMode={currentMode}
            onModeChange={onModeChange}
            language={language}
          />
        </div>
      </div>
    </header>
  );
};
