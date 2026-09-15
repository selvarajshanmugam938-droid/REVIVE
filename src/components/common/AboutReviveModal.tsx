import React from 'react';
import { X, ShieldCheck, Heart, Radio, MapPin, Cpu, Activity, Stethoscope, AlertTriangle, CheckCircle2, Award, ArrowRight } from 'lucide-react';
import { ReviveLogo } from './ReviveLogo';
import { Language } from '../../types';

interface AboutReviveModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const AboutReviveModal: React.FC<AboutReviveModalProps> = ({
  isOpen,
  onClose,
  language = 'en'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-label="About REVIVE Platform"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-[#134958] to-[#22819A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ReviveLogo size="md" showTagline={false} isDark={true} />
            <div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-black tracking-wider border border-emerald-400/30">
                SMART INDIA HACKATHON 2026
              </span>
              <h2 className="text-lg sm:text-xl font-black leading-tight text-white mt-0.5">
                About REVIVE — Rural Healthcare Visibility Engine
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 text-slate-700 text-sm leading-relaxed">
          {/* Executive Summary */}
          <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200 space-y-2">
            <h3 className="font-extrabold text-[#22819A] text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#22819A]" />
              Platform Identity & Purpose
            </h3>
            <p className="text-xs sm:text-sm text-slate-800 font-medium">
              <strong>REVIVE</strong> is a rural healthcare-resource visibility and coordination platform designed for the <strong>Smart India Hackathon 2026</strong>. It connects citizens and primary healthcare centers (PHCs) with verified medicine stock, hospital bed availability, blood bank inventories, TRANSTAN organ transplant corridors, and digital hospital referral passes.
            </p>
          </div>

          {/* Core Problem */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-base">The Rural Healthcare Gap</h4>
            <p className="text-xs sm:text-sm text-slate-600">
              In rural and underserved communities, patients and families often travel 30–80 km to district headquarters without knowing if required life-saving medicines are in stock, if ICU or ventilator beds are open, or if matched blood is available. This lack of transparency causes critical delays, financial strain, and avoidable mortality.
            </p>
          </div>

          {/* Key Capabilities */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-base">Key Technical Innovations</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>Real-Time Visibility Grid</span>
                </div>
                <p className="text-slate-600">
                  Unified live telemetry across retail pharmacies, Jan Aushadhi Kendras, Government Headquarter Hospitals (GH), and private medical colleges.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <span>ESP32 Physical Kiosk Node</span>
                </div>
                <p className="text-slate-600">
                  Hardware REVIVE Box with INMP441 I2S microphone, MAX98357A audio amplifier, 16x2 LCD, and bidirectional telemetry for village panchayat offices.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  <span>Multilingual Voice Assistant</span>
                </div>
                <p className="text-slate-600">
                  Phonetically resilient conversational query answering in Tamil, Hindi, and English with strict non-hallucinatory grounded facts.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <Stethoscope className="w-4 h-4 text-rose-600" />
                  <span>Smart Referral Pass Workflow</span>
                </div>
                <p className="text-slate-600">
                  End-to-end digital transfer passes with QR validation, receiving hospital triage review, bed assignment, and 108 ambulance transit tracking.
                </p>
              </div>
            </div>
          </div>

          {/* Operational Boundaries & Medical Disclaimers */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2 text-xs">
            <h4 className="font-extrabold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              Platform Scope & Health Disclaimers
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-amber-900/90">
              <li><strong>Not a Delivery Service:</strong> REVIVE connects citizens with authorized physical providers and pharmacies; it does not ship or courier medications.</li>
              <li><strong>No Medical Diagnosis or Prescription:</strong> REVIVE does not prescribe medications, provide clinical diagnoses, or replace licensed physicians.</li>
              <li><strong>Verification First:</strong> Resource availability changes dynamically; citizens are instructed to call providers to verify before travelling.</li>
              <li><strong>Emergency Protocol:</strong> For life-threatening trauma or acute symptoms, users are immediately directed to call Emergency 108.</li>
            </ul>
          </div>

          {/* Prototype Implementation Notice */}
          <div className="p-3.5 bg-slate-100 rounded-2xl text-xs space-y-1 text-slate-600">
            <span className="font-bold text-slate-800 block">Demonstration State Notice</span>
            <p>
              This deployment is a fully operational Smart India Hackathon prototype operating on demonstration data across Tamil Nadu districts (Coimbatore, Erode, Salem, Madurai, Chennai). Real-world deployment integrates state HMIS, PMBI Jan Aushadhi, and TRANSTAN APIs.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#22819A] hover:bg-[#1a667b] text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 min-h-[44px]"
            >
              Close Briefing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
