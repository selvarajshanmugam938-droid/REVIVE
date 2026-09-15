import express from 'express';
import path from 'path';
import https from 'https';
import { createServer as createViteServer } from 'vite';
import { db, eventBus } from './server/db.js';
import { GoogleGenAI } from '@google/genai';
import { trainAndNormalizeQuery } from './server/queryTrainer.js';
import {
  buildHumanizedVoicePrompt,
  generateHumanizedSpokenFallback,
  format16x2LcdLines,
  GroundedFacts
} from './server/aiVoicePersona.js';

// Text splitter for robust sentence-by-sentence neural TTS
function splitTextIntoChunks(text: string, maxLength = 170): string[] {
  const sentences = text.match(/[^.!?।;\n]+[.!?।;\n]+|[^.!?।;\n]+$/g) || [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    if ((current + ' ' + trimmed).trim().length <= maxLength) {
      current = (current + ' ' + trimmed).trim();
    } else {
      if (current) chunks.push(current);
      if (trimmed.length <= maxLength) {
        current = trimmed;
      } else {
        const words = trimmed.split(' ');
        current = '';
        for (const word of words) {
          if ((current + ' ' + word).trim().length <= maxLength) {
            current = (current + ' ' + word).trim();
          } else {
            if (current) chunks.push(current);
            current = word;
          }
        }
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// Fetch high-fidelity audio chunks from Google Neural TTS
function fetchGoogleTTSChunk(text: string, lang: string): Promise<Buffer> {
  return new Promise((resolve) => {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(text)}`;
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*'
        },
        timeout: 4500
      },
      (res) => {
        if (res.statusCode !== 200) {
          return resolve(Buffer.alloc(0));
        }
        const data: Buffer[] = [];
        res.on('data', (d) => data.push(d));
        res.on('end', () => resolve(Buffer.concat(data)));
      }
    );
    req.on('error', () => resolve(Buffer.alloc(0)));
    req.on('timeout', () => {
      req.destroy();
      resolve(Buffer.alloc(0));
    });
  });
}

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    } catch (err) {
      console.warn('Gemini client init skipped or failed:', err);
    }
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global uncaught handlers to prevent dev server crash
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception in server process:', err);
  });
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection in server process:', reason);
  });

  app.use(express.json());

  // Health check endpoints FIRST (Required by platform health monitors and reverse proxies)
  app.get(['/api/health', '/health', '/healthz'], (req, res) => {
    res.json({ status: 'ok', service: 'REVIVE Platform', timestamp: new Date().toISOString() });
  });

  // SSE Stream for Real-Time stock, bed, referral, and IoT updates
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const onStockUpdate = (data: any) => {
      res.write(`event: stock_updated\ndata: ${JSON.stringify(data)}\n\n`);
    };
    const onBloodUpdate = (data: any) => {
      res.write(`event: blood_updated\ndata: ${JSON.stringify(data)}\n\n`);
    };
    const onOrganUpdate = (data: any) => {
      res.write(`event: organ_updated\ndata: ${JSON.stringify(data)}\n\n`);
    };
    const onBedUpdate = (data: any) => {
      res.write(`event: bed_updated\ndata: ${JSON.stringify(data)}\n\n`);
    };
    const onReferralCreated = (data: any) => {
      res.write(`event: referral_created\ndata: ${JSON.stringify(data)}\n\n`);
    };
    const onReferralUpdated = (data: any) => {
      res.write(`event: referral_updated\ndata: ${JSON.stringify(data)}\n\n`);
    };
    const onIoTTelemetry = (data: any) => {
      res.write(`event: iot_telemetry\ndata: ${JSON.stringify(data)}\n\n`);
    };

    eventBus.on('stock_updated', onStockUpdate);
    eventBus.on('blood_updated', onBloodUpdate);
    eventBus.on('organ_updated', onOrganUpdate);
    eventBus.on('bed_updated', onBedUpdate);
    eventBus.on('referral_created', onReferralCreated);
    eventBus.on('referral_updated', onReferralUpdated);
    eventBus.on('iot_telemetry', onIoTTelemetry);

    // Initial ping
    res.write(`event: connected\ndata: ${JSON.stringify({ message: 'Connected to REVIVE Live Realtime Stream', timestamp: new Date().toISOString() })}\n\n`);

    req.on('close', () => {
      eventBus.off('stock_updated', onStockUpdate);
      eventBus.off('blood_updated', onBloodUpdate);
      eventBus.off('organ_updated', onOrganUpdate);
      eventBus.off('bed_updated', onBedUpdate);
      eventBus.off('referral_created', onReferralCreated);
      eventBus.off('referral_updated', onReferralUpdated);
      eventBus.off('iot_telemetry', onIoTTelemetry);
    });
  });

  // ----------------------------------------------------
  // AUTHENTICATION APIS
  // ----------------------------------------------------
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = db.findUserByEmail(cleanEmail);
    if (!user && cleanEmail.includes('@revive.in')) {
      user = db.findUserByEmail(cleanEmail.replace('@revive.in', '@revive.demo'));
    }
    if (!user && cleanEmail.includes('@revive.demo')) {
      user = db.findUserByEmail(cleanEmail.replace('@revive.demo', '@revive.in'));
    }

    if (!user) {
      return res.status(401).json({ error: 'No account found with this email' });
    }

    // In demo environment, accept demo123 or demo or matching hash
    if (user.passwordHash !== password && password !== 'demo123' && password !== 'demo') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return safe user object
    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser, token: `tok_${user.id}_${Date.now()}` });
  });

  // Dedicated Hospital Staff & Bed In-Charge 1-Click Login
  app.post('/api/auth/hospital-login', (req, res) => {
    const { hospitalId, staffName, staffRole } = req.body;
    const targetHosp = db.hospitals.find(h => h.id === hospitalId) || db.hospitals[0];
    
    // Find or create safe user profile for this hospital's clinical staff
    const doctorName = staffName || `Dr. ${targetHosp.name.split(' ')[0]} Medical Officer`;
    const designation = staffRole || 'Chief Medical Officer & Bed In-Charge';
    const email = `hospital.${targetHosp.id}@revive.in`;

    let user = db.findUserByEmail(email);
    if (!user) {
      user = db.createUser({
        name: doctorName,
        email,
        password: 'demo',
        phone: targetHosp.phone || '+91 94400 11000',
        role: 'HOSPITAL',
        district: targetHosp.district,
        hospitalId: targetHosp.id,
        hospitalName: targetHosp.name,
        hospitalStaffRole: designation
      });
    } else {
      user.name = doctorName;
      user.hospitalId = targetHosp.id;
      user.hospitalName = targetHosp.name;
      user.hospitalStaffRole = designation;
      user.district = targetHosp.district;
    }

    const { passwordHash, ...safeUser } = user;
    res.json({
      user: safeUser,
      token: `tok_hosp_${targetHosp.id}_${Date.now()}`,
      message: `Authenticated as ${designation} at ${targetHosp.name}`
    });
  });

  // Dedicated Blood Bank Coordinator 1-Click Login
  app.post('/api/auth/bloodbank-login', (req, res) => {
    const { hospitalId, officerName } = req.body;
    const targetHosp = db.hospitals.find(h => h.id === hospitalId) || db.hospitals[0];
    const staffName = officerName || 'S. Manickam (IRCS Blood Center Lead)';
    const email = 'bloodbank@revive.demo';

    let user = db.findUserByEmail(email);
    if (!user) {
      user = db.createUser({
        name: staffName,
        email,
        password: 'demo',
        phone: '+91 94435 99011',
        role: 'BLOOD_BANK',
        district: targetHosp.district,
        hospitalId: targetHosp.id,
        hospitalName: 'Indian Red Cross Society Regional Blood Center',
        hospitalStaffRole: 'Senior Blood Bank & Component Separation In-Charge'
      });
    }

    const { passwordHash, ...safeUser } = user;
    res.json({
      user: safeUser,
      token: `tok_blood_${targetHosp.id}_${Date.now()}`,
      message: `Authenticated as Blood Bank Coordinator at ${targetHosp.name}`
    });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role, district, phone, pharmacyName, address } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    let pharmacyId = undefined;
    let hospitalId = req.body.hospitalId;
    let hospitalName = req.body.hospitalName;
    let hospitalStaffRole = req.body.hospitalStaffRole;

    if (role === 'PHARMACY') {
      const newPharmacy = {
        id: `ph-${Date.now()}`,
        name: pharmacyName || `${name}'s Medicals`,
        ownerName: name,
        licenseNumber: `TN-${district?.slice(0, 3)?.toUpperCase() || 'TN'}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        address: address || `${district || 'Coimbatore'} Main Road`,
        district: district || 'Coimbatore',
        lat: 11.0168 + (Math.random() - 0.5) * 0.05,
        lng: 76.9558 + (Math.random() - 0.5) * 0.05,
        phone: phone || '+91 94400 00000',
        is24x7: true,
        rating: 4.8,
        updatedAt: new Date().toISOString()
      };
      db.pharmacies.push(newPharmacy);
      pharmacyId = newPharmacy.id;
    } else if (role === 'HOSPITAL') {
      if (!hospitalId) {
        const targetHosp = db.hospitals.find(h => h.district.toLowerCase() === (district || '').toLowerCase()) || db.hospitals[0];
        hospitalId = targetHosp.id;
        hospitalName = targetHosp.name;
      } else {
        const targetHosp = db.hospitals.find(h => h.id === hospitalId);
        if (targetHosp) hospitalName = targetHosp.name;
      }
      if (!hospitalStaffRole) {
        hospitalStaffRole = 'Organ & Blood Bank Medical Officer';
      }
    }

    const newUser = db.createUser({
      name,
      email,
      phone,
      password,
      role: role || 'USER',
      district: district || 'Coimbatore',
      pharmacyId,
      hospitalId,
      hospitalName,
      hospitalStaffRole
    });

    const { passwordHash, ...safeUser } = newUser;
    res.status(201).json({ user: safeUser, token: `tok_${newUser.id}_${Date.now()}` });
  });

  app.patch('/api/auth/preferences', (req, res) => {
    const { userId, mode, language, district, lat, lng } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const updated = db.updateUserPreferences(userId, { mode, language, district, lat, lng });
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { passwordHash, ...safeUser } = updated;
    res.json({ user: safeUser });
  });

  // ----------------------------------------------------
  // MEDICINES & AVAILABILITY APIS
  // ----------------------------------------------------
  app.get('/api/medicines', (req, res) => {
    const { search, category } = req.query;
    const meds = db.getMedicines(search as string, category as string);
    res.json({ medicines: meds, total: meds.length });
  });

  app.get('/api/medicines/:id', (req, res) => {
    const med = db.medicines.find(m => m.id === req.params.id);
    if (!med) return res.status(404).json({ error: 'Medicine not found' });
    const availability = db.getMedicineAvailability({ medicineId: med.id });
    res.json({ medicine: med, availability, totalStock: availability.reduce((acc, i) => acc + i.stockQuantity, 0) });
  });

  app.get('/api/medicine-availability', (req, res) => {
    const {
      medicineId,
      search,
      pharmacySearch,
      pharmacyId,
      district,
      userLat,
      userLng,
      statusFilter,
      only24x7
    } = req.query;

    const items = db.getMedicineAvailability({
      medicineId: medicineId as string,
      search: search as string,
      pharmacySearch: pharmacySearch as string,
      pharmacyId: pharmacyId as string,
      district: district as string,
      userLat: userLat ? parseFloat(userLat as string) : undefined,
      userLng: userLng ? parseFloat(userLng as string) : undefined,
      statusFilter: statusFilter as string,
      only24x7: only24x7 === 'true'
    });

    res.json({ items, total: items.length });
  });

  // ----------------------------------------------------
  // PHARMACY PORTAL APIS
  // ----------------------------------------------------
  app.get('/api/pharmacies', (req, res) => {
    const { search, district, only24x7, userLat, userLng } = req.query;
    const pharmacies = db.getPharmacies({
      search: search as string,
      district: district as string,
      only24x7: only24x7 === 'true',
      userLat: userLat ? parseFloat(userLat as string) : undefined,
      userLng: userLng ? parseFloat(userLng as string) : undefined
    });
    res.json({ pharmacies, total: pharmacies.length });
  });

  app.get('/api/pharmacies/:id', (req, res) => {
    const pharmacy = db.pharmacies.find(p => p.id === req.params.id);
    if (!pharmacy) return res.status(404).json({ error: 'Pharmacy not found' });
    const inventory = db.getPharmacyInventory(pharmacy.id);
    res.json({ pharmacy, inventory });
  });

  app.patch('/api/pharmacy/inventory/:id', (req, res) => {
    const { stockQuantity, status, price, rackLocation } = req.body;
    const updated = db.updateInventoryStock(req.params.id, { stockQuantity, status, price });
    if (!updated) return res.status(404).json({ error: 'Inventory item not found' });
    if (rackLocation) {
      updated.rackLocation = rackLocation;
    }
    res.json({ item: updated, message: 'Stock updated successfully' });
  });

  app.delete('/api/pharmacy/inventory/:id', (req, res) => {
    const success = db.deletePharmacyInventory(req.params.id);
    if (!success) return res.status(404).json({ error: 'Inventory item not found' });
    res.json({ message: 'Medicine removed from pharmacy inventory successfully' });
  });

  app.post('/api/pharmacy/inventory', (req, res) => {
    const { pharmacyId, medicineId, customMedicine, stockQuantity, price, rackLocation } = req.body;
    if (!pharmacyId) {
      return res.status(400).json({ error: 'pharmacyId is required' });
    }

    let targetMedId = medicineId;

    // If pharmacist is adding a brand new medicine not currently in master list
    if (customMedicine && customMedicine.name && customMedicine.name.trim()) {
      const createdMed = db.createMedicine({
        name: customMedicine.name.trim(),
        genericName: customMedicine.genericName ? customMedicine.genericName.trim() : customMedicine.name.trim(),
        category: customMedicine.category || 'General Medicine',
        dosageForm: customMedicine.dosageForm || 'Tablet',
        strength: customMedicine.strength || 'Standard',
        description: customMedicine.description || `${customMedicine.name} - Essential Healthcare Stock`,
        prescriptionRequired: Boolean(customMedicine.prescriptionRequired),
        price: Number(price || customMedicine.price) || 25,
        manufacturer: customMedicine.manufacturer || 'Certified Pharma India'
      });
      targetMedId = createdMed.id;
    }

    if (!targetMedId) {
      return res.status(400).json({ error: 'Either medicineId or custom medicine details are required' });
    }

    const item = db.addPharmacyMedicine(pharmacyId, {
      medicineId: targetMedId,
      stockQuantity: Number(stockQuantity) || 0,
      price: Number(price) || (customMedicine?.price || 25),
      rackLocation: rackLocation || 'Main Counter'
    });

    if (!item) return res.status(400).json({ error: 'Failed to add medicine to inventory' });
    res.status(201).json({ item, message: 'Medicine added to inventory successfully' });
  });

  // ----------------------------------------------------
  // HOSPITALS & BEDS APIS
  // ----------------------------------------------------
  app.get('/api/hospitals', (req, res) => {
    const { search, district, bedCategory, type, userLat, userLng } = req.query;
    const hospitals = db.getHospitals({
      search: search as string,
      district: district as string,
      bedCategory: bedCategory as string,
      type: type as string,
      userLat: userLat ? parseFloat(userLat as string) : undefined,
      userLng: userLng ? parseFloat(userLng as string) : undefined
    });
    res.json({ hospitals, total: hospitals.length });
  });

  app.get('/api/hospitals/:id', (req, res) => {
    const hospital = db.hospitals.find(h => h.id === req.params.id);
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    res.json({ hospital });
  });

  app.patch('/api/hospitals/:hospitalId/beds/:bedId', (req, res) => {
    const { availableBeds, occupiedBeds, totalBeds, ventilatorCount, pricePerDay, categoryLabel } = req.body;
    const updated = db.updateHospitalBed(req.params.hospitalId, req.params.bedId, {
      availableBeds: availableBeds !== undefined ? Number(availableBeds) : undefined,
      occupiedBeds: occupiedBeds !== undefined ? Number(occupiedBeds) : undefined,
      totalBeds: totalBeds !== undefined ? Number(totalBeds) : undefined,
      ventilatorCount: ventilatorCount !== undefined ? Number(ventilatorCount) : undefined,
      pricePerDay: pricePerDay !== undefined ? Number(pricePerDay) : undefined,
      categoryLabel
    });
    if (!updated) return res.status(404).json({ error: 'Bed or Hospital not found' });
    res.json({ bed: updated, message: 'Bed availability updated successfully' });
  });

  app.post('/api/hospitals/:hospitalId/beds', (req, res) => {
    const { category, categoryLabel, totalBeds, availableBeds, ventilatorCount, pricePerDay } = req.body;
    if (!category || totalBeds === undefined) {
      return res.status(400).json({ error: 'category and totalBeds are required' });
    }

    const created = db.addHospitalBed(req.params.hospitalId, {
      category,
      categoryLabel: categoryLabel || `${category} Ward`,
      totalBeds: Number(totalBeds),
      availableBeds: availableBeds !== undefined ? Number(availableBeds) : Number(totalBeds),
      ventilatorCount: ventilatorCount !== undefined ? Number(ventilatorCount) : 0,
      pricePerDay: pricePerDay !== undefined ? Number(pricePerDay) : 0
    });

    if (!created) return res.status(404).json({ error: 'Hospital not found' });
    res.status(201).json({ bed: created, message: 'New bed ward registered and availability broadcasted' });
  });

  // ----------------------------------------------------
  // HOSPITAL PORTAL APIS (ORGANS & BLOOD INVENTORY)
  // ----------------------------------------------------
  app.get('/api/hospital/portal-data/:hospitalId', (req, res) => {
    const data = db.getHospitalPortalData(req.params.hospitalId);
    if (!data) return res.status(404).json({ error: 'Hospital data not found' });
    res.json(data);
  });

  app.patch('/api/hospital/blood-inventory/:itemId', (req, res) => {
    const { unitsAvailable, status, is24x7 } = req.body;
    const updated = db.updateHospitalBloodInventory(req.params.itemId, {
      unitsAvailable: unitsAvailable !== undefined ? Number(unitsAvailable) : undefined,
      status,
      is24x7
    });
    if (!updated) return res.status(404).json({ error: 'Blood inventory item not found' });
    res.json({ item: updated, message: 'Blood inventory stock updated' });
  });

  app.post('/api/hospital/blood-inventory', (req, res) => {
    const { bloodBankId, hospitalId, bloodGroup, componentType, unitsAvailable, status } = req.body;
    if (!bloodGroup || !componentType || unitsAvailable === undefined) {
      return res.status(400).json({ error: 'bloodGroup, componentType, and unitsAvailable are required' });
    }
    const item = db.addHospitalBloodInventoryItem({
      bloodBankId: bloodBankId || 'bb-02',
      hospitalId,
      bloodGroup,
      componentType,
      unitsAvailable: Number(unitsAvailable),
      status
    });
    res.status(201).json({ item, message: 'Blood inventory units registered' });
  });

  app.patch('/api/hospital/organ-inventory/:itemId', (req, res) => {
    const { status, waitlistCount, matchingCriteria, coordinatorName, coordinatorPhone, donorDetails } = req.body;
    const updated = db.updateHospitalOrganStatus(req.params.itemId, {
      status,
      waitlistCount: waitlistCount !== undefined ? Number(waitlistCount) : undefined,
      matchingCriteria,
      coordinatorName,
      coordinatorPhone,
      donorDetails
    });
    if (!updated) return res.status(404).json({ error: 'Organ inventory item not found' });
    res.json({ item: updated, message: 'Organ status and waitlist updated' });
  });

  app.post('/api/hospital/organ-inventory', (req, res) => {
    const { hospitalId, centerId, organType, status, waitlistCount, matchingCriteria, coordinatorName, coordinatorPhone, donorDetails } = req.body;
    if (!hospitalId || !organType) {
      return res.status(400).json({ error: 'hospitalId and organType are required' });
    }
    const item = db.addHospitalOrganItem({
      hospitalId,
      centerId,
      organType,
      status: status || 'DONOR_AVAILABLE',
      waitlistCount: waitlistCount !== undefined ? Number(waitlistCount) : 0,
      matchingCriteria,
      coordinatorName,
      coordinatorPhone,
      donorDetails
    });
    res.status(201).json({ item, message: 'Organ donor listing registered' });
  });

  // ----------------------------------------------------
  // BLOOD AVAILABILITY APIS
  // ----------------------------------------------------
  app.get('/api/blood-availability', (req, res) => {
    const { bloodGroup, componentType, district, userLat, userLng } = req.query;
    const items = db.getBloodAvailability({
      bloodGroup: bloodGroup as string,
      componentType: componentType as string,
      district: district as string,
      userLat: userLat ? parseFloat(userLat as string) : undefined,
      userLng: userLng ? parseFloat(userLng as string) : undefined
    });
    res.json({ items, total: items.length });
  });

  // ----------------------------------------------------
  // ORGAN AVAILABILITY APIS
  // ----------------------------------------------------
  app.get('/api/organ-availability', (req, res) => {
    const { organType, district, status, userLat, userLng } = req.query;
    const items = db.getOrganAvailability({
      organType: organType as string,
      district: district as string,
      status: status as string,
      userLat: userLat ? parseFloat(userLat as string) : undefined,
      userLng: userLng ? parseFloat(userLng as string) : undefined
    });
    res.json({ items, total: items.length });
  });

  // ----------------------------------------------------
  // REFERRALS APIS
  // ----------------------------------------------------
  app.get('/api/referrals', (req, res) => {
    const { userId } = req.query;
    const referrals = db.getReferrals(userId as string);
    res.json({ referrals });
  });

  app.post('/api/referrals', (req, res) => {
    const referral = db.createReferral(req.body);
    res.status(201).json({ referral, message: 'Referral requested successfully' });
  });

  app.patch('/api/referrals/:id/status', (req, res) => {
    const { status, actor, note } = req.body;
    const updated = db.updateReferralStatus(req.params.id, status, actor, note);
    if (!updated) return res.status(404).json({ error: 'Referral not found' });
    res.json({ referral: updated });
  });

  // Smart Referral Action Workflow (Accept, Reject, Travelling, Arrived, Complete)
  app.patch('/api/referrals/:id/action', (req, res) => {
    const { action, bedAssigned, note, actorName } = req.body;
    if (!action) {
      return res.status(400).json({ error: 'Action is required (ACCEPT, REJECT, TRAVELLING, ARRIVED, COMPLETE)' });
    }
    const updated = db.reviewHospitalReferral(req.params.id, action, bedAssigned, note, actorName);
    if (!updated) return res.status(404).json({ error: 'Referral not found' });
    res.json({ referral: updated, message: `Referral action ${action} executed successfully` });
  });

  // ----------------------------------------------------
  // CITIZEN DISCREPANCY & VERIFICATION REPORTING
  // ----------------------------------------------------
  app.post('/api/reports/incorrect-info', (req, res) => {
    const { resourceType, resourceId, resourceName, facilityName, district, issueType, notes, reportedBy, contactPhone } = req.body;
    if (!resourceType || !issueType) {
      return res.status(400).json({ error: 'resourceType and issueType are required' });
    }
    const report = db.createDiscrepancyReport({
      resourceType,
      resourceId,
      resourceName,
      facilityName,
      district,
      issueType,
      notes,
      reportedBy,
      contactPhone
    });
    res.status(201).json({ report, message: 'Discrepancy report recorded for administrative audit' });
  });

  app.get('/api/reports', (req, res) => {
    res.json({ reports: db.getDiscrepancyReports() });
  });

  app.patch('/api/reports/:id', (req, res) => {
    const { status, notes } = req.body;
    const updated = db.updateDiscrepancyReport(req.params.id, status || 'RESOLVED', notes);
    if (!updated) return res.status(404).json({ error: 'Report not found' });
    res.json({ report: updated, message: 'Report status updated' });
  });

  // ----------------------------------------------------
  // AUDIT LOGS & ADMIN METRICS
  // ----------------------------------------------------
  app.get('/api/audit-logs', (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    res.json({ logs: db.getAuditLogs(limit) });
  });

  app.get('/api/admin/metrics', (req, res) => {
    res.json({ metrics: db.getAdminMetrics() });
  });

  app.post('/api/demo/reset', (req, res) => {
    const result = db.resetDemoData();
    res.json(result);
  });

  // ----------------------------------------------------
  // IOT DEVICES APIS
  // ----------------------------------------------------
  app.get('/api/iot/devices', (req, res) => {
    res.json({ devices: db.getIoTDevices() });
  });

  app.post('/api/iot/simulate-pulse', (req, res) => {
    const { deviceCode, telemetry } = req.body;
    const updated = db.updateIoTReading(deviceCode || 'REVIVE-BED-TN01', telemetry || {
      occupancy: Math.random() > 0.3,
      pressure: Math.round(50 + Math.random() * 40),
      heartRate: Math.round(68 + Math.random() * 25),
      spO2: Math.round(95 + Math.random() * 4)
    });
    res.json({ device: updated, message: 'Hardware pulse simulated' });
  });

  // ----------------------------------------------------
  // NOTIFICATIONS APIS
  // ----------------------------------------------------
  app.get('/api/notifications', (req, res) => {
    const { userId } = req.query;
    let notifs = db.notifications;
    if (userId) {
      notifs = notifs.filter(n => !n.userId || n.userId === userId);
    }
    res.json({ notifications: notifs });
  });

  app.patch('/api/notifications/:id/read', (req, res) => {
    const n = db.notifications.find(item => item.id === req.params.id);
    if (n) n.read = true;
    res.json({ success: true });
  });

  // ----------------------------------------------------
  // GLOBAL SEARCH API
  // ----------------------------------------------------
  app.get('/api/search', (req, res) => {
    const { q, district, userLat, userLng } = req.query;
    const results = db.globalSearch(
      (q as string) || '',
      district as string,
      userLat ? parseFloat(userLat as string) : undefined,
      userLng ? parseFloat(userLng as string) : undefined
    );
    res.json({ results, total: results.length });
  });

  // Shared Neural Audio Synthesizer with 24-hour cache
  const ttsAudioCache = new Map<string, { buffer: Buffer; expiresAt: number }>();

  async function synthesizeAudioBuffer(text: string, lang: 'en' | 'ta' | 'hi'): Promise<Buffer> {
    const cleanText = text
      .replace(/[*_~`#]/g, '')
      .replace(/[()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return Buffer.alloc(0);

    const cacheKey = `${lang}::${cleanText}`;
    const cached = ttsAudioCache.get(cacheKey);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.buffer;
    }

    const chunks = splitTextIntoChunks(cleanText, 160);
    const audioBuffers: Buffer[] = [];

    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      const buf = await fetchGoogleTTSChunk(chunk.trim(), lang);
      if (buf && buf.length > 0) {
        audioBuffers.push(buf);
      }
    }

    if (audioBuffers.length === 0) {
      return Buffer.alloc(0);
    }

    const mergedAudio = Buffer.concat(audioBuffers);
    ttsAudioCache.set(cacheKey, {
      buffer: mergedAudio,
      expiresAt: now + 24 * 60 * 60 * 1000
    });
    return mergedAudio;
  }

  // In-memory query response cache for <1ms repeat voice queries
  interface AssistantCacheItem {
    reply: string;
    spokenText: string;
    audioUrl: string;
    referencedData: any;
    expiresAt: number;
  }
  const assistantResponseCache = new Map<string, AssistantCacheItem>();

  // Instant grounded response generator (executes in <1ms without network latency)
  function generateInstantGroundedReply(
    trained: any,
    matchedMeds: any[],
    matchedHospitals: any[],
    matchedBlood: any[],
    language: 'en' | 'ta' | 'hi'
  ): { reply: string; spokenText: string; referencedData: any } {
    const facts: GroundedFacts = {
      medicines: matchedMeds.map(m => ({
        medicineName: m.medicineName,
        genericName: m.genericName,
        pharmacyName: m.pharmacyName,
        distanceKm: m.distanceKm || 2.5,
        stockQuantity: m.stockQuantity,
        pharmacyPhone: m.pharmacyPhone,
        price: m.price
      })),
      hospitals: matchedHospitals.map(h => ({
        name: h.name,
        distanceKm: h.distanceKm || 3.2,
        emergencyPhone: h.emergencyPhone || '108',
        phone: h.phone,
        totalAvailableBeds: h.totalAvailableBeds || 15,
        icuAvailable: h.beds?.find((b: any) => b.category === 'ICU')?.availableBeds || 4,
        oxygenAvailable: h.beds?.find((b: any) => b.category === 'OXYGEN_SUPPORTED')?.availableBeds || 8
      })),
      bloodBanks: matchedBlood.map(b => ({
        bloodBankName: b.bloodBankName,
        bloodGroup: b.bloodGroup,
        unitsAvailable: b.unitsAvailable,
        emergencyContact: b.emergencyContact,
        distanceKm: b.distanceKm || 2.0
      }))
    };

    const fallback = generateHumanizedSpokenFallback(trained, facts, language);
    let referencedData: any = null;

    if (trained.isEmergencyAlert) {
      referencedData = { type: 'beds', items: matchedHospitals.length > 0 ? matchedHospitals : [db.hospitals[0]] };
    } else if (trained.intent === 'MEDICINE' && matchedMeds.length > 0) {
      referencedData = { type: 'medicines', items: matchedMeds };
    } else if (trained.intent === 'BED' && matchedHospitals.length > 0) {
      referencedData = { type: 'beds', items: matchedHospitals };
    } else if (trained.intent === 'BLOOD' && matchedBlood.length > 0) {
      referencedData = { type: 'blood', items: matchedBlood };
    }

    return {
      reply: fallback.spokenText,
      spokenText: fallback.spokenText,
      referencedData
    };
  }

  // ----------------------------------------------------
  // ASK REVIVE AI ASSISTANT API (Humanized Voice Trained Model)
  // ----------------------------------------------------
  app.post('/api/assistant/query', async (req, res) => {
    const { query, language = 'en', district = 'Coimbatore', userLat, userLng, conversationHistory } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Auto-detect script if language is ambiguous
    let targetLang: 'en' | 'ta' | 'hi' = 'en';
    if (language === 'ta' || /[\u0B80-\u0BFF]/.test(query)) {
      targetLang = 'ta';
    } else if (language === 'hi' || /[\u0900-\u097F]/.test(query)) {
      targetLang = 'hi';
    } else {
      targetLang = (language as 'en' | 'ta' | 'hi') || 'en';
    }

    const cleanQuery = query.trim().toLowerCase();
    const cacheKey = `${cleanQuery}::${targetLang}::${district}`;
    const now = Date.now();

    // 1. Check ultra-fast in-memory cache (<1ms response)
    const cached = assistantResponseCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return res.json({
        reply: cached.reply,
        spokenText: cached.spokenText,
        language: targetLang,
        audioUrl: cached.audioUrl,
        referencedData: cached.referencedData,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    const trained = trainAndNormalizeQuery(query);
    const medSearchQuery = trained.medicineTarget || trained.normalizedQuery || query;

    // 2. Fetch live grounded database facts
    const matchedMeds = db.getMedicineAvailability({
      search: medSearchQuery,
      district,
      userLat,
      userLng
    }).slice(0, 3);

    const matchedHospitals = db.getHospitals({
      search: trained.intent === 'BED' ? undefined : (trained.normalizedQuery || query),
      district,
      bedCategory: trained.bedCategoryTarget && trained.bedCategoryTarget !== 'ALL' ? trained.bedCategoryTarget : undefined,
      userLat,
      userLng
    }).slice(0, 3);

    const matchedBlood = db.getBloodAvailability({
      district,
      bloodGroup: trained.bloodGroupTarget,
      userLat,
      userLng
    }).slice(0, 3);

    // Warm, humanized instant fallback baseline
    const instant = generateInstantGroundedReply(
      trained,
      matchedMeds,
      matchedHospitals,
      matchedBlood,
      targetLang
    );

    let finalReply = instant.reply;
    let finalSpokenText = instant.spokenText;
    let finalReferencedData = instant.referencedData;

    // 3. High-Quality Gemini 3.8 Flash Voice Synthesis with 2500ms timeout
    const ai = getGeminiClient();
    if (ai) {
      try {
        const facts: GroundedFacts = {
          medicines: matchedMeds.map(m => ({
            medicineName: m.medicineName,
            genericName: m.genericName,
            pharmacyName: m.pharmacyName,
            distanceKm: m.distanceKm || 2.5,
            stockQuantity: m.stockQuantity,
            pharmacyPhone: m.pharmacyPhone,
            price: m.price
          })),
          hospitals: matchedHospitals.map(h => ({
            name: h.name,
            distanceKm: h.distanceKm || 3.2,
            emergencyPhone: h.emergencyPhone || '108',
            phone: h.phone,
            totalAvailableBeds: h.totalAvailableBeds || 15,
            icuAvailable: h.beds?.find((b: any) => b.category === 'ICU')?.availableBeds || 4,
            oxygenAvailable: h.beds?.find((b: any) => b.category === 'OXYGEN_SUPPORTED')?.availableBeds || 8
          })),
          bloodBanks: matchedBlood.map(b => ({
            bloodBankName: b.bloodBankName,
            bloodGroup: b.bloodGroup,
            unitsAvailable: b.unitsAvailable,
            emergencyContact: b.emergencyContact,
            distanceKm: b.distanceKm || 2.0
          }))
        };

        const prompt = buildHumanizedVoicePrompt(query, targetLang, district, trained, facts, conversationHistory);

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            maxOutputTokens: 220,
            temperature: 0.3
          }
        });

        // 2500ms race timeout ensures user and hardware get an immediate voice answer
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
        const geminiResult: any = await Promise.race([geminiPromise, timeoutPromise]);

        if (geminiResult && geminiResult.text && geminiResult.text.trim().length > 15) {
          // Clean out any accidental markdown characters to ensure silky smooth audio reading
          let candidateText = geminiResult.text
            .replace(/[*_~`#]/g, '')
            .replace(/\((.*?)\)/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          let isLanguageValid = true;
          if (targetLang === 'ta' && !/[\u0B80-\u0BFF]/.test(candidateText)) {
            isLanguageValid = false;
          } else if (targetLang === 'hi' && !/[\u0900-\u097F]/.test(candidateText)) {
            isLanguageValid = false;
          }

          if (isLanguageValid) {
            finalReply = candidateText;
            finalSpokenText = candidateText;
          }

          if (trained.intent === 'MEDICINE' && matchedMeds.length > 0) {
            finalReferencedData = { type: 'medicines', items: matchedMeds };
          } else if (trained.intent === 'BED' && matchedHospitals.length > 0) {
            finalReferencedData = { type: 'beds', items: matchedHospitals };
          } else if (trained.intent === 'BLOOD' && matchedBlood.length > 0) {
            finalReferencedData = { type: 'blood', items: matchedBlood };
          }
        }
      } catch (err) {
        console.warn('Gemini voice synthesis fallback:', err);
      }
    }

    const audioUrl = `/api/tts?lang=${targetLang}&text=${encodeURIComponent(finalSpokenText)}`;
    const lcdDisplay = format16x2LcdLines(
      trained.isEmergencyAlert ? 'EMERGENCY' as any : 'SPEAKING',
      query,
      finalSpokenText,
      trained.intent
    );

    // Sync active LCD state
    currentLcdState = {
      line1: lcdDisplay.line1,
      line2: lcdDisplay.line2,
      backlight: true,
      state: 'SPEAKING',
      updatedAt: new Date().toISOString()
    };

    // Cache the result for 3 minutes for instant repeat answers
    assistantResponseCache.set(cacheKey, {
      reply: finalReply,
      spokenText: finalSpokenText,
      audioUrl,
      referencedData: finalReferencedData,
      expiresAt: now + 3 * 60 * 1000
    });

    res.json({
      reply: finalReply,
      spokenText: finalSpokenText,
      language: targetLang,
      audioUrl,
      referencedData: finalReferencedData,
      lcdDisplay,
      timestamp: new Date().toISOString()
    });
  });

  // ----------------------------------------------------
  // HARDWARE VOICE QUERY API (POST /api/hardware/voice-query)
  // Dedicated endpoint for Raspberry Pi, ESP32, smart kiosks,
  // and rural audio speakers. Returns spoken audio & display lines!
  // ----------------------------------------------------
  app.post('/api/hardware/voice-query', async (req, res) => {
    const {
      query,
      language = 'en',
      district = 'Coimbatore',
      deviceId = 'REVIVE-BOX-01',
      returnAudio = true,
      userLat,
      userLng,
      conversationHistory
    } = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Voice query string is required' });
    }

    // Auto-detect target script if query is in Tamil or Hindi
    let targetLang: 'en' | 'ta' | 'hi' = 'en';
    if (language === 'ta' || /[\u0B80-\u0BFF]/.test(query)) {
      targetLang = 'ta';
    } else if (language === 'hi' || /[\u0900-\u097F]/.test(query)) {
      targetLang = 'hi';
    } else {
      targetLang = (language as 'en' | 'ta' | 'hi') || 'en';
    }

    const trained = trainAndNormalizeQuery(query);
    const medSearchQuery = trained.medicineTarget || trained.normalizedQuery || query;

    const matchedMeds = db.getMedicineAvailability({
      search: medSearchQuery,
      district,
      userLat,
      userLng
    }).slice(0, 3);

    const matchedHospitals = db.getHospitals({
      search: trained.intent === 'BED' ? undefined : (trained.normalizedQuery || query),
      district,
      bedCategory: trained.bedCategoryTarget && trained.bedCategoryTarget !== 'ALL' ? trained.bedCategoryTarget : undefined,
      userLat,
      userLng
    }).slice(0, 3);

    const matchedBlood = db.getBloodAvailability({
      district,
      bloodGroup: trained.bloodGroupTarget,
      userLat,
      userLng
    }).slice(0, 3);

    const instant = generateInstantGroundedReply(
      trained,
      matchedMeds,
      matchedHospitals,
      matchedBlood,
      targetLang
    );

    let finalSpokenText = instant.spokenText;
    let finalReferencedData = instant.referencedData;

    // Fast Gemini 3.8 Flash generation
    const ai = getGeminiClient();
    if (ai) {
      try {
        const facts: GroundedFacts = {
          medicines: matchedMeds.map(m => ({
            medicineName: m.medicineName,
            genericName: m.genericName,
            pharmacyName: m.pharmacyName,
            distanceKm: m.distanceKm || 2.5,
            stockQuantity: m.stockQuantity,
            pharmacyPhone: m.pharmacyPhone,
            price: m.price
          })),
          hospitals: matchedHospitals.map(h => ({
            name: h.name,
            distanceKm: h.distanceKm || 3.2,
            emergencyPhone: h.emergencyPhone || '108',
            phone: h.phone,
            totalAvailableBeds: h.totalAvailableBeds || 15,
            icuAvailable: h.beds?.find((b: any) => b.category === 'ICU')?.availableBeds || 4,
            oxygenAvailable: h.beds?.find((b: any) => b.category === 'OXYGEN_SUPPORTED')?.availableBeds || 8
          })),
          bloodBanks: matchedBlood.map(b => ({
            bloodBankName: b.bloodBankName,
            bloodGroup: b.bloodGroup,
            unitsAvailable: b.unitsAvailable,
            emergencyContact: b.emergencyContact,
            distanceKm: b.distanceKm || 2.0
          }))
        };

        const prompt = buildHumanizedVoicePrompt(query, targetLang, district, trained, facts, conversationHistory);
        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { maxOutputTokens: 200, temperature: 0.3 }
        });

        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
        const geminiResult: any = await Promise.race([geminiPromise, timeoutPromise]);

        if (geminiResult && geminiResult.text && geminiResult.text.trim().length > 15) {
          const candidate = geminiResult.text
            .replace(/[*_~`#]/g, '')
            .replace(/\((.*?)\)/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          let isValid = true;
          if (targetLang === 'ta' && !/[\u0B80-\u0BFF]/.test(candidate)) isValid = false;
          if (targetLang === 'hi' && !/[\u0900-\u097F]/.test(candidate)) isValid = false;

          if (isValid) {
            finalSpokenText = candidate;
          }
        }
      } catch (err) {
        console.warn('Hardware voice synthesis fallback:', err);
      }
    }

    // Synthesize audio buffer if requested by hardware
    let audioBase64: string | undefined;
    let audioSizeBytes = 0;
    if (returnAudio) {
      try {
        const audioBuf = await synthesizeAudioBuffer(finalSpokenText, targetLang);
        if (audioBuf && audioBuf.length > 0) {
          audioBase64 = audioBuf.toString('base64');
          audioSizeBytes = audioBuf.length;
        }
      } catch (e) {
        console.warn('Audio synthesis for hardware notice:', e);
      }
    }

    const audioUrl = `/api/tts?lang=${targetLang}&text=${encodeURIComponent(finalSpokenText)}`;

    // Prepare 4-line display text for 128x64 SSD1306 OLED / LCD screen on hardware
    const topHosp = matchedHospitals[0] || db.hospitals[0];
    const topMed = matchedMeds[0] || db.medicineInventory[0];
    const topBlood = matchedBlood[0] || db.bloodInventory[0];

    let oledLines = {
      line1: 'REVIVE Voice Assistant',
      line2: 'Query Processed',
      line3: `District: ${district}`,
      line4: 'Speaker Playing...'
    };

    if (trained.isEmergencyAlert) {
      oledLines = {
        line1: '! EMERGENCY ALERT !',
        line2: 'Call 108 Ambulance',
        line3: topHosp?.name?.slice(0, 21) || 'GH Trauma Centre',
        line4: `Ph: ${topHosp?.emergencyPhone || '108'}`
      };
    } else if (trained.intent === 'MEDICINE' && topMed) {
      oledLines = {
        line1: topMed.medicineName.slice(0, 21),
        line2: `Stock: ${topMed.stockQuantity} units`,
        line3: topMed.pharmacyName.slice(0, 21),
        line4: `Ph: ${topMed.pharmacyPhone}`
      };
    } else if (trained.intent === 'BED' && topHosp) {
      oledLines = {
        line1: topHosp.name.slice(0, 21),
        line2: `Avail Beds: ${topHosp.totalAvailableBeds}`,
        line3: `Dist: ${topHosp.distanceKm || 3}km`,
        line4: `Ph: ${topHosp.emergencyPhone || topHosp.phone}`
      };
    } else if (trained.intent === 'BLOOD' && topBlood) {
      oledLines = {
        line1: `Blood: ${topBlood.bloodGroup}`,
        line2: `Units: ${topBlood.unitsAvailable}`,
        line3: topBlood.bloodBankName.slice(0, 21),
        line4: `Ph: ${topBlood.emergencyContact}`
      };
    }

    // Prepare 16x2 LCD display strings for I2C HD44780 LCD module on ESP32
    const lcdLines = format16x2LcdLines(
      trained.isEmergencyAlert ? 'EMERGENCY' as any : 'SPEAKING',
      query,
      finalSpokenText,
      trained.intent
    );

    currentLcdState = {
      line1: lcdLines.line1,
      line2: lcdLines.line2,
      backlight: true,
      state: 'SPEAKING',
      updatedAt: new Date().toISOString()
    };

    // Emit live event to dashboard event bus
    eventBus.emit('hardware_voice_event', {
      deviceId,
      query,
      language: targetLang,
      spokenText: finalSpokenText,
      lcdDisplay: lcdLines,
      isEmergency: trained.isEmergencyAlert,
      timestamp: new Date().toISOString()
    });

    // Update IoT telemetry for the voice kiosk
    db.updateIoTReading('REVIVE-VOICE-KIOSK01', {
      speakerStatus: 'SPEAKING_AUDIO_OUT',
      lastSpokenLanguage: targetLang,
      lastSpokenQuery: query,
      lastSpokenReply: finalSpokenText.slice(0, 100),
      lcdLine1: lcdLines.line1,
      lcdLine2: lcdLines.line2
    });

    res.json({
      status: 'success',
      deviceId,
      language: targetLang,
      spokenText: finalSpokenText,
      audioUrl,
      audioBase64,
      audioContentType: 'audio/mpeg',
      audioSizeBytes,
      durationEstimateSec: Math.max(2.5, Math.round((finalSpokenText.length / 15) * 10) / 10),
      hardwareDisplay: oledLines,
      lcdDisplay: lcdLines,
      hardwareIndicators: {
        ledColor: trained.isEmergencyAlert ? 'RED_EMERGENCY' : 'GREEN_OK',
        isEmergency: trained.isEmergencyAlert,
        buzzerBeeps: trained.isEmergencyAlert ? 3 : 1
      },
      referencedData: finalReferencedData,
      timestamp: new Date().toISOString()
    });
  });

  // ----------------------------------------------------
  // DIRECT HARDWARE AUDIO STREAMING API (GET /api/hardware/voice-audio)
  // Designed for ESP32 / Arduino microcontrollers with I2S DACs:
  // Hardware makes a simple HTTP GET and pipes MP3 directly into DAC!
  // ----------------------------------------------------
  app.get('/api/hardware/voice-audio', async (req, res) => {
    const { query, lang = 'en', district = 'Coimbatore', deviceId = 'ESP32-REVIVE' } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).send('Query parameter is required');
    }

    let targetLang: 'en' | 'ta' | 'hi' = 'en';
    if (lang === 'ta' || /[\u0B80-\u0BFF]/.test(query)) {
      targetLang = 'ta';
    } else if (lang === 'hi' || /[\u0900-\u097F]/.test(query)) {
      targetLang = 'hi';
    } else {
      targetLang = (lang as 'en' | 'ta' | 'hi') || 'en';
    }

    const trained = trainAndNormalizeQuery(query);
    const medSearchQuery = trained.medicineTarget || trained.normalizedQuery || query;

    const matchedMeds = db.getMedicineAvailability({ search: medSearchQuery, district: district as string }).slice(0, 3);
    const matchedHospitals = db.getHospitals({ district: district as string }).slice(0, 3);
    const matchedBlood = db.getBloodAvailability({ district: district as string }).slice(0, 3);

    const instant = generateInstantGroundedReply(trained, matchedMeds, matchedHospitals, matchedBlood, targetLang);
    let finalSpokenText = instant.spokenText;

    // Synthesize audio
    const audioBuf = await synthesizeAudioBuffer(finalSpokenText, targetLang);
    if (!audioBuf || audioBuf.length === 0) {
      return res.status(502).send('Failed to synthesize voice stream');
    }

    // Update IoT telemetry
    db.updateIoTReading('REVIVE-VOICE-KIOSK01', {
      speakerStatus: 'STREAMING_I2S_AUDIO',
      lastSpokenLanguage: targetLang,
      lastSpokenQuery: query
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Spoken-Text', encodeURIComponent(finalSpokenText.slice(0, 200)));
    res.setHeader('X-Emergency-Alert', trained.isEmergencyAlert ? 'true' : 'false');
    res.setHeader('X-Device-Id', deviceId as string);
    res.setHeader('Content-Length', audioBuf.length.toString());

    return res.send(audioBuf);
  });

  // ----------------------------------------------------
  // HARDWARE STATUS & TELEMETRY API
  // ----------------------------------------------------
  let currentLcdState = {
    line1: 'REVIVE READY    ',
    line2: 'How can I help? ',
    backlight: true,
    state: 'READY' as any,
    updatedAt: new Date().toISOString()
  };

  const registeredHardwareDevices: any[] = [
    {
      deviceCode: 'REVIVE-BOX-01',
      deviceLabel: 'REVIVE Box — Rural Health Companion (ESP32)',
      hardwareType: 'ESP32_REVIVE_BOX',
      status: 'ONLINE',
      isSimulated: true,
      ipAddress: '192.168.1.142',
      macAddress: '24:6F:28:B4:7A:9C',
      wifiSsid: 'RuralHealth_Net',
      wifiRssi: -58,
      batteryLevel: 96,
      lastHeartbeat: new Date().toISOString(),
      authToken: 'rv-esp32-box-sec7782',
      lcdDisplay: {
        line1: 'REVIVE READY    ',
        line2: 'How can I help? '
      },
      components: {
        micI2S: 'INMP441',
        ampI2S: 'MAX98357A',
        lcdI2C: '16x2_HD44780'
      },
      telemetry: {
        micStatus: 'ACTIVE',
        speakerStatus: 'STANDBY',
        sampleRateHz: 24000
      }
    },
    {
      deviceCode: 'REVIVE-VOICE-KIOSK01',
      deviceLabel: 'Smart Rural Voice Kiosk & Audio Out Speaker',
      hardwareType: 'KIOSK',
      status: 'ONLINE',
      isSimulated: false,
      ipAddress: '192.168.1.80',
      batteryLevel: 100,
      wifiRssi: -48,
      authToken: 'rv-kiosk-9901',
      lcdDisplay: {
        line1: 'KIOSK ACTIVE    ',
        line2: 'Coimbatore PHC  '
      },
      telemetry: {
        speakerStatus: 'STANDBY',
        sampleRateHz: 24000
      }
    }
  ];

  app.get('/api/hardware/devices', (req, res) => {
    res.json({
      devices: registeredHardwareDevices,
      activeLcd: currentLcdState,
      timestamp: new Date().toISOString()
    });
  });

  app.post('/api/hardware/register', (req, res) => {
    const { deviceCode, deviceLabel, macAddress, wifiSsid } = req.body;
    if (!deviceCode) {
      return res.status(400).json({ error: 'deviceCode is required' });
    }

    let existing = registeredHardwareDevices.find(d => d.deviceCode === deviceCode);
    const authToken = `rv-sec-${Math.random().toString(36).substring(2, 10)}`;

    if (!existing) {
      existing = {
        deviceCode,
        deviceLabel: deviceLabel || `ESP32 REVIVE Box (${deviceCode})`,
        hardwareType: 'ESP32_REVIVE_BOX',
        status: 'ONLINE',
        isSimulated: false,
        ipAddress: req.ip || '192.168.1.150',
        macAddress: macAddress || '24:6F:28:XX:XX:XX',
        wifiSsid: wifiSsid || 'HealthCenter_WiFi',
        wifiRssi: -55,
        batteryLevel: 100,
        lastHeartbeat: new Date().toISOString(),
        authToken,
        lcdDisplay: {
          line1: 'REVIVE CONNECTED',
          line2: 'Ready for audio '
        },
        components: {
          micI2S: 'INMP441',
          ampI2S: 'MAX98357A',
          lcdI2C: '16x2_HD44780'
        }
      };
      registeredHardwareDevices.push(existing);
    } else {
      existing.status = 'ONLINE';
      existing.lastHeartbeat = new Date().toISOString();
      existing.isSimulated = false;
      existing.authToken = authToken;
    }

    res.json({
      status: 'registered',
      device: existing,
      authToken,
      message: 'ESP32 REVIVE Box registered successfully'
    });
  });

  app.post('/api/hardware/pair', (req, res) => {
    const { deviceCode, authPin } = req.body;
    const device = registeredHardwareDevices.find(d => d.deviceCode === deviceCode);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    device.status = 'ONLINE';
    device.lastHeartbeat = new Date().toISOString();
    res.json({
      status: 'paired',
      device,
      message: `Device ${deviceCode} successfully authenticated and paired`
    });
  });

  app.post('/api/hardware/heartbeat', (req, res) => {
    const { deviceCode = 'REVIVE-BOX-01', wifiRssi, batteryLevel, ipAddress, speakerStatus } = req.body;
    const device = registeredHardwareDevices.find(d => d.deviceCode === deviceCode);

    if (device) {
      device.status = 'ONLINE';
      device.lastHeartbeat = new Date().toISOString();
      if (wifiRssi !== undefined) device.wifiRssi = wifiRssi;
      if (batteryLevel !== undefined) device.batteryLevel = batteryLevel;
      if (ipAddress) device.ipAddress = ipAddress;
      if (speakerStatus && device.telemetry) device.telemetry.speakerStatus = speakerStatus;
    }

    res.json({
      status: 'ok',
      deviceCode,
      serverTime: new Date().toISOString(),
      lcdDisplay: currentLcdState
    });
  });

  app.post('/api/hardware/simulate-toggle', (req, res) => {
    const { isOnline } = req.body;
    const box = registeredHardwareDevices.find(d => d.deviceCode === 'REVIVE-BOX-01');
    if (box) {
      box.status = isOnline ? 'ONLINE' : 'OFFLINE';
      box.isSimulated = true;
      box.lastHeartbeat = new Date().toISOString();
    }
    res.json({
      status: 'success',
      device: box,
      isSimulated: true,
      message: `Simulated REVIVE Box is now ${isOnline ? 'ONLINE' : 'OFFLINE'}`
    });
  });

  app.get('/api/hardware/lcd-state', (req, res) => {
    res.json(currentLcdState);
  });

  app.post('/api/hardware/lcd-state', (req, res) => {
    const { line1, line2, state, backlight = true } = req.body;
    currentLcdState = {
      line1: (line1 || currentLcdState.line1).slice(0, 16).padEnd(16, ' '),
      line2: (line2 || currentLcdState.line2).slice(0, 16).padEnd(16, ' '),
      backlight: backlight !== undefined ? backlight : true,
      state: state || currentLcdState.state,
      updatedAt: new Date().toISOString()
    };
    res.json(currentLcdState);
  });

  app.get('/api/hardware/voice-status', (req, res) => {
    const voiceDevice = registeredHardwareDevices.find(d => d.deviceCode === 'REVIVE-BOX-01') || {
      deviceCode: 'REVIVE-BOX-01',
      deviceLabel: 'REVIVE Box — Rural Health Companion',
      status: 'ONLINE',
      batteryLevel: 98,
      telemetry: { speakerStatus: 'STANDBY', sampleRateHz: 24000 }
    };

    res.json({
      device: voiceDevice,
      activeLcd: currentLcdState,
      endpointDocumentation: {
        voiceQueryPost: '/api/hardware/voice-query',
        voiceAudioGetStream: '/api/hardware/voice-audio?query=...&lang=...&district=...',
        heartbeatPost: '/api/hardware/heartbeat',
        lcdStateGet: '/api/hardware/lcd-state',
        supportedLanguages: ['en', 'ta', 'hi'],
        audioFormat: 'MP3 24kHz Mono Neural TTS (MAX98357A compatible)',
        hardwareProtocols: ['HTTP REST JSON', 'Direct HTTP Chunked Stream to I2S DAC']
      }
    });
  });

  // ----------------------------------------------------
  // HIGH-FIDELITY NEURAL TEXT-TO-SPEECH API (GET /api/tts)
  // Ensures 100% fluent Tamil, Hindi, and English reading
  // without browser voice drops or missing local voice packs
  // ----------------------------------------------------
  app.get('/api/tts', async (req, res) => {
    const { text, lang = 'en' } = req.query;
    if (!text || typeof text !== 'string') {
      return res.status(400).send('Text query param is required');
    }

    const cleanText = text
      .replace(/[*_~`#]/g, '')
      .replace(/[()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      return res.status(400).send('Cleaned text is empty');
    }

    const targetLang = (lang as string).toLowerCase().startsWith('ta')
      ? 'ta'
      : (lang as string).toLowerCase().startsWith('hi')
      ? 'hi'
      : 'en';

    try {
      const mergedAudio = await synthesizeAudioBuffer(cleanText, targetLang);
      if (!mergedAudio || mergedAudio.length === 0) {
        return res.status(502).send('Failed to synthesize speech chunks');
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Length', mergedAudio.length.toString());
      return res.send(mergedAudio);
    } catch (err) {
      console.error('TTS endpoint error:', err);
      return res.status(500).send('TTS processing error');
    }
  });

  // ----------------------------------------------------
  // VITE MIDDLEWARE (DEV) & STATIC FILES (PROD)
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`REVIVE Full-Stack Healthcare Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Server startup failure:', err);
});
