/**
 * Rural Healthcare Query Normalizer, Phonetic Matcher & Intent Trainer
 * Designed specifically for rural communities using simple keywords, phonetic spellings,
 * transliterations, and colloquial medical terms (Tamil, Hindi, English).
 */

export interface TrainedQueryResult {
  intent: 'MEDICINE' | 'BED' | 'BLOOD' | 'ORGAN' | 'REFERRAL' | 'EMERGENCY' | 'GENERAL';
  normalizedQuery: string;
  matchedKeywords: string[];
  medicineTarget?: string;
  bloodGroupTarget?: string;
  bedCategoryTarget?: string;
  organTypeTarget?: string;
  isEmergencyAlert: boolean;
}

// Stop words commonly spoken in natural questions (English, Tamil, Hindi, Hinglish)
const STOP_WORDS = new Set([
  'where', 'could', 'i', 'get', 'find', 'is', 'there', 'any', 'available', 'stock',
  'near', 'me', 'please', 'can', 'give', 'tell', 'show', 'need', 'want', 'how',
  // Tamil phonetic & script stop words
  'enga', 'irukku', 'kedaikkum', 'venum', 'theriyuma', 'sollunga', 'kudunga',
  'எங்கே', 'எங்கு', 'இருக்கு', 'இருக்குது', 'இருக்கா', 'கிடைக்கும்', 'கிடைக்குமா',
  'வேண்டும்', 'வேணும்', 'தேவை', 'சொல்லுங்க', 'உள்ளதா', 'உள்ளது', 'கொடுங்க', 'எங்க',
  // Hindi phonetic & script stop words
  'kahan', 'kaha', 'kidhar', 'milega', 'milegi', 'milti', 'milte', 'milenge', 'milta', 'hai', 'hain',
  'kya', 'chahiye', 'batao', 'bataiye', 'bataye', 'dijiye', 'dijiyega', 'paas', 'hoga', 'hogi', 'me', 'mein',
  'se', 'ko', 'ka', 'ki', 'ke', 'aur', 'ya', 'par', 'pe', 'urgent', 'jarurat', 'zaroorat', 'turant',
  'mujhe', 'hume', 'humko', 'kripya', 'madad', 'help', 'uplabdh',
  'कहाँ', 'कहा', 'किधर', 'मिलेगा', 'मिलेगी', 'मिलती', 'मिलते', 'मिलेंगे', 'मिलता', 'चाहिए', 'है',
  'हैं', 'था', 'थी', 'थे', 'हो', 'बताओ', 'बताइए', 'बताएं', 'दीजिए', 'दीजिये', 'दें', 'पास', 'होगा', 'होगी', 'की',
  'के', 'का', 'को', 'में', 'से', 'पर', 'और', 'या', 'उपलब्ध', 'स्टॉक', 'कृपया', 'जरूरत', 'आवश्यकता', 'तत्काल', 'जल्दी',
  'इमरजेंसी', 'निकटतम', 'नजदीकी', 'तुरंत', 'मुझे', 'हमे', 'हमें', 'किसी', 'कोई', 'मदद', 'सहायता', 'जानकारी', 'बारे',
  'सकते', 'सकता', 'सकती'
]);

