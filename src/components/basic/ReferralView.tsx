import React, { useState, useEffect } from 'react';
import {
  Share2,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Hospital,
  ArrowRight,
  User as UserIcon,
  PhoneCall,
  FileText,
  QrCode,
  Check,
  XCircle,
  Truck,
  BedDouble,
  Stethoscope,
  Filter,
  Download,
  Printer
} from 'lucide-react';
import { Referral, Language, User } from '../../types';
import { getTranslation } from '../../locales';

interface ReferralViewProps {
  language: Language;
  user: User | null;
  userDistrict: string;
}

export const ReferralView: React.FC<ReferralViewProps> = ({
  language,
  user,
  userDistrict
}) => {
  const t = getTranslation(language);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState<Referral | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  // Form state
  const [patientName, setPatientName] = useState(user?.name || '');
  const [patientAge, setPatientAge] = useState('45');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientPhone, setPatientPhone] = useState(user?.phone || '+91 98400 11223');
  const [fromFacility, setFromFacility] = useState(`${userDistrict} Primary Health Center (PHC)`);
  const [toHospitalName, setToHospitalName] = useState('Coimbatore Medical College Hospital (CMCH)');
  const [urgency, setUrgency] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('URGENT');
  const [symptoms, setSymptoms] = useState('');
  const [requiredSpecialty, setRequiredSpecialty] = useState('Cardiology & Intensive Care');
  const [submitting, setSubmitting] = useState(false);

  // Triage Action State
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [assignedBed, setAssignedBed] = useState('ICU-04');
  const [actionNote, setActionNote] = useState('');
  const [performingAction, setPerformingAction] = useState(false);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      // If user is citizen, show their own passes; if hospital staff or admin, show all referrals
      const isStaffOrAdmin = user?.role === 'HOSPITAL' || user?.role === 'ADMIN';
      const endpoint = isStaffOrAdmin ? '/api/referrals' : `/api/referrals${user ? `?userId=${user.id}` : ''}`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setReferrals(data.referrals || []);
      }
    } catch (err) {
      console.warn('Failed to fetch referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [user]);

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !symptoms) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          patientName,
          patientAge: parseInt(patientAge, 10) || 40,
          patientGender,
          patientPhone,
          fromFacility,
          toHospitalName,
          urgency,
          reason: symptoms,
          requiredSpecialty,
          referralDistrict: userDistrict
        })
      });

      if (res.ok) {
        const data = await res.json();
        setShowForm(false);
        setSymptoms('');
        fetchReferrals();
        if (data.referral) {
          setSelectedPass(data.referral);
        }
      }
    } catch (err) {
      console.warn('Referral creation error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTriageAction = async (id: string, action: 'ACCEPT' | 'REJECT' | 'TRAVELLING' | 'ARRIVED' | 'COMPLETE') => {
    setPerformingAction(true);
    try {
      const res = await fetch(`/api/referrals/${id}/action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          bedAssigned: action === 'ACCEPT' ? assignedBed : undefined,
          note: actionNote || (action === 'ACCEPT' ? 'Bed pre-allocated and clinical team notified' : undefined),
          actorName: user?.name || 'Hospital Triage Team'
        })
      });

      if (res.ok) {
        setActioningId(null);
        setActionNote('');
        fetchReferrals();
      }
    } catch (err) {
      console.warn('Triage action error:', err);
    } finally {
      setPerformingAction(false);
    }
  };

  const getUrgencyBadge = (urg: string) => {
    switch (urg) {
      case 'EMERGENCY':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">EMERGENCY</span>;
      case 'URGENT':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">URGENT</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">ROUTINE</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">Pending Triage</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">Under Review</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Accepted • Bed Reserved</span>;
      case 'PATIENT_TRAVELLING':
      case 'AMBULANCE_DISPATCHED':
        return <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">108 Ambulance En Route</span>;
      case 'ARRIVED':
        return <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">Arrived at Casualty</span>;
      case 'COMPLETED':
      case 'ADMITTED':
        return <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">Transfer Completed</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">Diverted / Rejected</span>;
      default:
        return <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const filteredReferrals = referrals.filter(r => {
    if (statusFilter === 'ACTIVE') {
      return ['REQUESTED', 'UNDER_REVIEW', 'ACCEPTED', 'PATIENT_TRAVELLING', 'ARRIVED'].includes(r.status);
    }
    if (statusFilter === 'COMPLETED') {
      return ['COMPLETED', 'ADMITTED', 'REJECTED'].includes(r.status);
    }
    return true;
  });

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Title & Action */}
      <div className="p-4 sm:p-5 bg-white/90 backdrop-blur-md rounded-3xl border border-[#CDD4DD]/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-teal-100 text-teal-700 rounded-2xl">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Smart Referral & Triage Workflow
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Digital Clinic-to-Tertiary Transfer Passes with Bed Pre-Allocation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter pills */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition ${statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
            >
              All ({referrals.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-lg transition ${statusFilter === 'ACTIVE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
            >
              Active ({referrals.filter(r => ['REQUESTED', 'UNDER_REVIEW', 'ACCEPTED', 'PATIENT_TRAVELLING'].includes(r.status)).length})
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-2.5 py-1 rounded-lg transition ${statusFilter === 'COMPLETED' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
            >
              Done
            </button>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 min-h-[44px] bg-[#22819A] hover:bg-[#1a667b] text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showForm ? 'Close Form' : 'Generate Referral Pass'}</span>
          </button>
        </div>
      </div>

      {/* New Referral Creation Form */}
      {showForm && (
        <form
          onSubmit={handleSubmitReferral}
          className="p-5 sm:p-6 bg-white rounded-3xl border-2 border-[#22819A]/30 shadow-lg space-y-4 animate-in slide-in-from-top duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Generate Official PHC-to-Hospital Referral Pass
              </h3>
              <p className="text-xs text-slate-500">
                Creates a QR-authenticated digital transit slip transmitted instantly to receiving triage desks.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800">
              TAMIL NADU HMIS SYNC
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Patient Full Name *</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Murugan S"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Age & Gender</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="Age"
                  className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm font-medium"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Attendant / Patient Phone *</label>
              <input
                type="tel"
                required
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="+91 94400 00000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Urgency Priority</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800"
              >
                <option value="ROUTINE">Routine (Elective Consultation)</option>
                <option value="URGENT">Urgent (Within 6 Hours)</option>
                <option value="EMERGENCY">Emergency (Immediate 108 Transit)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Origin Facility (PHC / Sub-Center)</label>
              <input
                type="text"
                value={fromFacility}
                onChange={(e) => setFromFacility(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Destination Tertiary Hospital</label>
              <input
                type="text"
                value={toHospitalName}
                onChange={(e) => setToHospitalName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Required Clinical Specialty</label>
              <input
                type="text"
                value={requiredSpecialty}
                onChange={(e) => setRequiredSpecialty(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Clinical Diagnosis & Indications *</label>
              <input
                type="text"
                required
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g. Acute severe chest pain radiating to left arm. ST elevation on ECG."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-[#22819A] hover:bg-[#1a667b] text-white text-xs font-bold rounded-xl shadow-md min-h-[44px] transition active:scale-95"
            >
              {submitting ? 'Transmitting Digital Pass...' : 'Generate Verified Referral Pass'}
            </button>
          </div>
        </form>
      )}

      {/* QR Pass Detail Modal */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-6 h-6 text-[#22819A]" />
                <h3 className="font-extrabold text-slate-900 text-base">Digital Referral Pass</h3>
              </div>
              <button
                onClick={() => setSelectedPass(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* QR Mock graphic */}
            <div className="bg-slate-50 border-2 border-dashed border-[#22819A]/40 rounded-2xl p-6 text-center space-y-2">
              <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl shadow border border-slate-200 flex flex-col items-center justify-center relative">
                {/* SVG QR Code Simulation */}
                <div className="grid grid-cols-6 gap-1 w-full h-full p-1 bg-slate-950 rounded">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        (i % 2 === 0 || i % 5 === 0) && i !== 7 && i !== 14
                          ? 'bg-white'
                          : 'bg-slate-950'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="font-mono text-xs font-black text-slate-800 tracking-wider">
                {selectedPass.tokenCode}
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                Scan at Hospital Triage Reception for Instant Priority Admission
              </p>
            </div>

            {/* Key Pass Details */}
            <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <p><strong>Patient:</strong> {selectedPass.patientName} ({selectedPass.patientAge}y, {selectedPass.patientGender})</p>
              <p><strong>Transfer Destination:</strong> {selectedPass.toHospitalName}</p>
              <p><strong>Specialty:</strong> {selectedPass.requiredSpecialty}</p>
              <p><strong>Status:</strong> {selectedPass.status.replace(/_/g, ' ')}</p>
              {selectedPass.assignedBed && (
                <p className="text-emerald-700 font-bold">
                  <strong>Bed Allocated:</strong> {selectedPass.assignedBed} ({selectedPass.assignedWard})
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Pass</span>
              </button>
              <button
                onClick={() => setSelectedPass(null)}
                className="flex-1 py-2 bg-[#22819A] hover:bg-[#1a667b] text-white font-bold text-xs rounded-xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referrals List */}
      <div className="space-y-4">
        {loading && (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <div className="w-8 h-8 border-3 border-[#22819A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium">Fetching referral tracking records...</p>
          </div>
        )}

        {!loading && filteredReferrals.length === 0 && (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <Share2 className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No active referral passes</h3>
            <p className="text-xs text-slate-500">Tap "Generate Referral Pass" to initiate a clinical transfer.</p>
          </div>
        )}

        {!loading && filteredReferrals.map((ref) => (
          <div
            key={ref.id}
            className="p-4 sm:p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 hover:border-[#22819A]/50 shadow-sm transition-all duration-200 space-y-4"
          >
            {/* Header with Token Code */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-black bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                    {ref.tokenCode}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">
                    {ref.patientName} ({ref.patientAge}y / {ref.patientGender})
                  </h3>
                  {getUrgencyBadge(ref.urgency)}
                  {getStatusBadge(ref.status)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Requested: {new Date(ref.createdAt).toLocaleDateString()} at {new Date(ref.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedPass(ref)}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Show QR Pass</span>
                </button>

                {ref.patientPhone && (
                  <a
                    href={`tel:${ref.patientPhone}`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
                    <span>{ref.patientPhone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Transfer Route */}
            <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-50 rounded-2xl text-xs text-slate-700 border border-slate-200">
              <div className="flex items-center gap-2 flex-1">
                <Hospital className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Origin Clinic</span>
                  <span className="font-bold">{ref.fromFacility}</span>
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-[#22819A] hidden sm:block shrink-0" />

              <div className="flex items-center gap-2 flex-1">
                <Hospital className="w-4 h-4 text-[#22819A] shrink-0" />
                <div>
                  <span className="text-[10px] text-[#22819A] block uppercase font-bold">Receiving Facility</span>
                  <span className="font-bold">{ref.toHospitalName}</span>
                </div>
              </div>
            </div>

            {/* Reason & Specialist */}
            <div className="text-xs text-slate-600 space-y-1">
              <p><strong>Clinical Reason:</strong> {ref.reason}</p>
              <p><strong>Required Specialty:</strong> <span className="text-[#22819A] font-bold">{ref.requiredSpecialty}</span></p>
              {ref.assignedBed && (
                <p className="text-emerald-800 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  Bed Allocated: {ref.assignedBed} ({ref.assignedWard || 'Emergency Ward'})
                </p>
              )}
              {ref.triageNotes && (
                <p className="text-slate-500 italic">
                  <strong>Triage Notes:</strong> {ref.triageNotes}
                </p>
              )}
            </div>

            {/* Hospital Clinical Triage Action Controls */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Triage Transition Actions
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                {ref.status === 'REQUESTED' && (
                  <>
                    <button
                      onClick={() => {
                        setActioningId(ref.id);
                        setAssignedBed('ICU Bed 03');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Accept & Allocate Bed</span>
                    </button>
                    <button
                      onClick={() => handleTriageAction(ref.id, 'REJECT')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold"
                    >
                      Divert / Reject
                    </button>
                  </>
                )}

                {ref.status === 'ACCEPTED' && (
                  <button
                    onClick={() => handleTriageAction(ref.id, 'TRAVELLING')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Dispatch 108 Ambulance</span>
                  </button>
                )}

                {ref.status === 'PATIENT_TRAVELLING' && (
                  <button
                    onClick={() => handleTriageAction(ref.id, 'ARRIVED')}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <BedDouble className="w-3.5 h-3.5" />
                    <span>Confirm Casualty Arrival</span>
                  </button>
                )}

                {ref.status === 'ARRIVED' && (
                  <button
                    onClick={() => handleTriageAction(ref.id, 'COMPLETE')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete Admission</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Bed Allocation Modal if actioning */}
            {actioningId === ref.id && (
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-300 space-y-2">
                <h4 className="font-bold text-xs text-emerald-950">Allocate Bed for {ref.patientName}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">Ward / Bed Number</label>
                    <input
                      type="text"
                      value={assignedBed}
                      onChange={(e) => setAssignedBed(e.target.value)}
                      placeholder="e.g. ICU-02 or Emergency Triage Bed 04"
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">Triage Note</label>
                    <input
                      type="text"
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="e.g. Cardiologist paged. Cath lab ready."
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActioningId(null)}
                    className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriageAction(ref.id, 'ACCEPT')}
                    disabled={performingAction}
                    className="px-4 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow"
                  >
                    {performingAction ? 'Allocating...' : 'Confirm Bed & Accept'}
                  </button>
                </div>
              </div>
            )}

            {/* Timeline Milestones */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Live Timeline</span>
              <div className="space-y-1.5">
                {ref.timeline.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-slate-800">{step.label || step.status.replace(/_/g, ' ')}</span>
                    {step.actor && <span className="text-slate-400 text-[11px]">({step.actor})</span>}
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
