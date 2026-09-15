import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { LiveTelemetryBar } from './components/common/LiveTelemetryBar';
import { OfflineBanner } from './components/common/OfflineBanner';
import { PrototypeDisclaimerBanner } from './components/common/PrototypeDisclaimerBanner';
import { AboutReviveModal } from './components/common/AboutReviveModal';
import { ReportDiscrepancyModal } from './components/common/ReportDiscrepancyModal';
import { EmergencyModal } from './components/common/EmergencyModal';
import { VoiceAssistantModal } from './components/common/VoiceAssistantModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { AuthModal } from './components/auth/AuthModal';
import { MedicineDetailModal } from './components/basic/MedicineDetailModal';
import { FloatingAssistantOrb } from './components/common/FloatingAssistantOrb';
import { MobileBottomBar } from './components/common/MobileBottomBar';
import { BasicDashboard } from './components/basic/BasicDashboard';
import { AdvancedDashboard } from './components/advanced/AdvancedDashboard';
import { PharmacyPortal } from './components/pharmacy/PharmacyPortal';
import { PharmacyGateway } from './components/pharmacy/PharmacyGateway';
import { HospitalPortal } from './components/hospital/HospitalPortal';
import { HospitalGateway } from './components/hospital/HospitalGateway';
import { AdminPortal } from './components/admin/AdminPortal';
import { HardwareModeView } from './components/hardware/HardwareModeView';
import { User, AppMode, Language, Hospital, Pharmacy, GlobalSearchResult, UserRole } from './types';
import { getTranslation } from './locales';
import { Bell, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';

export function App() {
  // App state
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('revive_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [mode, setMode] = useState<AppMode>(() => {
    if (user?.role === 'ADMIN') return 'ADMIN';
    if (user?.role === 'HOSPITAL') return 'HOSPITAL';
    if (user?.role === 'PHARMACY') return 'PHARMACY';
    return user?.preferences?.mode || 'BASIC';
  });
  const [language, setLanguage] = useState<Language>(user?.preferences?.language || 'en');
  const [district, setDistrict] = useState<string>(user?.district || 'Coimbatore');

  // Facilities data cache for high responsiveness
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isDiscrepancyOpen, setIsDiscrepancyOpen] = useState(false);
  const [discrepancyTarget, setDiscrepancyTarget] = useState<any>({
    resourceType: 'MEDICINE',
    resourceName: 'Essential Medicine Stock',
    facilityName: 'District Facility',
    district: 'Coimbatore',
    phone: '+91 94400 11000'
  });
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [selectedGlobalMedicine, setSelectedGlobalMedicine] = useState<any>(null);
  const [isGlobalMedDetailOpen, setIsGlobalMedDetailOpen] = useState(false);

  // Live Toast Notifications
  const [toasts, setToasts] = useState<{ id: string; title: string; message: string; type: 'info' | 'success' | 'alert' }[]>([]);

  const t = getTranslation(language);

  // Sync mode & language changes to user preferences
  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    if (user) {
      const updated = { ...user, preferences: { ...user.preferences, mode: newMode } };
      setUser(updated);
      localStorage.setItem('revive_user', JSON.stringify(updated));
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    if (user) {
      const updated = { ...user, preferences: { ...user.preferences, language: newLang } };
      setUser(updated);
      localStorage.setItem('revive_user', JSON.stringify(updated));
    }
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    if (user) {
      const updated = { ...user, district: newDist };
      setUser(updated);
      localStorage.setItem('revive_user', JSON.stringify(updated));
    }
  };

  const handleAuthSuccess = (authenticatedUser: User, token: string) => {
    setUser(authenticatedUser);
    localStorage.setItem('revive_user', JSON.stringify(authenticatedUser));
    localStorage.setItem('revive_token', token);
    if (authenticatedUser.preferences?.language) {
      setLanguage(authenticatedUser.preferences.language);
    }
    if (authenticatedUser.role === 'HOSPITAL') {
      setMode('HOSPITAL');
    } else if (authenticatedUser.role === 'PHARMACY') {
      setMode('PHARMACY');
    } else if (authenticatedUser.preferences?.mode) {
      setMode(authenticatedUser.preferences.mode);
    }
    if (authenticatedUser.district) {
      setDistrict(authenticatedUser.district);
    }
    addToast('Signed In', `Welcome, ${authenticatedUser.name}!`, 'success');
  };

  const handleQuickDemoLogin = async (demoRole: UserRole) => {
    let demoEmail = 'user@revive.demo';
    if (demoRole === 'PHARMACY') demoEmail = 'pharmacy@revive.demo';
    if (demoRole === 'HOSPITAL') demoEmail = 'hospital@revive.demo';
    if (demoRole === 'ADMIN') demoEmail = 'admin@revive.demo';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'demo123' })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        handleAuthSuccess(data.user, data.token);
        if (demoRole === 'HOSPITAL') {
          setMode('HOSPITAL');
        } else if (demoRole === 'PHARMACY') {
          setMode('PHARMACY');
        }
      } else {
        addToast('Sign In', data.error || 'Demo login failed', 'alert');
      }
    } catch (err) {
      console.warn('Demo login error:', err);
    }
  };

  const handleHospitalDirectLogin = async (hospitalId: string, staffName?: string, staffRole?: string) => {
    try {
      const res = await fetch('/api/auth/hospital-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalId, staffName, staffRole })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        handleAuthSuccess(data.user, data.token);
        setMode('HOSPITAL');
      } else {
        addToast('Hospital Sign In', data.error || 'Hospital login failed', 'alert');
      }
    } catch (err) {
      console.warn('Hospital login error:', err);
      addToast('Hospital Sign In', 'Network connection issue', 'alert');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('revive_user');
    localStorage.removeItem('revive_token');
    setMode('BASIC');
    addToast('Signed Out', 'You have been signed out.', 'info');
  };

  const addToast = (title: string, message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-3), { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Keyboard shortcut ⌘K / Ctrl+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch initial facilities
  const loadFacilities = async () => {
    try {
      const [hRes, pRes] = await Promise.all([
        fetch(`/api/hospitals?district=${district}`),
        fetch('/api/pharmacies')
      ]);
      if (hRes.ok) {
        const hData = await hRes.json();
        setHospitals(hData.hospitals || []);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setPharmacies(pData.pharmacies || []);
      }
    } catch (e) {
      console.warn('Initial data load error:', e);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, [district]);

  // Real-Time Server-Sent Events Listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.addEventListener('stock_updated', (e) => {
        try {
          const data = JSON.parse(e.data);
          addToast('Stock Update', `${data.medicineName} stock updated to ${data.stockQuantity} units at ${data.pharmacyName}`, 'info');
        } catch (err) {}
      });

      eventSource.addEventListener('blood_updated', (e) => {
        try {
          const data = JSON.parse(e.data);
          addToast('Blood Bank Grid', `${data.item?.bloodGroup || 'Blood'} (${data.item?.componentType?.replace('_', ' ') || 'Component'}) stock updated to ${data.item?.unitsAvailable ?? ''} units`, 'info');
        } catch (err) {}
      });

      eventSource.addEventListener('organ_updated', (e) => {
        try {
          const data = JSON.parse(e.data);
          addToast('TRANSTAN Organ Alert', `${data.item?.organType || 'Organ'} (${data.item?.status || 'Active'}) updated at ${data.item?.centerName || 'Transplant Center'}`, 'info');
        } catch (err) {}
      });

      eventSource.addEventListener('bed_updated', (e) => {
        try {
          const data = JSON.parse(e.data);
          addToast('Bed Status Update', `${data.category} bed count updated at ${data.hospitalName}`, 'info');
          loadFacilities();
        } catch (err) {}
      });

      eventSource.addEventListener('referral_created', (e) => {
        try {
          const data = JSON.parse(e.data);
          addToast('Referral Transfer Active', `Patient ${data.patientName} referral generated (${data.tokenCode})`, 'success');
        } catch (err) {}
      });
    } catch (err) {
      console.warn('SSE connection notice:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const handleSelectSearchResult = (result: GlobalSearchResult) => {
    if (result.type === 'HOSPITAL') {
      setMode('ADVANCED');
    } else if (result.type === 'MEDICINE') {
      setSelectedGlobalMedicine(result.data);
      setIsGlobalMedDetailOpen(true);
    } else if (result.type === 'PHARMACY') {
      setMode('BASIC');
    }
  };

  if (mode === 'HARDWARE') {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col font-sans">
        <HardwareModeView
          language={language}
          onLanguageChange={handleLanguageChange}
          userDistrict={district}
          onExit={() => setMode('BASIC')}
        />

        {/* Global Search Dialog Modal */}
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          language={language}
          onSelectResult={handleSelectSearchResult}
          userDistrict={district}
        />

        {/* Emergency Assistance Modal */}
        <EmergencyModal
          isOpen={isEmergencyOpen}
          onClose={() => setIsEmergencyOpen(false)}
          language={language}
          userDistrict={district}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-medical-futuristic text-slate-900 flex flex-col font-sans selection:bg-blue-600/20 selection:text-blue-700">
      {/* SIH Prototype Disclaimer & Offline Simulation Banner */}
      <PrototypeDisclaimerBanner
        language={language}
        onOpenAbout={() => setIsAboutOpen(true)}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={() => setIsSimulatedOffline(!isSimulatedOffline)}
      />

      {/* Offline Status Bar */}
      <OfflineBanner language={language} />

      {/* Main Header with Centered Modes and Dedicated Login Hub */}
      <Header
        user={user}
        currentMode={mode}
        onModeChange={handleModeChange}
        language={language}
        onLanguageChange={handleLanguageChange}
        selectedDistrict={district}
        onDistrictChange={handleDistrictChange}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onQuickDemoLogin={handleQuickDemoLogin}
      />

      {/* Live Rural Health Grid Telemetry Ribbon */}
      <LiveTelemetryBar
        language={language}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        userDistrict={district}
      />

      {/* Main Content Area - with bottom padding for mobile navigation bar */}
      <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-8">
        {/* Primary View Routing */}
        {mode === 'ADMIN' ? (
          <AdminPortal
            user={user}
            onResetDemoSuccess={() => {
              addToast('Demo Reset', 'Database restored to SIH benchmark state.', 'success');
              loadFacilities();
            }}
          />
        ) : mode === 'HOSPITAL' ? (
          user && (user.role === 'HOSPITAL' || user.role === 'ADMIN') ? (
            <HospitalPortal user={user} language={language} />
          ) : (
            <HospitalGateway
              language={language}
              user={user}
              onQuickDemoLogin={() => handleQuickDemoLogin('HOSPITAL')}
              onHospitalDirectLogin={handleHospitalDirectLogin}
              onOpenAuth={() => setIsAuthOpen(true)}
              onSwitchToBasic={() => setMode('BASIC')}
            />
          )
        ) : mode === 'PHARMACY' ? (
          user && user.role === 'PHARMACY' ? (
            <PharmacyPortal user={user} language={language} />
          ) : (
            <PharmacyGateway
              language={language}
              user={user}
              onQuickDemoLogin={() => handleQuickDemoLogin('PHARMACY')}
              onOpenAuth={() => setIsAuthOpen(true)}
              onSwitchToBasic={() => setMode('BASIC')}
            />
          )
        ) : mode === 'BASIC' ? (
          <BasicDashboard
            language={language}
            user={user}
            userDistrict={district}
            onOpenVoice={() => setIsVoiceOpen(true)}
            onOpenEmergency={() => setIsEmergencyOpen(true)}
          />
        ) : (
          <AdvancedDashboard
            language={language}
            user={user}
            userDistrict={district}
            hospitals={hospitals}
            pharmacies={pharmacies}
          />
        )}
      </main>

      {/* Floating 3D Virtual Assistant Interactive Orb */}
      <FloatingAssistantOrb
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenHardware={() => setMode('HARDWARE')}
      />

      {/* Footer */}
      <footer className="w-full bg-white/90 border-t border-slate-200/80 py-6 px-4 mt-12 text-center text-xs text-slate-500 shadow-2xs">
        <div className="w-full px-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-semibold text-slate-700">
            REVIVE — Tamil Nadu Rural Health Access & Critical Telemetry Grid
          </p>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <span className="text-red-600 font-bold">Emergency 108</span>
            <span>•</span>
            <span className="text-teal-700 font-bold">Health Line 104</span>
            <span>•</span>
            <span>TRANSTAN Organ Corridor</span>
            <span>•</span>
            <span>Jan Aushadhi PMBI</span>
          </div>
        </div>
      </footer>

      {/* Floating Toast Notification Stack */}
      <div className="fixed bottom-20 md:bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-3.5 rounded-2xl shadow-xl border text-xs font-semibold flex items-start gap-2.5 backdrop-blur-md pointer-events-auto animate-in slide-in-from-right duration-200 ${
              t.type === 'success'
                ? 'bg-emerald-50/95 border-emerald-300 text-emerald-900'
                : t.type === 'alert'
                ? 'bg-red-50/95 border-red-300 text-red-900'
                : 'bg-slate-900/95 text-white border-slate-700'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : t.type === 'alert' ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <Bell className="w-4 h-4 text-[#90C2E7] shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold leading-snug">{t.title}</p>
              <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{t.message}</p>
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Global Search Dialog Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        language={language}
        onSelectResult={handleSelectSearchResult}
        userDistrict={district}
      />

      {/* Voice Assistant Interactive Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        language={language}
        onLanguageChange={handleLanguageChange}
        userDistrict={district}
      />

      {/* Emergency Assistance Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
        language={language}
        userDistrict={district}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        language={language}
        onSuccess={handleAuthSuccess}
      />

      {/* Global Tablet Clinical Detail Modal */}
      <MedicineDetailModal
        medicine={selectedGlobalMedicine}
        isOpen={isGlobalMedDetailOpen}
        onClose={() => setIsGlobalMedDetailOpen(false)}
        language={language}
        userDistrict={district}
      />

      {/* SIH Hackathon About REVIVE Mission Modal */}
      <AboutReviveModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Data Verification Discrepancy Modal */}
      <ReportDiscrepancyModal
        isOpen={isDiscrepancyOpen}
        onClose={() => setIsDiscrepancyOpen(false)}
        resourceType={discrepancyTarget.resourceType}
        resourceName={discrepancyTarget.resourceName}
        facilityName={discrepancyTarget.facilityName}
        district={discrepancyTarget.district}
        facilityPhone={discrepancyTarget.phone}
        onSubmitSuccess={() => {
          addToast('Verification Report Logged', 'Discrepancy submitted to District Health Officer triage queue.', 'success');
        }}
      />

      {/* Thumb-Optimized Mobile Bottom Navigation Bar (< md screens) */}
      <MobileBottomBar
        currentMode={mode}
        onModeChange={handleModeChange}
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenEmergency={() => setIsEmergencyOpen(true)}
        language={language}
      />
    </div>
  );
}

export default App;

