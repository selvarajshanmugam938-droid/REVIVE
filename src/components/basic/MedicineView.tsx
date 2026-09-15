import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  Store,
  PhoneCall,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  Navigation,
  Share2,
  Sparkles,
  Info,
  ChevronRight,
  TrendingDown,
  ShieldAlert,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { MedicineInventoryItem, Pharmacy, Language } from '../../types';
import { getTranslation } from '../../locales';
import { MedicineDetailModal } from './MedicineDetailModal';
import { DataFreshnessBadge } from '../common/DataFreshnessBadge';
import { ReportDiscrepancyModal } from '../common/ReportDiscrepancyModal';

interface MedicineViewProps {
  language: Language;
  userDistrict: string;
  initialSearch?: string;
  initialViewMode?: 'MEDICINES' | 'PHARMACIES';
}

interface PharmacyWithStats extends Pharmacy {
  totalMedicines?: number;
  availableMedicines?: number;
  hasParacetamol?: boolean;
}

export const MedicineView: React.FC<MedicineViewProps> = ({
  language,
  userDistrict,
  initialSearch = '',
  initialViewMode = 'MEDICINES'
}) => {
  const t = getTranslation(language);

  // View Mode: Search by Medicine vs Search by Pharmacy
  const [viewMode, setViewMode] = useState<'MEDICINES' | 'PHARMACIES'>(initialViewMode);

  // Medicine Inventory State
  const [items, setItems] = useState<MedicineInventoryItem[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [pharmacyFilter, setPharmacyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [only24x7, setOnly24x7] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pharmacy Directory State
  const [pharmacies, setPharmacies] = useState<PharmacyWithStats[]>([]);
  const [pharmacySearch, setPharmacySearch] = useState('');
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);
  const [selectedPharmacyForStock, setSelectedPharmacyForStock] = useState<PharmacyWithStats | null>(null);
  const [pharmacyInventory, setPharmacyInventory] = useState<MedicineInventoryItem[]>([]);
  const [loadingPharmacyInventory, setLoadingPharmacyInventory] = useState(false);

  // Detailed Tablet Modal State
  const [selectedMedicine, setSelectedMedicine] = useState<MedicineInventoryItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [discrepancyData, setDiscrepancyData] = useState<{
    resourceType: 'MEDICINE' | 'BED' | 'BLOOD';
    resourceName: string;
    facilityName: string;
    district: string;
    phone?: string;
  } | null>(null);

  const quickFilterPills = [
    { label: language === 'ta' ? 'அனைத்தும்' : language === 'hi' ? 'सभी' : 'All Meds', query: '' },
    { label: language === 'ta' ? 'பாராசிட்டமால்' : language === 'hi' ? 'पैरासिटामोल' : 'Paracetamol', query: 'paracetamol' },
    { label: 'Dolo 650', query: 'dolo' },
    { label: language === 'ta' ? 'பாம்பு கடி மருந்து' : language === 'hi' ? 'एंटीवेनम' : 'Snake Antivenom', query: 'antivenom' },
    { label: language === 'ta' ? 'இன்சுலின்' : language === 'hi' ? 'इंसुलिन' : 'Insulin', query: 'insulin' },
    { label: 'ORS', query: 'ors' },
    { label: 'Azithromycin', query: 'azithromycin' },
    { label: 'Amoxicillin', query: 'amoxicillin' }
  ];

  // Fetch Medicine Availability (with typo tolerance handled by server)
  const fetchInventory = async (customSearch?: string, customPharm?: string) => {
    setLoading(true);
    try {
      const activeSearch = customSearch !== undefined ? customSearch : search.trim();
      const activePharm = customPharm !== undefined ? customPharm : pharmacyFilter.trim();

      const queryParams = new URLSearchParams({
        district: userDistrict,
        search: activeSearch,
        pharmacySearch: activePharm,
        statusFilter: statusFilter,
        only24x7: only24x7 ? 'true' : 'false'
      });

      const res = await fetch(`/api/medicine-availability?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.warn('Failed to fetch medicine availability:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Pharmacies Directory
  const fetchPharmacies = async (customQuery?: string) => {
    setLoadingPharmacies(true);
    try {
      const q = customQuery !== undefined ? customQuery : pharmacySearch.trim();
      const queryParams = new URLSearchParams({
        district: userDistrict,
        search: q,
        only24x7: only24x7 ? 'true' : 'false'
      });

      const res = await fetch(`/api/pharmacies?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPharmacies(data.pharmacies || []);
      }
    } catch (err) {
      console.warn('Failed to fetch pharmacies:', err);
    } finally {
      setLoadingPharmacies(false);
    }
  };

  // Fetch stock of a specific pharmacy when user clicks "View Available Stock"
  const viewPharmacyStock = async (pharmacy: PharmacyWithStats) => {
    setSelectedPharmacyForStock(pharmacy);
    setLoadingPharmacyInventory(true);
    try {
      const res = await fetch(`/api/medicine-availability?pharmacyId=${encodeURIComponent(pharmacy.id)}&district=${encodeURIComponent(userDistrict)}`);
      if (res.ok) {
        const data = await res.json();
        setPharmacyInventory(data.items || []);
      }
    } catch (err) {
      console.warn('Failed to fetch pharmacy inventory:', err);
    } finally {
      setLoadingPharmacyInventory(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'MEDICINES') {
      fetchInventory();
    } else {
      fetchPharmacies();
    }
  }, [viewMode, userDistrict, statusFilter, only24x7]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewMode === 'MEDICINES') {
      fetchInventory();
    } else {
      fetchPharmacies();
    }
  };

  const handleSelectPill = (q: string) => {
    setSearch(q);
    fetchInventory(q);
  };

  const handleOpenDetailModal = (item: MedicineInventoryItem) => {
    setSelectedMedicine(item);
    setIsDetailModalOpen(true);
  };

  const handleWhatsAppShare = (item: MedicineInventoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = encodeURIComponent(
      `*REVIVE Medical Stock Alert*\nMedicine: ${item.medicineName} (${item.strength})\nGeneric: ${item.genericName}\nPharmacy: ${item.pharmacyName}\nStatus: ${item.stockQuantity} units available (${item.status})\nPrice: ₹${item.price}\nContact: ${item.pharmacyPhone}\nAddress: ${item.pharmacyAddress}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const getStatusBadge = (status: string, stock: number) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.available} ({stock} {t.units})</span>
          </span>
        );
      case 'LIMITED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.limited} ({stock} {t.units})</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span>{t.outOfStock}</span>
          </span>
        );
    }
  };

  const formatUpdated = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin} min ago`;
      const diffHr = Math.floor(diffMin / 60);
      return `${diffHr} hr ago`;
    } catch (e) {
      return 'Recently';
    }
  };

  // Check if current search is a Paracetamol variant or common typo
  const isParacetamolSearch = /p[ae]r[ae]?[cs][aei]?[etm][a-z]*m[ao]l|parac[a-z]{2,8}ol|dolo|crocin|calpol/i.test(search);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      
      {/* =========================================================================
          CONTROL CENTER: Dual Mode Toggle (Medicines vs Pharmacies) & Filters
         ========================================================================= */}
      <div className="p-4 sm:p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-[#CDD4DD]/80 shadow-sm space-y-4">
        
        {/* Top Tier: Title, Mode Toggle & 24x7 Switch */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl shadow-xs">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {viewMode === 'MEDICINES' ? t.pillarMedicine : 'Pharmacy Directory & Search'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {viewMode === 'MEDICINES'
                  ? `${t.pillarMedicineDesc} • ${userDistrict}`
                  : `Verified retail & government pharmacies in ${userDistrict}`}
              </p>
            </div>
          </div>

          {/* Mode Switcher: Search Medicines vs Search Pharmacies */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('MEDICINES')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  viewMode === 'MEDICINES'
                    ? 'bg-white text-[#22819A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Search Medicines</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('PHARMACIES')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  viewMode === 'PHARMACIES'
                    ? 'bg-white text-[#22819A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Search Pharmacies</span>
              </button>
            </div>

            {/* 24x7 Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 min-h-[40px] transition">
              <input
                type="checkbox"
                checked={only24x7}
                onChange={(e) => setOnly24x7(e.target.checked)}
                className="w-4 h-4 text-[#22819A] rounded focus:ring-0 cursor-pointer"
              />
              <span className="hidden sm:inline">24x7 Pharmacies</span>
              <span className="sm:hidden">24x7</span>
            </label>
          </div>
        </div>

        {/* MODE A: MEDICINE SEARCH CONTROLS */}
        {viewMode === 'MEDICINES' && (
          <div className="space-y-3">
            {/* Quick Rural Medicine Pill Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#22819A]" />
                Quick:
              </span>
              {quickFilterPills.map((pill, idx) => {
                const isSelected = search.toLowerCase() === pill.query.toLowerCase();
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPill(pill.query)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition active:scale-95 shrink-0 ${
                      isSelected
                        ? 'bg-[#22819A] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Dual Search Input Bar: Medicine Query + Pharmacy Filter */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
              {/* Medicine Name Input */}
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
                  placeholder="Search medicine (e.g. Paracetamol, Dolo, Insulin)..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#22819A] focus:bg-white text-slate-900 rounded-2xl pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7] transition min-h-[44px]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => { setSearch(''); fetchInventory(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Pharmacy Name Filter Input */}
              <div className="md:col-span-3 relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={pharmacyFilter}
                  onChange={(e) => setPharmacyFilter(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
                  placeholder="Filter pharmacy name..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#22819A] focus:bg-white text-slate-900 rounded-2xl pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7] transition min-h-[44px]"
                />
                {pharmacyFilter && (
                  <button
                    type="button"
                    onClick={() => { setPharmacyFilter(''); fetchInventory(undefined, ''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    aria-label="Clear pharmacy filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="md:col-span-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-2xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7] min-h-[44px]"
                  aria-label="Filter by stock status"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="LIMITED">Limited</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>

              {/* Search Submit Button */}
              <div className="md:col-span-1">
                <button
                  type="button"
                  onClick={() => fetchInventory()}
                  className="w-full px-4 py-2.5 min-h-[44px] bg-[#22819A] hover:bg-[#1a667b] text-white rounded-2xl font-bold text-sm shadow-sm transition active:scale-95 flex items-center justify-center"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Smart Typo Detection Banner (e.g. for paracemotol / paracaetomol) */}
            {isParacetamolSearch && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Matched <strong>Paracetamol (Acetaminophen)</strong> for query "{search}".
                    Click any item below to view detailed clinical guidelines and dosage!
                  </span>
                </div>
                <button
                  onClick={() => {
                    const topItem = items.find(i => i.medicineName.toLowerCase().includes('paracetamol')) || items[0];
                    if (topItem) handleOpenDetailModal(topItem);
                  }}
                  className="px-2.5 py-1 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shrink-0"
                >
                  View Details & Dosage
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE B: PHARMACY DIRECTORY SEARCH CONTROLS */}
        {viewMode === 'PHARMACIES' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={pharmacySearch}
                  onChange={(e) => setPharmacySearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPharmacies()}
                  placeholder="Search pharmacy by name (e.g. Apollo, MedPlus, Jan Aushadhi, Thulasi) or location..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#22819A] focus:bg-white text-slate-900 rounded-2xl pl-10 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7] transition min-h-[44px]"
                />
                {pharmacySearch && (
                  <button
                    type="button"
                    onClick={() => { setPharmacySearch(''); fetchPharmacies(''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => fetchPharmacies()}
                className="px-6 py-2.5 min-h-[44px] bg-[#22819A] hover:bg-[#1a667b] text-white rounded-2xl font-bold text-sm shadow-sm transition active:scale-95 shrink-0"
              >
                Search Pharmacies
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Quick Pharmacy Searches:</span>
              {['Jan Aushadhi', 'Apollo', 'MedPlus', 'Thulasi'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => { setPharmacySearch(tag); fetchPharmacies(tag); }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          CONTENT SECTION: VIEW MODE A (MEDICINE INVENTORY CARDS)
         ========================================================================= */}
      {viewMode === 'MEDICINES' && (
        <div className="space-y-3 sm:space-y-4">
          {loading && (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <div className="w-8 h-8 border-3 border-[#22819A] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Checking live pharmacy stock...</p>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Pill className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">{t.noMedicinesFound}</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">{t.tryAnotherSearch}</p>
              <button
                onClick={() => { setSearch(''); setPharmacyFilter(''); setStatusFilter('ALL'); setOnly24x7(false); fetchInventory('', ''); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition min-h-[44px]"
              >
                Reset Filters
              </button>
            </div>
          )}

          {!loading && items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenDetailModal(item)}
              className="p-4 sm:p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 hover:border-[#22819A]/60 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer"
            >
              {/* Left: Medicine Info with Click-to-Inspect Hint */}
              <div className="space-y-2 flex-1">
                <div className="flex items-start sm:items-center justify-between sm:justify-start gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#22819A] transition flex items-center gap-1.5">
                      <span>{item.medicineName}</span>
                      <Info className="w-4 h-4 text-[#22819A] opacity-0 group-hover:opacity-100 transition" />
                    </h3>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.strength}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                      {item.dosageForm}
                    </span>
                  </div>
                  {getStatusBadge(item.status, item.stockQuantity)}
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
                  <span className="font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {item.genericName}
                  </span>
                  <span className="bg-teal-50 text-[#22819A] px-2.5 py-0.5 rounded-lg font-semibold border border-teal-100">
                    {item.category}
                  </span>
                  <span className="font-bold text-slate-800">
                    ₹{item.price} <span className="text-[10px] font-normal text-slate-500">/ pack</span>
                  </span>
                  {item.medicineName.toLowerCase().includes('paracetamol') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                      <TrendingDown className="w-3 h-3 text-emerald-600" />
                      Jan Aushadhi: ₹3.50
                    </span>
                  )}
                </div>

                {/* Pharmacy Location Details */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Store className="w-4 h-4 text-[#22819A] shrink-0" />
                    <span>{item.pharmacyName}</span>
                    {item.is24x7 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800">
                        24x7
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{item.pharmacyAddress}</span>
                    {item.distanceKm !== undefined && (
                      <span className="font-bold text-[#22819A] ml-1">({item.distanceKm.toFixed(1)} km)</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:ml-auto">
                    <DataFreshnessBadge
                      updatedAt={item.updatedAt}
                      verifiedByPhone={true}
                      onReportDiscrepancy={() => setDiscrepancyData({
                        resourceType: 'MEDICINE',
                        resourceName: item.medicineName,
                        facilityName: item.pharmacyName,
                        district: userDistrict,
                        phone: item.pharmacyPhone
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0 flex-wrap sm:flex-nowrap">
                {/* View Details Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetailModal(item);
                  }}
                  className="px-3.5 py-2.5 min-h-[44px] bg-[#22819A]/10 hover:bg-[#22819A]/20 text-[#22819A] border border-[#22819A]/30 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95"
                  title="View tablet description, dosage, side effects and savings"
                >
                  <Info className="w-4 h-4" />
                  <span>Details & Dosage</span>
                </button>

                {/* Direct Phone Call */}
                <a
                  href={`tel:${item.pharmacyPhone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{t.contact}</span>
                </a>

                {/* Directions on Map */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${item.pharmacyLat},${item.pharmacyLng}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-3.5 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95"
                  title="Open Directions"
                >
                  <Navigation className="w-4 h-4 text-[#22819A]" />
                  <span className="hidden sm:inline">{t.getDirections}</span>
                </a>

                {/* WhatsApp Share */}
                <button
                  type="button"
                  onClick={(e) => handleWhatsAppShare(item, e)}
                  className="p-2.5 min-h-[44px] min-w-[44px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl flex items-center justify-center transition active:scale-95"
                  title="Share via WhatsApp"
                  aria-label="Share via WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          CONTENT SECTION: VIEW MODE B (PHARMACY DIRECTORY CARDS)
         ========================================================================= */}
      {viewMode === 'PHARMACIES' && (
        <div className="space-y-3 sm:space-y-4">
          {loadingPharmacies && (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <div className="w-8 h-8 border-3 border-[#22819A] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Scanning regional registered pharmacies...</p>
            </div>
          )}

          {!loadingPharmacies && pharmacies.length === 0 && (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No pharmacies found matching "{pharmacySearch}"</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try searching for Jan Aushadhi, Apollo, or clearing the search box.
              </p>
              <button
                onClick={() => { setPharmacySearch(''); fetchPharmacies(''); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition min-h-[44px]"
              >
                Reset Search
              </button>
            </div>
          )}

          {!loadingPharmacies && pharmacies.map((pharmacy) => (
            <div
              key={pharmacy.id}
              className="p-4 sm:p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 hover:border-[#22819A]/60 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Pharmacy Overview */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {pharmacy.name}
                  </h3>
                  {pharmacy.is24x7 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                      24x7 Open
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                      Day Pharmacy
                    </span>
                  )}
                  {pharmacy.hasParacetamol && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Paracetamol In Stock
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{pharmacy.address} • {pharmacy.district}</span>
                  {pharmacy.distanceKm !== undefined && (
                    <span className="font-bold text-[#22819A] ml-1">({pharmacy.distanceKm.toFixed(1)} km away)</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 pt-1">
                  <span className="font-bold text-slate-800">
                    📦 {pharmacy.availableMedicines ?? pharmacy.totalMedicines ?? 50}+ Medicines Available
                  </span>
                  <span>•</span>
                  <span>License: TN-PHARM-{pharmacy.id.slice(-4)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0 flex-wrap sm:flex-nowrap">
                {/* View Stock Button */}
                <button
                  type="button"
                  onClick={() => viewPharmacyStock(pharmacy)}
                  className="px-4 py-2.5 min-h-[44px] bg-[#22819A] hover:bg-[#1a667b] text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition active:scale-95"
                >
                  <Pill className="w-4 h-4" />
                  <span>View Available Stock</span>
                </button>

                {/* Direct Phone Call */}
                <a
                  href={`tel:${pharmacy.phone}`}
                  className="px-3.5 py-2.5 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition active:scale-95"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call</span>
                </a>

                {/* Directions */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.lat},${pharmacy.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition active:scale-95"
                >
                  <Navigation className="w-4 h-4 text-[#22819A]" />
                  <span>Directions</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          DRAWER / POPUP: PHARMACY LIVE STOCK INVENTORY INSPECTOR
         ========================================================================= */}
      {selectedPharmacyForStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-[#1b5869] text-white flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-teal-300" />
                  <h3 className="font-bold text-base sm:text-lg text-white">
                    {selectedPharmacyForStock.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {selectedPharmacyForStock.address} • Contact: {selectedPharmacyForStock.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedPharmacyForStock(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-bold">Live Inventory ({pharmacyInventory.length} Items Listed)</span>
              <span>Click any tablet to view clinical dosage & instructions</span>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar">
              {loadingPharmacyInventory && (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">
                  Loading pharmacy medicines...
                </div>
              )}

              {!loadingPharmacyInventory && pharmacyInventory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    handleOpenDetailModal(item);
                  }}
                  className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs flex items-center justify-between gap-3 transition cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-[#22819A] transition">
                        {item.medicineName}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {item.strength}
                      </span>
                      {getStatusBadge(item.status, item.stockQuantity)}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.genericName} • ₹{item.price} / pack
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetailModal(item);
                      }}
                      className="px-2.5 py-1.5 bg-[#22819A]/10 hover:bg-[#22819A]/20 text-[#22819A] rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#22819A] transition" />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
              <a
                href={`tel:${selectedPharmacyForStock.phone}`}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Call Pharmacy ({selectedPharmacyForStock.phone})
              </a>
              <button
                onClick={() => setSelectedPharmacyForStock(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DETAILED MEDICINE & TABLET CLINICAL MODAL
         ========================================================================= */}
      <MedicineDetailModal
        medicine={selectedMedicine}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        language={language}
        userDistrict={userDistrict}
      />

      {/* Verification Discrepancy Reporting Modal */}
      {discrepancyData && (
        <ReportDiscrepancyModal
          isOpen={!!discrepancyData}
          onClose={() => setDiscrepancyData(null)}
          resourceType={discrepancyData.resourceType}
          resourceName={discrepancyData.resourceName}
          facilityName={discrepancyData.facilityName}
          district={discrepancyData.district}
          facilityPhone={discrepancyData.phone}
          onSubmitSuccess={() => {
            setDiscrepancyData(null);
          }}
        />
      )}
    </div>
  );
};