// Map common typos, colloquial brand names, and phonetic variations to standard names
const MEDICINE_KEYWORD_MAP: Record<string, { standardName: string; category: string }> = {
  // Paracetamol variations & common typos (paracemotol, paracaetomol, etc.)
  'paracetamol': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'paracemotol': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'paracaetomol': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'paracaetomolor': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'paracetamolor': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'paracematol': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'paracemol': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'paracetomol': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'paracitamol': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'paracitmol': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'paracetmol': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'paracitomal': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'paractamol': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'parcetamol': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'dolo': { standardName: 'Paracetamol 650mg (Dolo)', category: 'Analgesic & Antipyretic' },
  'dollo': { standardName: 'Paracetamol 650mg (Dolo)', category: 'Analgesic & Antipyretic' },
  'dolo 650': { standardName: 'Paracetamol 650mg (Dolo)', category: 'Analgesic & Antipyretic' },
  'dolo650': { standardName: 'Paracetamol 650mg (Dolo)', category: 'Analgesic & Antipyretic' },
  'crocin': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'calpol': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'metacin': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'combiflam': { standardName: 'Ibuprofen + Paracetamol (Combiflam)', category: 'NSAID / Painkiller' },
  'fever': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'fever tablet': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'fever medicine': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'body pain': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'headache': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'tablet': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'tablets': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'tab': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'tabs': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'pill': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'pills': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'medicine': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'medicines': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'pharmacy': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  
  // Tamil mappings
  'பாராசிட்டமால்': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'காய்ச்சல்': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'காய்ச்சல் மாத்திரை': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'டோலோ': { standardName: 'Paracetamol 650mg (Dolo)', category: 'Analgesic & Antipyretic' },
  'தலைவலி': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },

  // Hindi mappings & colloquial symptoms
  'पैरासिटामोल': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'पेरासिटामोल': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'पैरासीटामोल': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'डोलो': { standardName: 'Paracetamol 650mg (Dolo)', category: 'Analgesic & Antipyretic' },
  'डोलो 650': { standardName: 'Paracetamol 650mg (Dolo)', category: 'Analgesic & Antipyretic' },
  'क्रोसिन': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'कैल्पोल': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'मेटासिन': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'बुखार': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'बुखार की दवा': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'बुखार की गोली': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'सिरदर्द': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'सरदर्द': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'सिर दर्द': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'सर दर्द': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'बदन दर्द': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'कमर दर्द': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'दर्द निवारक': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'दर्द की दवा': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'दर्द की गोली': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'पेनकिलर': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'bukhar': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'bukhar ki dawa': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'bukhar ki goli': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'sar dard': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'sir dard': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'sar dard ki dawa': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },
  'badan dard': { standardName: 'Paracetamol 500mg', category: 'Analgesic & Antipyretic' },

  // Amoxicillin / Azithromycin / Cold / Cough
  'amox': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'amoxicillin': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'amoxycillin': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'mox': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'mox 500': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'antibiotic': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'azithral': { standardName: 'Azithromycin 500mg (Azithral)', category: 'Antibiotic (Macrolide)' },
  'azithromycin': { standardName: 'Azithromycin 500mg (Azithral)', category: 'Antibiotic (Macrolide)' },
  'throat infection': { standardName: 'Azithromycin 500mg (Azithral)', category: 'Antibiotic (Macrolide)' },
  'cough': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'cold': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'सளி': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'இருமல்': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'अमोक्सिसिलिन': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'एजिथ्रोमाइसिन': { standardName: 'Azithromycin 500mg (Azithral)', category: 'Antibiotic (Macrolide)' },
  'एज़िथ्रोमाइसिन': { standardName: 'Azithromycin 500mg (Azithral)', category: 'Antibiotic (Macrolide)' },
  'एंटीबायोटिक': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'खांसी': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'खाँसी': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'सर्दी': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'जुकाम': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'गले में खराश': { standardName: 'Azithromycin 500mg (Azithral)', category: 'Antibiotic (Macrolide)' },
  'गले में दर्द': { standardName: 'Azithromycin 500mg (Azithral)', category: 'Antibiotic (Macrolide)' },
  'khansi': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'khansi ki dawa': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'sardi': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'sardi ki dawa': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },
  'jukam': { standardName: 'Amoxicillin 500mg (Mox 500)', category: 'Antibiotic (Penicillin)' },

  // ORS / Hydration / Vomiting / Diarrhea
  'ors': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'electral': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'electrol': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'electrolyte': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'dehydration': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'diarrhea': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'vomiting': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'loose motion': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'நீரிழப்பு': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'ஓஆர்எஸ்': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'ओआरएस': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'इलेक्ट्रॉल': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'उल्टी': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'दस्त': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'लूज मोशन': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'dast': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'dast ki dawa': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'ulti': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },
  'ulti ki dawa': { standardName: 'Oral Rehydration Salts (ORS W.H.O.)', category: 'Electrolyte Replenisher' },

  // Diabetes / Insulin / Metformin
  'insulin': { standardName: 'Insulin Human Mixtard 30/70', category: 'Anti-Diabetic' },
  'insuline': { standardName: 'Insulin Human Mixtard 30/70', category: 'Anti-Diabetic' },
  'sugar': { standardName: 'Metformin 500mg (Glycomet)', category: 'Anti-Diabetic' },
  'sugar medicine': { standardName: 'Metformin 500mg (Glycomet)', category: 'Anti-Diabetic' },
  'sugar tablet': { standardName: 'Metformin 500mg (Glycomet)', category: 'Anti-Diabetic' },
  'metformin': { standardName: 'Metformin 500mg (Glycomet)', category: 'Anti-Diabetic' },
  'glycomet': { standardName: 'Metformin 500mg (Glycomet)', category: 'Anti-Diabetic' },
  'diabetes': { standardName: 'Metformin 500mg (Glycomet)', category: 'Anti-Diabetic' },
  'diabetic': { standardName: 'Metformin 500mg (Glycomet)', category: 'Anti-Diabetic' },
  'சர்க்கரை': { standardName: 'Metformin 500mg (Glycomet)', category: 'Anti-Diabetic' },
  'இன்சுலின்': { standardName: 'Insulin Human Mixtard 30/70', category: 'Anti-Diabetic' },
  'इंसुलिन': { standardName: 'Insulin Human Mixtard 30/70', category: 'Anti-Diabetic' },
  'शुगर': { standardName: 'Metformin 500mg (Glycomet)', category: 'Anti-Diabetic' },
  'डायबिटीज': { standardName: 'Metformin 500mg (Glycomet)', category: 'Anti-Diabetic' },
  'मधुमेह': { standardName: 'Metformin 500mg (Glycomet)', category: 'Anti-Diabetic' },
  'मेटफॉर्मिन': { standardName: 'Metformin 500mg (Glycomet)', category: 'Anti-Diabetic' },
  'शुगर की दवा': { standardName: 'Metformin 500mg (Glycomet)', category: 'Anti-Diabetic' },
  'शुगर की गोली': { standardName: 'Metformin 500mg (Glycomet)', category: 'Anti-Diabetic' },
  'sugar ki dawa': { standardName: 'Metformin 500mg (Glycomet)', category: 'Anti-Diabetic' },

  // Snake Antivenom & Emergency
  'antivenom': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'anti venom': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'snake': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'snake bite': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'snake venom': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'poison': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'பாம்பு': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'பாம்பு கடி': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'விஷம்': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'விஷ முறிவு': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'सांप': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'साँप': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'सांप का काटना': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'जहर': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'विष': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'एंटीवेनम': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'एंटी स्नेक वेनम': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'saap': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },
  'saanp': { standardName: 'Snake Polyvalent Antivenom', category: 'Emergency Critical Care' },

  // Blood pressure / Heart
  'bp': { standardName: 'Amlodipine 5mg (Amlong)', category: 'Cardiovascular' },
  'bp tablet': { standardName: 'Amlodipine 5mg (Amlong)', category: 'Cardiovascular' },
  'amlodipine': { standardName: 'Amlodipine 5mg (Amlong)', category: 'Cardiovascular' },
  'telmisartan': { standardName: 'Telmisartan 40mg (Telma)', category: 'Cardiovascular' },
  'sorbitrate': { standardName: 'Isosorbide Dinitrate 10mg (Sorbitrate)', category: 'Cardiovascular' },
  'heart attack': { standardName: 'Isosorbide Dinitrate 10mg (Sorbitrate)', category: 'Cardiovascular' },
  'बीपी': { standardName: 'Amlodipine 5mg (Amlong)', category: 'Cardiovascular' },
  'ब्लड प्रेशर': { standardName: 'Amlodipine 5mg (Amlong)', category: 'Cardiovascular' },
  'उच्च रक्तचाप': { standardName: 'Amlodipine 5mg (Amlong)', category: 'Cardiovascular' },
  'एमलोडिपिन': { standardName: 'Amlodipine 5mg (Amlong)', category: 'Cardiovascular' },
  'दिल का दौरा': { standardName: 'Isosorbide Dinitrate 10mg (Sorbitrate)', category: 'Cardiovascular' },
  'सीने में दर्द': { standardName: 'Isosorbide Dinitrate 10mg (Sorbitrate)', category: 'Cardiovascular' },
  'हार्ट अटैक': { standardName: 'Isosorbide Dinitrate 10mg (Sorbitrate)', category: 'Cardiovascular' },
  'bp ki dawa': { standardName: 'Amlodipine 5mg (Amlong)', category: 'Cardiovascular' },
  'sine me dard': { standardName: 'Isosorbide Dinitrate 10mg (Sorbitrate)', category: 'Cardiovascular' },

  // Acidity / Gas / Digestion
  'pantop': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'pantoprazole': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'pan-d': { standardName: 'Pantoprazole + Domperidone (Pan-D)', category: 'Gastrointestinal' },
  'pan d': { standardName: 'Pantoprazole + Domperidone (Pan-D)', category: 'Gastrointestinal' },
  'acidity': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'gas': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'पेंटॉप': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'एसिडिटी': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'गैस': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'पेट दर्द': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'पेट में जलन': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'पेट में दर्द': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'पेट दर्द की गोली': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'पेट दर्द की दवा': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'गैस की गोली': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'गैस की दवा': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'एसिडिटी की गोली': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'एसिडिटी की दवा': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'pet dard': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'acidity ki dawa': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'gas ki dawa': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },
  'gas ki goli': { standardName: 'Pantoprazole 40mg (Pan 40)', category: 'Gastrointestinal' },

  // Asthma / Respiratory
  'inhaler': { standardName: 'Salbutamol Inhaler (Asthalin 100mcg)', category: 'Respiratory' },
  'asthalin': { standardName: 'Salbutamol Inhaler (Asthalin 100mcg)', category: 'Respiratory' },
  'asthma': { standardName: 'Salbutamol Inhaler (Asthalin 100mcg)', category: 'Respiratory' },
  'wheezing': { standardName: 'Salbutamol Inhaler (Asthalin 100mcg)', category: 'Respiratory' },
  'इन्हेलर': { standardName: 'Salbutamol Inhaler (Asthalin 100mcg)', category: 'Respiratory' },
  'अस्थमा': { standardName: 'Salbutamol Inhaler (Asthalin 100mcg)', category: 'Respiratory' },
  'दमा': { standardName: 'Salbutamol Inhaler (Asthalin 100mcg)', category: 'Respiratory' },
  'अस्थलीन': { standardName: 'Salbutamol Inhaler (Asthalin 100mcg)', category: 'Respiratory' },
  'सांस फूलना': { standardName: 'Salbutamol Inhaler (Asthalin 100mcg)', category: 'Respiratory' },
  'सांस की बीमारी': { standardName: 'Salbutamol Inhaler (Asthalin 100mcg)', category: 'Respiratory' },
  'dama': { standardName: 'Salbutamol Inhaler (Asthalin 100mcg)', category: 'Respiratory' },

  // Allergy / Skin
  'cetirizine': { standardName: 'Cetirizine 10mg (Cetzine)', category: 'Antiallergic' },
  'cetzine': { standardName: 'Cetirizine 10mg (Cetzine)', category: 'Antiallergic' },
  'allergy': { standardName: 'Cetirizine 10mg (Cetzine)', category: 'Antiallergic' },
  'सिट्रिज़िन': { standardName: 'Cetirizine 10mg (Cetzine)', category: 'Antiallergic' },
  'सिट्रिजिन': { standardName: 'Cetirizine 10mg (Cetzine)', category: 'Antiallergic' },
  'सिटजिन': { standardName: 'Cetirizine 10mg (Cetzine)', category: 'Antiallergic' },
  'एलर्जी': { standardName: 'Cetirizine 10mg (Cetzine)', category: 'Antiallergic' },
  'खुजली': { standardName: 'Cetirizine 10mg (Cetzine)', category: 'Antiallergic' },
  'खुजली की दवा': { standardName: 'Cetirizine 10mg (Cetzine)', category: 'Antiallergic' },
  'छींक': { standardName: 'Cetirizine 10mg (Cetzine)', category: 'Antiallergic' },
  'allergy ki dawa': { standardName: 'Cetirizine 10mg (Cetzine)', category: 'Antiallergic' }
};

