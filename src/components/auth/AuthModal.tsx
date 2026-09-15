import React, { useState } from 'react';
import { X, User as UserIcon, Store, ShieldCheck, Lock, Mail, Phone, MapPin, Sparkles, Building2, HeartHandshake } from 'lucide-react';
import { ReviveLogo } from '../common/ReviveLogo';
import { User, UserRole, Language } from '../../types';
import { getTranslation } from '../../locales';
import { sampleDistricts, seedHospitals } from '../../../server/seedData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSuccess: (user: User, token: string) => void;
  initialRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  language,
  onSuccess,
  initialRole
}) => {
  const t = getTranslation(language);
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<UserRole>(initialRole || 'USER');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Coimbatore');
  const [pharmacyName, setPharmacyName] = useState('');
  const [hospitalId, setHospitalId] = useState('hosp-02'); // CMCH default
  const [hospitalStaffRole, setHospitalStaffRole] = useState('Senior Medical Officer (Blood Bank & TRANSTAN)');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isRegister ? '/api/auth/register' : '/api/auth/login';
    const selectedHosp = seedHospitals.find(h => h.id === hospitalId);
    const payload = isRegister
      ? {
          name,
          email,
          password,
          role,
          district,
          phone,
          pharmacyName,
          hospitalId: role === 'HOSPITAL' ? hospitalId : undefined,
          hospitalName: role === 'HOSPITAL' ? selectedHosp?.name : undefined,
          hospitalStaffRole: role === 'HOSPITAL' ? hospitalStaffRole : undefined
        }
      : { email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoRole: UserRole) => {
    setError(null);
    setLoading(true);
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
        onSuccess(data.user, data.token);
        onClose();
      } else {
        throw new Error(data.error || 'Demo login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleHospitalFastLogin = async (hospId: string, customStaffRole?: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/hospital-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: hospId,
          staffRole: customStaffRole || hospitalStaffRole || 'Chief Medical Officer & Bed In-Charge'
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onSuccess(data.user, data.token);
        onClose();
      } else {
        throw new Error(data.error || 'Hospital sign in failed');
      }
    } catch (err: any) {
      setError(err.message || 'Hospital sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-label="Authentication"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#22819A] to-[#1a667b] text-white flex items-center justify-between">
          <ReviveLogo size="sm" showTagline={false} isDark={true} />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              {isRegister ? 'Create REVIVE Account' : 'Welcome to REVIVE'}
            </h3>
            <p className="text-xs text-slate-500">
              {isRegister
                ? 'Register to manage patient care, pharmacy stock, or hospital blood & organs'
                : 'Sign in to access your designated health operations desk'}
            </p>
          </div>

          {/* Role Selector (when registering) */}
          {isRegister && (
            <div className="flex rounded-2xl bg-slate-100 p-1 gap-1">
              <button
                type="button"
                onClick={() => setRole('USER')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 min-h-[38px] ${
                  role === 'USER' ? 'bg-[#22819A] text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Citizen</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('PHARMACY')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 min-h-[38px] ${
                  role === 'PHARMACY' ? 'bg-[#22819A] text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Pharmacy</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('HOSPITAL')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 min-h-[38px] ${
                  role === 'HOSPITAL' ? 'bg-red-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Hospital / Organs</span>
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {role === 'HOSPITAL' ? 'Medical Officer / Coordinator Name' : 'Full Name'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'HOSPITAL' ? 'e.g. Dr. R. Kavitha' : 'e.g. Ramesh Kumar'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                />
              </div>
            )}

            {isRegister && role === 'PHARMACY' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pharmacy / Medicals Name</label>
                <input
                  type="text"
                  required
                  value={pharmacyName}
                  onChange={(e) => setPharmacyName(e.target.value)}
                  placeholder="e.g. Sri Balaji Medicals"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                />
              </div>
            )}

            {isRegister && role === 'HOSPITAL' && (
              <div className="space-y-3 p-3 bg-red-50/70 rounded-2xl border border-red-100">
                <div>
                  <label className="text-xs font-bold text-red-950 block mb-1">Select Hospital / Medical Center</label>
                  <select
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    className="w-full bg-white border border-red-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                  >
                    {seedHospitals.map(h => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.district})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-red-950 block mb-1">Staff Designation / Unit</label>
                  <input
                    type="text"
                    required
                    value={hospitalStaffRole}
                    onChange={(e) => setHospitalStaffRole(e.target.value)}
                    placeholder="e.g. Blood Bank In-Charge & TRANSTAN Liaison"
                    className="w-full bg-white border border-red-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'HOSPITAL' ? 'hospital@revive.demo' : 'name@example.com'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                />
              </div>
            </div>

            {isRegister && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 94400 00000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">District</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-800"
                  >
                    {sampleDistricts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 min-h-[46px] bg-[#22819A] hover:bg-[#1a667b] text-white font-black text-sm rounded-xl shadow-md transition active:scale-98 disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Sign In Buttons */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block text-center">
              ⚡ 1-Click Fast Role Sign-In
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('USER')}
                className="p-2 bg-teal-50 hover:bg-teal-100 text-[#22819A] border border-teal-200 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 min-h-[46px]"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span className="text-[10px]">Citizen</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('PHARMACY')}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 min-h-[46px]"
              >
                <Store className="w-3.5 h-3.5" />
                <span className="text-[10px]">Pharmacy</span>
              </button>
              <button
                type="button"
                onClick={() => handleHospitalFastLogin(hospitalId, hospitalStaffRole)}
                className="p-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-0.5 min-h-[46px]"
                title="Hospital Bed, ICU & Organ Telemetry Desk"
              >
                <HeartHandshake className="w-3.5 h-3.5 text-red-600" />
                <span className="text-[10px]">Hospital Desk</span>
              </button>
            </div>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="text-xs text-[#22819A] font-bold hover:underline"
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
