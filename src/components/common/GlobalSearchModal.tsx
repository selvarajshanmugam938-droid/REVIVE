import React, { useState, useEffect } from 'react';
import { Search, X, Pill, Hospital, Droplet, Heart, Store, ArrowRight, MapPin, Loader2 } from 'lucide-react';
import { GlobalSearchResult, Language } from '../../types';
import { getTranslation } from '../../locales';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  userDistrict: string;
  onSelectResult: (result: GlobalSearchResult) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  language,
  userDistrict,
  onSelectResult
}) => {
  const t = getTranslation(language);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&district=${encodeURIComponent(userDistrict)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, userDistrict]);

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'MEDICINE': return <Pill className="w-5 h-5 text-emerald-600" />;
      case 'HOSPITAL': return <Hospital className="w-5 h-5 text-blue-600" />;
      case 'BLOOD': return <Droplet className="w-5 h-5 text-red-600" />;
      case 'ORGAN': return <Heart className="w-5 h-5 text-purple-600" />;
      case 'PHARMACY': return <Store className="w-5 h-5 text-teal-600" />;
      default: return <Search className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        role="dialog"
        aria-modal="true"
        aria-label="Global Search"
      >
        {/* Search Input Box */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
          <Search className="w-6 h-6 text-[#22819A] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="flex-1 bg-transparent text-slate-900 text-base sm:text-lg font-medium placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              aria-label="Clear search text"
            >
              ✕
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 transition"
          >
            ESC
          </button>
        </div>

        {/* Results Stream */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#22819A]" />
              <span className="text-xs font-medium">Searching live database...</span>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <p className="font-semibold text-slate-800">{t.noMedicinesFound}</p>
              <p className="text-xs text-slate-400 mt-1">{t.tryAnotherSearch}</p>
            </div>
          )}

          {!loading && results.map((result) => (
            <button
              key={result.id}
              onClick={() => {
                onSelectResult(result);
                onClose();
              }}
              className="w-full p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-100 hover:border-[#22819A]/40 shadow-sm flex items-center justify-between text-left transition group active:scale-99 min-h-[60px]"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-2xl bg-slate-100 group-hover:bg-[#90C2E7]/20 transition shrink-0">
                  {getIcon(result.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-[#22819A] transition">
                      {result.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {result.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{result.subtitle}</p>
                  {result.district && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#22819A] font-medium mt-1">
                      <MapPin className="w-3 h-3" />
                      {result.district} {result.distanceKm ? `(${result.distanceKm} km)` : ''}
                    </span>
                  )}
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-[#22819A] group-hover:translate-x-0.5 transition shrink-0 ml-2" />
            </button>
          ))}

          {!query && (
            <div className="py-6 px-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Suggestions</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {['Paracetamol', 'ICU Beds', 'O+ Blood', 'Amoxicillin', 'Dialysis Hospital', 'Insulin'].map((sug) => (
                  <button
                    key={sug}
                    onClick={() => setQuery(sug)}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-[#90C2E7]/15 border border-slate-200 text-left text-xs font-semibold text-slate-700 transition"
                  >
                    🔍 {sug}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
