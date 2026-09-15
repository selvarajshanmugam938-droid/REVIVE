import { EventEmitter } from 'events';
import {
  seedMedicines,
  seedPharmacies,
  seedHospitals,
  seedBloodBanks,
  seedTransplantCenters,
  seedIoTDevices,
  seedUsers,
  sampleDistricts
} from './seedData.js';
import { trainAndNormalizeQuery } from './queryTrainer.js';

export const eventBus = new EventEmitter();

// District coordinate lookup for fallback distance calculation
export const districtCoordinates: Record<string, { lat: number; lng: number }> = {
  'Coimbatore': { lat: 11.0168, lng: 76.9558 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Madurai': { lat: 9.9252, lng: 78.1198 },
  'Salem': { lat: 11.6643, lng: 78.1460 },
  'Tiruchirappalli': { lat: 10.7905, lng: 78.7047 },
  'Erode': { lat: 11.3410, lng: 77.7172 },
  'Tiruppur': { lat: 11.1085, lng: 77.3411 },
  'Namakkal': { lat: 11.2189, lng: 78.1674 },
  'Karur': { lat: 10.9601, lng: 78.0766 },
  'Dindigul': { lat: 10.3673, lng: 77.9803 },
  'Nilgiris': { lat: 11.4102, lng: 76.6950 },
  'Thanjavur': { lat: 10.7870, lng: 79.1378 },
  'Vellore': { lat: 12.9165, lng: 79.1325 },
  'Tirunelveli': { lat: 8.7139, lng: 77.7567 },
  'Cuddalore': { lat: 11.7480, lng: 79.7714 }
};

// Haversine distance formula in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

class Database {
  users: any[] = [];
  pharmacies: any[] = [];
  medicines: any[] = [];
  medicineInventory: any[] = [];
  hospitals: any[] = [];
  bloodBanks: any[] = [];
  bloodInventory: any[] = [];
  transplantCenters: any[] = [];
  organAvailability: any[] = [];
  referrals: any[] = [];
  iotDevices: any[] = [];
  notifications: any[] = [];
  auditLogs: any[] = [];
  discrepancyReports: any[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    this.users = JSON.parse(JSON.stringify(seedUsers));
    this.pharmacies = JSON.parse(JSON.stringify(seedPharmacies));
    this.medicines = JSON.parse(JSON.stringify(seedMedicines));
    this.hospitals = JSON.parse(JSON.stringify(seedHospitals));
    this.bloodBanks = JSON.parse(JSON.stringify(seedBloodBanks));
    this.transplantCenters = JSON.parse(JSON.stringify(seedTransplantCenters));
    this.iotDevices = JSON.parse(JSON.stringify(seedIoTDevices));

    // Generate comprehensive Medicine Inventory across all pharmacies
    this.medicineInventory = [];
    let invCounter = 1;
    this.pharmacies.forEach((pharmacy, pIdx) => {
      this.medicines.forEach((med, mIdx) => {
        // Vary stock and status realistically
        const isCommon = ['med-01', 'med-02', 'med-05', 'med-12', 'med-13', 'med-22', 'med-24'].includes(med.id);
        const rand = (pIdx * 17 + mIdx * 31) % 100;
        
        let stockQuantity = 0;
        let status = 'OUT_OF_STOCK';
        
        if (isCommon || rand < 75) {
          if (rand > 20) {
            stockQuantity = 20 + ((pIdx * 11 + mIdx * 7) % 140);
            status = 'AVAILABLE';
          } else {
            stockQuantity = 2 + (mIdx % 5);
            status = 'LIMITED';
          }
        }

        const price = Math.round(15 + (mIdx * 12.5) + (pIdx % 3) * 5);
        const rackCode = `Rack ${String.fromCharCode(65 + (mIdx % 6))}-${(pIdx % 4) + 1}`;

        this.medicineInventory.push({
          id: `inv-${invCounter++}`,
          pharmacyId: pharmacy.id,
          pharmacyName: pharmacy.name,
          pharmacyAddress: pharmacy.address,
          pharmacyDistrict: pharmacy.district,
          pharmacyPhone: pharmacy.phone,
          pharmacyLat: pharmacy.lat,
          pharmacyLng: pharmacy.lng,
          is24x7: pharmacy.is24x7,
          medicineId: med.id,
          medicineName: med.name,
          genericName: med.genericName,
          category: med.category,
          dosageForm: med.dosageForm,
          strength: med.strength,
          stockQuantity,
          status,
          price,
          rackLocation: rackCode,
          batchNumber: `BAT-${2024 + (mIdx % 2)}-${1000 + invCounter}`,
          expiryDate: '2027-12-31',
          updatedAt: new Date(Date.now() - (mIdx % 45) * 60000).toISOString()
        });
      });
    });

    // Generate Blood Inventory for all Blood Banks
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const components = ['WHOLE_BLOOD', 'PRBC', 'PLATELETS', 'FFP'];
    this.bloodInventory = [];
    let bInvCounter = 1;

    this.bloodBanks.forEach((bb, bbIdx) => {
      bloodGroups.forEach((bg, bgIdx) => {
        components.forEach((comp, cIdx) => {
          const rand = (bbIdx * 13 + bgIdx * 19 + cIdx * 7) % 100;
          let units = 0;
          let status = 'OUT_OF_STOCK';

          if (rand > 15) {
            units = 4 + ((bbIdx * 5 + bgIdx * 3 + cIdx * 4) % 35);
            status = units > 8 ? 'AVAILABLE' : 'LIMITED';
          }

          this.bloodInventory.push({
            id: `blood-inv-${bInvCounter++}`,
            bloodBankId: bb.id,
            bloodBankName: bb.name,
            hospitalName: bb.hospitalName,
            address: bb.address,
            district: bb.district,
            phone: bb.phone,
            emergencyContact: bb.emergencyContact,
            lat: bb.lat,
            lng: bb.lng,
            is24x7: bb.is24x7,
            bloodGroup: bg,
            componentType: comp,
            unitsAvailable: units,
            status,
            updatedAt: new Date(Date.now() - (bgIdx * 8 + cIdx * 5) * 60000).toISOString()
          });
        });
      });
    });

    // Generate Organ Availability Information
    const organTypes = ['KIDNEY', 'LIVER', 'HEART', 'LUNG', 'CORNEA', 'PANCREAS'];
    this.organAvailability = [];
    let orgCounter = 1;

    this.transplantCenters.forEach((tc, tcIdx) => {
      organTypes.forEach((organ, oIdx) => {
        const statuses = ['WAITLIST_OPEN', 'DONOR_AVAILABLE', 'INFORMATION_ONLY'];
        const status = statuses[(tcIdx + oIdx) % statuses.length];
        const waitlistCount = 12 + ((tcIdx * 7 + oIdx * 11) % 65);

        this.organAvailability.push({
          id: `org-avail-${orgCounter++}`,
          centerId: tc.id,
          centerName: tc.name,
          hospitalId: tc.hospitalId,
          address: tc.address,
          district: tc.district,
          phone: tc.phone,
          coordinatorName: tc.coordinatorName,
          coordinatorPhone: tc.coordinatorPhone,
          lat: tc.lat,
          lng: tc.lng,
          organType: organ,
          status,
          waitlistCount,
          matchingCriteria: 'ABO Blood Match, HLA Tissue Typing, PRA < 20%, Body Size Match (TRANSTAN Rules)',
          disclaimer: 'Official TRANSTAN / NOTTO allocation only. Commercial trade is strictly prohibited by law.',
          updatedAt: new Date(Date.now() - (oIdx * 30) * 60000).toISOString()
        });
      });
    });

    // Seed Referrals
    this.referrals = [
      {
        id: 'REF-2026-8801',
        tokenCode: 'REF-2026-TN-8801',
        qrData: JSON.stringify({ tokenCode: 'REF-2026-TN-8801', patient: 'Kuppusamy', to: 'CMCH', urgency: 'URGENT' }),
        userId: 'usr-01',
        patientName: 'Kuppusamy (Age 64)',
        patientAge: 64,
        patientGender: 'MALE',
        patientPhone: '+91 98421 55678',
        reason: 'Acute shortness of breath with diabetic nephropathy needing tertiary ICU dialysis',
        symptoms: ['Breathlessness', 'Decreased urine output', 'Chest heaviness', 'High Creatinine'],
        priority: 'URGENT',
        urgency: 'URGENT',
        currentFacility: 'PHC Modakkurichi, Erode',
        fromFacility: 'PHC Modakkurichi, Erode',
        preferredFacilityId: 'hosp-02',
        referredFacilityName: 'Coimbatore Medical College Hospital (CMCH)',
        toHospitalName: 'Coimbatore Medical College Hospital (CMCH)',
        requiredSpecialty: 'Nephrology & Intensive Care',
        referralDistrict: 'Coimbatore',
        assignedWard: 'Nephrology ICU Ward A',
        assignedBed: 'ICU Bed #04',
        assignedDoctor: 'Dr. R. Kavitha',
        status: 'ACCEPTED',
        notes: 'Pre-admission bed reserved in Nephrology ICU. Ambulance transit assigned.',
        timeline: [
          { status: 'REQUESTED', label: 'Referral Requested by Rural Medical Officer', timestamp: new Date(Date.now() - 4 * 3600000).toISOString(), actor: 'Dr. S. Vimal (PHC Modakkurichi)' },
          { status: 'UNDER_REVIEW', label: 'Triage Review at CMCH Referral Cell', timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), actor: 'Dr. R. Kavitha (CMCH Triage)' },
          { status: 'ACCEPTED', label: 'Bed Reserved: Nephrology ICU #04', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), actor: 'CMCH Admission Desk' }
        ],
        createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 60000).toISOString()
      },
      {
        id: 'REF-2026-8802',
        tokenCode: 'REF-2026-TN-8802',
        qrData: JSON.stringify({ tokenCode: 'REF-2026-TN-8802', patient: 'Meenakshi Sundaram', to: 'GH Erode', urgency: 'EMERGENCY' }),
        userId: 'usr-01',
        patientName: 'Meenakshi Sundaram (Age 28)',
        patientAge: 28,
        patientGender: 'FEMALE',
        patientPhone: '+91 94432 77890',
        reason: 'High-risk primigravida at 36 weeks with severe pre-eclampsia',
        symptoms: ['Elevated BP 170/110', 'Pedal edema', 'Headache', 'Visual blurring'],
        priority: 'EMERGENCY',
        urgency: 'EMERGENCY',
        currentFacility: 'CHC Sathyamangalam',
        fromFacility: 'CHC Sathyamangalam',
        preferredFacilityId: 'hosp-01',
        referredFacilityName: 'Government District Headquarters Hospital (GH Erode)',
        toHospitalName: 'Government District Headquarters Hospital (GH Erode)',
        requiredSpecialty: 'Obstetrics & Neonatal ICU',
        referralDistrict: 'Erode',
        assignedWard: 'Emergency Labor & Delivery ICU',
        assignedBed: 'Bed M-02',
        assignedDoctor: 'Dr. P. Gomathi',
        status: 'PATIENT_TRAVELLING',
        notes: 'Magnesium Sulfate loading dose administered. Emergency Obstetric Team alerted.',
        timeline: [
          { status: 'REQUESTED', label: 'Emergency Referral Requested', timestamp: new Date(Date.now() - 1 * 3600000).toISOString(), actor: 'Dr. P. Gomathi' },
          { status: 'UNDER_REVIEW', label: 'Verified by On-Call Obstetrician', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), actor: 'GH Erode Triage' },
          { status: 'ACCEPTED', label: 'Maternity ICU & OT Prepped', timestamp: new Date(Date.now() - 25 * 60000).toISOString(), actor: 'GH Erode Labor Ward' },
          { status: 'PATIENT_TRAVELLING', label: 'En-Route in 108 Ambulance (TN-33-G-1108)', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), actor: '108 Paramedic Team' }
        ],
        createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 60000).toISOString()
      }
    ];

    // Seed Notifications
    this.notifications = [
      {
        id: 'notif-01',
        userId: 'usr-01',
        title: 'Referral Update (REF-2026-8801)',
        message: 'Your referral to Coimbatore Medical College Hospital has been ACCEPTED. ICU Bed #04 is reserved.',
        type: 'SUCCESS',
        read: false,
        createdAt: new Date(Date.now() - 30 * 60000).toISOString()
      },
      {
        id: 'notif-02',
        userId: 'usr-01',
        title: 'New Stock Alert: Insulin Actrapid',
        message: 'Sri Lakshmi Medicals, Erode just updated stock: 40 units available.',
        type: 'INFO',
        read: false,
        createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
      }
    ];

    // Seed Audit Logs
    this.auditLogs = [
      {
        id: 'aud-01',
        timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
        action: 'INVENTORY_STOCK_UPDATE',
        role: 'PHARMACY',
        actorName: 'Sri Lakshmi Medicals Staff',
        facilityId: 'ph-01',
        facilityName: 'Sri Lakshmi Medicals, Erode',
        details: 'Updated Paracetamol 650mg stock: 45 -> 60 units. Status: AVAILABLE.',
        ipOrOrigin: '192.168.1.42 (Pharmacy POS Terminal)'
      },
      {
        id: 'aud-02',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        action: 'REFERRAL_ACCEPTED',
        role: 'HOSPITAL',
        actorName: 'Dr. R. Kavitha',
        facilityId: 'hosp-02',
        facilityName: 'Coimbatore Medical College Hospital',
        details: 'Approved referral REF-2026-TN-8801 for patient Kuppusamy. Assigned ICU Bed #04.',
        ipOrOrigin: '10.0.4.12 (CMCH Triage Desk)'
      },
      {
        id: 'aud-03',
        timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
        action: 'BLOOD_BANK_AUDIT',
        role: 'BLOOD_BANK',
        actorName: 'S. Manickam',
        facilityId: 'hosp-02',
        facilityName: 'Red Cross Regional Blood Center',
        details: 'Verified O-Negative and B-Positive packed red blood cell units. Expiry dates re-checked.',
        ipOrOrigin: '10.0.4.88 (Blood Component Lab)'
      },
      {
        id: 'aud-04',
        timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
        action: 'BED_CAPACITY_SYNC',
        role: 'HOSPITAL',
        actorName: 'CMCH Nursing Superintendent',
        facilityId: 'hosp-02',
        facilityName: 'Coimbatore Medical College Hospital',
        details: 'Synced ICU Bed capacity telemetry: 4 available, 24 occupied.',
        ipOrOrigin: 'IoT Central Telemetry Hub'
      }
    ];

    // Seed Discrepancy Reports
    this.discrepancyReports = [
      {
        id: 'rep-01',
        resourceType: 'MEDICINE',
        resourceId: 'med-04',
        resourceName: 'Azithromycin 500mg',
        facilityName: 'Jan Aushadhi Kendra, Annur',
        district: 'Coimbatore',
        issueType: 'OUT_OF_STOCK',
        reportedBy: 'Citizen (K. Arumugam)',
        contactPhone: '+91 98421 99887',
        notes: 'Visited pharmacy at 2:00 PM; counter confirmed strip out of stock until tomorrow shipment.',
        status: 'RESOLVED',
        createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
        resolvedAt: new Date(Date.now() - 2 * 3600000).toISOString()
      },
      {
        id: 'rep-02',
        resourceType: 'BED',
        resourceId: 'hosp-01',
        resourceName: 'Emergency Oxygen Bed',
        facilityName: 'Government District Headquarters Hospital (GH Erode)',
        district: 'Erode',
        issueType: 'INCORRECT_PHONE',
        reportedBy: 'Citizen (M. Selvam)',
        contactPhone: '+91 94432 11445',
        notes: 'Direct landline extension 104 was engaged; reception suggested calling mobile line +91 94432 22001.',
        status: 'INVESTIGATING',
        createdAt: new Date(Date.now() - 1 * 3600000).toISOString()
      }
    ];
  }

  // User Auth
  findUserByEmail(email: string) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string) {
    return this.users.find(u => u.id === id);
  }

  createUser(userData: any) {
    const newUser = {
      id: `usr-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '',
      passwordHash: userData.password, // Plain or hashed simulation
      role: userData.role || 'USER',
      mode: userData.mode || (userData.role === 'HOSPITAL' ? 'HOSPITAL' : 'BASIC'),
      language: userData.language || 'en',
      district: userData.district || 'Coimbatore',
      pharmacyId: userData.pharmacyId,
      hospitalId: userData.hospitalId,
      hospitalName: userData.hospitalName,
      hospitalStaffRole: userData.hospitalStaffRole || 'Hospital Medical Officer',
      lat: userData.lat || districtCoordinates[userData.district || 'Coimbatore']?.lat || 11.0168,
      lng: userData.lng || districtCoordinates[userData.district || 'Coimbatore']?.lng || 76.9558
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUserPreferences(userId: string, prefs: { mode?: 'BASIC' | 'ADVANCED' | 'PHARMACY' | 'HOSPITAL'; language?: 'en' | 'ta' | 'hi'; district?: string; lat?: number; lng?: number }) {
    const user = this.findUserById(userId);
    if (user) {
      if (prefs.mode) user.mode = prefs.mode;
      if (prefs.language) user.language = prefs.language;
      if (prefs.district) {
        user.district = prefs.district;
        if (districtCoordinates[prefs.district]) {
          user.lat = districtCoordinates[prefs.district].lat;
          user.lng = districtCoordinates[prefs.district].lng;
        }
      }
      if (prefs.lat) user.lat = prefs.lat;
      if (prefs.lng) user.lng = prefs.lng;
    }
    return user;
  }

  // Medicines & Inventory
  getMedicines(search?: string, category?: string) {
    let list = this.medicines;
    if (category && category !== 'ALL') {
      list = list.filter(m => m.category.toLowerCase() === category.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      const trained = trainAndNormalizeQuery(q);
      const targetMed = trained.medicineTarget ? trained.medicineTarget.toLowerCase() : '';
      const phoneticQ = q.replace(/omol/g, 'amol').replace(/acit/g, 'acet').replace(/em/g, 'etam');
      const isParacetamol = /p[ae]r[ae]?[cs][aei]?[etm][a-z]*m[ao]l|parac[a-z]{2,8}ol|paracet|paracit|dolo|crocin|calpol/i.test(q);

      list = list.filter(m => {
        const mName = m.name.toLowerCase();
        const mGen = m.genericName.toLowerCase();
        const mDesc = m.description.toLowerCase();
        const mUses = m.uses.map((u: string) => u.toLowerCase()).join(' ');

        // Direct containment
        if (mName.includes(q) || mGen.includes(q) || mDesc.includes(q) || mUses.includes(q)) return true;
        // Paracetamol variations & typos (paracemotol, paracaetomol, etc.)
        if (isParacetamol && (mName.includes('paracetamol') || mGen.includes('paracetamol') || mName.includes('dolo'))) return true;
        // Phonetic correction (e.g. paracetomol -> paracetamol)
        if (mName.includes(phoneticQ) || mGen.includes(phoneticQ)) return true;
        // Target medicine from intent normalizer
        if (targetMed && (mName.includes(targetMed) || targetMed.includes(mName))) return true;
        // Check matched keywords
        if (trained.matchedKeywords.some(kw => kw.length > 2 && (mName.includes(kw) || mGen.includes(kw) || mUses.includes(kw)))) return true;
        return false;
      });
    }
    return list;
  }

  getMedicineAvailability(params: {
    medicineId?: string;
    search?: string;
    pharmacySearch?: string;
    pharmacyId?: string;
    district?: string;
    userLat?: number;
    userLng?: number;
    statusFilter?: string;
    only24x7?: boolean;
  }) {
    let items = [...this.medicineInventory];

    if (params.medicineId) {
      items = items.filter(i => i.medicineId === params.medicineId);
    }

    if (params.pharmacyId) {
      items = items.filter(i => i.pharmacyId === params.pharmacyId);
    }

    if (params.pharmacySearch && params.pharmacySearch.trim()) {
      const pQ = params.pharmacySearch.toLowerCase().trim();
      items = items.filter(i =>
        i.pharmacyName.toLowerCase().includes(pQ) ||
        i.pharmacyAddress.toLowerCase().includes(pQ) ||
        i.pharmacyDistrict.toLowerCase().includes(pQ)
      );
    }

    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      const trained = trainAndNormalizeQuery(q);
      const targetMed = trained.medicineTarget ? trained.medicineTarget.toLowerCase() : '';
      const phoneticQ = q.replace(/omol/g, 'amol').replace(/acit/g, 'acet').replace(/em/g, 'etam');
      const isParacetamol = /p[ae]r[ae]?[cs][aei]?[etm][a-z]*m[ao]l|parac[a-z]{2,8}ol|paracet|paracit|dolo|crocin|calpol/i.test(q);

      items = items.filter(i => {
        const iMed = i.medicineName.toLowerCase();
        const iGen = i.genericName.toLowerCase();
        const iPharm = i.pharmacyName.toLowerCase();
        const iCat = i.category.toLowerCase();

        // Direct containment
        if (iMed.includes(q) || iGen.includes(q) || iPharm.includes(q) || iCat.includes(q)) return true;
        // Paracetamol variations & typos (paracemotol, paracaetomol, etc.)
        if (isParacetamol && (iMed.includes('paracetamol') || iGen.includes('paracetamol') || iMed.includes('dolo'))) return true;
        // Phonetic correction
        if (iMed.includes(phoneticQ) || iGen.includes(phoneticQ)) return true;
        // Target medicine from training map
        if (targetMed && (iMed.includes(targetMed) || targetMed.includes(iMed))) return true;
        // Matched keywords
        if (trained.matchedKeywords.some(kw => kw.length > 2 && (iMed.includes(kw) || iGen.includes(kw)))) return true;
        return false;
      });
    }

    if (params.district && params.district !== 'ALL') {
      items = items.filter(i => i.pharmacyDistrict.toLowerCase() === params.district!.toLowerCase());
    }

    if (params.statusFilter && params.statusFilter !== 'ALL') {
      items = items.filter(i => i.status === params.statusFilter);
    }

    if (params.only24x7) {
      items = items.filter(i => i.is24x7);
    }

    // Compute distance
    const refLat = params.userLat || 11.0168;
    const refLng = params.userLng || 76.9558;

    items = items.map(item => ({
      ...item,
      distanceKm: calculateDistanceKm(refLat, refLng, item.pharmacyLat, item.pharmacyLng)
    }));

    // Sort by available stock first, then distance
    items.sort((a, b) => {
      const statusWeight: Record<string, number> = { 'AVAILABLE': 3, 'LIMITED': 2, 'OUT_OF_STOCK': 1, 'UNKNOWN': 0 };
      const sDiff = (statusWeight[b.status] || 0) - (statusWeight[a.status] || 0);
      if (sDiff !== 0) return sDiff;
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    });

    return items;
  }

  // Pharmacies directory query with search and stock statistics
  getPharmacies(params: {
    search?: string;
    district?: string;
    only24x7?: boolean;
    userLat?: number;
    userLng?: number;
  } = {}) {
    let list = [...this.pharmacies];

    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.phone.includes(q)
      );
    }

    if (params.district && params.district !== 'ALL') {
      list = list.filter(p => p.district.toLowerCase() === params.district!.toLowerCase());
    }

    if (params.only24x7) {
      list = list.filter(p => p.is24x7);
    }

    const refLat = params.userLat || 11.0168;
    const refLng = params.userLng || 76.9558;

    return list.map(pharmacy => {
      const inv = this.medicineInventory.filter(i => i.pharmacyId === pharmacy.id);
      const availableCount = inv.filter(i => i.status === 'AVAILABLE').length;
      const dist = calculateDistanceKm(refLat, refLng, pharmacy.lat, pharmacy.lng);
      return {
        ...pharmacy,
        distanceKm: dist,
        totalMedicines: inv.length,
        availableMedicines: availableCount,
        hasParacetamol: inv.some(i => i.status === 'AVAILABLE' && i.medicineName.toLowerCase().includes('paracetamol'))
      };
    }).sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }

  // Pharmacy Inventory Management
  getPharmacyInventory(pharmacyId: string) {
    return this.medicineInventory.filter(i => i.pharmacyId === pharmacyId);
  }

  updateInventoryStock(itemId: string, updates: { stockQuantity?: number; status?: string; price?: number }) {
    const item = this.medicineInventory.find(i => i.id === itemId);
    if (!item) return null;

    if (updates.stockQuantity !== undefined) {
      item.stockQuantity = Math.max(0, updates.stockQuantity);
      if (item.stockQuantity === 0) {
        item.status = 'OUT_OF_STOCK';
      } else if (item.stockQuantity < 10) {
        item.status = 'LIMITED';
      } else {
        item.status = 'AVAILABLE';
      }
    }

    if (updates.status) {
      item.status = updates.status;
    }

    if (updates.price !== undefined) {
      item.price = updates.price;
    }

    item.updatedAt = new Date().toISOString();

    // Broadcast real-time stock update
    eventBus.emit('stock_updated', {
      itemId: item.id,
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      pharmacyId: item.pharmacyId,
      pharmacyName: item.pharmacyName,
      stockQuantity: item.stockQuantity,
      status: item.status,
      updatedAt: item.updatedAt
    });

    return item;
  }

  createMedicine(data: {
    name: string;
    genericName: string;
    category: string;
    dosageForm: string;
    strength: string;
    description?: string;
    prescriptionRequired?: boolean;
    price?: number;
    manufacturer?: string;
    tamilName?: string;
    hindiName?: string;
  }) {
    const trimmedName = data.name.trim();
    const trimmedStrength = (data.strength || 'Standard').trim();

    // Check if medicine with same name and strength already exists
    let existing = this.medicines.find(
      m => m.name.toLowerCase() === trimmedName.toLowerCase() &&
           (m.strength || '').toLowerCase() === trimmedStrength.toLowerCase()
    );
    if (existing) {
      return existing;
    }

    const newMed = {
      id: `med-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      name: trimmedName,
      genericName: data.genericName.trim(),
      category: data.category || 'General Medicine',
      dosageForm: data.dosageForm || 'Tablet',
      strength: trimmedStrength,
      description: data.description || `${trimmedName} (${data.genericName.trim()}) ${trimmedStrength}. Quality pharmaceutical medicine.`,
      prescriptionRequired: data.prescriptionRequired !== undefined ? data.prescriptionRequired : false,
      price: data.price || 30,
      manufacturer: data.manufacturer || 'Quality Pharma India',
      tamilName: data.tamilName || trimmedName,
      hindiName: data.hindiName || trimmedName,
      isEssential: false
    };

    this.medicines.push(newMed as any);
    return newMed;
  }

  deletePharmacyInventory(itemId: string) {
    const idx = this.medicineInventory.findIndex(i => i.id === itemId);
    if (idx !== -1) {
      const removed = this.medicineInventory.splice(idx, 1)[0];
      eventBus.emit('stock_updated', {
        itemId: removed.id,
        medicineId: removed.medicineId,
        medicineName: removed.medicineName,
        pharmacyId: removed.pharmacyId,
        stockQuantity: 0,
        status: 'OUT_OF_STOCK'
      });
      return true;
    }
    return false;
  }

  addPharmacyMedicine(pharmacyId: string, medicineData: {
    medicineId: string;
    stockQuantity: number;
    price: number;
    rackLocation?: string;
  }) {
    const pharmacy = this.pharmacies.find(p => p.id === pharmacyId);
    const medicine = this.medicines.find(m => m.id === medicineData.medicineId);

    if (!pharmacy || !medicine) return null;

    // Check if already exists in this pharmacy
    let existing = this.medicineInventory.find(i => i.pharmacyId === pharmacyId && i.medicineId === medicineData.medicineId);
    if (existing) {
      existing.stockQuantity += medicineData.stockQuantity;
      existing.price = medicineData.price || existing.price;
      existing.status = existing.stockQuantity > 0 ? (existing.stockQuantity < 10 ? 'LIMITED' : 'AVAILABLE') : 'OUT_OF_STOCK';
      existing.updatedAt = new Date().toISOString();
      return existing;
    }

    const newItem = {
      id: `inv-${Date.now()}`,
      pharmacyId: pharmacy.id,
      pharmacyName: pharmacy.name,
      pharmacyAddress: pharmacy.address,
      pharmacyDistrict: pharmacy.district,
      pharmacyPhone: pharmacy.phone,
      pharmacyLat: pharmacy.lat,
      pharmacyLng: pharmacy.lng,
      is24x7: pharmacy.is24x7,
      medicineId: medicine.id,
      medicineName: medicine.name,
      genericName: medicine.genericName,
      category: medicine.category,
      dosageForm: medicine.dosageForm,
      strength: medicine.strength,
      stockQuantity: medicineData.stockQuantity,
      status: medicineData.stockQuantity > 10 ? 'AVAILABLE' : (medicineData.stockQuantity > 0 ? 'LIMITED' : 'OUT_OF_STOCK'),
      price: medicineData.price,
      rackLocation: medicineData.rackLocation || 'Rack A-1',
      batchNumber: `BAT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: '2027-12-31',
      updatedAt: new Date().toISOString()
    };

    this.medicineInventory.unshift(newItem);

    eventBus.emit('stock_updated', newItem);
    return newItem;
  }

  // Hospitals & Beds
  getHospitals(params: {
    search?: string;
    district?: string;
    bedCategory?: string;
    type?: string;
    userLat?: number;
    userLng?: number;
  }) {
    let list = JSON.parse(JSON.stringify(this.hospitals));

    if (params.district && params.district !== 'ALL') {
      list = list.filter((h: any) => h.district.toLowerCase() === params.district!.toLowerCase());
    }

    if (params.type && params.type !== 'ALL') {
      list = list.filter((h: any) => h.type === params.type);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((h: any) =>
        h.name.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q) ||
        h.district.toLowerCase().includes(q)
      );
    }

    const refLat = params.userLat || 11.0168;
    const refLng = params.userLng || 76.9558;

    list = list.map((h: any) => {
      const totalAvailable = h.beds.reduce((acc: number, b: any) => acc + (b.availableBeds || 0), 0);
      return {
        ...h,
        totalAvailableBeds: totalAvailable,
        distanceKm: calculateDistanceKm(refLat, refLng, h.lat, h.lng)
      };
    });

    if (params.bedCategory && params.bedCategory !== 'ALL') {
      list = list.filter((h: any) =>
        h.beds.some((b: any) => b.category === params.bedCategory && b.availableBeds > 0)
      );
    }

    list.sort((a: any, b: any) => (a.distanceKm || 0) - (b.distanceKm || 0));
    return list;
  }

  updateHospitalBed(hospitalId: string, bedId: string, updates: {
    availableBeds?: number;
    occupiedBeds?: number;
    totalBeds?: number;
    ventilatorCount?: number;
    pricePerDay?: number;
    categoryLabel?: string;
  }) {
    const hospital = this.hospitals.find(h => h.id === hospitalId);
    if (!hospital) return null;
    const bed = hospital.beds.find((b: any) => b.id === bedId);
    if (!bed) return null;

    if (updates.totalBeds !== undefined) {
      bed.totalBeds = Math.max(1, Math.floor(updates.totalBeds));
    }

    if (updates.availableBeds !== undefined) {
      bed.availableBeds = Math.max(0, Math.min(bed.totalBeds, Math.floor(updates.availableBeds)));
      bed.occupiedBeds = Math.max(0, bed.totalBeds - bed.availableBeds);
    } else if (updates.occupiedBeds !== undefined) {
      bed.occupiedBeds = Math.max(0, Math.min(bed.totalBeds, Math.floor(updates.occupiedBeds)));
      bed.availableBeds = Math.max(0, bed.totalBeds - bed.occupiedBeds);
    }

    if (updates.ventilatorCount !== undefined) {
      bed.ventilatorCount = Math.max(0, Math.floor(updates.ventilatorCount));
    }

    if (updates.pricePerDay !== undefined) {
      bed.pricePerDay = Math.max(0, Math.floor(updates.pricePerDay));
    }

    if (updates.categoryLabel) {
      bed.categoryLabel = updates.categoryLabel;
    }

    bed.updatedAt = new Date().toISOString();
    hospital.updatedAt = new Date().toISOString();

    eventBus.emit('bed_updated', {
      hospitalId,
      hospitalName: hospital.name,
      category: bed.category,
      bed
    });

    return bed;
  }

  addHospitalBed(hospitalId: string, bedData: {
    category: string;
    categoryLabel: string;
    totalBeds: number;
    availableBeds: number;
    ventilatorCount?: number;
    pricePerDay?: number;
  }) {
    const hospital = this.hospitals.find(h => h.id === hospitalId);
    if (!hospital) return null;

    const total = Math.max(1, Number(bedData.totalBeds) || 10);
    const available = Math.max(0, Math.min(total, Number(bedData.availableBeds) || 0));

    const newBed: any = {
      id: `bed-${hospital.id}-${Date.now().toString().slice(-4)}`,
      category: bedData.category,
      categoryLabel: bedData.categoryLabel || `${bedData.category} Ward`,
      totalBeds: total,
      availableBeds: available,
      occupiedBeds: total - available,
      ventilatorCount: bedData.ventilatorCount ? Math.max(0, Number(bedData.ventilatorCount)) : 0,
      pricePerDay: bedData.pricePerDay !== undefined ? Math.max(0, Number(bedData.pricePerDay)) : 0,
      updatedAt: new Date().toISOString()
    };

    if (!hospital.beds) {
      hospital.beds = [];
    }
    hospital.beds.push(newBed);
    hospital.updatedAt = new Date().toISOString();

    eventBus.emit('bed_updated', {
      hospitalId,
      hospitalName: hospital.name,
      category: newBed.category,
      bed: newBed
    });

    return newBed;
  }

  // Blood Availability
  getBloodAvailability(params: {
    bloodGroup?: string;
    componentType?: string;
    district?: string;
    userLat?: number;
    userLng?: number;
  }) {
    let items = [...this.bloodInventory];

    if (params.bloodGroup && params.bloodGroup !== 'ALL') {
      items = items.filter(i => i.bloodGroup === params.bloodGroup);
    }

    if (params.componentType && params.componentType !== 'ALL') {
      items = items.filter(i => i.componentType === params.componentType);
    }

    if (params.district && params.district !== 'ALL') {
      items = items.filter(i => i.district.toLowerCase() === params.district!.toLowerCase());
    }

    const refLat = params.userLat || 11.0168;
    const refLng = params.userLng || 76.9558;

    items = items.map(item => ({
      ...item,
      distanceKm: calculateDistanceKm(refLat, refLng, item.lat, item.lng)
    }));

    items.sort((a, b) => {
      if (b.unitsAvailable !== a.unitsAvailable) return b.unitsAvailable - a.unitsAvailable;
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    });

    return items;
  }

  // Organ Availability
  getOrganAvailability(params: {
    organType?: string;
    district?: string;
    status?: string;
    userLat?: number;
    userLng?: number;
  }) {
    let items = [...this.organAvailability];

    if (params.organType && params.organType !== 'ALL') {
      items = items.filter(i => i.organType === params.organType);
    }

    if (params.status && params.status !== 'ALL') {
      items = items.filter(i => i.status === params.status);
    }

    if (params.district && params.district !== 'ALL') {
      items = items.filter(i => i.district.toLowerCase() === params.district!.toLowerCase());
    }

    const refLat = params.userLat || 11.0168;
    const refLng = params.userLng || 76.9558;

    items = items.map(item => ({
      ...item,
      distanceKm: calculateDistanceKm(refLat, refLng, item.lat, item.lng)
    }));

    items.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    return items;
  }

  // Hospital Portal: Blood & Organ Management
  getHospitalPortalData(hospitalId: string) {
    const hospital = this.hospitals.find(h => h.id === hospitalId) || this.hospitals[0];
    if (!hospital) return null;

    // Find linked blood banks
    let linkedBloodBanks = this.bloodBanks.filter(bb =>
      bb.hospitalId === hospital.id ||
      (bb.hospitalName && bb.hospitalName.toLowerCase().includes(hospital.name.toLowerCase())) ||
      (hospital.name && hospital.name.toLowerCase().includes(bb.hospitalName?.toLowerCase() || '')) ||
      bb.district.toLowerCase() === hospital.district.toLowerCase()
    );

    // If none found, create a dedicated blood bank for this hospital
    if (linkedBloodBanks.length === 0) {
      const newBb = {
        id: `bb-${hospital.id}`,
        name: `${hospital.name} Blood Bank & Transfusion Center`,
        hospitalName: hospital.name,
        address: hospital.address,
        district: hospital.district,
        phone: hospital.phone,
        emergencyContact: hospital.emergencyPhone || hospital.phone,
        lat: hospital.lat,
        lng: hospital.lng,
        is24x7: true,
        updatedAt: new Date().toISOString()
      };
      this.bloodBanks.push(newBb);
      linkedBloodBanks = [newBb];
    }

    const linkedBbIds = new Set(linkedBloodBanks.map(b => b.id));

    // Blood inventory for linked blood banks
    let bloodInventory = this.bloodInventory.filter(i => linkedBbIds.has(i.bloodBankId));

    // If empty inventory, generate standard blood group components
    if (bloodInventory.length === 0) {
      const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      const components = ['WHOLE_BLOOD', 'PRBC', 'PLATELETS', 'FFP'];
      const primaryBb = linkedBloodBanks[0];

      bloodGroups.forEach((bg, bgIdx) => {
        components.forEach((comp, cIdx) => {
          const units = 8 + ((bgIdx * 7 + cIdx * 5) % 25);
          const newItem = {
            id: `blood-inv-${primaryBb.id}-${bg.replace('+', 'pos').replace('-', 'neg')}-${comp.toLowerCase()}`,
            bloodBankId: primaryBb.id,
            bloodBankName: primaryBb.name,
            hospitalName: hospital.name,
            address: hospital.address,
            district: hospital.district,
            phone: hospital.phone,
            emergencyContact: hospital.emergencyPhone || hospital.phone,
            lat: hospital.lat,
            lng: hospital.lng,
            is24x7: primaryBb.is24x7,
            bloodGroup: bg,
            componentType: comp,
            unitsAvailable: units,
            status: units > 5 ? 'AVAILABLE' : units > 0 ? 'LIMITED' : 'OUT_OF_STOCK',
            updatedAt: new Date().toISOString()
          };
          this.bloodInventory.push(newItem);
        });
      });
      bloodInventory = this.bloodInventory.filter(i => linkedBbIds.has(i.bloodBankId));
    }

    // Find linked transplant centers
    let linkedTransplantCenters = this.transplantCenters.filter(tc =>
      tc.hospitalId === hospital.id ||
      (tc.name && tc.name.toLowerCase().includes(hospital.name.toLowerCase())) ||
      (hospital.name && hospital.name.toLowerCase().includes(tc.name.toLowerCase())) ||
      tc.district.toLowerCase() === hospital.district.toLowerCase()
    );

    if (linkedTransplantCenters.length === 0) {
      const newTc = {
        id: `tc-${hospital.id}`,
        name: `${hospital.name} TRANSTAN Organ Retrieval & Transplant Liaison`,
        hospitalId: hospital.id,
        address: hospital.address,
        district: hospital.district,
        phone: hospital.phone,
        coordinatorName: 'Dr. R. Kavitha (Zonal Transplant Officer)',
        coordinatorPhone: hospital.emergencyPhone || hospital.phone,
        accreditationNumber: `TRANSTAN-TN-${hospital.district.slice(0, 3).toUpperCase()}-01`,
        lat: hospital.lat,
        lng: hospital.lng,
        updatedAt: new Date().toISOString()
      };
      this.transplantCenters.push(newTc);
      linkedTransplantCenters = [newTc];
    }

    const linkedTcIds = new Set(linkedTransplantCenters.map(t => t.id));

    // Organ availability items for this hospital
    let organInventory = this.organAvailability.filter(i =>
      linkedTcIds.has(i.centerId) || i.hospitalId === hospital.id
    );

    // If empty organ inventory, seed standard organs
    if (organInventory.length === 0) {
      const primaryTc = linkedTransplantCenters[0];
      const organTypes = ['KIDNEY', 'LIVER', 'HEART', 'LUNG', 'CORNEA', 'PANCREAS'];
      organTypes.forEach((organ, oIdx) => {
        const statuses = ['WAITLIST_OPEN', 'DONOR_AVAILABLE', 'INFORMATION_ONLY'];
        const status = statuses[oIdx % statuses.length];
        const waitlistCount = 10 + (oIdx * 8);

        const newOrg = {
          id: `org-avail-${primaryTc.id}-${organ.toLowerCase()}`,
          centerId: primaryTc.id,
          centerName: primaryTc.name,
          hospitalId: hospital.id,
          address: hospital.address,
          district: hospital.district,
          phone: hospital.phone,
          coordinatorName: primaryTc.coordinatorName,
          coordinatorPhone: primaryTc.coordinatorPhone,
          lat: hospital.lat,
          lng: hospital.lng,
          organType: organ,
          status,
          waitlistCount,
          matchingCriteria: 'ABO Blood Match, HLA Tissue Typing, PRA < 20%, Body Size Match (TRANSTAN Rules)',
          disclaimer: 'Official TRANSTAN / NOTTO allocation only. Commercial trade is strictly prohibited by law.',
          updatedAt: new Date().toISOString()
        };
        this.organAvailability.push(newOrg);
      });
      organInventory = this.organAvailability.filter(i =>
        linkedTcIds.has(i.centerId) || i.hospitalId === hospital.id
      );
    }

    return {
      hospital,
      bloodBanks: linkedBloodBanks,
      transplantCenters: linkedTransplantCenters,
      bloodInventory,
      organInventory,
      beds: hospital.beds || []
    };
  }

  updateHospitalBloodInventory(itemId: string, updates: { unitsAvailable?: number; status?: string; is24x7?: boolean }) {
    const item = this.bloodInventory.find(i => i.id === itemId);
    if (!item) return null;

    if (updates.unitsAvailable !== undefined) {
      item.unitsAvailable = Math.max(0, Math.floor(updates.unitsAvailable));
      if (updates.status) {
        item.status = updates.status;
      } else {
        item.status = item.unitsAvailable === 0 ? 'OUT_OF_STOCK' : item.unitsAvailable < 5 ? 'LIMITED' : 'AVAILABLE';
      }
    } else if (updates.status) {
      item.status = updates.status;
    }

    if (updates.is24x7 !== undefined) {
      item.is24x7 = updates.is24x7;
    }

    item.updatedAt = new Date().toISOString();

    // Broadcast SSE
    eventBus.emit('blood_updated', {
      itemId: item.id,
      bloodBankId: item.bloodBankId,
      bloodBankName: item.bloodBankName,
      hospitalName: item.hospitalName,
      district: item.district,
      bloodGroup: item.bloodGroup,
      componentType: item.componentType,
      unitsAvailable: item.unitsAvailable,
      status: item.status,
      updatedAt: item.updatedAt
    });

    return item;
  }

  addHospitalBloodInventoryItem(data: {
    bloodBankId: string;
    hospitalId?: string;
    bloodGroup: string;
    componentType: string;
    unitsAvailable: number;
    status?: string;
  }) {
    let existing = this.bloodInventory.find(
      i => i.bloodBankId === data.bloodBankId &&
           i.bloodGroup === data.bloodGroup &&
           i.componentType === data.componentType
    );

    if (existing) {
      existing.unitsAvailable += Math.max(0, Number(data.unitsAvailable));
      existing.status = existing.unitsAvailable === 0 ? 'OUT_OF_STOCK' : existing.unitsAvailable < 5 ? 'LIMITED' : 'AVAILABLE';
      existing.updatedAt = new Date().toISOString();

      eventBus.emit('blood_updated', {
        itemId: existing.id,
        bloodBankId: existing.bloodBankId,
        bloodBankName: existing.bloodBankName,
        hospitalName: existing.hospitalName,
        district: existing.district,
        bloodGroup: existing.bloodGroup,
        componentType: existing.componentType,
        unitsAvailable: existing.unitsAvailable,
        status: existing.status,
        updatedAt: existing.updatedAt
      });

      return existing;
    }

    const bb = this.bloodBanks.find(b => b.id === data.bloodBankId) || this.bloodBanks[0];
    const units = Math.max(0, Number(data.unitsAvailable));
    const newItem = {
      id: `blood-inv-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      bloodBankId: bb?.id || 'bb-01',
      bloodBankName: bb?.name || 'Central Blood Bank',
      hospitalName: bb?.hospitalName || 'District Headquarters Hospital',
      address: bb?.address || 'Hospital Campus',
      district: bb?.district || 'Coimbatore',
      phone: bb?.phone || '+91 94400 00000',
      emergencyContact: bb?.emergencyContact || '+91 94400 00000',
      lat: bb?.lat || 11.0168,
      lng: bb?.lng || 76.9558,
      is24x7: true,
      bloodGroup: data.bloodGroup,
      componentType: data.componentType,
      unitsAvailable: units,
      status: data.status || (units === 0 ? 'OUT_OF_STOCK' : units < 5 ? 'LIMITED' : 'AVAILABLE'),
      updatedAt: new Date().toISOString()
    };

    this.bloodInventory.unshift(newItem);

    eventBus.emit('blood_updated', {
      itemId: newItem.id,
      bloodBankId: newItem.bloodBankId,
      bloodBankName: newItem.bloodBankName,
      hospitalName: newItem.hospitalName,
      district: newItem.district,
      bloodGroup: newItem.bloodGroup,
      componentType: newItem.componentType,
      unitsAvailable: newItem.unitsAvailable,
      status: newItem.status,
      updatedAt: newItem.updatedAt
    });

    return newItem;
  }

  updateHospitalOrganStatus(itemId: string, updates: {
    status?: string;
    waitlistCount?: number;
    matchingCriteria?: string;
    coordinatorName?: string;
    coordinatorPhone?: string;
    donorDetails?: string;
  }) {
    const item = this.organAvailability.find(i => i.id === itemId);
    if (!item) return null;

    if (updates.status) item.status = updates.status;
    if (updates.waitlistCount !== undefined) item.waitlistCount = Math.max(0, Math.floor(updates.waitlistCount));
    if (updates.matchingCriteria) item.matchingCriteria = updates.matchingCriteria;
    if (updates.coordinatorName) item.coordinatorName = updates.coordinatorName;
    if (updates.coordinatorPhone) item.coordinatorPhone = updates.coordinatorPhone;
    if (updates.donorDetails !== undefined) item.donorDetails = updates.donorDetails;

    item.updatedAt = new Date().toISOString();

    eventBus.emit('organ_updated', {
      itemId: item.id,
      centerId: item.centerId,
      centerName: item.centerName,
      hospitalId: item.hospitalId,
      district: item.district,
      organType: item.organType,
      status: item.status,
      waitlistCount: item.waitlistCount,
      matchingCriteria: item.matchingCriteria,
      coordinatorName: item.coordinatorName,
      coordinatorPhone: item.coordinatorPhone,
      donorDetails: item.donorDetails,
      updatedAt: item.updatedAt
    });

    return item;
  }

  addHospitalOrganItem(data: {
    hospitalId: string;
    centerId?: string;
    organType: string;
    status: string;
    waitlistCount: number;
    matchingCriteria?: string;
    coordinatorName?: string;
    coordinatorPhone?: string;
    donorDetails?: string;
  }) {
    const hospital = this.hospitals.find(h => h.id === data.hospitalId) || this.hospitals[0];
    const tc = (data.centerId ? this.transplantCenters.find(t => t.id === data.centerId) : null) ||
               this.transplantCenters.find(t => t.hospitalId === hospital.id) ||
               this.transplantCenters[0];

    const newItem = {
      id: `org-avail-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      centerId: tc?.id || 'tc-01',
      centerName: tc?.name || `${hospital.name} TRANSTAN Liaison Unit`,
      hospitalId: hospital.id,
      address: hospital.address,
      district: hospital.district,
      phone: hospital.phone,
      coordinatorName: data.coordinatorName || tc?.coordinatorName || 'TRANSTAN Coordinator',
      coordinatorPhone: data.coordinatorPhone || tc?.coordinatorPhone || hospital.emergencyPhone || hospital.phone,
      lat: hospital.lat,
      lng: hospital.lng,
      organType: data.organType,
      status: data.status || 'DONOR_AVAILABLE',
      waitlistCount: Number(data.waitlistCount) || 0,
      matchingCriteria: data.matchingCriteria || 'ABO Blood Match, HLA Tissue Typing, PRA < 20% (TRANSTAN Rules)',
      donorDetails: data.donorDetails || '',
      disclaimer: 'Official TRANSTAN / NOTTO allocation only. Commercial trade is strictly prohibited by law.',
      updatedAt: new Date().toISOString()
    };

    this.organAvailability.unshift(newItem);

    eventBus.emit('organ_updated', {
      itemId: newItem.id,
      centerId: newItem.centerId,
      centerName: newItem.centerName,
      hospitalId: newItem.hospitalId,
      district: newItem.district,
      organType: newItem.organType,
      status: newItem.status,
      waitlistCount: newItem.waitlistCount,
      matchingCriteria: newItem.matchingCriteria,
      coordinatorName: newItem.coordinatorName,
      coordinatorPhone: newItem.coordinatorPhone,
      donorDetails: newItem.donorDetails,
      updatedAt: newItem.updatedAt
    });

    return newItem;
  }

  // Referrals
  getReferrals(userId?: string) {
    if (userId) {
      return this.referrals.filter(r => r.userId === userId);
    }
    return this.referrals;
  }

  createReferral(referralData: any) {
    const tokenCode = `REF-2026-TN-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRef = {
      id: referralData.id || `ref-${Date.now()}`,
      tokenCode,
      qrData: JSON.stringify({
        tokenCode,
        patientName: referralData.patientName,
        age: referralData.patientAge,
        destination: referralData.toHospitalName || referralData.referredFacilityName || 'Tertiary Center',
        urgency: referralData.urgency || referralData.priority || 'URGENT',
        timestamp: new Date().toISOString()
      }),
      userId: referralData.userId || 'usr-01',
      patientName: referralData.patientName,
      patientAge: Number(referralData.patientAge) || 40,
      patientGender: referralData.patientGender || 'MALE',
      patientPhone: referralData.patientPhone || '',
      reason: referralData.reason || referralData.symptoms || '',
      symptoms: referralData.symptoms || [],
      priority: referralData.priority || referralData.urgency || 'ROUTINE',
      urgency: referralData.urgency || referralData.priority || 'ROUTINE',
      currentFacility: referralData.currentFacility || referralData.fromFacility || 'Rural PHC Clinic',
      fromFacility: referralData.fromFacility || referralData.currentFacility || 'Rural PHC Clinic',
      preferredFacilityId: referralData.preferredFacilityId,
      referredFacilityName: referralData.referredFacilityName || referralData.toHospitalName || 'Government District Headquarters Hospital',
      toHospitalName: referralData.toHospitalName || referralData.referredFacilityName || 'Government District Headquarters Hospital',
      requiredSpecialty: referralData.requiredSpecialty || 'General Medicine & Emergency Care',
      referralDistrict: referralData.referralDistrict || 'Coimbatore',
      assignedWard: referralData.assignedWard,
      assignedBed: referralData.assignedBed,
      assignedDoctor: referralData.assignedDoctor,
      triageNotes: referralData.triageNotes,
      status: 'REQUESTED',
      notes: referralData.notes || 'Pending triage verification by receiving medical officer',
      timeline: [
        {
          status: 'REQUESTED',
          label: 'Referral Pass Generated by Primary Clinic',
          timestamp: new Date().toISOString(),
          actor: referralData.patientName || 'Primary Health Officer'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.referrals.unshift(newRef);

    // Auto-create notification
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: newRef.userId,
      title: `Referral Created (${newRef.tokenCode})`,
      message: `Referral pass generated for ${newRef.patientName}. Destination: ${newRef.toHospitalName}.`,
      type: 'INFO',
      read: false,
      createdAt: new Date().toISOString()
    });

    // Log in Audit Trail
    this.logAudit(
      'REFERRAL_CREATED',
      'USER',
      referralData.patientName || 'Patient Attendant',
      undefined,
      newRef.fromFacility,
      `Referral pass ${newRef.tokenCode} generated for ${newRef.toHospitalName} (${newRef.priority})`
    );

    eventBus.emit('referral_created', newRef);
    return newRef;
  }

  updateReferralStatus(id: string, newStatus: string, actor: string = 'Hospital Triage Team', note?: string) {
    const ref = this.referrals.find(r => r.id === id || r.tokenCode === id);
    if (!ref) return null;

    ref.status = newStatus;
    ref.updatedAt = new Date().toISOString();
    ref.timeline.push({
      status: newStatus,
      label: `Status transitioned to ${newStatus.replace(/_/g, ' ')}`,
      timestamp: new Date().toISOString(),
      actor,
      note: note || ''
    });

    this.logAudit(
      'REFERRAL_STATUS_UPDATED',
      'HOSPITAL',
      actor,
      ref.preferredFacilityId,
      ref.toHospitalName,
      `Pass ${ref.tokenCode} status updated to ${newStatus}. Note: ${note || 'None'}`
    );

    eventBus.emit('referral_updated', ref);
    return ref;
  }

  reviewHospitalReferral(
    id: string,
    action: 'ACCEPT' | 'REJECT' | 'TRAVELLING' | 'ARRIVED' | 'COMPLETE' | 'UNDER_REVIEW',
    bedAssigned?: string,
    note?: string,
    actorName: string = 'Dr. R. Kavitha (CMCH Triage)'
  ) {
    const ref = this.referrals.find(r => r.id === id || r.tokenCode === id);
    if (!ref) return null;

    let targetStatus = 'UNDER_REVIEW';
    let timelineLabel = 'Referral Under Clinical Review';

    if (action === 'ACCEPT') {
      targetStatus = 'ACCEPTED';
      timelineLabel = `Referral Accepted & Bed Allocated (${bedAssigned || 'Triage Bed'})`;
      ref.assignedBed = bedAssigned || 'ICU Ward Bed';
      ref.assignedWard = 'Emergency Triage & Monitoring';
    } else if (action === 'REJECT') {
      targetStatus = 'REJECTED';
      timelineLabel = `Referral Diverted / Rejected: ${note || 'Clinical review criteria not met'}`;
    } else if (action === 'TRAVELLING') {
      targetStatus = 'PATIENT_TRAVELLING';
      timelineLabel = 'Patient Departed Clinic / En-Route in 108 Ambulance';
    } else if (action === 'ARRIVED') {
      targetStatus = 'ARRIVED';
      timelineLabel = 'Patient Arrived at Hospital Casualty Reception';
    } else if (action === 'COMPLETE') {
      targetStatus = 'COMPLETED';
      timelineLabel = 'Transfer & Admission Formalities Completed';
    }

    ref.status = targetStatus;
    ref.updatedAt = new Date().toISOString();
    if (note) ref.triageNotes = note;

    ref.timeline.push({
      status: targetStatus,
      label: timelineLabel,
      timestamp: new Date().toISOString(),
      actor: actorName,
      note: note || ''
    });

    this.logAudit(
      `REFERRAL_${action}`,
      'HOSPITAL',
      actorName,
      ref.preferredFacilityId,
      ref.toHospitalName,
      `Action: ${action} on ${ref.tokenCode}. Bed: ${bedAssigned || 'N/A'}. ${note || ''}`
    );

    eventBus.emit('referral_updated', ref);
    return ref;
  }

  // Audit Logs
  logAudit(
    action: string,
    role: string,
    actorName: string,
    facilityId?: string,
    facilityName?: string,
    details: string = '',
    ipOrOrigin: string = 'Authorized REVIVE Session'
  ) {
    const entry = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      role,
      actorName,
      facilityId,
      facilityName,
      details,
      ipOrOrigin
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 200) this.auditLogs.pop();
    return entry;
  }

  getAuditLogs(limit: number = 50) {
    return this.auditLogs.slice(0, limit);
  }

  // Discrepancy Reporting
  createDiscrepancyReport(data: any) {
    const newReport = {
      id: `rep-${Date.now()}`,
      resourceType: data.resourceType || 'MEDICINE',
      resourceId: data.resourceId || '',
      resourceName: data.resourceName || 'Resource',
      facilityName: data.facilityName || 'Facility',
      district: data.district || 'Coimbatore',
      issueType: data.issueType || 'OTHER',
      reportedBy: data.reportedBy || 'Citizen Contributor',
      contactPhone: data.contactPhone || '',
      notes: data.notes || '',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    this.discrepancyReports.unshift(newReport);

    this.logAudit(
      'DISCREPANCY_REPORTED',
      'USER',
      newReport.reportedBy,
      data.facilityId,
      newReport.facilityName,
      `Flagged: ${newReport.resourceName} (${newReport.issueType}): ${newReport.notes}`
    );

    return newReport;
  }

  getDiscrepancyReports() {
    return this.discrepancyReports;
  }

  updateDiscrepancyReport(id: string, status: string, notes?: string) {
    const report = this.discrepancyReports.find(r => r.id === id);
    if (!report) return null;

    report.status = status;
    if (status === 'RESOLVED') {
      report.resolvedAt = new Date().toISOString();
    }
    if (notes) {
      report.notes = `${report.notes} | Resolution: ${notes}`;
    }

    this.logAudit(
      'DISCREPANCY_RESOLVED',
      'ADMIN',
      'Health Operations Admin',
      undefined,
      report.facilityName,
      `Discrepancy ${id} marked as ${status}.`
    );

    return report;
  }

  // Admin Operational Metrics
  getAdminMetrics() {
    const totalPharmacies = this.pharmacies.length;
    const totalHospitals = this.hospitals.length;
    const totalBloodBanks = this.bloodBanks.length;
    const totalTransplantCenters = this.transplantCenters.length;

    const totalMedicines = this.medicines.length;
    const availableInventoryCount = this.medicineInventory.filter(i => i.status === 'AVAILABLE').length;
    const limitedInventoryCount = this.medicineInventory.filter(i => i.status === 'LIMITED').length;
    const outOfStockCount = this.medicineInventory.filter(i => i.status === 'OUT_OF_STOCK').length;

    let totalBeds = 0;
    let availableBeds = 0;
    let icuBedsTotal = 0;
    let icuBedsAvailable = 0;

    this.hospitals.forEach(h => {
      if (Array.isArray(h.beds)) {
        h.beds.forEach((b: any) => {
          totalBeds += b.total || 0;
          availableBeds += b.available || 0;
          if (b.category === 'ICU' || b.category === 'VENTILATOR' || b.category === 'EMERGENCY') {
            icuBedsTotal += b.total || 0;
            icuBedsAvailable += b.available || 0;
          }
        });
      }
    });

    const totalBloodUnits = this.bloodInventory.reduce((acc, curr) => acc + (curr.unitsAvailable || 0), 0);
    const criticalBloodShortages = this.bloodInventory.filter(b => b.status === 'CRITICAL').length;

    const totalReferrals = this.referrals.length;
    const activeReferrals = this.referrals.filter(r => ['REQUESTED', 'UNDER_REVIEW', 'ACCEPTED', 'PATIENT_TRAVELLING'].includes(r.status)).length;
    const completedReferrals = this.referrals.filter(r => r.status === 'COMPLETED').length;

    const pendingDiscrepancies = this.discrepancyReports.filter(d => d.status === 'PENDING').length;
    const resolvedDiscrepancies = this.discrepancyReports.filter(d => d.status === 'RESOLVED').length;

    return {
      facilities: {
        total: totalPharmacies + totalHospitals + totalBloodBanks + totalTransplantCenters,
        pharmacies: totalPharmacies,
        hospitals: totalHospitals,
        bloodBanks: totalBloodBanks,
        transplantCenters: totalTransplantCenters
      },
      medicines: {
        catalogCount: totalMedicines,
        inStockItems: availableInventoryCount,
        limitedItems: limitedInventoryCount,
        outOfStockItems: outOfStockCount,
        totalStockRecords: this.medicineInventory.length
      },
      beds: {
        totalBeds,
        availableBeds,
        occupancyRate: totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0,
        icuBedsTotal,
        icuBedsAvailable
      },
      blood: {
        totalUnits: totalBloodUnits,
        criticalShortages: criticalBloodShortages,
        verifiedBanks: totalBloodBanks
      },
      referrals: {
        total: totalReferrals,
        active: activeReferrals,
        completed: completedReferrals
      },
      discrepancies: {
        total: this.discrepancyReports.length,
        pending: pendingDiscrepancies,
        resolved: resolvedDiscrepancies
      },
      systemHealth: {
        iotNodesOnline: this.iotDevices.filter(d => d.status === 'ONLINE').length,
        totalIoTNodes: this.iotDevices.length,
        lastAuditTimestamp: this.auditLogs[0]?.timestamp || new Date().toISOString()
      }
    };
  }

  // Demonstration Data Reset
  resetDemoData() {
    this.seed();
    this.logAudit(
      'DEMO_DATA_RESET',
      'ADMIN',
      'System Demonstrator',
      undefined,
      'System-Wide',
      'Reset all hospital beds, inventory, referrals, and reports to pristine hackathon demonstration state.'
    );
    eventBus.emit('demo_reset', { timestamp: new Date().toISOString() });
    return { success: true, message: 'REVIVE demonstration state successfully restored.' };
  }

  // IoT Devices
  getIoTDevices() {
    return this.iotDevices;
  }

  updateIoTReading(deviceCode: string, telemetry: any) {
    const device = this.iotDevices.find(d => d.deviceCode === deviceCode);
    if (!device) return null;

    device.telemetry = { ...device.telemetry, ...telemetry };
    device.lastSeen = new Date().toISOString();
    device.updatedAt = new Date().toISOString();

    eventBus.emit('iot_telemetry', device);
    return device;
  }

  // Global Unified Instant Search
  globalSearch(query: string, district?: string, userLat?: number, userLng?: number) {
    if (!query || query.trim() === '') return [];
    const q = query.toLowerCase().trim();
    const results: any[] = [];
    const refLat = userLat || 11.0168;
    const refLng = userLng || 76.9558;

    // 1. Search Medicines
    const isParacetamol = /p[ae]r[ae]?[cs][aei]?[etm][a-z]*m[ao]l|parac[a-z]{2,8}ol|paracet|paracit|dolo|crocin|calpol/i.test(q);
    const trained = trainAndNormalizeQuery(q);
    const targetMed = trained.medicineTarget ? trained.medicineTarget.toLowerCase() : '';
    const phoneticQ = q.replace(/omol/g, 'amol').replace(/acit/g, 'acet').replace(/em/g, 'etam');

    const matchedMeds = this.medicines.filter(m => {
      const mName = m.name.toLowerCase();
      const mGen = m.genericName.toLowerCase();
      const mCat = m.category.toLowerCase();
      const mUses = m.uses.map((u: string) => u.toLowerCase()).join(' ');

      if (mName.includes(q) || mGen.includes(q) || mCat.includes(q) || mUses.includes(q)) return true;
      if (isParacetamol && (mName.includes('paracetamol') || mGen.includes('paracetamol') || mName.includes('dolo'))) return true;
      if (mName.includes(phoneticQ) || mGen.includes(phoneticQ)) return true;
      if (targetMed && (mName.includes(targetMed) || targetMed.includes(mName))) return true;
      return false;
    });

    matchedMeds.forEach(m => {
      // Find top available pharmacy for this medicine
      const avail = this.medicineInventory.filter(i => i.medicineId === m.id && i.status === 'AVAILABLE');
      results.push({
        id: `sr-med-${m.id}`,
        type: 'MEDICINE',
        title: m.name,
        subtitle: `${m.genericName} • ${m.dosageForm} (${m.strength})`,
        badge: avail.length > 0 ? `${avail.length} Pharmacies Available` : 'Check Availability',
        district: district || 'All Districts',
        data: m
      });
    });

    // 2. Search Hospitals & Beds
    const matchedHospitals = this.hospitals.filter(h =>
      h.name.toLowerCase().includes(q) ||
      h.address.toLowerCase().includes(q) ||
      h.district.toLowerCase().includes(q) ||
      h.beds.some((b: any) => b.category.toLowerCase().includes(q) || b.categoryLabel.toLowerCase().includes(q))
    );

    matchedHospitals.forEach(h => {
      const availBeds = h.beds.reduce((acc: number, b: any) => acc + b.availableBeds, 0);
      const icuBed = h.beds.find((b: any) => b.category === 'ICU');
      const dist = calculateDistanceKm(refLat, refLng, h.lat, h.lng);

      results.push({
        id: `sr-hosp-${h.id}`,
        type: 'HOSPITAL',
        title: h.name,
        subtitle: `${h.type === 'GOVERNMENT' ? 'Govt Hospital' : 'Private'} • ${h.district} • ${icuBed ? `${icuBed.availableBeds} ICU Beds Free` : ''}`,
        badge: `${availBeds} Total Beds Available`,
        district: h.district,
        distanceKm: dist,
        data: h
      });
    });

    // 3. Search Blood Banks
    const isBloodSearch = ['blood', 'a+', 'a-', 'b+', 'b-', 'ab+', 'ab-', 'o+', 'o-', 'plasma', 'platelets'].some(term => q.includes(term));
    if (isBloodSearch) {
      this.bloodBanks.slice(0, 4).forEach(bb => {
        const dist = calculateDistanceKm(refLat, refLng, bb.lat, bb.lng);
        results.push({
          id: `sr-bb-${bb.id}`,
          type: 'BLOOD',
          title: bb.name,
          subtitle: `24x7 Blood Bank • Emergency: ${bb.emergencyContact}`,
          badge: 'Stock Ready',
          district: bb.district,
          distanceKm: dist,
          data: bb
        });
      });
    }

    // 4. Search Pharmacies
    const matchedPharmacies = this.pharmacies.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q)
    );

    matchedPharmacies.forEach(p => {
      const dist = calculateDistanceKm(refLat, refLng, p.lat, p.lng);
      results.push({
        id: `sr-ph-${p.id}`,
        type: 'PHARMACY',
        title: p.name,
        subtitle: `${p.address} • Phone: ${p.phone}`,
        badge: p.is24x7 ? '24x7 Open' : 'Open',
        district: p.district,
        distanceKm: dist,
        data: p
      });
    });

    return results.slice(0, 15);
  }
}

export const db = new Database();
