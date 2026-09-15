import React, { useState } from 'react';
import { X, Flag, CheckCircle2, AlertCircle, Phone, Building2 } from 'lucide-react';
import { Language } from '../../types';

interface ReportDiscrepancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: 'MEDICINE' | 'BED' | 'BLOOD' | 'ORGAN' | 'PHARMACY' | 'HOSPITAL';
  resourceId?: string;
  resourceName: string;
  facilityName: string;
  district: string;
  facilityPhone?: string;
  language?: Language;
  onSuccess?: (reportId: string) => void;
}

export const ReportDiscrepancyModal: React.FC<ReportDiscrepancyModalProps> = ({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  resourceName,
  facilityName,
  district,
  facilityPhone,
  language = 'en',
  onSuccess
}) => {
  const [issueType, setIssueType] = useState<'OUT_OF_STOCK' | 'INCORRECT_PHONE' | 'CLOSED_FACILITY' | 'WRONG_PRICE' | 'BEDS_FULL' | 'OTHER'>('OUT_OF_STOCK');
  const [reportedBy, setReportedBy] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportRef, setReportRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reports/incorrect-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType,
          resourceId: resourceId || 'res-custom',
          resourceName,
          facilityName,
          district,
          issueType,
          reportedBy: reportedBy.trim() || 'Anonymous Citizen',
          contactPhone: contactPhone.trim(),
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.report) {
        setSubmitted(true);
        setReportRef(data.report.id);
        if (onSuccess) onSuccess(data.report.id);
      } else {
        throw new Error(data.error || 'Failed to submit discrepancy report');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with health operations server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-label="Report Data Discrepancy"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20">
              <Flag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">Report Resource Discrepancy</h3>
              <p className="text-xs text-rose-100 font-medium">Keep rural healthcare data fresh and verified</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {submitted ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-lg">Thank You for Your Feedback!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Your report <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">{reportRef}</span> has been logged into the REVIVE Operations Audit Desk. The facility will be contacted for verification.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-6 py-2.5 bg-[#22819A] text-white rounded-xl font-bold text-xs shadow-md"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Target Resource Summary */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-500 font-medium">
                  <span>Target Resource:</span>
                  <span className="font-bold uppercase text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {resourceType}
                  </span>
                </div>
                <p className="font-extrabold text-slate-900 text-sm">{resourceName}</p>
                <div className="flex items-center gap-1.5 text-slate-600 pt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{facilityName} ({district})</span>
                </div>
                {facilityPhone && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Listed contact: {facilityPhone}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Issue Type */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  What issue did you encounter? *
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <option value="OUT_OF_STOCK">Item / Medicine is Out of Stock</option>
                  <option value="INCORRECT_PHONE">Phone number not reachable or incorrect</option>
                  <option value="CLOSED_FACILITY">Facility was closed during listed hours</option>
                  <option value="BEDS_FULL">Beds / ICU reported full on arrival</option>
                  <option value="WRONG_PRICE">Price significantly higher than listed</option>
                  <option value="OTHER">Other discrepancy or feedback</option>
                </select>
              </div>

              {/* Specific Details */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Observation Notes & Specifics *
                </label>
                <textarea
                  required
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Visited shop at 4:30 PM. Counter clerk said syrup is out of stock until Friday. Listed phone rang without answer."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              {/* Optional Reporter Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Your Name (Optional)</label>
                  <input
                    type="text"
                    value={reportedBy}
                    onChange={(e) => setReportedBy(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Your Phone (Optional)</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 94400 00000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 font-medium">
                <strong>Citizen Verification Policy:</strong> Flagged reports update the resource status to "Needs Phone Confirmation" until the provider or administrative team re-verifies.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[42px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md min-h-[42px] transition active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Verification Flag'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
