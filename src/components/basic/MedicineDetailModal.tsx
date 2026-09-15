import React, { useState, useEffect } from 'react';
import {
  X,
  Pill,
  ShieldAlert,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  Store,
  Phone,
  Navigation,
  Sparkles,
  TrendingDown,
  Globe,
  Share2,
  HeartPulse,
  Scale
} from 'lucide-react';
import { Medicine, MedicineInventoryItem, Language } from '../../types';
import { getEnrichedMedicineDetails } from '../../data/medicineDetails';

interface MedicineDetailModalProps {
  medicine: Medicine | MedicineInventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  userDistrict?: string;
  onOpenPharmacy?: (pharmacyId: string) => void;
}

export const MedicineDetailModal: React.FC<MedicineDetailModalProps> = ({
  medicine,
  isOpen,
  onClose,
  language: initialLanguage,
  userDistrict,
  onOpenPharmacy
}) => {
  const [modalLang, setModalLang] = useState<Language>(initialLanguage || 'en');
  const [activeTab, setActiveTab] = useState<'overview' | 'dosage' | 'savings' | 'safety' | 'stock'>('overview');
  const [nearbyPharmacies, setNearbyPharmacies] = useState<MedicineInventoryItem[]>([]);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setModalLang(initialLanguage || 'en');
  }, [initialLanguage]);

  // Fetch live pharmacies that have this medicine in stock
  useEffect(() => {
    if (!isOpen || !medicine) return;

    const medId = 'medicineId' in medicine ? medicine.medicineId : medicine.id;
    const medName = 'medicineName' in medicine ? medicine.medicineName : medicine.name;

    setLoadingPharmacies(true);
    const districtParam = userDistrict && userDistrict !== 'ALL' ? `&district=${encodeURIComponent(userDistrict)}` : '';
    const queryParam = medId ? `medicineId=${encodeURIComponent(medId)}` : `search=${encodeURIComponent(medName)}`;

    fetch(`/api/medicine-availability?${queryParam}${districtParam}`)
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setNearbyPharmacies(data.items);
        } else if (Array.isArray(data)) {
          setNearbyPharmacies(data);
        }
      })
      .catch(err => console.warn('Failed to fetch medicine pharmacies:', err))
      .finally(() => setLoadingPharmacies(false));
  }, [isOpen, medicine, userDistrict]);

  if (!isOpen || !medicine) return null;

  const medName = 'medicineName' in medicine ? medicine.medicineName : medicine.name;
  const genName = medicine.genericName;
  const category = medicine.category;
  const dosageForm = medicine.dosageForm || 'Tablet';
  const strength = medicine.strength || 'Standard';
  const isPrescription = 'prescriptionRequired' in medicine ? medicine.prescriptionRequired : false;

  const clinical = getEnrichedMedicineDetails(medicine as any);

  const handleShare = () => {
    const text = `${medName} (${strength}) - ${genName}\nCategory: ${category}\nStock in ${userDistrict || 'Tamil Nadu'}: ${nearbyPharmacies.length} pharmacies\nVerified via REVIVE Lifeline`;
    if (navigator.share) {
      navigator.share({ title: medName, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-label={`${medName} clinical details`}
      >
        {/* =========================================================================
            MODAL HEADER: Name, Strength, Prescription Badge & Controls
           ========================================================================= */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-[#1b5869] text-white flex flex-col gap-3 relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                <Pill className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    {medName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {strength}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/15 text-slate-200">
                    {dosageForm}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5 font-medium flex items-center gap-2">
                  <span>{genName}</span>
                  <span>•</span>
                  <span className="text-teal-300 font-semibold">{category}</span>
                </p>
              </div>
            </div>

            {/* Top Right Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 text-xs font-semibold flex items-center gap-1"
                title="Share medicine details"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sub-bar: Prescription Tag & Multilingual Reader Toggle */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              {isPrescription ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Prescription Required (Schedule H/H1)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Over The Counter (OTC / Safe Self-Care)
                </span>
              )}

              {'price' in medicine && medicine.price && (
                <span className="font-bold text-white bg-white/15 px-2.5 py-1 rounded-lg">
                  MRP ~₹{medicine.price}
                </span>
              )}
            </div>

            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/15">
              <Globe className="w-3.5 h-3.5 text-teal-300 ml-1" />
              <button
                onClick={() => setModalLang('en')}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition ${
                  modalLang === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setModalLang('ta')}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition ${
                  modalLang === 'ta' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                தமிழ்
              </button>
              <button
                onClick={() => setModalLang('hi')}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition ${
                  modalLang === 'hi' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            NAVIGATION TABS
           ========================================================================= */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-[#22819A] text-[#22819A]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Info className="w-4 h-4" />
            Overview & Uses
          </button>
          <button
            onClick={() => setActiveTab('dosage')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'dosage'
                ? 'border-[#22819A] text-[#22819A]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            Dosage & How to Take
          </button>
          <button
            onClick={() => setActiveTab('savings')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'savings'
                ? 'border-[#22819A] text-[#22819A]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingDown className="w-4 h-4 text-emerald-600" />
            Jan Aushadhi Savings
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'safety'
                ? 'border-[#22819A] text-[#22819A]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Warnings & Side Effects
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'stock'
                ? 'border-[#22819A] text-[#22819A]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4 text-teal-600" />
            Live Pharmacy Stock ({nearbyPharmacies.length})
          </button>
        </div>

        {/* =========================================================================
            TAB CONTENT CONTAINER
           ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar bg-slate-50/50">
          
          {/* TAB 1: OVERVIEW & USES */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Multilingual Highlight Banner */}
              {modalLang === 'ta' && (
                <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 text-xs sm:text-sm leading-relaxed">
                  <span className="font-extrabold text-teal-900 block mb-1">மருந்து வழிகாட்டுதல் (தமிழ்):</span>
                  {clinical.tamilDescription}
                </div>
              )}

              {modalLang === 'hi' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm leading-relaxed">
                  <span className="font-extrabold text-amber-900 block mb-1">दवा संबंधी जानकारी (हिंदी):</span>
                  {clinical.hindiDescription}
                </div>
              )}

              {/* Clinical Description Card */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 mb-2 text-[#22819A] font-bold text-xs uppercase tracking-wider">
                  <HeartPulse className="w-4 h-4" />
                  Clinical Overview & Indications
                </div>
                <p className="text-slate-800 text-sm sm:text-base leading-relaxed">
                  {clinical.detailedDescription}
                </p>
              </div>

              {/* What this Tablet is Used For */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  What is this tablet used for:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {clinical.indications.map((ind, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs sm:text-sm text-slate-700"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{ind}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mechanism of Action */}
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 text-xs sm:text-sm text-sky-950">
                <span className="font-bold block mb-1 text-sky-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#22819A]" />
                  How It Works (Mechanism of Action):
                </span>
                <p className="leading-relaxed text-sky-900">{clinical.mechanismOfAction}</p>
              </div>

              {/* Common Indian Brand Names */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Common Market & Government Brand Names:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {clinical.brandNames.map((brand, bIdx) => (
                    <span
                      key={bIdx}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOSAGE & HOW TO TAKE */}
          {activeTab === 'dosage' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Critical Dosage Safety Alert */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 text-sm">
                    Maximum Safe Limit: {clinical.dosageInstructions.maxDailyLimit}
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Exceeding the maximum daily threshold poses serious risks of acute hepatic (liver) damage.
                    Always observe the minimum interval between doses.
                  </p>
                </div>
              </div>

              {/* Adult vs Pediatric Dosages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Adult Dosage</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                      Standard Dose
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">
                    {clinical.dosageInstructions.adult}
                  </p>
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="font-bold">Recommended Frequency:</span> {clinical.dosageInstructions.frequency}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pediatric Dosage</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">
                      Children
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">
                    {clinical.dosageInstructions.pediatric}
                  </p>
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="font-bold">Administration Advice:</span> Use calibrated oral dropper/cup.
                  </div>
                </div>
              </div>

              {/* Administration & Timing */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#22819A]" />
                  Timing & How to Take:
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {clinical.dosageInstructions.timing}
                </p>
                <div className="pt-2 text-xs text-slate-500">
                  <span className="font-bold">Storage:</span> {clinical.storageInfo}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: JAN AUSHADHI COMPARISON */}
          {activeTab === 'savings' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-white/20 uppercase tracking-wider">
                      Government Jan Aushadhi Initiative
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black mt-2">
                      Save {clinical.janAushadhiComparison.savingsPercentage}% on this Tablet!
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
                      Pradhan Mantri Bhartiya Janaushadhi Pariyojana provides WHO-GMP certified generic medicines
                      at a fraction of private commercial brand prices.
                    </p>
                  </div>
                  <TrendingDown className="w-12 h-12 text-white/80 shrink-0 hidden sm:block" />
                </div>
              </div>

              {/* Comparison Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-5 rounded-2xl bg-emerald-50/80 border-2 border-emerald-400 shadow-xs">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                    Jan Aushadhi Generic (10 Tablets)
                  </span>
                  <div className="text-3xl font-black text-emerald-800 mt-1">
                    ₹{clinical.janAushadhiComparison.genericPrice.toFixed(2)}
                  </div>
                  <p className="text-xs text-emerald-700 mt-1">
                    Available at government Jan Aushadhi Kendras across Tamil Nadu
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Commercial Branded Equivalent
                  </span>
                  <div className="text-3xl font-black text-slate-700 mt-1">
                    ₹{clinical.janAushadhiComparison.brandedPrice.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Standard private retail pharmacy brand price for identical active therapeutic ingredient
                  </p>
                </div>
              </div>

              {/* Bioequivalence & Quality Guarantee */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed flex items-start gap-3">
                <Scale className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">Therapeutic Equivalence:</span>
                  Jan Aushadhi medicines undergo strict batch testing in NABL-accredited laboratories.
                  The active salt content and bioavailability are identical to expensive commercial brands.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WARNINGS & SIDE EFFECTS */}
          {activeTab === 'safety' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Precautions List */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="w-4 h-4" />
                  Key Precautions & Health Warnings:
                </h4>
                <div className="space-y-2">
                  {clinical.precautions.map((prec, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 text-xs sm:text-sm text-amber-950 flex items-start gap-2.5"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
                      <span>{prec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Side Effects Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Common & Mild Effects
                  </span>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                    {clinical.sideEffects.common.map((eff, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-slate-400">•</span>
                        <span>{eff}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                    Rare Serious Reactions (Seek Medical Help)
                  </span>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                    {clinical.sideEffects.rare.map((eff, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-red-900">
                        <span className="text-red-500 font-bold">•</span>
                        <span>{eff}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LIVE PHARMACY STOCK */}
          {activeTab === 'stock' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2 px-1">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    Nearby Pharmacies with {medName} in Stock
                  </h4>
                  <p className="text-xs text-slate-500">
                    Showing verified inventory in {userDistrict || 'Tamil Nadu'}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-teal-50 text-[#22819A] border border-teal-200">
                  {nearbyPharmacies.length} Pharmacies
                </span>
              </div>

              {loadingPharmacies && (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  Scanning regional pharmacy inventories...
                </div>
              )}

              {!loadingPharmacies && nearbyPharmacies.length === 0 && (
                <div className="py-10 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 p-6">
                  <Store className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-800">No stock currently found in {userDistrict || 'district'}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Try switching district in the top menu or contacting the nearest government hospital pharmacy.
                  </p>
                </div>
              )}

              {!loadingPharmacies && nearbyPharmacies.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-[#22819A]/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-bold text-slate-900 text-sm sm:text-base">
                        {item.pharmacyName}
                      </h5>
                      {item.is24x7 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                          24x7 Open
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status === 'AVAILABLE' ? `In Stock (${item.stockQuantity} units)` : 'Limited Stock'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1">
                      {item.pharmacyAddress} • {item.pharmacyDistrict}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-600 font-medium mt-1.5">
                      {item.distanceKm !== undefined && (
                        <span className="text-[#22819A] font-bold">
                          📍 {item.distanceKm.toFixed(1)} km away
                        </span>
                      )}
                      <span>₹{item.price} / unit</span>
                      {item.rackLocation && (
                        <span className="text-slate-400">Loc: {item.rackLocation}</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.pharmacyPhone && (
                      <a
                        href={`tel:${item.pharmacyPhone}`}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.pharmacyName + ' ' + item.pharmacyAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition active:scale-95"
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#22819A]" />
                      Map
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* =========================================================================
            MODAL FOOTER: Quick Action Station
           ========================================================================= */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium truncate">
            {nearbyPharmacies.length > 0 ? (
              <span className="text-emerald-700 font-bold">
                ✓ Available in {nearbyPharmacies.length} nearby registered pharmacies
              </span>
            ) : (
              <span>Lifeline inventory updated every 60 seconds</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('stock')}
              className="px-4 py-2 rounded-xl bg-[#22819A] hover:bg-[#1a667b] text-white text-xs font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5" />
              Check Nearby Stock
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
