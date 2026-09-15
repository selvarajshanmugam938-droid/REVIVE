export type UserRole = 'USER' | 'PHARMACY' | 'ADMIN' | 'HOSPITAL' | 'BLOOD_BANK';
export type AppMode = 'BASIC' | 'ADVANCED' | 'PHARMACY' | 'HOSPITAL' | 'ADMIN' | 'HARDWARE';
export type Language = 'en' | 'ta' | 'hi';

export type DataFreshnessStatus = 'RECENTLY_UPDATED' | 'NEEDS_CONFIRMATION' | 'STALE';
export type ProviderVerificationStatus = 'VERIFIED_PROVIDER' | 'COMMUNITY_REPORTED' | 'PENDING_AUDIT';

export interface DataFreshnessInfo {
  status: DataFreshnessStatus;
  label: string;
  hoursAgo: number;
  relativeTime: string;
  isVerifiedProvider: boolean;
  needsPhoneConfirmation: boolean;
}

export interface DiscrepancyReport {
  id: string;
  resourceType: 'MEDICINE' | 'BED' | 'BLOOD' | 'ORGAN' | 'PHARMACY' | 'HOSPITAL';
  resourceId: string;
  resourceName: string;
  facilityName: string;
  district: string;
  issueType: 'OUT_OF_STOCK' | 'INCORRECT_PHONE' | 'CLOSED_FACILITY' | 'WRONG_PRICE' | 'BEDS_FULL' | 'OTHER';
  reportedBy: string;
  contactPhone?: string;
  notes: string;
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  role: UserRole;
  actorName: string;
  facilityId?: string;
  facilityName?: string;
  details: string;
  ipOrOrigin?: string;
}

export type VoiceAssistantState =
  | 'READY'
  | 'LISTENING'
  | 'PROCESSING'
  | 'SPEAKING'
  | 'INTERRUPTED'
  | 'MUTED'
  | 'OFFLINE'
  | 'PERMISSION_REQUIRED'
  | 'ERROR';

export interface HardwareLcdState {
  line1: string; // Max 16 characters for physical 16x2 LCD
  line2: string; // Max 16 characters for physical 16x2 LCD
  backlight: boolean;
  state: VoiceAssistantState;
}

