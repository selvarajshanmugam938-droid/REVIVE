import React, { useState, useEffect, useCallback } from 'react';
import {
  HeartHandshake,
  Droplet,
  Building2,
  Activity,
  Plus,
  Minus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  ShieldCheck,
  Send,
  Zap,
  Radio,
  Share2,
  UserCheck,
  Stethoscope,
  ChevronDown,
  Bed,
  Wind,
  Layers,
  Sparkles,
  Sliders,
  Check,
  X
} from 'lucide-react';
import {
  User,
  Language,
  HospitalPortalData,
  BloodInventoryItem,
  OrganAvailabilityItem,
  BloodGroup,
  BloodComponent,
  OrganType,
  OrganStatus,
  AvailabilityStatus,
  HospitalBed,
  BedCategory
} from '../../types';
import { seedHospitals } from '../../../server/seedData';

interface HospitalPortalProps {
  user: User;
  language: Language;
}

type TabType = 'BLOOD' | 'ORGANS' | 'BEDS' | 'AUDIT';

export const HospitalPortal: React.FC<HospitalPortalProps> = ({ user, language }) => {
  // Current hospital selection
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(
    user.hospitalId || 'hosp-02' // CMCH Coimbatore by default
  );

  const [portalData, setPortalData] = useState<HospitalPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('BLOOD');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters for Blood
  const [bloodSearch, setBloodSearch] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('ALL');
  const [selectedComponent, setSelectedComponent] = useState<string>('ALL');

  // Filters for Organs
  const [organSearch, setOrganSearch] = useState('');
  const [selectedOrganType, setSelectedOrganType] = useState<string>('ALL');

  // Modal States
  const [isBloodModalOpen, setIsBloodModalOpen] = useState(false);
  const [isOrganModalOpen, setIsOrganModalOpen] = useState(false);
  const [corridorAlertActive, setCorridorAlertActive] = useState(false);

  // Blood Modal Form State
  const [newBloodGroup, setNewBloodGroup] = useState<BloodGroup>('O+');
  const [newComponent, setNewComponent] = useState<BloodComponent>('WHOLE_BLOOD');
  const [newUnits, setNewUnits] = useState<number>(5);
  const [donorSource, setDonorSource] = useState('Voluntary Camp / Walk-in Donor');

  // Organ Modal Form State
  const [newOrganType, setNewOrganType] = useState<OrganType>('KIDNEY');
  const [newOrganStatus, setNewOrganStatus] = useState<OrganStatus>('DONOR_AVAILABLE');
  const [newWaitlistCount, setNewWaitlistCount] = useState<number>(12);
  const [newDonorDetails, setNewDonorDetails] = useState('Cadaveric donor verified, TRANSTAN green corridor ready');
  const [newMatchingCriteria, setNewMatchingCriteria] = useState('ABO Compatible, HLA Tissue Match, PRA < 20%');

  // Bed Management State & Modals
  const [selectedBedFilter, setSelectedBedFilter] = useState<string>('ALL');
  const [bedSearch, setBedSearch] = useState('');
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [bedModalMode, setBedModalMode] = useState<'ADD_AVAILABILITY' | 'REGISTER_WARD'>('ADD_AVAILABILITY');
  const [selectedBedForAction, setSelectedBedForAction] = useState<HospitalBed | null>(null);

  // Form: Quick Add Availability / Capacity
  const [quickBedId, setQuickBedId] = useState<string>('');
  const [quickBedDelta, setQuickBedDelta] = useState<number>(5);
  const [quickActionType, setQuickActionType] = useState<'RELEASE_AVAILABILITY' | 'ADD_CAPACITY' | 'ADMIT_PATIENT'>('RELEASE_AVAILABILITY');
  const [quickReason, setQuickReason] = useState<string>('Ward sanitization complete & beds disinfected');

  // Form: Register New Ward
  const [newBedCategory, setNewBedCategory] = useState<BedCategory>('ICU');
  const [newBedLabel, setNewBedLabel] = useState<string>('');
  const [newBedTotal, setNewBedTotal] = useState<number>(20);
  const [newBedAvailable, setNewBedAvailable] = useState<number>(8);
  const [newBedVentilators, setNewBedVentilators] = useState<number>(4);
  const [newBedPrice, setNewBedPrice] = useState<number>(0);

  // Audit Logs for this session
  const [auditLogs, setAuditLogs] = useState<
    { id: string; timestamp: string; action: string; actor: string; type: 'blood' | 'organ' | 'bed' }[]
  >([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 15 * 60000).toLocaleTimeString(),
      action: 'Initial inventory baseline synchronized with State Blood Transfusion Council (SBTC)',
      actor: user.name,
      type: 'blood'
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 40 * 60000).toLocaleTimeString(),
      action: 'TRANSTAN Cadaveric Organ Allocation Cell active for Zonal Cluster',
      actor: 'TRANSTAN Liaison',
      type: 'organ'
    }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch Hospital Portal Data
  const fetchPortalData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hospital/portal-data/${selectedHospitalId}`);
      if (!res.ok) throw new Error('Failed to load portal data');
      const data: HospitalPortalData = await res.json();
      setPortalData(data);
    } catch (err: any) {
      showToast('Error loading hospital records. Retrying...');
    } finally {
      setLoading(false);
    }
  }, [selectedHospitalId]);

  useEffect(() => {
    fetchPortalData();
  }, [fetchPortalData]);

  // Update Blood Inventory Units
  const handleUpdateBloodUnits = async (item: BloodInventoryItem, delta: number) => {
    const newUnits = Math.max(0, item.unitsAvailable + delta);
    setSavingId(item.id);

    try {
      const res = await fetch(`/api/hospital/blood-inventory/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitsAvailable: newUnits })
      });

      if (!res.ok) throw new Error('Failed to update blood stock');
      const data = await res.json();

      setPortalData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          bloodInventory: prev.bloodInventory.map(bi => (bi.id === item.id ? data.item : bi))
        };
      });

      const logMsg = `Updated ${item.bloodGroup} (${item.componentType.replace('_', ' ')}) stock: ${item.unitsAvailable} → ${newUnits} units`;
      showToast(logMsg);
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          action: logMsg,
          actor: user.name,
          type: 'blood'
        },
        ...prev
      ]);
    } catch (err: any) {
      showToast('Failed to update blood units. Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  // Direct Blood Units Edit
  const handleDirectBloodUnitsInput = async (item: BloodInventoryItem, valueStr: string) => {
    const val = parseInt(valueStr, 10);
    if (isNaN(val) || val < 0) return;
    setSavingId(item.id);

    try {
      const res = await fetch(`/api/hospital/blood-inventory/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitsAvailable: val })
      });

      if (!res.ok) throw new Error('Failed to update blood stock');
      const data = await res.json();

      setPortalData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          bloodInventory: prev.bloodInventory.map(bi => (bi.id === item.id ? data.item : bi))
        };
      });

      const logMsg = `Adjusted ${item.bloodGroup} ${item.componentType} stock to ${val} units`;
      showToast(logMsg);
    } catch (err: any) {
      showToast('Failed to update blood inventory');
    } finally {
      setSavingId(null);
    }
  };

  // Add Blood Donation Units (Modal)
  const handleAddBloodDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalData || !portalData.bloodBanks.length) return;
    const targetBb = portalData.bloodBanks[0];

    try {
      const res = await fetch('/api/hospital/blood-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bloodBankId: targetBb.id,
          hospitalId: portalData.hospital.id,
          bloodGroup: newBloodGroup,
          componentType: newComponent,
          unitsAvailable: Number(newUnits)
        })
      });

      if (!res.ok) throw new Error('Failed to record blood units');
      await fetchPortalData();

      setIsBloodModalOpen(false);
      const logMsg = `Logged donation batch: +${newUnits} units of ${newBloodGroup} (${newComponent}) [${donorSource}]`;
      showToast(logMsg);
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          action: logMsg,
          actor: user.name,
          type: 'blood'
        },
        ...prev
      ]);
    } catch (err: any) {
      showToast('Error registering blood batch');
    }
  };

  // Update Organ Status
  const handleUpdateOrganStatus = async (
    item: OrganAvailabilityItem,
    updates: Partial<OrganAvailabilityItem>
  ) => {
    setSavingId(item.id);

    try {
      const res = await fetch(`/api/hospital/organ-inventory/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!res.ok) throw new Error('Failed to update organ registry');
      const data = await res.json();

      setPortalData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          organInventory: prev.organInventory.map(oi => (oi.id === item.id ? data.item : oi))
        };
      });

      const logMsg = `Updated ${item.organType} listing: ${updates.status || item.status} (Waitlist: ${
        updates.waitlistCount !== undefined ? updates.waitlistCount : item.waitlistCount
      })`;
      showToast(logMsg);
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          action: logMsg,
          actor: user.name,
          type: 'organ'
        },
        ...prev
      ]);
    } catch (err: any) {
      showToast('Failed to update organ status');
    } finally {
      setSavingId(null);
    }
  };

  // Register New Organ Donor Listing (Modal)
  const handleAddOrganItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalData) return;

    try {
      const res = await fetch('/api/hospital/organ-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: portalData.hospital.id,
          centerId: portalData.transplantCenters[0]?.id,
          organType: newOrganType,
          status: newOrganStatus,
          waitlistCount: Number(newWaitlistCount),
          donorDetails: newDonorDetails,
          matchingCriteria: newMatchingCriteria
        })
      });

      if (!res.ok) throw new Error('Failed to register organ donor');
      await fetchPortalData();

      setIsOrganModalOpen(false);
      const logMsg = `Registered TRANSTAN Organ Donor Entry: ${newOrganType} (${newOrganStatus})`;
      showToast(logMsg);
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          action: logMsg,
          actor: user.name,
          type: 'organ'
        },
        ...prev
      ]);
    } catch (err: any) {
      showToast('Error registering organ item');
    }
  };

  // Trigger Green Corridor Alert
  const handleTriggerGreenCorridor = (organ: OrganAvailabilityItem) => {
    setCorridorAlertActive(true);
    const alertMsg = `EMERGENCY GREEN CORRIDOR INITIATED: Cadaveric ${organ.organType} at ${
      portalData?.hospital.name || 'Hospital'
    } en route. Traffic & ambulance escort synchronized.`;
    showToast(alertMsg);

    setAuditLogs(prev => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        action: alertMsg,
        actor: user.name,
        type: 'organ'
      },
      ...prev
    ]);

    setTimeout(() => {
      setCorridorAlertActive(false);
    }, 10000);
  };

  // Open Bed Modal with optional pre-selected ward and mode
  const handleOpenBedModal = (bed?: HospitalBed, mode: 'ADD_AVAILABILITY' | 'REGISTER_WARD' = 'ADD_AVAILABILITY') => {
    setBedModalMode(mode);
    if (bed) {
      setSelectedBedForAction(bed);
      setQuickBedId(bed.id);
    } else if (portalData?.beds && portalData.beds.length > 0) {
      setSelectedBedForAction(portalData.beds[0]);
      setQuickBedId(portalData.beds[0].id);
    }
    setQuickBedDelta(5);
    setQuickActionType('RELEASE_AVAILABILITY');
    setQuickReason('Ward sanitization complete & beds disinfected');
    setIsBedModalOpen(true);
  };

  // Fast 1-click Bed Release (+1 available bed)
  const handleQuickReleaseBed = async (bed: HospitalBed) => {
    if (bed.availableBeds >= bed.totalBeds) {
      showToast(`${bed.categoryLabel} is already at 100% capacity (${bed.totalBeds} beds).`);
      return;
    }
    const targetAvailable = bed.availableBeds + 1;
    setSavingId(bed.id);

    try {
      const res = await fetch(`/api/hospitals/${selectedHospitalId}/beds/${bed.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availableBeds: targetAvailable })
      });
      if (!res.ok) throw new Error('Failed to update bed availability');
      const data = await res.json();

      setPortalData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          beds: prev.beds.map(b => (b.id === bed.id ? data.bed : b))
        };
      });

      const logMsg = `Released 1 bed in ${bed.categoryLabel} (Available: ${targetAvailable}/${bed.totalBeds})`;
      showToast(logMsg);
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          action: logMsg,
          actor: user.name,
          type: 'bed'
        },
        ...prev
      ]);
    } catch (err) {
      showToast('Failed to update bed status');
    } finally {
      setSavingId(null);
    }
  };

  // Fast 1-click Patient Admit (-1 available bed)
  const handleQuickAdmitBed = async (bed: HospitalBed) => {
    if (bed.availableBeds <= 0) {
      showToast(`${bed.categoryLabel} has 0 available beds.`);
      return;
    }
    const targetAvailable = bed.availableBeds - 1;
    setSavingId(bed.id);

    try {
      const res = await fetch(`/api/hospitals/${selectedHospitalId}/beds/${bed.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availableBeds: targetAvailable })
      });
      if (!res.ok) throw new Error('Failed to update bed availability');
      const data = await res.json();

      setPortalData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          beds: prev.beds.map(b => (b.id === bed.id ? data.bed : b))
        };
      });

      const logMsg = `Patient admitted to ${bed.categoryLabel} (Available: ${targetAvailable}/${bed.totalBeds})`;
      showToast(logMsg);
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          action: logMsg,
          actor: user.name,
          type: 'bed'
        },
        ...prev
      ]);
    } catch (err) {
      showToast('Failed to admit patient');
    } finally {
      setSavingId(null);
    }
  };

  // Apply Quick Availability / Capacity from Modal
  const handleApplyQuickAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetBed = (portalData?.beds || []).find(b => b.id === (quickBedId || portalData?.beds[0]?.id));
    if (!targetBed) {
      showToast('Please select a target ward');
      return;
    }

    setSavingId('modal-bed');
    try {
      let payload: any = {};
      let logMsg = '';

      if (quickActionType === 'RELEASE_AVAILABILITY') {
        const newAvail = Math.min(targetBed.totalBeds, targetBed.availableBeds + Number(quickBedDelta));
        payload = { availableBeds: newAvail };
        logMsg = `Added +${quickBedDelta} available beds to ${targetBed.categoryLabel} [${quickReason}]`;
      } else if (quickActionType === 'ADD_CAPACITY') {
        const newTotal = targetBed.totalBeds + Number(quickBedDelta);
        const newAvail = targetBed.availableBeds + Number(quickBedDelta);
        payload = { totalBeds: newTotal, availableBeds: newAvail };
        logMsg = `Expanded ward capacity by +${quickBedDelta} beds in ${targetBed.categoryLabel} (Total: ${newTotal})`;
      } else {
        const newAvail = Math.max(0, targetBed.availableBeds - Number(quickBedDelta));
        payload = { availableBeds: newAvail };
        logMsg = `Admitted ${quickBedDelta} patients to ${targetBed.categoryLabel}`;
      }

      const res = await fetch(`/api/hospitals/${selectedHospitalId}/beds/${targetBed.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update bed');
      const data = await res.json();

      setPortalData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          beds: prev.beds.map(b => (b.id === targetBed.id ? data.bed : b))
        };
      });

      showToast(logMsg);
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          action: logMsg,
          actor: user.name,
          type: 'bed'
        },
        ...prev
      ]);
      setIsBedModalOpen(false);
    } catch (err) {
      showToast('Error applying bed availability');
    } finally {
      setSavingId(null);
    }
  };

  // Register New Ward
  const handleRegisterNewWard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBedLabel.trim()) {
      showToast('Please provide a ward name or description');
      return;
    }

    setSavingId('modal-ward');
    try {
      const res = await fetch(`/api/hospitals/${selectedHospitalId}/beds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newBedCategory,
          categoryLabel: newBedLabel.trim(),
          totalBeds: Number(newBedTotal),
          availableBeds: Number(newBedAvailable),
          ventilatorCount: Number(newBedVentilators),
          pricePerDay: Number(newBedPrice)
        })
      });

      if (!res.ok) throw new Error('Failed to register bed ward');
      const data = await res.json();

      setPortalData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          beds: [...prev.beds, data.bed]
        };
      });

      const logMsg = `Registered new ward: ${data.bed.categoryLabel} (${data.bed.availableBeds}/${data.bed.totalBeds} Beds available)`;
      showToast(logMsg);
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          action: logMsg,
          actor: user.name,
          type: 'bed'
        },
        ...prev
      ]);

      setIsBedModalOpen(false);
      setNewBedLabel('');
    } catch (err) {
      showToast('Failed to register new bed ward');
    } finally {
      setSavingId(null);
    }
  };

  // Filtered Blood Inventory
  const filteredBlood = (portalData?.bloodInventory || []).filter(item => {
    const matchesSearch =
      bloodSearch === '' ||
      item.bloodGroup.toLowerCase().includes(bloodSearch.toLowerCase()) ||
      item.componentType.toLowerCase().includes(bloodSearch.toLowerCase());
    const matchesGroup = selectedBloodGroup === 'ALL' || item.bloodGroup === selectedBloodGroup;
    const matchesComp = selectedComponent === 'ALL' || item.componentType === selectedComponent;
    return matchesSearch && matchesGroup && matchesComp;
  });

  // Filtered Organ Inventory
  const filteredOrgans = (portalData?.organInventory || []).filter(item => {
    const matchesSearch =
      organSearch === '' ||
      item.organType.toLowerCase().includes(organSearch.toLowerCase()) ||
      item.matchingCriteria?.toLowerCase().includes(organSearch.toLowerCase()) ||
      item.donorDetails?.toLowerCase().includes(organSearch.toLowerCase());
    const matchesType = selectedOrganType === 'ALL' || item.organType === selectedOrganType;
    return matchesSearch && matchesType;
  });

  // Filtered Bed Inventory
  const filteredBeds = (portalData?.beds || []).filter(bed => {
    const matchesSearch =
      bedSearch === '' ||
      bed.categoryLabel.toLowerCase().includes(bedSearch.toLowerCase()) ||
      bed.category.toLowerCase().includes(bedSearch.toLowerCase());
    const matchesCategory = selectedBedFilter === 'ALL' || bed.category === selectedBedFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate Summary Metrics
  const totalBloodUnits = (portalData?.bloodInventory || []).reduce(
    (sum, i) => sum + i.unitsAvailable,
    0
  );
  const criticalBloodCount = (portalData?.bloodInventory || []).filter(
    i => i.unitsAvailable <= 3
  ).length;
  const activeOrganDonorsCount = (portalData?.organInventory || []).filter(
    i => i.status === 'DONOR_AVAILABLE'
  ).length;

  // Bed Summary Metrics
  const totalBedsCount = (portalData?.beds || []).reduce(
    (sum, b) => sum + (b.totalBeds ?? 0),
    0
  );
  const totalAvailableBeds = (portalData?.beds || []).reduce(
    (sum, b) => sum + (b.availableBeds ?? 0),
    0
  );
  const totalOccupiedBeds = (portalData?.beds || []).reduce(
    (sum, b) => sum + (b.occupiedBeds ?? 0),
    0
  );
  const totalIcuAvailable = (portalData?.beds || [])
    .filter(b => b.category === 'ICU')
    .reduce((sum, b) => sum + (b.availableBeds ?? 0), 0);
  const totalIcuCapacity = (portalData?.beds || [])
    .filter(b => b.category === 'ICU')
    .reduce((sum, b) => sum + (b.totalBeds ?? 0), 0);
  const totalVentilators = (portalData?.beds || []).reduce(
    (sum, b) => sum + (b.ventilatorCount ?? 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-teal-500/50 flex items-center gap-3 animate-in slide-in-from-top-4 duration-150">
          <Zap className="w-5 h-5 text-teal-400 shrink-0 animate-pulse" />
          <p className="text-xs font-bold leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* Corridor Alert Active Banner */}
      {corridorAlertActive && (
        <div className="p-4 rounded-2xl bg-red-600 text-white shadow-xl flex items-center justify-between border-2 border-red-300 animate-pulse">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-white shrink-0 animate-spin" />
            <div>
              <span className="text-xs uppercase tracking-widest font-black block">
                PRIORITY 1: TRANSTAN GREEN CORRIDOR IN PROGRESS
              </span>
              <span className="text-xs font-semibold">
                Tamil Nadu Highway Police, Traffic Hub & 108 Emergency Ambulance Dispatched
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-white text-red-700 font-extrabold text-xs rounded-xl">
            LIVE ESCORT
          </span>
        </div>
      )}

      {/* Top Operations Header */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-4 sm:p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-2.5 py-1 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-extrabold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-red-600" />
              <span>TRANSTAN & State Blood Transfusion Center</span>
            </div>

            <div className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Real-Time SSE Grid Connected</span>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {portalData?.hospital.name || 'Hospital Operations Terminal'}
            </h1>
            <span className="text-xs text-slate-500 font-bold hidden sm:inline">
              ({portalData?.hospital.district} District)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
              <strong className="text-slate-900">{user.name}</strong> ({user.hospitalStaffRole || 'Medical Officer'})
            </span>
            <span>•</span>
            <span>Accredited TRANSTAN Center #{portalData?.transplantCenters[0]?.accreditationNumber || 'TRANSTAN-TN-01'}</span>
          </div>
        </div>

        {/* Controls & Action Buttons: Screen-fitted and responsively aligned */}
        <div className="flex flex-col sm:flex-row flex-wrap xl:flex-nowrap items-stretch sm:items-center gap-2.5 w-full xl:w-auto">
          {/* Facility Selector & Refresh Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial sm:w-56">
              <select
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 pr-7 transition focus:outline-none focus:ring-2 focus:ring-red-400 appearance-none truncate"
                title="Switch Hospital Facility"
              >
                {seedHospitals.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.district})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={fetchPortalData}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center justify-center min-h-[38px] min-w-[38px] shrink-0"
              title="Refresh Inventory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Action Buttons: Responsive Grid / Flex ensuring "+ Register Organ" fits cleanly */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto">
            <button
              id="header-add-beds-btn"
              onClick={() => handleOpenBedModal(undefined, 'ADD_AVAILABILITY')}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 min-h-[38px] whitespace-nowrap"
            >
              <Bed className="w-3.5 h-3.5 shrink-0" />
              <span>+ Add Beds</span>
            </button>

            <button
              id="header-log-blood-btn"
              onClick={() => setIsBloodModalOpen(true)}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 min-h-[38px] whitespace-nowrap"
            >
              <Droplet className="w-3.5 h-3.5 shrink-0" />
              <span>+ Log Blood</span>
            </button>

            <button
              id="header-register-organ-btn"
              onClick={() => setIsOrganModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 min-h-[38px] whitespace-nowrap ring-1 ring-slate-800"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>+ Register Organ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <Droplet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Blood Bank Reserve
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900">{totalBloodUnits}</span>
              <span className="text-xs font-bold text-slate-500">Units Ready</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Critical Low Stock
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-amber-600">{criticalBloodCount}</span>
              <span className="text-xs font-bold text-slate-500">Groups ≤ 3 units</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              TRANSTAN Donors
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-rose-600">{activeOrganDonorsCount}</span>
              <span className="text-xs font-bold text-slate-500">Corridor Ready</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              ICU & Critical Beds
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-blue-600">
                {totalIcuAvailable}
              </span>
              <span className="text-xs font-bold text-slate-500">
                of {totalIcuCapacity} Free
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('BLOOD')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 min-h-[42px] shrink-0 ${
            activeTab === 'BLOOD'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Droplet className="w-4 h-4" />
          <span>Blood Bank Inventory</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'BLOOD' ? 'bg-red-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {portalData?.bloodInventory?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ORGANS')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 min-h-[42px] shrink-0 ${
            activeTab === 'ORGANS'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>TRANSTAN Organ Registry</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'ORGANS' ? 'bg-rose-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {portalData?.organInventory?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('BEDS')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 min-h-[42px] shrink-0 ${
            activeTab === 'BEDS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bed className="w-4 h-4" />
          <span>Bed & ICU Telemetry</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'BEDS' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {totalAvailableBeds} Free
          </span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 min-h-[42px] shrink-0 ${
            activeTab === 'AUDIT'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Audit Stream</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'AUDIT' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: BLOOD INVENTORY MANAGEMENT */}
      {activeTab === 'BLOOD' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[180px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search group / component..."
                  value={bloodSearch}
                  onChange={(e) => setBloodSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              {/* Blood Group Filter */}
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {['ALL', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                  <button
                    key={bg}
                    onClick={() => setSelectedBloodGroup(bg)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      selectedBloodGroup === bg
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {/* Component Filter */}
            <div className="flex items-center gap-1">
              {['ALL', 'WHOLE_BLOOD', 'PRBC', 'PLATELETS', 'FFP'].map(comp => (
                <button
                  key={comp}
                  onClick={() => setSelectedComponent(comp)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                    selectedComponent === comp
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {comp.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Blood Inventory Matrix / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredBlood.map(item => {
              const isSaving = savingId === item.id;
              const isCritical = item.unitsAvailable <= 3;
              const isLimited = item.unitsAvailable > 3 && item.unitsAvailable < 8;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl bg-white border transition-all duration-150 shadow-xs flex flex-col justify-between gap-3 ${
                    isCritical
                      ? 'border-red-300 bg-red-50/20'
                      : isLimited
                      ? 'border-amber-200 bg-amber-50/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-xl bg-red-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                        {item.bloodGroup}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-sm">
                          {item.componentType.replace('_', ' ')}
                        </h3>
                        <p className="text-[11px] text-slate-500 truncate max-w-[170px]">
                          {item.bloodBankName}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        item.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'LIMITED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {/* Units Counter & Quick Stepper */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Units In Cold Vault
                      </span>
                      <div className="flex items-baseline gap-1">
                        <input
                          type="number"
                          min="0"
                          value={item.unitsAvailable}
                          onChange={(e) => handleDirectBloodUnitsInput(item, e.target.value)}
                          className="w-16 text-xl font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                        <span className="text-xs font-bold text-slate-500">units</span>
                      </div>
                    </div>

                    {/* Step Increments */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateBloodUnits(item, -5)}
                        disabled={item.unitsAvailable < 5 || isSaving}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-lg text-xs font-bold text-slate-700 min-h-[34px]"
                        title="Deduct 5 Units"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => handleUpdateBloodUnits(item, -1)}
                        disabled={item.unitsAvailable <= 0 || isSaving}
                        className="p-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-lg text-xs font-bold text-slate-700 min-h-[34px] min-w-[34px] flex items-center justify-center"
                        title="Deduct 1 Unit"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleUpdateBloodUnits(item, 1)}
                        disabled={isSaving}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold min-h-[34px] min-w-[34px] flex items-center justify-center"
                        title="Add 1 Unit"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleUpdateBloodUnits(item, 5)}
                        disabled={isSaving}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold min-h-[34px]"
                        title="Add 5 Units"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>24/7 Transfusion Vault Ready</span>
                    <span>Synced {new Date(item.updatedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBlood.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-2">
              <Droplet className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-bold text-slate-700">No blood stock matches the selected filter.</p>
              <button
                onClick={() => {
                  setSelectedBloodGroup('ALL');
                  setSelectedComponent('ALL');
                  setBloodSearch('');
                }}
                className="text-xs text-red-600 font-bold hover:underline"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRANSTAN ORGAN TRANSPLANT REGISTRY */}
      {activeTab === 'ORGANS' && (
        <div className="space-y-4">
          {/* Header Controls for Organs */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search organs, clinical criteria, donor details..."
                  value={organSearch}
                  onChange={(e) => setOrganSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {['ALL', 'KIDNEY', 'LIVER', 'HEART', 'LUNG', 'CORNEA', 'PANCREAS'].map(ot => (
                  <button
                    key={ot}
                    onClick={() => setSelectedOrganType(ot)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      selectedOrganType === ot
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {ot}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="tab-register-organ-btn"
              onClick={() => setIsOrganModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs whitespace-nowrap active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Register New Organ</span>
            </button>
          </div>

          {/* Organ Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOrgans.map(item => {
              const isSaving = savingId === item.id;
              const hasDonor = item.status === 'DONOR_AVAILABLE';

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-3xl bg-white border transition-all duration-150 shadow-sm space-y-4 ${
                    hasDonor ? 'border-rose-400 ring-2 ring-rose-500/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                          hasDonor ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        <HeartHandshake className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 text-base">{item.organType}</h3>
                          {hasDonor && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 animate-pulse">
                              DONOR ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate max-w-[260px]">
                          {item.centerName || 'TRANSTAN Designated Liaison'}
                        </p>
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <div className="relative">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleUpdateOrganStatus(item, { status: e.target.value as OrganStatus })
                        }
                        disabled={isSaving}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border transition focus:outline-none ${
                          item.status === 'DONOR_AVAILABLE'
                            ? 'bg-rose-50 border-rose-300 text-rose-800'
                            : item.status === 'EMERGENCY_MATCH'
                            ? 'bg-red-50 border-red-300 text-red-800'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <option value="WAITLIST_OPEN">Waitlist Open</option>
                        <option value="DONOR_AVAILABLE">Donor Available</option>
                        <option value="EMERGENCY_MATCH">Emergency Match Underway</option>
                        <option value="INFORMATION_ONLY">Info & Counseling Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Matching Criteria & Clinical Notes */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <div>
                      <span className="font-bold text-slate-600 block text-[11px]">
                        Clinical Matching Criteria:
                      </span>
                      <p className="text-slate-800 font-medium leading-relaxed">
                        {item.matchingCriteria || 'ABO Blood Match, HLA Tissue Typing (TRANSTAN Guidelines)'}
                      </p>
                    </div>

                    {item.donorDetails && (
                      <div className="pt-1.5 border-t border-slate-200/60">
                        <span className="font-bold text-rose-800 block text-[11px]">
                          Active Donor Notes:
                        </span>
                        <p className="text-rose-950 font-semibold leading-relaxed">
                          {item.donorDetails}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Waitlist Counter & Corridor Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Waitlist:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            handleUpdateOrganStatus(item, {
                              waitlistCount: Math.max(0, item.waitlistCount - 1)
                            })
                          }
                          disabled={item.waitlistCount <= 0 || isSaving}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-black text-slate-900 text-sm px-1.5">
                          {item.waitlistCount}
                        </span>
                        <button
                          onClick={() =>
                            handleUpdateOrganStatus(item, {
                              waitlistCount: item.waitlistCount + 1
                            })
                          }
                          disabled={isSaving}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Action Hub */}
                    <div className="flex items-center gap-2">
                      {hasDonor && (
                        <button
                          onClick={() => handleTriggerGreenCorridor(item)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition active:scale-95"
                          title="Alert Highway Police & Ambulance Dispatch"
                        >
                          <Radio className="w-3.5 h-3.5 animate-pulse" />
                          <span>Green Corridor Alert</span>
                        </button>
                      )}

                      <a
                        href={`tel:${item.coordinatorPhone || portalData?.hospital.phone}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Coordinator</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: BED & ICU TELEMETRY */}
      {activeTab === 'BEDS' && (
        <div className="space-y-5">
          {/* Bed Telemetry Header Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
                  <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  <span>Tamil Nadu 108 Emergency Ambulance Telemetry Grid</span>
                </div>
                <h3 className="font-black text-xl text-white">
                  Real-Time Bed Availability & Ward Capacity Desk
                </h3>
                <p className="text-xs text-blue-200/90 leading-relaxed max-w-2xl">
                  Discharge patients, add sanitized beds, deploy emergency surge capacity, or register new ICU/Oxygen wards. All updates propagate instantaneously to 108 ambulances and rural PHC referral networks.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => handleOpenBedModal(undefined, 'ADD_AVAILABILITY')}
                  className="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-md transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Bed Availability</span>
                </button>

                <button
                  onClick={() => handleOpenBedModal(undefined, 'REGISTER_WARD')}
                  className="px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-300" />
                  <span>Register Ward</span>
                </button>
              </div>
            </div>

            {/* Live Telemetry Metric Strips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/10">
              <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-blue-300 block">
                  Total Hospital Beds
                </span>
                <span className="text-xl font-black text-white">{totalBedsCount}</span>
                <span className="text-[11px] text-blue-200 block">across registered wards</span>
              </div>

              <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                  Available Beds Free
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-emerald-300">{totalAvailableBeds}</span>
                  <span className="text-xs text-emerald-200">ready</span>
                </div>
                <span className="text-[11px] text-emerald-200 block">
                  {totalBedsCount ? Math.round((totalAvailableBeds / totalBedsCount) * 100) : 0}% available
                </span>
              </div>

              <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-purple-300 block">
                  ICU / Critical Care Free
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-purple-300">{totalIcuAvailable}</span>
                  <span className="text-xs text-purple-200">of {totalIcuCapacity}</span>
                </div>
                <span className="text-[11px] text-purple-200 block">Critical emergency ready</span>
              </div>

              <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-sky-300 block">
                  Ventilator Units
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-sky-300">{totalVentilators}</span>
                  <span className="text-xs text-sky-200">units</span>
                </div>
                <span className="text-[11px] text-sky-200 block">Oxygen & Invasive</span>
              </div>
            </div>
          </div>

          {/* Bed Filtering & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={bedSearch}
                onChange={(e) => setBedSearch(e.target.value)}
                placeholder="Search by ward name, category (e.g. ICU, General, Oxygen)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 pr-2 shrink-0">
                Filter:
              </span>
              {[
                { id: 'ALL', label: 'All Wards' },
                { id: 'ICU', label: 'ICU' },
                { id: 'EMERGENCY', label: 'Emergency' },
                { id: 'OXYGEN_SUPPORTED', label: 'Oxygen' },
                { id: 'GENERAL', label: 'General' },
                { id: 'PEDIATRIC', label: 'Pediatric' },
                { id: 'MATERNITY', label: 'Maternity' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedBedFilter(cat.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                    selectedBedFilter === cat.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bed Cards Grid */}
          {filteredBeds.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <Bed className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">No Bed Wards Match Current Filter</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Adjust your search or category filter, or click below to register a new ward for this facility.
              </p>
              <button
                onClick={() => handleOpenBedModal(undefined, 'REGISTER_WARD')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register New Bed Ward</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBeds.map(bed => {
                const total = bed.totalBeds || 1;
                const available = bed.availableBeds ?? 0;
                const occupied = bed.occupiedBeds ?? (total - available);
                const occupancyPercent = Math.min(100, Math.round((occupied / total) * 100));
                const isSaving = savingId === bed.id;

                // Category badges styling
                const categoryConfig: Record<string, { bg: string; text: string; border: string }> = {
                  ICU: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                  EMERGENCY: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
                  OXYGEN_SUPPORTED: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
                  GENERAL: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
                  PEDIATRIC: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
                  MATERNITY: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
                  ISOLATION: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' }
                };
                const config = categoryConfig[bed.category] || categoryConfig.GENERAL;

                return (
                  <div
                    key={bed.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Card Header: Category & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider inline-block ${config.bg} ${config.text} ${config.border}`}
                          >
                            {bed.category.replace('_', ' ')}
                          </span>
                          <h4 className="font-black text-slate-900 text-sm sm:text-base leading-snug">
                            {bed.categoryLabel || `${bed.category} Ward`}
                          </h4>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 flex items-center gap-1 ${
                            available > 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${available > 0 ? 'bg-emerald-600' : 'bg-red-600'}`} />
                          {available > 0 ? `${available} Available` : 'Full Capacity'}
                        </span>
                      </div>

                      {/* Visual Occupancy Meter */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500">Ward Occupancy</span>
                          <span
                            className={
                              occupancyPercent >= 90
                                ? 'text-red-600 font-extrabold'
                                : occupancyPercent >= 75
                                ? 'text-amber-600 font-extrabold'
                                : 'text-emerald-700 font-extrabold'
                            }
                          >
                            {occupancyPercent}% Occupied
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              occupancyPercent >= 90
                                ? 'bg-red-600'
                                : occupancyPercent >= 75
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${occupancyPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Detailed Metric Strip */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Available
                          </span>
                          <span className="text-lg font-black text-emerald-700 block">
                            {available}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Occupied
                          </span>
                          <span className="text-lg font-black text-slate-700 block">
                            {occupied}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Total Beds
                          </span>
                          <span className="text-lg font-black text-slate-900 block">
                            {total}
                          </span>
                        </div>
                      </div>

                      {/* Equipment Tags (Ventilators, Tariff) */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        {bed.ventilatorCount > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 font-bold flex items-center gap-1">
                            <Wind className="w-3 h-3 text-sky-600" />
                            <span>{bed.ventilatorCount} Ventilators Equipped</span>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold">
                          {bed.pricePerDay === 0 ? 'Govt / Free Scheme' : `₹${bed.pricePerDay}/day`}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* + Release Bed */}
                        <button
                          onClick={() => handleQuickReleaseBed(bed)}
                          disabled={isSaving || available >= total}
                          className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 disabled:opacity-40 rounded-xl text-xs font-black flex items-center justify-center gap-1 min-h-[38px] transition active:scale-95"
                          title="Patient discharged or sanitized bed released"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-700" />
                          <span>+ Release Bed</span>
                        </button>

                        {/* - Admit Patient */}
                        <button
                          onClick={() => handleQuickAdmitBed(bed)}
                          disabled={isSaving || available <= 0}
                          className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 disabled:opacity-40 rounded-xl text-xs font-black flex items-center justify-center gap-1 min-h-[38px] transition active:scale-95"
                          title="Admit patient from 108 ambulance or triage"
                        >
                          <Minus className="w-3.5 h-3.5 text-slate-700" />
                          <span>- Admit</span>
                        </button>
                      </div>

                      {/* Modal Trigger for this Ward */}
                      <button
                        onClick={() => handleOpenBedModal(bed, 'ADD_AVAILABILITY')}
                        className="w-full py-1.5 text-xs text-blue-700 font-bold hover:bg-blue-50/80 rounded-xl flex items-center justify-center gap-1 transition"
                      >
                        <Sliders className="w-3 h-3 text-blue-600" />
                        <span>Add Availability / Surge Capacity</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT STREAM */}
      {activeTab === 'AUDIT' && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-base">Facility Real-Time Audit Log</h3>
            <span className="text-xs text-slate-500">Tamper-evident system logs</span>
          </div>

          <div className="space-y-3">
            {auditLogs.map(log => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      log.type === 'blood'
                        ? 'bg-red-100 text-red-700'
                        : log.type === 'organ'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {log.type === 'blood' ? (
                      <Droplet className="w-3.5 h-3.5" />
                    ) : log.type === 'organ' ? (
                      <HeartHandshake className="w-3.5 h-3.5" />
                    ) : (
                      <Activity className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-snug">{log.action}</p>
                    <p className="text-[11px] text-slate-500">Logged by {log.actor}</p>
                  </div>
                </div>

                <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD BLOOD DONATION BATCH */}
      {isBloodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-red-600">
                <Droplet className="w-5 h-5" />
                <h3 className="font-black text-slate-900 text-base">Record Blood Donation Batch</h3>
              </div>
              <button
                onClick={() => setIsBloodModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddBloodDonation} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Blood Group</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as BloodGroup[]).map(bg => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setNewBloodGroup(bg)}
                      className={`py-2 rounded-xl text-xs font-black transition ${
                        newBloodGroup === bg
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Component Type</label>
                <select
                  value={newComponent}
                  onChange={(e) => setNewComponent(e.target.value as BloodComponent)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                >
                  <option value="WHOLE_BLOOD">Whole Blood</option>
                  <option value="PRBC">Packed Red Blood Cells (PRBC)</option>
                  <option value="PLATELETS">Platelet Concentrate</option>
                  <option value="FFP">Fresh Frozen Plasma (FFP)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Units Received</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={newUnits}
                  onChange={(e) => setNewUnits(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Donation Drive / Source
                </label>
                <input
                  type="text"
                  value={donorSource}
                  onChange={(e) => setDonorSource(e.target.value)}
                  placeholder="e.g. NSS Camp / Rotaract Drive / Voluntary"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-[11px] text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mandatory screening (HIV, HBV, HCV, Syphilis, Malaria) verified.</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-black transition active:scale-98 shadow-md"
              >
                Add Units & Broadcast to Grid
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER ORGAN DONOR LISTING */}
      {isOrganModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2 text-rose-600">
                <HeartHandshake className="w-5 h-5" />
                <h3 className="font-black text-slate-900 text-base">TRANSTAN Organ Listing</h3>
              </div>
              <button
                onClick={() => setIsOrganModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="register-organ-modal-form" onSubmit={handleAddOrganItem} className="flex-1 overflow-y-auto p-5 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Organ Type</label>
                <select
                  value={newOrganType}
                  onChange={(e) => setNewOrganType(e.target.value as OrganType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                >
                  <option value="KIDNEY">Kidney</option>
                  <option value="LIVER">Liver</option>
                  <option value="HEART">Heart</option>
                  <option value="LUNG">Lung</option>
                  <option value="CORNEA">Cornea</option>
                  <option value="PANCREAS">Pancreas</option>
                  <option value="TISSUE">Tissue</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Status</label>
                <select
                  value={newOrganStatus}
                  onChange={(e) => setNewOrganStatus(e.target.value as OrganStatus)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                >
                  <option value="DONOR_AVAILABLE">Donor Available (Urgent)</option>
                  <option value="EMERGENCY_MATCH">Emergency Match Underway</option>
                  <option value="WAITLIST_OPEN">Waitlist Open</option>
                  <option value="INFORMATION_ONLY">Information Only</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Waitlist Recipient Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={newWaitlistCount}
                  onChange={(e) => setNewWaitlistCount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Active Donor Specifics
                </label>
                <textarea
                  rows={2}
                  value={newDonorDetails}
                  onChange={(e) => setNewDonorDetails(e.target.value)}
                  placeholder="Cadaveric brainstem death certified, HLA matching in progress..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Matching Criteria & Guidelines
                </label>
                <input
                  type="text"
                  value={newMatchingCriteria}
                  onChange={(e) => setNewMatchingCriteria(e.target.value)}
                  placeholder="ABO Match, HLA Tissue Typing, PRA < 20%"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-rose-50 rounded-xl text-[11px] text-rose-800">
                Official TRANSTAN Allocation only. Commercial trade is strictly forbidden under THOTA Act.
              </div>
            </form>

            <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
              <button
                type="submit"
                form="register-organ-modal-form"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-black transition active:scale-98 shadow-md flex items-center justify-center gap-2"
              >
                <HeartHandshake className="w-4 h-4 text-white" />
                <span>Register Organ & Alert Zonal Units</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD BED AVAILABILITY & WARD CAPACITY */}
      {isBedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-blue-600">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Bed className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {bedModalMode === 'ADD_AVAILABILITY'
                      ? 'Update Bed Availability & Surge Capacity'
                      : 'Register New Ward / ICU Unit'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Real-time synchronization with Tamil Nadu 108 ambulance grid
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsBedModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setBedModalMode('ADD_AVAILABILITY')}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  bedModalMode === 'ADD_AVAILABILITY'
                    ? 'bg-white text-blue-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Update Availability</span>
              </button>

              <button
                type="button"
                onClick={() => setBedModalMode('REGISTER_WARD')}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  bedModalMode === 'REGISTER_WARD'
                    ? 'bg-white text-blue-700 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>+ Register New Ward</span>
              </button>
            </div>

            {/* FORM 1: QUICK ADD AVAILABILITY / CAPACITY */}
            {bedModalMode === 'ADD_AVAILABILITY' && (
              <form onSubmit={handleApplyQuickAvailability} className="space-y-4">
                {/* Target Ward Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Target Hospital Ward
                  </label>
                  <select
                    value={quickBedId || portalData?.beds[0]?.id || ''}
                    onChange={(e) => {
                      setQuickBedId(e.target.value);
                      const b = (portalData?.beds || []).find(item => item.id === e.target.value);
                      if (b) setSelectedBedForAction(b);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {(portalData?.beds || []).map(b => (
                      <option key={b.id} value={b.id}>
                        {b.categoryLabel} ({b.category}) — {b.availableBeds} Available / {b.totalBeds} Total
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Type: Free up beds vs Add capacity vs Admit */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Action Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickActionType('RELEASE_AVAILABILITY')}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition ${
                        quickActionType === 'RELEASE_AVAILABILITY'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-400/30'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block font-black text-emerald-700">+ Free Beds</span>
                      <span className="text-[10px] text-slate-500 font-normal">Sanitized / Ready</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuickActionType('ADD_CAPACITY')}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition ${
                        quickActionType === 'ADD_CAPACITY'
                          ? 'bg-blue-50 border-blue-300 text-blue-800 ring-2 ring-blue-400/30'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block font-black text-blue-700">+ Surge Beds</span>
                      <span className="text-[10px] text-slate-500 font-normal">Expand Total</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuickActionType('ADMIT_PATIENT')}
                      className={`p-2.5 rounded-xl border text-center text-xs font-bold transition ${
                        quickActionType === 'ADMIT_PATIENT'
                          ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-400/30'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block font-black text-amber-700">- Admit Patient</span>
                      <span className="text-[10px] text-slate-500 font-normal">Triage / 108 Intake</span>
                    </button>
                  </div>
                </div>

                {/* Bed Count Input & Quick Chips */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Number of Beds ({quickActionType === 'ADMIT_PATIENT' ? 'To Admit' : 'To Add'})
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 5, 10, 20].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setQuickBedDelta(val)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                            quickBedDelta === val
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          +{val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quickBedDelta}
                    onChange={(e) => setQuickBedDelta(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Reason / Context */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Operational Note / Reason
                  </label>
                  <select
                    value={quickReason}
                    onChange={(e) => setQuickReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="Ward sanitization complete & beds disinfected">
                      Ward sanitization complete & beds disinfected
                    </option>
                    <option value="Discharged recovered patients">
                      Discharged recovered patients
                    </option>
                    <option value="Post-operative transfer to step-down unit">
                      Post-operative transfer to step-down unit
                    </option>
                    <option value="Emergency surge capacity deployed by administration">
                      Emergency surge capacity deployed by administration
                    </option>
                    <option value="Admitted acute trauma patient from 108 emergency">
                      Admitted acute trauma patient from 108 emergency
                    </option>
                  </select>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-[11px] text-blue-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    New bed availability will immediately be accessible by rural PHC triage nurses and 108 ambulance pilots on the field.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={savingId === 'modal-bed'}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-black transition active:scale-98 shadow-md flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>
                    {savingId === 'modal-bed' ? 'Updating Grid...' : 'Update Bed Availability & Broadcast'}
                  </span>
                </button>
              </form>
            )}

            {/* FORM 2: REGISTER NEW WARD */}
            {bedModalMode === 'REGISTER_WARD' && (
              <form onSubmit={handleRegisterNewWard} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Category */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Ward Category
                    </label>
                    <select
                      value={newBedCategory}
                      onChange={(e) => setNewBedCategory(e.target.value as BedCategory)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="ICU">ICU (Intensive Care)</option>
                      <option value="EMERGENCY">Emergency / Trauma</option>
                      <option value="OXYGEN_SUPPORTED">Oxygen Supported</option>
                      <option value="GENERAL">General Ward</option>
                      <option value="PEDIATRIC">Pediatric Care</option>
                      <option value="MATERNITY">Maternity / Labour</option>
                      <option value="ISOLATION">Isolation Ward</option>
                    </select>
                  </div>

                  {/* Daily Tariff */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Tariff (₹/day)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newBedPrice}
                      onChange={(e) => setNewBedPrice(Number(e.target.value))}
                      placeholder="0 (Free for Govt)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                {/* Ward Label */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Ward Label / Department Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBedLabel}
                    onChange={(e) => setNewBedLabel(e.target.value)}
                    placeholder="e.g. Critical Coronary Care Unit - Block C"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Total Capacity & Available Beds */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Total Capacity
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newBedTotal}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setNewBedTotal(val);
                        if (newBedAvailable > val) setNewBedAvailable(val);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Available Now
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={newBedTotal}
                      required
                      value={newBedAvailable}
                      onChange={(e) => setNewBedAvailable(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Ventilators
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newBedVentilators}
                      onChange={(e) => setNewBedVentilators(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-sky-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-600 border border-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    The ward will be immediately registered in the hospital registry and live occupancy metrics will be broadcast to emergency ambulances.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={savingId === 'modal-ward'}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-black transition active:scale-98 shadow-md flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  <span>
                    {savingId === 'modal-ward' ? 'Registering Ward...' : 'Register Ward & Connect Telemetry'}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
