import React from 'react';
import { ShieldCheck, Clock, AlertTriangle, Phone, Flag } from 'lucide-react';
import { Language } from '../../types';

interface DataFreshnessBadgeProps {
  updatedAt?: string;
  isVerified?: boolean;
  phone?: string;
  onReportDiscrepancy?: () => void;
  language?: Language;
  compact?: boolean;
}

export const DataFreshnessBadge: React.FC<DataFreshnessBadgeProps> = ({
  updatedAt,
  isVerified = true,
  phone,
  onReportDiscrepancy,
  language = 'en',
  compact = false
}) => {
  const calculateFreshness = () => {
    if (!updatedAt) {
      return {
        type: 'RECENTLY_UPDATED' as const,
        text: 'Recently Verified',
        sub: 'Within 2 hours',
        color: 'emerald'
      };
    }

    const diffMs = Date.now() - new Date(updatedAt).getTime();
    const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));

    if (diffHours < 6) {
      return {
        type: 'RECENTLY_UPDATED' as const,
        text: diffHours === 0 ? 'Verified & Fresh (<1h ago)' : `Verified & Fresh (${diffHours}h ago)`,
        sub: 'Active telemetry verified',
        color: 'emerald'
      };
    } else if (diffHours < 24) {
      return {
        type: 'NEEDS_CONFIRMATION' as const,
        text: `Needs Phone Confirmation (${diffHours}h ago)`,
        sub: 'Call provider before travelling',
        color: 'amber'
      };
    } else {
      const days = Math.floor(diffHours / 24);
      return {
        type: 'STALE' as const,
        text: `Stale Record (>24h ago)`,
        sub: 'Mandatory verification required',
        color: 'orange'
      };
    }
  };

  const fresh = calculateFreshness();

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            fresh.color === 'emerald'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : fresh.color === 'amber'
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-orange-100 text-orange-800 border border-orange-300'
          }`}
        >
          {fresh.color === 'emerald' ? (
            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
          ) : fresh.color === 'amber' ? (
            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-3 h-3 text-orange-600 shrink-0" />
          )}
          <span>{fresh.text}</span>
        </span>

        {isVerified && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-2.5 h-2.5 text-blue-600" />
            <span>Authorized Provider</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="p-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2">
        <div
          className={`p-1.5 rounded-xl shrink-0 ${
            fresh.color === 'emerald'
              ? 'bg-emerald-100 text-emerald-700'
              : fresh.color === 'amber'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-orange-100 text-orange-700'
          }`}
        >
          {fresh.color === 'emerald' ? (
            <ShieldCheck className="w-4 h-4" />
          ) : fresh.color === 'amber' ? (
            <Clock className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-black text-slate-800">{fresh.text}</span>
            {isVerified && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                Authorized Facility
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">{fresh.sub}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {phone && (
          <a
            href={`tel:${phone}`}
            className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-emerald-200 rounded-xl font-bold text-[11px] flex items-center gap-1 transition shadow-2xs"
            title="Call facility to verify availability before travelling"
          >
            <Phone className="w-3 h-3 text-emerald-600" />
            <span>Verify by Phone</span>
          </a>
        )}

        {onReportDiscrepancy && (
          <button
            type="button"
            onClick={onReportDiscrepancy}
            className="px-2 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-xl font-bold text-[11px] flex items-center gap-1 transition"
            title="Report incorrect phone number or stock discrepancy"
          >
            <Flag className="w-3 h-3 text-slate-400 group-hover:text-rose-500" />
            <span>Report Info</span>
          </button>
        )}
      </div>
    </div>
  );
};
