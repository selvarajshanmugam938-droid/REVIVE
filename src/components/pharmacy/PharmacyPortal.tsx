import React, { useState, useEffect } from 'react';
import { Store, Plus, Search, CheckCircle2, AlertCircle, Trash2, Edit, Clock, Phone, RefreshCw, ShieldCheck, MapPin } from 'lucide-react';
import { Pharmacy, MedicineInventoryItem, Medicine, User, Language } from '../../types';
import { getTranslation } from '../../locales';

interface PharmacyPortalProps {
  user: User;
  language: Language;
}

export const PharmacyPortal: React.FC<PharmacyPortalProps> = ({
  user,
  language
}) => {
  const t = getTranslation(language);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [inventory, setInventory] = useState<MedicineInventoryItem[]>([]);
  const [catalogMedicines, setCatalogMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Medicine Form
  const [addMode, setAddMode] = useState<'catalog' | 'custom'>('catalog');
  const [selectedMedId, setSelectedMedId] = useState('');
  const [stockQuantity, setStockQuantity] = useState(50);
  const [price, setPrice] = useState(30);
  const [rackLocation, setRackLocation] = useState('Rack A-1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom medicine fields
  const [customName, setCustomName] = useState('');
  const [customGeneric, setCustomGeneric] = useState('');
  const [customStrength, setCustomStrength] = useState('500mg');
  const [customCategory, setCustomCategory] = useState('Analgesic & Antipyretic');
  const [customDosageForm, setCustomDosageForm] = useState('Tablet');
  const [customManufacturer, setCustomManufacturer] = useState('Certified Pharma');
  const [customDescription, setCustomDescription] = useState('');
  const [customPrescriptionRequired, setCustomPrescriptionRequired] = useState(false);

  const fetchPharmacyData = async () => {
    if (!user.pharmacyId) return;
    setLoading(true);
    try {
      const [pRes, mRes] = await Promise.all([
        fetch(`/api/pharmacies/${user.pharmacyId}`),
        fetch('/api/medicines')
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setPharmacy(pData.pharmacy);
        setInventory(pData.inventory || []);
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        setCatalogMedicines(mData.medicines || []);
        if (mData.medicines?.length > 0) {
          setSelectedMedId(mData.medicines[0].id);
        }
      }
    } catch (e) {
      console.warn('Pharmacy data fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacyData();
  }, [user.pharmacyId]);

  const handleUpdateStock = async (itemId: string, newQty: number) => {
    const qty = Math.max(0, newQty);
    const status = qty > 10 ? 'AVAILABLE' : qty > 0 ? 'LIMITED' : 'OUT_OF_STOCK';

    // Optimistic UI update
    setInventory(prev => prev.map(item => item.id === itemId ? { ...item, stockQuantity: qty, status: status as any } : item));

    try {
      await fetch(`/api/pharmacy/inventory/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: qty, status })
      });
    } catch (err) {
      console.warn('Stock update error:', err);
      fetchPharmacyData();
    }
  };

  const handleDeleteInventoryItem = async (itemId: string, medicineName: string) => {
    const confirmMsg = language === 'ta'
      ? `${medicineName} மருந்தை உங்கள் மருந்தக இருப்பிலிருந்து நீக்க விரும்புகிறீர்களா?`
      : language === 'hi'
      ? `क्या आप ${medicineName} को अपनी फार्मेसी स्टॉक से हटाना चाहते हैं?`
      : `Are you sure you want to remove ${medicineName} from your pharmacy inventory?`;

    if (!window.confirm(confirmMsg)) return;

    setInventory(prev => prev.filter(item => item.id !== itemId));
    try {
      const res = await fetch(`/api/pharmacy/inventory/${itemId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        fetchPharmacyData();
      }
    } catch (err) {
      console.warn('Delete inventory item error:', err);
      fetchPharmacyData();
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacy) return;

    setIsSubmitting(true);
    try {
      let bodyData: any = {
        pharmacyId: pharmacy.id,
        stockQuantity: Number(stockQuantity),
        price: Number(price),
        rackLocation
      };

      if (addMode === 'catalog') {
        if (!selectedMedId) return;
        bodyData.medicineId = selectedMedId;
      } else {
        if (!customName.trim()) return;
        bodyData.customMedicine = {
          name: customName.trim(),
          genericName: customGeneric.trim() || customName.trim(),
          strength: customStrength.trim() || 'Standard',
          category: customCategory,
          dosageForm: customDosageForm,
          manufacturer: customManufacturer.trim() || 'Certified Pharma India',
          description: customDescription.trim() || `${customName.trim()} - Essential stock in pharmacy`,
          prescriptionRequired: customPrescriptionRequired,
          price: Number(price)
        };
      }

      const res = await fetch('/api/pharmacy/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        setShowAddModal(false);
        // Reset custom fields
        setCustomName('');
        setCustomGeneric('');
        setCustomDescription('');
        fetchPharmacyData();
      }
    } catch (err) {
      console.warn('Failed to add medicine:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.medicineName.toLowerCase().includes(search.toLowerCase()) ||
    item.genericName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Pharmacy Header Profile Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#22819A] to-[#175d70] rounded-3xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/20 text-[#FEF7F8]">
              PHARMACY PORTAL
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/30 text-emerald-100 border border-emerald-300/40">
              Verified License: {pharmacy?.licenseNumber || 'TN-CBE-2026-9812'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">{pharmacy?.name || `${user.name}'s Medicals`}</h2>
          <p className="text-xs sm:text-sm text-[#90C2E7] flex items-center gap-1.5">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{pharmacy?.address || `${user.district} Main Bazaar`}, {pharmacy?.district || user.district}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 min-h-[44px] bg-[#90C2E7] hover:bg-[#7eb6e0] text-[#22819A] font-extrabold text-xs sm:text-sm rounded-2xl flex items-center gap-2 shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addStock}</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="p-4 bg-white/90 backdrop-blur-md rounded-3xl border border-[#CDD4DD]/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter pharmacy stock items..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
          <span>Total Medicines Listed: {inventory.length}</span>
          <span>•</span>
          <span className="text-emerald-700">
            In Stock: {inventory.filter(i => i.stockQuantity > 0).length}
          </span>
        </div>
      </div>

      {/* Inventory Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Medicine & Generic</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Price</th>
                <th className="px-4 py-3.5">Live Stock Units</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{item.medicineName}</div>
                    <div className="text-[11px] text-slate-500">{item.genericName} • {item.rackLocation || 'Rack A'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-teal-50 text-[#22819A] px-2.5 py-0.5 rounded-lg text-xs font-semibold">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    ₹{item.price}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-base font-black ${item.stockQuantity > 10 ? 'text-emerald-600' : item.stockQuantity > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {item.stockQuantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      item.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : item.status === 'LIMITED' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => handleUpdateStock(item.id, item.stockQuantity - 10)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs min-h-[36px] min-w-[36px] transition active:scale-95"
                        title="Reduce 10 units"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => handleUpdateStock(item.id, item.stockQuantity + 10)}
                        className="px-2.5 py-1.5 bg-[#22819A] hover:bg-[#1a667b] text-white font-bold rounded-lg text-xs min-h-[36px] min-w-[36px] transition active:scale-95"
                        title="Add 10 units"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => handleUpdateStock(item.id, item.stockQuantity + 50)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs min-h-[36px] min-w-[36px] transition active:scale-95"
                        title="Restock 50 units"
                      >
                        +50
                      </button>
                      <button
                        onClick={() => handleDeleteInventoryItem(item.id, item.medicineName)}
                        className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
                        title={language === 'ta' ? 'மருந்தை நீக்கு' : language === 'hi' ? 'दवा हटाएं' : 'Remove medicine'}
                        aria-label="Remove medicine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 sm:p-6 w-full max-w-lg space-y-4 animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {language === 'ta' ? 'மருந்தக இருப்பு சேர்க்க' : language === 'hi' ? 'फार्मेसी में दवा जोड़ें' : 'Add Medicine to Store Inventory'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'ta' ? 'பட்டியலிலிருந்து அல்லது புதிய மருந்து விவரங்களை உள்ளிடவும்' : language === 'hi' ? 'कैटलॉग से चुनें या नई दवा का विवरण दर्ज करें' : 'Select existing drug or register a new medicine'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setAddMode('catalog')}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition ${
                  addMode === 'catalog'
                    ? 'bg-white text-[#22819A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'ta' ? 'அத்தியாவசிய பட்டியல்' : language === 'hi' ? 'कैटलॉग से चुनें' : 'From Directory'}
              </button>
              <button
                type="button"
                onClick={() => setAddMode('custom')}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition ${
                  addMode === 'custom'
                    ? 'bg-white text-[#22819A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {language === 'ta' ? '+ புதிய மருந்து பதிவு' : language === 'hi' ? '+ नई दवा दर्ज करें' : '+ New Custom Medicine'}
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-3.5">
              {addMode === 'catalog' ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'ta' ? 'அத்தியாவசிய மருந்து தேர்வு' : language === 'hi' ? 'आवश्यक दवा सूची से चुनें' : 'Select Medicine from Directory'}
                  </label>
                  <select
                    value={selectedMedId}
                    onChange={(e) => setSelectedMedId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                  >
                    {catalogMedicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.genericName} - {m.strength})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {language === 'ta' ? 'மருந்து பெயர் (Brand Name) *' : language === 'hi' ? 'दवा का नाम (Brand Name) *' : 'Medicine Brand Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder={language === 'hi' ? 'उदा. Paracetamol 500mg, Dolo 650, Calpol' : 'e.g. Paracetamol 500mg, Calpol, Dolo 650'}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {language === 'ta' ? 'ஜெனரிக் பெயர் (Salt)' : language === 'hi' ? 'जेनेरिक नाम (सॉल्ट)' : 'Generic / Salt Formula'}
                      </label>
                      <input
                        type="text"
                        value={customGeneric}
                        onChange={(e) => setCustomGeneric(e.target.value)}
                        placeholder="e.g. Paracetamol IP"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {language === 'ta' ? 'அளவு (Strength)' : language === 'hi' ? 'मात्रा (Strength)' : 'Strength'}
                      </label>
                      <input
                        type="text"
                        value={customStrength}
                        onChange={(e) => setCustomStrength(e.target.value)}
                        placeholder="e.g. 500mg / 650mg"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {language === 'ta' ? 'மருந்து வகை' : language === 'hi' ? 'श्रेणी (Category)' : 'Category'}
                      </label>
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                      >
                        <option value="Analgesic & Antipyretic">Analgesic & Antipyretic (Pain/Fever)</option>
                        <option value="Antibiotic (Penicillin)">Antibiotic</option>
                        <option value="Cardiovascular">Cardiovascular (Heart/BP)</option>
                        <option value="Anti-Diabetic">Anti-Diabetic (Insulin/Sugar)</option>
                        <option value="Gastrointestinal">Gastrointestinal (Acidity/Gas)</option>
                        <option value="Respiratory">Respiratory (Asthma/Inhaler)</option>
                        <option value="Electrolyte Replenisher">Electrolyte Replenisher (ORS)</option>
                        <option value="Emergency Critical Care">Emergency Critical Care (Antivenom)</option>
                        <option value="Antiallergic">Antiallergic (Cold/Allergy)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {language === 'ta' ? 'வடிவம் (Form)' : language === 'hi' ? 'खुराक रूप (Form)' : 'Dosage Form'}
                      </label>
                      <select
                        value={customDosageForm}
                        onChange={(e) => setCustomDosageForm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                      >
                        <option value="Tablet">Tablet (गोली)</option>
                        <option value="Capsule">Capsule (कैप्सूल)</option>
                        <option value="Syrup">Syrup (सिरप)</option>
                        <option value="Injection">Injection (इंजेक्शन)</option>
                        <option value="Inhaler">Inhaler (इन्हेलर)</option>
                        <option value="Drops">Drops (ड्रॉप्स)</option>
                        <option value="Powder (Sachet)">Powder (Sachet)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {language === 'ta' ? 'உற்பத்தியாளர்' : language === 'hi' ? 'निर्माता (Manufacturer)' : 'Manufacturer'}
                      </label>
                      <input
                        type="text"
                        value={customManufacturer}
                        onChange={(e) => setCustomManufacturer(e.target.value)}
                        placeholder="e.g. Cipla, Sun Pharma, Abbott"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                      />
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={customPrescriptionRequired}
                          onChange={(e) => setCustomPrescriptionRequired(e.target.checked)}
                          className="w-4 h-4 rounded text-[#22819A] focus:ring-[#90C2E7]"
                        />
                        <span>{language === 'hi' ? 'पर्चा जरूरी (Rx Required)' : 'Rx Prescription Required'}</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {language === 'ta' ? 'மருந்து விளக்கம்' : language === 'hi' ? 'विवरण (Description)' : 'Description'}
                    </label>
                    <input
                      type="text"
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder={language === 'hi' ? 'उदा. बुखार और सिरदर्द के लिए उपयोगी' : 'e.g. Effective relief for mild to moderate fever and headache'}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'ta' ? 'இருப்பு எண்ணிக்கை' : language === 'hi' ? 'स्टॉक यूनिट्स (Stock Quantity)' : 'Stock Quantity'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {language === 'ta' ? 'விற்பனை விலை (₹)' : language === 'hi' ? 'विक्रय मूल्य (₹ Price)' : 'Selling Price (₹)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'ta' ? 'ரேக் / அலமாரி இடம்' : language === 'hi' ? 'रैक / शेल्फ स्थान' : 'Rack / Storage Location'}
                </label>
                <input
                  type="text"
                  value={rackLocation}
                  onChange={(e) => setRackLocation(e.target.value)}
                  placeholder={language === 'hi' ? 'उदा. काउंटर शेल्फ 2B' : 'e.g. Counter Shelf 2B'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#90C2E7]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl min-h-[44px]"
                >
                  {language === 'ta' ? 'ரத்து' : language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[#22819A] hover:bg-[#1a667b] text-white text-xs font-bold rounded-xl shadow-md min-h-[44px] transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting
                    ? (language === 'hi' ? 'सहेजा जा रहा है...' : 'Saving...')
                    : (language === 'ta' ? 'மருந்து சேர்க்க' : language === 'hi' ? 'दवा जोड़ें' : 'Add Medicine')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