// Sorted list of medicine keyword phrases by length descending for greedy phrase matching
const SORTED_MEDICINE_KEYS = Object.keys(MEDICINE_KEYWORD_MAP).sort((a, b) => b.length - a.length);

export function trainAndNormalizeQuery(rawQuery: string): TrainedQueryResult {
  if (!rawQuery) {
    return {
      intent: 'GENERAL',
      normalizedQuery: '',
      matchedKeywords: [],
      isEmergencyAlert: false
    };
  }

  const cleaned = rawQuery.toLowerCase().trim();
  const tokens = cleaned
    .replace(/[^\w\s\u0B80-\u0BFF\u0900-\u097F+-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);

  // Check for Emergency triggers first
  const isEmergency =
    cleaned.includes('108') ||
    cleaned.includes('ambulance') ||
    cleaned.includes('accident') ||
    cleaned.includes('heart attack') ||
    cleaned.includes('snake bite') ||
    cleaned.includes('bleeding') ||
    cleaned.includes('unconscious') ||
    cleaned.includes('ஆம்புலன்ஸ்') ||
    cleaned.includes('அவசரம்') ||
    cleaned.includes('விபத்து') ||
    cleaned.includes('எமர்ஜென்சி') ||
    cleaned.includes('एम्बुलेंस') ||
    cleaned.includes('दुर्घटना') ||
    cleaned.includes('एक्सीडेंट') ||
    cleaned.includes('इमरजेंसी') ||
    cleaned.includes('आपातकाल') ||
    cleaned.includes('बेहोश') ||
    cleaned.includes('खून बह रहा');

  // 1. SPECIFIC MEDICINE PHRASE CHECK (Checked first so specific medicines aren't swallowed by generic terms)
  for (const key of SORTED_MEDICINE_KEYS) {
    if (cleaned.includes(key)) {
      const mapping = MEDICINE_KEYWORD_MAP[key];
      return {
        intent: 'MEDICINE',
        normalizedQuery: mapping.standardName,
        matchedKeywords: [key, mapping.standardName],
        medicineTarget: mapping.standardName,
        isEmergencyAlert: isEmergency || key.includes('antivenom') || key.includes('snake') || key.includes('सांप')
      };
    }
  }

  // 2. STEM & PHONETIC MEDICINE MATCHERS
  // Paracetamol, Fever & Pain
  if (
    cleaned.includes('பாராசிட்ட') ||
    cleaned.includes('பாரசிட்ட') ||
    cleaned.includes('பாராசிட') ||
    cleaned.includes('பாரசிட') ||
    cleaned.includes('டோலோ') ||
    cleaned.includes('குரோசின்') ||
    cleaned.includes('காய்ச்சல்') ||
    cleaned.includes('தலைவலி') ||
    cleaned.includes('உடல் வலி') ||
    cleaned.includes('पैरासिटा') ||
    cleaned.includes('पेरासिटा') ||
    cleaned.includes('पैरासीटा') ||
    cleaned.includes('पैरासिटामिल') ||
    cleaned.includes('क्रोसिन') ||
    cleaned.includes('डोलो') ||
    cleaned.includes('बुखार') ||
    cleaned.includes('सिरदर्द') ||
    cleaned.includes('सरदर्द') ||
    cleaned.includes('बदन दर्द') ||
    cleaned.includes('दर्द निवारक') ||
    /p[ae]r[ae]?[cs][aei]?[etm][a-z]*m[ao]l|parac[a-z]{2,8}ol|paracet|paracit|dolo|crocin|calpol|metacin|fever|headache/i.test(cleaned)
  ) {
    const isDolo = cleaned.includes('dolo') || cleaned.includes('டோலோ') || cleaned.includes('डोलो');
    const std = isDolo ? 'Paracetamol 650mg (Dolo)' : 'Paracetamol 500mg';
    return {
      intent: 'MEDICINE',
      normalizedQuery: std,
      matchedKeywords: ['paracetamol', std],
      medicineTarget: std,
      isEmergencyAlert: isEmergency
    };
  }

  // Insulin & Diabetes
  if (
    cleaned.includes('இன்சுலின்') ||
    cleaned.includes('சர்க்கரை') ||
    cleaned.includes('டயாபடீஸ்') ||
    cleaned.includes('மெட்பார்மின்') ||
    cleaned.includes('इंसुलिन') ||
    cleaned.includes('इन्सुलिन') ||
    cleaned.includes('शुगर') ||
    cleaned.includes('डायबिटीज') ||
    cleaned.includes('डायबिटिक') ||
    cleaned.includes('मधुमेह') ||
    cleaned.includes('मेटफॉर्मिन') ||
    /insulin|sugar|diabet|metformin|glycomet/.test(cleaned)
  ) {
    const isInsulin = cleaned.includes('insulin') || cleaned.includes('இன்சுலின்') || cleaned.includes('इंसुलिन') || cleaned.includes('इन्सुलिन');
    const std = isInsulin ? 'Insulin Human Mixtard 30/70' : 'Metformin 500mg (Glycomet)';
    return {
      intent: 'MEDICINE',
      normalizedQuery: std,
      matchedKeywords: ['diabetes', std],
      medicineTarget: std,
      isEmergencyAlert: isEmergency
    };
  }

  // Snake Antivenom & Toxins
  if (
    cleaned.includes('பாம்பு') ||
    cleaned.includes('விஷம்') ||
    cleaned.includes('விஷ முறிவு') ||
    cleaned.includes('ஆன்டிவெனம்') ||
    cleaned.includes('சாம்ப') ||
    cleaned.includes('सांप') ||
    cleaned.includes('साँप') ||
    cleaned.includes('जहर') ||
    cleaned.includes('विष') ||
    cleaned.includes('एंटीवेनम') ||
    /snake|antivenom|anti venom|poison/.test(cleaned)
  ) {
    const std = 'Snake Polyvalent Antivenom';
    return {
      intent: 'MEDICINE',
      normalizedQuery: std,
      matchedKeywords: ['antivenom', std],
      medicineTarget: std,
      isEmergencyAlert: true
    };
  }

  // ORS / Dehydration / Diarrhea / Vomiting
  if (
    cleaned.includes('ஓஆர்எஸ்') ||
    cleaned.includes('எலக்ட்ரால்') ||
    cleaned.includes('வாந்தி') ||
    cleaned.includes('பேதி') ||
    cleaned.includes('வயிற்றுப்போக்கு') ||
    cleaned.includes('நீரிழப்பு') ||
    cleaned.includes('ओआरएस') ||
    cleaned.includes('उल्टी') ||
    cleaned.includes('दस्त') ||
    cleaned.includes('इलेक्ट्रॉल') ||
    cleaned.includes('लूज मोशन') ||
    cleaned.includes('डिहाइड्रेशन') ||
    /ors|electral|electrol|dehydrat|diarrhea|loose motion|vomit/.test(cleaned)
  ) {
    const std = 'Oral Rehydration Salts (ORS W.H.O.)';
    return {
      intent: 'MEDICINE',
      normalizedQuery: std,
      matchedKeywords: ['ors', std],
      medicineTarget: std,
      isEmergencyAlert: isEmergency
    };
  }

  // Antibiotics / Cold / Cough
  if (
    cleaned.includes('அமாக்ஸ்') ||
    cleaned.includes('அமாக்சி') ||
    cleaned.includes('ஆன்டிபயாடிக்') ||
    cleaned.includes('சளி') ||
    cleaned.includes('இருமல்') ||
    cleaned.includes('தொண்டை') ||
    cleaned.includes('அசித்ரோ') ||
    cleaned.includes('अमोक्सिसिलिन') ||
    cleaned.includes('एमोक्सिसिलिन') ||
    cleaned.includes('एजिथ्रोमाइसिन') ||
    cleaned.includes('एज़िथ्रोमाइसिन') ||
    cleaned.includes('एंटीबायोटिक') ||
    cleaned.includes('सर्दी') ||
    cleaned.includes('जुकाम') ||
    cleaned.includes('खांसी') ||
    cleaned.includes('खाँसी') ||
    cleaned.includes('कफ') ||
    /amox|azithr|antibiotic|cough|cold|throat/.test(cleaned)
  ) {
    const std = (cleaned.includes('azithr') || cleaned.includes('அசித்ரோ') || cleaned.includes('एजिथ्रो')) ? 'Azithromycin 500mg (Azithral)' : 'Amoxicillin 500mg (Mox 500)';
    return {
      intent: 'MEDICINE',
      normalizedQuery: std,
      matchedKeywords: ['antibiotic', std],
      medicineTarget: std,
      isEmergencyAlert: isEmergency
    };
  }

  // BP / Cardiovascular
  if (
    cleaned.includes('பிபி') ||
    cleaned.includes('பிரஷர்') ||
    cleaned.includes('ரத்த அழுத்தம்') ||
    cleaned.includes('ஆம்லோடிபின்') ||
    cleaned.includes('நெஞ்சு வலி') ||
    cleaned.includes('மாரடைப்பு') ||
    cleaned.includes('बीपी') ||
    cleaned.includes('ब्लड प्रेशर') ||
    cleaned.includes('उच्च रक्तचाप') ||
    cleaned.includes('एमलोडिपिन') ||
    cleaned.includes('दिल का दौरा') ||
    cleaned.includes('सीने में दर्द') ||
    cleaned.includes('हार्ट अटैक') ||
    /bp|blood pressure|amlodipine|telmisartan|heart attack/.test(cleaned)
  ) {
    const isEmergencyAttack = cleaned.includes('மாரடைப்பு') || cleaned.includes('நெஞ்சு வலி') || cleaned.includes('दिल का दौरा') || cleaned.includes('हार्ट अटैक') || cleaned.includes('heart attack');
    const std = isEmergencyAttack ? 'Isosorbide Dinitrate 10mg (Sorbitrate)' : 'Amlodipine 5mg (Amlong)';
    return {
      intent: 'MEDICINE',
      normalizedQuery: std,
      matchedKeywords: ['bp', std],
      medicineTarget: std,
      isEmergencyAlert: isEmergency || isEmergencyAttack
    };
  }

  // Acidity & Gas
  if (
    cleaned.includes('பான்டோப்') ||
    cleaned.includes('அசிடிட்டி') ||
    cleaned.includes('கேஸ்') ||
    cleaned.includes('நெஞ்செரிச்சல்') ||
    cleaned.includes('வயிற்று வலி') ||
    cleaned.includes('पेंटॉप') ||
    cleaned.includes('एसिडिटी') ||
    cleaned.includes('गैस') ||
    cleaned.includes('पेट दर्द') ||
    cleaned.includes('पेट में जलन') ||
    cleaned.includes('पैन डी') ||
    /pantop|pan-d|acid|acidity|gas|heartburn/.test(cleaned)
  ) {
    const std = 'Pantoprazole 40mg (Pan 40)';
    return {
      intent: 'MEDICINE',
      normalizedQuery: std,
      matchedKeywords: ['acidity', std],
      medicineTarget: std,
      isEmergencyAlert: isEmergency
    };
  }

  // Inhaler & Asthma
  if (
    cleaned.includes('இன்ஹேலர்') ||
    cleaned.includes('ஆஸ்துமா') ||
    cleaned.includes('இளைப்பு') ||
    cleaned.includes('வீசிங்') ||
    cleaned.includes('इन्हेलर') ||
    cleaned.includes('अस्थमा') ||
    cleaned.includes('दमा') ||
    cleaned.includes('अस्थलीन') ||
    cleaned.includes('सांस फूलना') ||
    cleaned.includes('सांस की तकलीफ') ||
    /inhaler|asthma|asthalin|wheez/.test(cleaned)
  ) {
    const std = 'Salbutamol Inhaler (Asthalin 100mcg)';
    return {
      intent: 'MEDICINE',
      normalizedQuery: std,
      matchedKeywords: ['asthma', std],
      medicineTarget: std,
      isEmergencyAlert: isEmergency
    };
  }

  // 3. BLOOD BANK INTENT & BLOOD GROUP RECOGNITION (English, Tamil, Hindi)
  const bloodMatch = cleaned.match(/\b(o\+|o-|b\+|b-|a\+|a-|ab\+|ab-|o positive|o negative|b positive|b negative|a positive|a negative|ab positive|ab negative)\b/i);
  const hindiBloodGroupMatch =
    cleaned.includes('ओ पॉजिटिव') || cleaned.includes('ओ पॉज़िटिव') || cleaned.includes('ओ+') || cleaned.includes('ओ positive')
      ? 'O+'
      : cleaned.includes('ओ नेगेटिव') || cleaned.includes('ओ-')
      ? 'O-'
      : cleaned.includes('एबी पॉजिटिव') || cleaned.includes('एबी पॉज़िटिव') || cleaned.includes('एबी+')
      ? 'AB+'
      : cleaned.includes('एबी नेगेटिव') || cleaned.includes('एबी-')
      ? 'AB-'
      : cleaned.includes('ए पॉजिटिव') || cleaned.includes('ए पॉज़िटिव') || cleaned.includes('ए+')
      ? 'A+'
      : cleaned.includes('ए नेगेटिव') || cleaned.includes('ए-')
      ? 'A-'
      : cleaned.includes('बी पॉजिटिव') || cleaned.includes('बी पॉज़िटिव') || cleaned.includes('बी+')
      ? 'B+'
      : cleaned.includes('बी नेगेटिव') || cleaned.includes('बी-')
      ? 'B-'
      : null;

  const hasBloodWord =
    cleaned.includes('blood') ||
    cleaned.includes('இரத்தம்') ||
    cleaned.includes('ரத்தம்') ||
    cleaned.includes('ரத்த வங்கி') ||
    cleaned.includes('குருதி') ||
    cleaned.includes('ब्लड') ||
    cleaned.includes('ब्लड बैंक') ||
    cleaned.includes('खून') ||
    cleaned.includes('रक्त') ||
    cleaned.includes('रक्त बैंक') ||
    cleaned.includes('रुधिर');

  if (bloodMatch || hindiBloodGroupMatch || hasBloodWord) {
    let group = hindiBloodGroupMatch || 'O+';
    if (bloodMatch) {
      const g = bloodMatch[0].toUpperCase();
      if (g.includes('AB') && (g.includes('+') || g.includes('POS'))) group = 'AB+';
      else if (g.includes('AB') && (g.includes('-') || g.includes('NEG'))) group = 'AB-';
      else if (g.includes('O') && (g.includes('+') || g.includes('POS'))) group = 'O+';
      else if (g.includes('O') && (g.includes('-') || g.includes('NEG'))) group = 'O-';
      else if (g.includes('A') && (g.includes('+') || g.includes('POS'))) group = 'A+';
      else if (g.includes('A') && (g.includes('-') || g.includes('NEG'))) group = 'A-';
      else if (g.includes('B') && (g.includes('+') || g.includes('POS'))) group = 'B+';
      else if (g.includes('B') && (g.includes('-') || g.includes('NEG'))) group = 'B-';
    }
    return {
      intent: 'BLOOD',
      normalizedQuery: 'blood bank ' + group,
      matchedKeywords: [group, 'blood'],
      bloodGroupTarget: group,
      isEmergencyAlert: isEmergency
    };
  }

  // 4. REFERRALS (English, Tamil, Hindi)
  if (
    cleaned.includes('referral') ||
    cleaned.includes('transfer') ||
    cleaned.includes('refer') ||
    cleaned.includes('பரிந்துரை') ||
    cleaned.includes('ரெபரல்') ||
    cleaned.includes('रेफरल') ||
    cleaned.includes('रेफर') ||
    cleaned.includes('ट्रांसफर') ||
    cleaned.includes('स्थानांतरण') ||
    cleaned.includes('रेफरल पर्ची')
  ) {
    return {
      intent: 'REFERRAL',
      normalizedQuery: 'patient referral transfer',
      matchedKeywords: ['referral'],
      isEmergencyAlert: isEmergency
    };
  }

  // 5. ORGAN TRANSPLANT (English, Tamil, Hindi)
  if (
    cleaned.includes('organ') ||
    cleaned.includes('kidney') ||
    cleaned.includes('liver') ||
    cleaned.includes('cornea') ||
    cleaned.includes('transplant') ||
    cleaned.includes('transtan') ||
    cleaned.includes('உறுப்பு மாற்று') ||
    cleaned.includes('अंग प्रत्यारोपण') ||
    cleaned.includes('प्रत्यारोपण') ||
    cleaned.includes('ट्रांसप्लांट') ||
    cleaned.includes('किडनी') ||
    cleaned.includes('गुर्दा') ||
    cleaned.includes('लिवर') ||
    cleaned.includes('यकृत') ||
    cleaned.includes('हार्ट ट्रांसप्लांट') ||
    cleaned.includes('अंगदान') ||
    cleaned.includes('नेत्रदान')
  ) {
    return {
      intent: 'ORGAN',
      normalizedQuery: 'organ transplant waiting',
      matchedKeywords: ['organ'],
      isEmergencyAlert: isEmergency
    };
  }

  // 6. HOSPITAL BEDS INTENT (English, Tamil, Hindi)
  const hasBedWord =
    cleaned.includes('bed') ||
    cleaned.includes('beds') ||
    cleaned.includes('icu') ||
    cleaned.includes('oxygen') ||
    cleaned.includes('ventilator') ||
    cleaned.includes('casualty') ||
    cleaned.includes('admit') ||
    cleaned.includes('admission') ||
    cleaned.includes('hospital') ||
    cleaned.includes('clinic') ||
    cleaned.includes('படுக்கை') ||
    cleaned.includes('ஐசியூ') ||
    cleaned.includes('மருத்துவமனை') ||
    cleaned.includes('ஆக்சிஜன்') ||
    cleaned.includes('बेड') ||
    cleaned.includes('बिस्तर') ||
    cleaned.includes('पलंग') ||
    cleaned.includes('अस्पताल') ||
    cleaned.includes('हॉस्पिटल') ||
    cleaned.includes('हस्पताल') ||
    cleaned.includes('चिकित्सालय') ||
    cleaned.includes('दवाखाना') ||
    cleaned.includes('क्लीनिक') ||
    cleaned.includes('भर्ती') ||
    cleaned.includes('एडमिट') ||
    cleaned.includes('दाखिल') ||
    cleaned.includes('आईसीयू') ||
    cleaned.includes('आई सी यू') ||
    cleaned.includes('आई.सी.यू') ||
    cleaned.includes('वेंटिलेटर') ||
    cleaned.includes('ऑक्सीजन') ||
    cleaned.includes('ऑक्सिजन');

  if (hasBedWord) {
    let bedCategory = 'ALL';
    if (
      cleaned.includes('icu') ||
      cleaned.includes('ஐசியூ') ||
      cleaned.includes('आईसीयू') ||
      cleaned.includes('आई सी यू') ||
      cleaned.includes('आई.सी.यू')
    ) {
      bedCategory = 'ICU';
    } else if (
      cleaned.includes('oxygen') ||
      cleaned.includes('ஆக்சிஜன்') ||
      cleaned.includes('ऑक्सीजन') ||
      cleaned.includes('ऑक्सिजन')
    ) {
      bedCategory = 'OXYGEN_SUPPORTED';
    } else if (
      cleaned.includes('emergency') ||
      cleaned.includes('casualty') ||
      cleaned.includes('कैजुअल्टी') ||
      cleaned.includes('इमरजेंसी') ||
      cleaned.includes('आपातकाल')
    ) {
      bedCategory = 'EMERGENCY';
    }

    return {
      intent: 'BED',
      normalizedQuery: 'hospital beds ' + bedCategory,
      matchedKeywords: [bedCategory, 'hospital'],
      bedCategoryTarget: bedCategory,
      isEmergencyAlert: isEmergency
    };
  }

  // 7. GENERIC MEDICINE & TABLET QUERIES (Checked AFTER specific medicines & other pillars)
  if (
    cleaned.includes('மாத்திரை') ||
    cleaned.includes('மருந்து') ||
    cleaned.includes('மருந்தகம்') ||
    cleaned.includes('தடை மாத்திரை') ||
    cleaned.includes('வழங்கும் மாத்திரை') ||
    cleaned.includes('दवा') ||
    cleaned.includes('दवाई') ||
    cleaned.includes('दवाइयां') ||
    cleaned.includes('दवाएं') ||
    cleaned.includes('गोली') ||
    cleaned.includes('गोलियां') ||
    cleaned.includes('टैबलेट') ||
    cleaned.includes('फार्मेसी') ||
    cleaned.includes('मेडिकल स्टोर') ||
    /tablet|tablets|tab\b|pill|pills|medicine|medicines|medication|capsule|tonic|syrup|pharmacy/.test(cleaned)
  ) {
    const std = 'Paracetamol 500mg';
    return {
      intent: 'MEDICINE',
      normalizedQuery: std,
      matchedKeywords: ['tablet', 'medicine', std],
      medicineTarget: std,
      isEmergencyAlert: isEmergency
    };
  }

  // 8. FALLBACK TOKEN CLEANING
  const significantTokens = tokens.filter(t => !STOP_WORDS.has(t));
  const fallbackNormalized = significantTokens.join(' ') || cleaned;

  return {
    intent: isEmergency ? 'EMERGENCY' : 'GENERAL',
    normalizedQuery: fallbackNormalized,
    matchedKeywords: significantTokens,
    isEmergencyAlert: isEmergency
  };
}