export interface HardwareDevice {
  deviceCode: string;
  deviceLabel: string;
  hardwareType: 'ESP32_REVIVE_BOX' | 'KIOSK' | 'SIMULATOR';
  status: 'ONLINE' | 'STANDBY' | 'OFFLINE' | 'PAIRING';
  isSimulated: boolean;
  ipAddress?: string;
  macAddress?: string;
  wifiSsid?: string;
  wifiRssi?: number;
  batteryLevel?: number;
  lastHeartbeat?: string;
  authToken?: string;
  lcdDisplay: {
    line1: string;
    line2: string;
  };
  telemetry?: {
    micStatus?: 'ACTIVE' | 'MUTED' | 'STANDBY';
    speakerStatus?: 'STANDBY' | 'PLAYING' | 'STREAMING_I2S_AUDIO' | 'SPEAKING_AUDIO_OUT';
    sampleRateHz?: number;
    lastSpokenLanguage?: string;
    lastSpokenQuery?: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  mode?: AppMode;
  language?: Language;
  district: string;
  pharmacyId?: string;
  hospitalId?: string;
  hospitalName?: string;
  hospitalStaffRole?: string;
  preferences?: {
    mode?: AppMode;
    language?: Language;
  };
  lat?: number;
  lng?: number;
}

export type BloodComponentType = BloodComponent;
export type OrganInventoryItem = OrganAvailabilityItem;

export type AvailabilityStatus = 'AVAILABLE' | 'LIMITED' | 'OUT_OF_STOCK' | 'UNKNOWN';

export interface Pharmacy {
  id: string;
  name: string;
  ownerName: string;
  licenseNumber: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  phone: string;
  is24x7: boolean;
  rating: number;
  updatedAt: string;
  distanceKm?: number;
}

export interface DosageGuidelines {
  adult: string;
  pediatric: string;
  frequency: string;
  maxDailyLimit: string;
  timing: string;
}

export interface JanAushadhiComparison {
  genericPrice: number;
  brandedPrice: number;
  savingsPercentage: number;
  governmentScheme: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  dosageForm: string; // Tablet, Syrup, Injection, Capsule, Drops, Ointment
  strength: string; // e.g. 500mg, 100ml
  manufacturer: string;
  prescriptionRequired: boolean;
  description: string;
  uses: string[];
  detailedDescription?: string;
  indications?: string[];
  brandNames?: string[];
  dosageInstructions?: DosageGuidelines;
  sideEffects?: {
    common: string[];
    rare: string[];
  };
  precautions?: string[];
  mechanismOfAction?: string;
  janAushadhiComparison?: JanAushadhiComparison;
  storageInfo?: string;
  tamilDescription?: string;
  hindiDescription?: string;
}

export interface MedicineInventoryItem {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyDistrict: string;
  pharmacyPhone: string;
  pharmacyLat: number;
  pharmacyLng: number;
  is24x7: boolean;
  medicineId: string;
  medicineName: string;
  genericName: string;
  category: string;
  dosageForm: string;
  strength: string;
  stockQuantity: number;
  status: AvailabilityStatus;
  price: number;
  rackLocation?: string;
  batchNumber?: string;
  expiryDate?: string;
  updatedAt: string;
  distanceKm?: number;
  description?: string;
  detailedDescription?: string;
  indications?: string[];
  brandNames?: string[];
  dosageInstructions?: DosageGuidelines;
  sideEffects?: {
    common: string[];
    rare: string[];
  };
  precautions?: string[];
  mechanismOfAction?: string;
  janAushadhiComparison?: JanAushadhiComparison;
  storageInfo?: string;
  tamilDescription?: string;
  hindiDescription?: string;
}

export type BedCategory = 'GENERAL' | 'ICU' | 'EMERGENCY' | 'PEDIATRIC' | 'MATERNITY' | 'ISOLATION' | 'OXYGEN_SUPPORTED';

export interface HospitalBed {
  id: string;
  category: BedCategory;
  categoryLabel: string;
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  ventilatorCount: number;
  pricePerDay: number;
  updatedAt: string;
}

export interface Hospital {
  id: string;
  name: string;
  type: 'GOVERNMENT' | 'PRIVATE' | 'COMMUNITY_HEALTH_CENTER' | 'PRIMARY_HEALTH_CENTER';
  address: string;
  district: string;
  lat: number;
  lng: number;
  phone: string;
  emergencyPhone: string;
  ambulanceAvailable: boolean;
  rating: number;
  updatedAt: string;
  beds: HospitalBed[];
  distanceKm?: number;
  totalAvailableBeds?: number;
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type BloodComponent = 'WHOLE_BLOOD' | 'PRBC' | 'PLATELETS' | 'FFP';

export interface BloodInventoryItem {
  id: string;
  bloodBankId: string;
  bloodBankName: string;
  hospitalName?: string;
  address: string;
  district: string;
  phone: string;
  emergencyContact: string;
  lat: number;
  lng: number;
  is24x7: boolean;
  bloodGroup: BloodGroup;
  componentType: BloodComponent;
  unitsAvailable: number;
  status: AvailabilityStatus;
  updatedAt: string;
  distanceKm?: number;
}

export interface BloodBank {
  id: string;
  name: string;
  hospitalName?: string;
  address: string;
  district: string;
  phone: string;
  emergencyContact: string;
  lat: number;
  lng: number;
  is24x7: boolean;
  updatedAt: string;
  distanceKm?: number;
}

export type OrganType = 'KIDNEY' | 'LIVER' | 'HEART' | 'LUNG' | 'CORNEA' | 'PANCREAS' | 'TISSUE';
export type OrganStatus = 'WAITLIST_OPEN' | 'DONOR_AVAILABLE' | 'EMERGENCY_MATCH' | 'INFORMATION_ONLY';

export interface TransplantCenter {
  id: string;
  name: string;
  hospitalId: string;
  address: string;
  district: string;
  phone: string;
  coordinatorName: string;
  coordinatorPhone: string;
  accreditationNumber: string;
  lat: number;
  lng: number;
  updatedAt: string;
  distanceKm?: number;
}

export interface OrganAvailabilityItem {
  id: string;
  centerId: string;
  centerName: string;
  hospitalId: string;
  address: string;
  district: string;
  phone: string;
  coordinatorName: string;
  coordinatorPhone: string;
  lat: number;
  lng: number;
  organType: OrganType;
  status: OrganStatus;
  waitlistCount: number;
  matchingCriteria: string;
  donorDetails?: string;
  disclaimer: string;
  updatedAt: string;
  distanceKm?: number;
}

export type ReferralPriority = 'ROUTINE' | 'URGENT' | 'EMERGENCY';
export type ReferralStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PATIENT_TRAVELLING'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'VERIFIED'
  | 'AMBULANCE_DISPATCHED'
  | 'ADMITTED'
  | 'REFERRED';

export interface ReferralTimelineStep {
  status: ReferralStatus;
  label: string;
  timestamp?: string;
  note?: string;
  actor?: string;
}

export interface Referral {
  id: string;
  tokenCode: string; // e.g. REF-2026-TN-4821
  userId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER' | string;
  patientPhone: string;
  reason: string;
  symptoms: string[] | string;
  priority: ReferralPriority;
  urgency?: ReferralPriority;
  currentFacility?: string;
  fromFacility?: string;
  preferredFacilityId?: string;
  referredFacilityName?: string;
  toHospitalName?: string;
  requiredSpecialty?: string;
  referralDistrict?: string;
  assignedWard?: string;
  assignedBed?: string;
  assignedDoctor?: string;
  triageNotes?: string;
  qrData?: string;
  status: ReferralStatus;
  notes?: string;
  timeline: ReferralTimelineStep[];
  createdAt: string;
  updatedAt: string;
}

export type IoTDeviceType = 'BED_OCCUPANCY' | 'COLD_STORAGE' | 'OXYGEN_PRESSURE' | 'VITAL_MONITOR' | 'AMBULANCE_TRACKER' | 'VOICE_ASSISTANT_NODE';
export type IoTDeviceStatus = 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ALERT';

export interface IoTDevice {
  id: string;
  deviceCode: string; // e.g., REVIVE-BED-TN01
  deviceType: IoTDeviceType;
  deviceLabel: string;
  facilityType: 'HOSPITAL' | 'PHARMACY' | 'AMBULANCE' | 'RURAL_CLINIC';
  facilityId: string;
  facilityName: string;
  locationLabel: string;
  status: IoTDeviceStatus;
  batteryLevel: number;
  signalStrength: number;
  lastSeen: string;
  telemetry: {
    occupancy?: boolean;
    temperature?: number; // °C
    humidity?: number; // %
    pressure?: number; // PSI / Bar
    spO2?: number; // %
    heartRate?: number; // BPM
    flowRate?: number; // L/min
    gpsLat?: number;
    gpsLng?: number;
    activeSpeaker?: boolean;
    audioOutVolume?: number;
    lastSpokenLanguage?: string;
    lastSpokenQuery?: string;
    speakerStatus?: string;
    sampleRateHz?: number;
    lastSpokenReply?: string;
  };
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  read: boolean;
  createdAt: string;
}

export interface GlobalSearchResult {
  id: string;
  type: 'MEDICINE' | 'HOSPITAL' | 'BED' | 'BLOOD' | 'ORGAN' | 'PHARMACY';
  title: string;
  subtitle: string;
  badge: string;
  district: string;
  distanceKm?: number;
  data: any;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  language: Language;
  timestamp: string;
  suggestedActions?: { label: string; action: string; payload?: any }[];
  referencedData?: {
    type: 'medicines' | 'beds' | 'blood' | 'organs' | 'emergency';
    items: any[];
  };
}

export interface HospitalPortalData {
  hospital: Hospital;
  bloodBanks: BloodBank[];
  transplantCenters: TransplantCenter[];
  bloodInventory: BloodInventoryItem[];
  organInventory: OrganAvailabilityItem[];
  beds: HospitalBed[];
}
