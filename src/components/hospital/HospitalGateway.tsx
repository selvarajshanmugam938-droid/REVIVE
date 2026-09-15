import React, { useState } from 'react';
import {
  HeartHandshake,
  ShieldCheck,
  ArrowRight,
  Building2,
  Droplet,
  Activity,
  UserCheck,
  Stethoscope,
  AlertTriangle,
  Bed,
  CheckCircle2,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Language, User } from '../../types';
import { seedHospitals } from '../../../server/seedData';

interface HospitalGatewayProps {
  language: Language;
  onQuickDemoLogin: () => void;
  onHospitalDirectLogin?: (hospitalId: string, staffName?: string, staffRole?: string) => void;
  onOpenAuth: () => void;
  onSwitchToBasic: () => void;
  user: User | null;
}

export const HospitalGateway: React.FC<HospitalGatewayProps> = ({
  language,
  onQuickDemoLogin,
  onHospitalDirectLogin,
  onOpenAuth,
  onSwitchToBasic,
  user
}) => {
  const [selectedHospId, setSelectedHospId] = useState('hosp-02'); // CMCH default
  const [staffRole, setStaffRole] = useState('Chief Medical Officer & Bed In-Charge');
  const [staffName, setStaffName] = useState('Dr. S. Vimal, MD');

  const selectedHospital = seedHospitals.find(h => h.id === selectedHospId) || seedHospitals[0];

  const handleLaunch = () => {
    if (onHospitalDirectLogin) {
      onHospitalDirectLogin(selectedHospId, staffName, staffRole);
    } else {
      onQuickDemoLogin();
    }
  };

  const handlePresetLogin = (hospId: string, name: string, role: string) => {
    if (onHospitalDirectLogin) {
      onHospitalDirectLogin(hospId, name, role);
    } else {
      onQuickDemoLogin();
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4 space-y-8 animate-in fade-in zoom-in-95 duration-200">
      {/* Gateway Header Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-6 sm:p-10 border border-blue-500/30 shadow-2xl">
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold">
            <Bed className="w-4 h-4 text-blue-400" />
            <span>Hospital Operations, Bed Availability & Organ Telemetry Grid</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            {language === 'ta'
              ? 'மருத்துவமனை படுக்கை & மருத்துவ நடவடிக்கைகள் மையம்'
              : language === 'hi'
              ? 'अस्पताल बेड उपलब्धता एवं परिचालन पोर्टल'
              : 'Hospital Bed Availability & Operations Terminal'}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
            {language === 'ta'
              ? 'அவசர படுக்கைகள், ICU, ஆக்ஸிஜன் வசதிகள், இரத்த வங்கி மற்றும் உறுப்பு மாற்று நிலையை நிகழ்நேரத்தில் புதுப்பிக்கவும்.'
              : language === 'hi'
              ? 'आपातकालीन बेड, आईसीयू, ऑक्सीजन वार्ड, रक्त बैंक और अंग प्रत्यारोपण डेटा को वास्तविक समय में प्रबंधित और अद्यतन करें।'
              : 'Empower medical superintendents, triage wardens, and blood bank coordinators to manage ICU bed availability, organ referrals, and emergency telemetry in sync with the 108 ambulance grid.'}
          </p>

          {/* Quick Preset Hospital Badges - Responsive Grid that fits every screen */}
          <div className="pt-2 w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              ⚡ 1-Click Fast Hospital Desk Access:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full">
              <button
                type="button"
                onClick={() => handlePresetLogin('hosp-02', 'Dr. S. Vimal (CMO)', 'Chief Medical Officer & Bed In-Charge')}
                className="w-full px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-blue-200 hover:text-white flex items-center justify-center sm:justify-start gap-2 transition active:scale-95 text-left"
              >
                <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="truncate">CMCH Coimbatore (Bed/ICU)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetLogin('hosp-03', 'Dr. M. Sundaram (Casualty)', 'Casualty & Emergency Bed Warden')}
                className="w-full px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-red-200 hover:text-white flex items-center justify-center sm:justify-start gap-2 transition active:scale-95 text-left"
              >
                <Activity className="w-4 h-4 text-red-400 shrink-0" />
                <span className="truncate">GRH Madurai (Casualty)</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetLogin('hosp-04', 'Dr. K. Jayanthi (Triage)', 'Bed Triage & Allocation Officer')}
                className="w-full px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-amber-200 hover:text-white flex items-center justify-center sm:justify-start gap-2 transition active:scale-95 text-left"
              >
                <Bed className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">Salem Medical (Bed Triage)</span>
              </button>

              <button
                id="hospital-login-register-organ-btn"
                type="button"
                onClick={() => handlePresetLogin('hosp-01', 'Dr. P. Sharmila (TRANSTAN)', 'TRANSTAN Organ Coordinator')}
                className="w-full px-3 py-2 rounded-xl bg-rose-500/25 hover:bg-rose-500/35 border border-rose-400/50 text-xs font-bold text-rose-200 hover:text-white flex items-center justify-center sm:justify-start gap-2 transition active:scale-95 text-left shadow-xs"
              >
                <HeartHandshake className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="truncate">RGGGH (Register Organ)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hospital Staff Login & Facility Selector Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Stethoscope className="w-4 h-4" />
              <span>Medical Officer Authentication</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              Select Your Hospital & Staff Role
            </h2>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>State Health Department Verified</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Hospital Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 block">
              Accredited Hospital
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedHospId}
                onChange={(e) => setSelectedHospId(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-2xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                {seedHospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.district})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500">
              District: <span className="font-semibold text-slate-700">{selectedHospital.district}</span> • Type: <span className="font-semibold text-slate-700">{selectedHospital.type}</span>
            </p>
          </div>

          {/* Designation Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 block">
              Staff Designation / Duty Desk
            </label>
            <div className="relative">
              <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-300 rounded-2xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="Chief Medical Officer & Bed In-Charge">Chief Medical Officer & Bed In-Charge</option>
                <option value="ICU & Emergency Triage Warden">ICU & Emergency Triage Warden</option>
                <option value="Casualty Medical Officer (CMO)">Casualty Medical Officer (CMO)</option>
                <option value="TRANSTAN Organ Coordinator">TRANSTAN Organ Coordinator</option>
                <option value="Blood Bank & Component Officer">Blood Bank & Component Officer</option>
              </select>
            </div>
            <p className="text-[11px] text-slate-500">
              Controls bed allocation permissions & telemetry broadcast.
            </p>
          </div>

          {/* Medical Officer Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 block">
              Medical Officer Name
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="e.g. Dr. S. Vimal, MD"
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
              </input>
            </div>
            <p className="text-[11px] text-slate-500">
              Logged in audit trail for all bed capacity changes.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleLaunch}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/25 transition active:scale-95"
            >
              <Bed className="w-4 h-4" />
              <span>Enter {selectedHospital.name.split(' ')[0]} Bed & Operations Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span>Sign In with Existing Credentials</span>
            </button>

            <button
              onClick={onSwitchToBasic}
              className="w-full sm:w-auto px-3.5 py-3 text-slate-500 hover:text-slate-800 text-xs font-semibold text-center"
            >
              Return to Citizen View
            </button>
          </div>
        </div>
      </div>

      {/* Feature Pillars of the Portal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bed className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Add & Manage Bed Availability</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Quickly add newly sanitized beds, register new ICU/Oxygen wards, admit patients, or release occupied beds with instantaneous 108 grid telemetry.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <Droplet className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Real-Time Blood Stock Balancing</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Update Whole Blood, PRBC, Platelet, and FFP units across all 8 blood groups with immediate state-wide SSE broadcasting.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">TRANSTAN Organ Allocation</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Log cadaveric donor availability, manage active waitlists, and coordinate life-saving organ green corridors under state protocols.
            </p>
          </div>
          <button
            onClick={() => handlePresetLogin('hosp-01', 'Dr. P. Sharmila (TRANSTAN)', 'TRANSTAN Organ Coordinator')}
            className="w-full mt-2 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
            <span>Open Organ Registry Desk</span>
          </button>
        </div>
      </div>

      {/* Regulatory & Safety Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 flex items-start gap-3 text-xs">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Hospital Clinical Operations & Bed Telemetry Standards</span>
          <p className="text-amber-800 leading-relaxed">
            All bed availability changes are broadcast to the Tamil Nadu 108 Emergency Ambulance network and rural PHC referral intake. Accurate bed counts ensure patients in critical distress are routed to the nearest hospital with ready ventilators and ICU staff.
          </p>
        </div>
      </div>
    </div>
  );
};

