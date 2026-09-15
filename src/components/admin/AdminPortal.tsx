import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Store,
  HeartHandshake,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Search,
  Filter,
  Users,
  FileText,
  Radio,
  Check,
  X,
  PhoneCall,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { User, Language, AuditLogEntry, DiscrepancyReport } from '../../types';

interface AdminPortalProps {
  user: User;
  language?: Language;
  onResetDemoSuccess?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ user, language, onResetDemoSuccess }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [reports, setReports] = useState<DiscrepancyReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'METRICS' | 'REPORTS' | 'AUDIT' | 'RESET'>('METRICS');
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resetting, setResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [mRes, rRes, aRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/reports'),
        fetch('/api/audit-logs?limit=40')
      ]);

      if (mRes.ok) {
        const mData = await mRes.json();
        setMetrics(mData.metrics);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        setReports(rData.reports || []);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        setAuditLogs(aData.logs || []);
      }
    } catch (err) {
      console.warn('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleResolveReport = async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'RESOLVED',
          notes: resolutionNote || 'Stock verified with facility manager by phone'
        })
      });
      if (res.ok) {
        setResolvingId(null);
        setResolutionNote('');
        fetchAdminData();
      }
    } catch (err) {
      console.warn('Failed to resolve report:', err);
    }
  };

  const handleResetDemo = async () => {
    setResetting(true);
    setResetMessage(null);
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResetMessage(data.message || 'Demo state restored successfully.');
        setShowConfirmReset(false);
        fetchAdminData();
        onResetDemoSuccess?.();
      }
    } catch (err) {
      setResetMessage('Reset request failed. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow">
            <ShieldCheck className="w-7 h-7 text-[#90C2E7]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Health Operations & Audit Administration
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                ADMIN ACCESS
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Logged in as {user.name} • Tamil Nadu Health Resource Grid Monitor
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-2xl bg-slate-100 p-1 gap-1 self-start md:self-center overflow-x-auto no-scrollbar max-w-full w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('METRICS')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'METRICS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>Telemetry & Impact</span>
          </button>
          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'REPORTS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Discrepancy Inbox ({reports.filter(r => r.status === 'PENDING').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'AUDIT' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>System Audit Trail</span>
          </button>
          <button
            onClick={() => setActiveTab('RESET')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'RESET' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>Demo Reset</span>
          </button>
        </div>
      </div>

      {/* TAB 1: METRICS & IMPACT */}
      {activeTab === 'METRICS' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Authorized Providers</span>
                <Building2 className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">
                {metrics?.facilities?.total || '32'}
              </p>
              <p className="text-[11px] text-slate-500">
                {metrics?.facilities?.hospitals || 4} Hospitals • {metrics?.facilities?.pharmacies || 20} Pharmacies • {metrics?.facilities?.bloodBanks || 8} Blood Banks
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Critical Bed Grid</span>
                <Activity className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">
                {metrics?.beds?.icuBedsAvailable ?? 12}
                <span className="text-sm font-bold text-slate-400"> / {metrics?.beds?.icuBedsTotal ?? 48} ICU</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Total Available: {metrics?.beds?.availableBeds ?? 142} beds • Occupancy {metrics?.beds?.occupancyRate ?? 68}%
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Blood Ready Units</span>
                <HeartHandshake className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">
                {metrics?.blood?.totalUnits ?? 384}
                <span className="text-xs font-bold text-emerald-600 ml-1">Units</span>
              </p>
              <p className="text-[11px] text-slate-500">
                {metrics?.blood?.criticalShortages ? `${metrics?.blood?.criticalShortages} shortages flagged` : 'All blood groups stocked'}
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Active Smart Referrals</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">
                {metrics?.referrals?.active ?? 2}
                <span className="text-xs font-bold text-slate-400 ml-1">In Transit</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Total Processed: {metrics?.referrals?.total ?? 6} passes • Bed Triage Active
              </p>
            </div>
          </div>

          {/* System Telemetry & IoT Health Status */}
          <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600" />
              <span>Hardware & Edge Telemetry Health</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-bold block mb-0.5">ESP32 KIOSK NODES</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {metrics?.systemHealth?.iotNodesOnline ?? 2} Online / {metrics?.systemHealth?.totalIoTNodes ?? 2} Total
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Village Panchayat Telemetry Active</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-bold block mb-0.5">DATA VERIFICATION RATE</span>
                <span className="font-extrabold text-blue-700 text-sm">96.4% Verified</span>
                <p className="text-[10px] text-slate-500 mt-1">Provider telemetry updated &lt; 6h</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-400 font-bold block mb-0.5">LAST AUDIT EVENT</span>
                <span className="font-extrabold text-slate-800 text-sm">
                  {metrics?.systemHealth?.lastAuditTimestamp ? new Date(metrics.systemHealth.lastAuditTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Immutable session ledger tracking</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISCREPANCY REPORTS INBOX */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-3xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Citizen Discrepancy & Stock Reports</h3>
              <p className="text-xs text-slate-500">
                Community feedback flagging out-of-stock items, wrong numbers, or bed shortages.
              </p>
            </div>
            <button
              onClick={fetchAdminData}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Refresh Inbox
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-700">No active discrepancies</p>
              <p className="text-xs text-slate-500">All healthcare records are verified and aligned.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                    rep.status === 'RESOLVED'
                      ? 'bg-slate-50/70 border-slate-200 opacity-80'
                      : 'bg-white border-amber-300 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black bg-slate-900 text-white px-2.5 py-0.5 rounded">
                        {rep.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        rep.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        {rep.status}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {rep.resourceName} ({rep.resourceType})
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium">
                      Reported: {new Date(rep.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>

                  <div className="py-2.5 space-y-1.5 text-xs text-slate-600">
                    <p>
                      <strong>Facility:</strong> {rep.facilityName} ({rep.district})
                    </p>
                    <p>
                      <strong>Issue Flagged:</strong> <span className="font-bold text-rose-700">{rep.issueType.replace(/_/g, ' ')}</span>
                    </p>
                    <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 italic">
                      "{rep.notes}"
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Reported by: {rep.reportedBy} {rep.contactPhone && `(${rep.contactPhone})`}
                    </p>
                  </div>

                  {rep.status !== 'RESOLVED' && (
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                      {resolvingId === rep.id ? (
                        <div className="w-full flex flex-col sm:flex-row items-center gap-2">
                          <input
                            type="text"
                            value={resolutionNote}
                            onChange={(e) => setResolutionNote(e.target.value)}
                            placeholder="Resolution notes (e.g. Spoke with manager; stock restocked)"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                          />
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleResolveReport(rep.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                            >
                              Confirm Resolution
                            </button>
                            <button
                              onClick={() => setResolvingId(null)}
                              className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setResolvingId(rep.id);
                            setResolutionNote('');
                          }}
                          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Audit & Mark Resolved</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SYSTEM AUDIT TRAIL */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-3xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Immutable System Activity & Audit Trail</h3>
              <p className="text-xs text-slate-500">
                Timestamped records of clinical triage decisions, stock updates, and authentications.
              </p>
            </div>
            <button
              onClick={fetchAdminData}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Refresh Log
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      log.role === 'HOSPITAL' ? 'bg-red-100 text-red-800' :
                      log.role === 'PHARMACY' ? 'bg-emerald-100 text-emerald-800' :
                      log.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {log.role}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-medium">{log.actorName}</span>
                  </div>
                  <p className="text-slate-600">{log.details}</p>
                  {log.facilityName && (
                    <p className="text-[11px] text-slate-400">Facility: {log.facilityName}</p>
                  )}
                </div>

                <div className="text-left sm:text-right shrink-0 text-slate-400 text-[11px]">
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  <span className="block text-[10px] opacity-75">{new Date(log.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DEMONSTRATION RESET */}
      {activeTab === 'RESET' && (
        <div className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-4 text-center">
          <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <RotateCcw className="w-7 h-7" />
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Reset Prototype Demonstration Data
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            This action restores all sample medicine inventory, hospital bed counts, blood bank units, Smart Referral passes, and reports back to their clean Smart India Hackathon state.
          </p>

          {resetMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold">
              {resetMessage}
            </div>
          )}

          <div className="pt-2 flex flex-col items-center justify-center gap-2">
            {!showConfirmReset ? (
              <button
                onClick={() => setShowConfirmReset(true)}
                disabled={resetting}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition active:scale-95 disabled:opacity-50 min-h-[46px]"
              >
                Restore Pristine Demo Data
              </button>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl max-w-md w-full space-y-3 animate-in zoom-in-95 duration-150">
                <p className="text-xs text-rose-900 font-bold">
                  Are you sure? This will restore all hospital beds, medicine stock, referrals, and reports.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={handleResetDemo}
                    disabled={resetting}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50 min-h-[40px]"
                  >
                    {resetting ? 'Resetting...' : 'Yes, Restore Now'}
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    disabled={resetting}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition min-h-[40px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
