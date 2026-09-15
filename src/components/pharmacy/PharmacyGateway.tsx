import React from 'react';
import { Store, ShieldCheck, ArrowRight, Sparkles, Building2, Pill, Activity, UserCheck } from 'lucide-react';
import { Language, User } from '../../types';

interface PharmacyGatewayProps {
  language: Language;
  onQuickDemoLogin: () => void;
  onOpenAuth: () => void;
  onSwitchToBasic: () => void;
  user: User | null;
}

export const PharmacyGateway: React.FC<PharmacyGatewayProps> = ({
  language,
  onQuickDemoLogin,
  onOpenAuth,
  onSwitchToBasic,
  user
}) => {
  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Gateway Header Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white p-6 sm:p-10 border border-teal-500/30 shadow-2xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-bold">
            <Store className="w-3.5 h-3.5 text-teal-300" />
            <span>Staff & Pharmacy Operations Desk</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            {language === 'ta'
              ? 'மருந்தகம் & சுகாதாரப் பணியாளர் கட்டுப்பாட்டு மையம்'
              : language === 'hi'
              ? 'फार्मेसी एवं स्वास्थ्य कर्मचारी प्रबंधन पोर्टल'
              : 'Jan Aushadhi & Clinic Inventory Desk'}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
            {language === 'ta'
              ? 'அத்தியாவசிய மருந்து இருப்புகளை நிகழ்நேரத்தில் புதுப்பிக்கவும், அரசு ஆரம்ப சுகாதார நிலைய (PHC) பரிந்துரைகளை ஏற்கவும் மற்றும் அவசர படுக்கை நிலையை கண்காணிக்கவும்.'
              : language === 'hi'
              ? 'आवश्यक दवा स्टॉक को वास्तविक समय में अपडेट करें, पीएचसी रेफरल स्वीकार करें और आपातकालीन आईसीयू स्थिति का प्रबंधन करें।'
              : 'Direct live synchronization for Jan Aushadhi pharmacies, rural health clinics, and hospital inventory desks across Tamil Nadu.'}
          </p>

          {/* Action Hub */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onQuickDemoLogin}
              className="px-6 py-3.5 bg-gradient-to-r from-teal-500 to-[#22819A] hover:from-teal-600 hover:to-[#1a667b] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-teal-500/25 transition active:scale-95 border border-teal-300/30"
            >
              <UserCheck className="w-4 h-4" />
              <span>Launch Demo Pharmacist Desk</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenAuth}
              className="px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border border-white/20 transition active:scale-95"
            >
              <span>Sign In with Staff Credentials</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Pillars of the Portal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Pill className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Real-Time Inventory Sync</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Update stock counts, rack locations, and prices with instant SSE broadcasting to all citizen dashboards.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">PHC Referral Intake</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Verify digital transfer tokens from rural Primary Health Centres and fast-track patient admissions.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">TRANSTAN & Blood Grid</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Participate in the Tamil Nadu organ green corridor and emergency blood reserve network.
          </p>
        </div>
      </div>

      {/* Back to Citizen View */}
      <div className="text-center pt-2">
        <button
          onClick={onSwitchToBasic}
          className="text-xs font-bold text-[#22819A] hover:underline"
        >
          ← Return to Citizen Quick Access Dashboard
        </button>
      </div>
    </div>
  );
};
