/**
 * REVIVE Humanized Voice AI Persona & Speech Synthesizer
 * 
 * Specifically tuned for rural healthcare smart speakers and voice hardware kiosks.
 * Delivers warm, compassionate, spoken responses in English, Tamil, and Hindi
 * with zero robotic formatting, formatted cleanly for hardware speaker DAC / I2S output.
 */

import { GoogleGenAI } from '@google/genai';

export interface GroundedFacts {
  medicines: Array<{
    medicineName: string;
    genericName: string;
    pharmacyName: string;
    distanceKm: number;
    stockQuantity: number;
    pharmacyPhone: string;
    price: number;
  }>;
  hospitals: Array<{
    name: string;
    distanceKm: number;
    emergencyPhone: string;
    phone: string;
    totalAvailableBeds: number;
    icuAvailable?: number;
    oxygenAvailable?: number;
  }>;
  bloodBanks: Array<{
    bloodBankName: string;
    bloodGroup: string;
    unitsAvailable: number;
    emergencyContact: string;
    distanceKm?: number;
  }>;
}

/**
 * Builds a natural, compassionate prompt for Gemini 3.8 Flash
 * specifically designed for spoken audio playback through a hardware speaker.
 */
export function buildHumanizedVoicePrompt(
  userQuery: string,
  targetLang: 'en' | 'ta' | 'hi',
  district: string,
  trainedIntent: {
    intent: string;
    medicineTarget?: string;
    bloodGroupTarget?: string;
    bedCategoryTarget?: string;
    isEmergencyAlert: boolean;
  },
  facts: GroundedFacts,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; text: string }>
): string {
  const languageNames = {
    en: 'English (Conversational, warm, empathetic doctor style)',
    ta: 'Tamil (கனிவான, மரியாதையான, எளிய பேச்சுத் தமிழ் - Pure Spoken Tamil Script)',
    hi: 'Hindi (आत्मीय, आदरणीय, सरल और आश्वस्त करने वाली हिंदी - Pure Devanagari Script)'
  };

  const emergencyNotice = trainedIntent.isEmergencyAlert
    ? 'CRITICAL: The user may be experiencing an acute emergency (e.g. accident, snake bite, chest pain, breathlessness). Sound calm, decisive, and reassuring. Direct them to call 108 immediately and state the nearest emergency casualty ward.'
    : 'Provide a warm, reassuring, spoken healthcare assistant response.';

  const historyContext = conversationHistory && conversationHistory.length > 0
    ? `\nRECENT CONVERSATION HISTORY (Context & Memory):
${conversationHistory.slice(-4).map(turn => `${turn.role.toUpperCase()}: "${turn.text}"`).join('\n')}
(Do NOT repeat the introductory greeting if you have already greeted the patient in recent turns. Seamlessly continue the conversation.)`
    : '';

  return `You are Dr. Revive, a warm, caring, patient, and emotionally intelligent healthcare companion speaking through the REVIVE Box (a rural healthcare smart speaker / kiosk) in Tamil Nadu, India.
A patient, family member, elderly citizen, or rural villager is speaking to you for healthcare guidance.

${emergencyNotice}
${historyContext}

TARGET SPOKEN LANGUAGE: ${languageNames[targetLang]}
CURRENT PATIENT QUERY: "${userQuery}"
DETECTED TOPIC: ${trainedIntent.intent} (${trainedIntent.medicineTarget || trainedIntent.bloodGroupTarget || trainedIntent.bedCategoryTarget || 'General Healthcare'})
CURRENT DISTRICT: ${district}

LIVE VERIFIED DISTRICT HEALTHCARE DATA:
- Available Medicines: ${JSON.stringify(facts.medicines.slice(0, 3))}
- Available Hospitals & Beds: ${JSON.stringify(facts.hospitals.slice(0, 3))}
- Available Blood Banks: ${JSON.stringify(facts.bloodBanks.slice(0, 3))}

HARDWARE AUDIO OUTPUT REQUIREMENTS (EXTREMELY CRITICAL):
1. SPOKEN VOICE ONLY: Your response will be directly converted into audio speech through a hardware loudspeaker.
2. NO MARKDOWN: NEVER use asterisks (**), hashtags (#), bullet points (-), underscores, or tables. It must be continuous, smooth conversational speech.
3. NO BRACKETS OR TECHNICAL CODES: Do NOT include parenthetical English terms in Tamil or Hindi (e.g. avoid '(Paracetamol)' or '(Mettupalayam)'). Use natural transliteration in the target script.
4. HUMANIZED EMPATHY & CONVERSATIONAL TURN-TAKING:
   - If this is the start of a conversation, begin with a gentle, reassuring tone:
     * In Tamil: "வணக்கம்! நீங்கள் சற்றும் கவலைப்படாதீர்கள்..." or "வணக்கம்! நான் உங்களுக்கு உதவுகிறேன்..."
     * In Hindi: "नमस्ते जी! आप बिल्कुल चिंता न करें, मैं आपकी पूरी सहायता करूँगा..."
     * In English: "Hello! Please don't worry, I am right here to help you..."
   - If continuing an existing dialogue, speak naturally without robotic greetings.
   - Deliver the facts smoothly like a caring clinician explaining to a family member. Mention the pharmacy or hospital name, how far away it is in kilometers, how many units or beds are in stock, and clearly state their phone number so they can call before traveling.
   - If the user asks whether you are an AI or robot, reply honestly and warmly that you are REVIVE, an AI-powered healthcare assistant dedicated to guiding rural communities to care. Never falsely claim to be a human doctor.
   - Never diagnose complex illnesses with unjustified certainty. For emergencies, direct immediately to 108 ambulance.
   - Ask ONE clear, caring follow-up question when appropriate (e.g. "Would you like me to share their phone number?").
   - Keep it concise (2 to 3 natural spoken sentences, about 35-50 words total) so the hardware speaker finishes speaking in under 10 seconds.
5. SCRIPT ENFORCEMENT:
   ${targetLang === 'ta' ? 'You MUST write 100% in Tamil script (தமிழ் எழுத்துக்கள்). Do NOT write any English sentences.' : ''}
   ${targetLang === 'hi' ? 'You MUST write 100% in Hindi Devanagari script (देवनागरी लिपि). Do NOT write any English sentences.' : ''}
   ${targetLang === 'en' ? 'Write in fluent, natural conversational Indian English.' : ''}

Generate the humanized spoken voice response now:`;
}

/**
 * Formats exactly 16 characters per line for physical 16x2 HD44780 LCD with I2C.
 * Pad or truncate to ensure the physical LCD screen never overflows or glitches.
 */
export function format16x2LcdLines(
  state: 'READY' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'INTERRUPTED' | 'OFFLINE' | 'ERROR',
  query?: string,
  spokenReply?: string,
  intent?: string
): { line1: string; line2: string } {
  const pad16 = (str: string) => {
    const clean = (str || '').replace(/[^\x20-\x7E]/g, ' ').slice(0, 16);
    return clean.padEnd(16, ' ');
  };

  switch (state) {
    case 'READY':
      return {
        line1: pad16('REVIVE READY'),
        line2: pad16('How can I help?')
      };
    case 'LISTENING':
      return {
        line1: pad16('LISTENING...'),
        line2: pad16('Speak to mic...')
      };
    case 'PROCESSING':
      return {
        line1: pad16('THINKING...'),
        line2: query ? pad16(query) : pad16('Checking data...')
      };
    case 'SPEAKING':
      if (intent === 'MEDICINE') {
        return {
          line1: pad16('MEDICINE FOUND'),
          line2: spokenReply ? pad16(spokenReply.slice(0, 16)) : pad16('Audio playing...')
        };
      }
      if (intent === 'BED') {
        return {
          line1: pad16('HOSPITAL BEDS'),
          line2: spokenReply ? pad16(spokenReply.slice(0, 16)) : pad16('Audio playing...')
        };
      }
      return {
        line1: pad16('REVIVE SPEAKING'),
        line2: spokenReply ? pad16(spokenReply.slice(0, 16)) : pad16('Audio playing...')
      };
    case 'INTERRUPTED':
      return {
        line1: pad16('INTERRUPTED'),
        line2: pad16('Listening again')
      };
    case 'OFFLINE':
      return {
        line1: pad16('REVIVE OFFLINE'),
        line2: pad16('Check Wi-Fi link')
      };
    case 'ERROR':
    default:
      return {
        line1: pad16('REVIVE NOTICE'),
        line2: pad16('Please retry...')
      };
  }
}

/**
 * Humanized Instant Fallback Generator
 * Used when network latency exceeds budget or offline mode is active.
 * Ensures the hardware speaker always speaks a warm, compassionate human response.
 */
export function generateHumanizedSpokenFallback(
  trained: {
    intent: string;
    medicineTarget?: string;
    bloodGroupTarget?: string;
    bedCategoryTarget?: string;
    isEmergencyAlert: boolean;
  },
  facts: GroundedFacts,
  lang: 'en' | 'ta' | 'hi'
): { spokenText: string; displaySummary: string; isEmergency: boolean } {
  const isEmergency = trained.isEmergencyAlert;

  if (isEmergency) {
    const topHosp = facts.hospitals[0];
    const hospName = topHosp ? topHosp.name : 'அருகிலுள்ள தலைமை அரசு மருத்துவமனை';
    const hospPhone = topHosp?.emergencyPhone || topHosp?.phone || '108';

    if (lang === 'ta') {
      return {
        spokenText: `அவசர எச்சரிக்கை! நீங்கள் சற்றும் பதற்றப்பட வேண்டாம். உடனடியாக 108 ஆம்புலன்ஸை அழையுங்கள். உங்களுக்கு மிக அருகில் உள்ள அவசர சிகிச்சை மையம் ${hospName} ஆகும். அவர்களின் அவசர தொடர்பு எண் ${hospPhone}. நோயாளிக்கு தைரியம் சொல்லுங்கள், உதவி உடனே கிடைக்கும்.`,
        displaySummary: `108 Ambulance Alert | ${hospName}`,
        isEmergency: true
      };
    } else if (lang === 'hi') {
      return {
        spokenText: `आपातकालीन सूचना! आप बिल्कुल घबराइए नहीं, धैर्य रखें। तुरंत 108 एम्बुलेंस पर कॉल करें। आपके सबसे निकटतम आपातकालीन अस्पताल ${hospName} है, और उनका फोन नंबर ${hospPhone} है। मरीज को प्राथमिक सहारा दें, सहायता जल्द पहुँच रही है।`,
        displaySummary: `108 Ambulance Alert | ${hospName}`,
        isEmergency: true
      };
    } else {
      return {
        spokenText: `Emergency Alert! Please stay calm and do not panic. Call 108 Ambulance immediately. Your nearest emergency trauma center is ${hospName}, reached at ${hospPhone}. Keep the patient safe, help is on the way.`,
        displaySummary: `108 Ambulance Alert | ${hospName}`,
        isEmergency: true
      };
    }
  }

  // 1. Medicine Intent
  if (trained.intent === 'MEDICINE') {
    const topMed = facts.medicines[0];
    const medName = trained.medicineTarget || topMed?.medicineName || 'தேவையான மருந்து';

    if (topMed) {
      const km = Math.round((topMed.distanceKm || 2.5) * 10) / 10;
      const stock = topMed.stockQuantity;
      const phone = topMed.pharmacyPhone;
      const phName = topMed.pharmacyName;

      if (lang === 'ta') {
        const tamilMed = medName.toLowerCase().includes('paracetamol')
          ? 'பாராசிட்டமால்'
          : medName.toLowerCase().includes('dolo')
          ? 'டோலோ'
          : medName;

        return {
          spokenText: `வணக்கம்! நீங்கள் சற்றும் கவலைப்பட வேண்டாம். ${tamilMed} மருந்து உங்களுக்கு அருகில் ${km} கிலோமீட்டர் தொலைவில் உள்ள ${phName} மருந்தகத்தில் ${stock} எண்ணிக்கை கையிருப்பில் உள்ளது. நீங்கள் புறப்படுவதற்கு முன் ${phone} என்ற எண்ணில் அழைத்து உறுதி செய்து கொள்ளலாம்.`,
          displaySummary: `${tamilMed}: ${stock} units @ ${phName} (${km} km)`,
          isEmergency: false
        };
      } else if (lang === 'hi') {
        const hindiMed = medName.toLowerCase().includes('paracetamol')
          ? 'पैरासिटामोल'
          : medName.toLowerCase().includes('dolo')
          ? 'डोलो'
          : medName;

        return {
          spokenText: `नमस्ते जी! आप बिल्कुल चिंता न करें, मैं आपकी सहायता के लिए यहाँ हूँ। ${hindiMed} दवा आपके पास लगभग ${km} किलोमीटर दूर ${phName} पर उपलब्ध है, जहाँ ${stock} यूनिट का स्टॉक मौजूद है। वहाँ जाने से पहले आप फोन नंबर ${phone} पर बात कर सकते हैं।`,
          displaySummary: `${hindiMed}: ${stock} units @ ${phName} (${km} km)`,
          isEmergency: false
        };
      } else {
        return {
          spokenText: `Hello! Please don't worry, I am right here to help you. ${medName} is available nearby at ${phName}, about ${km} kilometers away, with ${stock} units currently in stock. You can call them directly at ${phone} before heading over.`,
          displaySummary: `${medName}: ${stock} units @ ${phName} (${km} km)`,
          isEmergency: false
        };
      }
    } else {
      if (lang === 'ta') {
        return {
          spokenText: `வணக்கம்! மன்னிக்கவும், ${medName} மருந்து தற்போது அருகிலுள்ள உள்ளூர் மருந்தகங்களில் தற்காலிகமாக கையிருப்பில் இல்லை. அருகில் உள்ள மாவட்ட அரசு மருத்துவமனை மருந்தகத்தை தொடர்பு கொள்ளுமாறு கேட்டுக்கொள்கிறோம்.`,
          displaySummary: `${medName}: Out of stock locally`,
          isEmergency: false
        };
      } else if (lang === 'hi') {
        return {
          spokenText: `नमस्ते जी! क्षमा करें, ${medName} दवा इस समय नजदीकी फार्मेसी में उपलब्ध नहीं है। कृपया नजदीकी जिला सरकारी अस्पताल के दवा काउंटर से संपर्क करें।`,
          displaySummary: `${medName}: Out of stock locally`,
          isEmergency: false
        };
      } else {
        return {
          spokenText: `Hello! I apologize, but ${medName} is currently out of stock at nearby local pharmacies. Please check with your nearest district government hospital dispensary.`,
          displaySummary: `${medName}: Out of stock locally`,
          isEmergency: false
        };
      }
    }
  }

  // 2. Hospital Bed Intent
  if (trained.intent === 'BED') {
    const topHosp = facts.hospitals[0];
    if (topHosp) {
      const km = Math.round((topHosp.distanceKm || 3.2) * 10) / 10;
      const totalBeds = topHosp.totalAvailableBeds || 12;
      const icuCount = topHosp.icuAvailable || 4;
      const phone = topHosp.emergencyPhone || topHosp.phone;

      if (lang === 'ta') {
        return {
          spokenText: `வணக்கம்! உங்களுக்கு அருகில் ${km} கிலோமீட்டர் தொலைவில் உள்ள ${topHosp.name} மருத்துவமனையில் தற்போது ${totalBeds} படுக்கைகள் தயாராக உள்ளன, இதில் ${icuCount} ஐ.சி.யு தீவிர சிகிச்சை படுக்கைகளும் அடங்கும். அவசர முன்பதிவுக்கு ${phone} என்ற எண்ணை தொடர்புகொள்ளவும்.`,
          displaySummary: `${topHosp.name}: ${totalBeds} beds (${icuCount} ICU) | ${km} km`,
          isEmergency: false
        };
      } else if (lang === 'hi') {
        return {
          spokenText: `नमस्ते जी! आपके निकटतम ${km} किलोमीटर की दूरी पर ${topHosp.name} में कुल ${totalBeds} बेड उपलब्ध हैं, जिनमें ${icuCount} आईसीयू बेड भी शामिल हैं। आपातकालीन संपर्क के लिए फोन नंबर ${phone} पर कॉल करें।`,
          displaySummary: `${topHosp.name}: ${totalBeds} beds (${icuCount} ICU) | ${km} km`,
          isEmergency: false
        };
      } else {
        return {
          spokenText: `Hello! At ${topHosp.name}, located about ${km} kilometers from you, there are currently ${totalBeds} beds available, including ${icuCount} ICU beds. For urgent assistance, please call ${phone}.`,
          displaySummary: `${topHosp.name}: ${totalBeds} beds (${icuCount} ICU) | ${km} km`,
          isEmergency: false
        };
      }
    }
  }

  // 3. Blood Bank Intent
  if (trained.intent === 'BLOOD') {
    const topBlood = facts.bloodBanks[0];
    if (topBlood) {
      const grp = topBlood.bloodGroup;
      const units = topBlood.unitsAvailable;
      const bank = topBlood.bloodBankName;
      const phone = topBlood.emergencyContact;

      if (lang === 'ta') {
        return {
          spokenText: `வணக்கம்! ${bank} இரத்த வங்கியில் ${grp} பிரிவு இரத்தம் ${units} அலகுகள் தயாராக உள்ளன. தேவைப்படும் பட்சத்தில் உடனடியாக ${phone} என்ற அவசர உதவி எண்ணை அழைக்கவும்.`,
          displaySummary: `${grp} Blood: ${units} units @ ${bank}`,
          isEmergency: false
        };
      } else if (lang === 'hi') {
        return {
          spokenText: `नमस्ते जी! ${bank} में ${grp} ग्रुप का ${units} यूनिट रक्त सुरक्षित और उपलब्ध है। तुरंत रक्त प्राप्त करने के लिए हेल्पलाइन नंबर ${phone} पर संपर्क करें।`,
          displaySummary: `${grp} Blood: ${units} units @ ${bank}`,
          isEmergency: false
        };
      } else {
        return {
          spokenText: `Hello! At ${bank}, there are currently ${units} units of ${grp} blood ready. You can call their blood bank helpline at ${phone} to arrange collection.`,
          displaySummary: `${grp} Blood: ${units} units @ ${bank}`,
          isEmergency: false
        };
      }
    }
  }

  // General Warm Greeting / Guide
  if (lang === 'ta') {
    return {
      spokenText: `வணக்கம்! நான் உங்கள் ரிவைவ் கிராமப்புற மருத்துவ உதவியாளர். உங்களுக்கு தேவையான மாத்திரைகள், மருத்துவமனை படுக்கைகள், இரத்த வங்கி அல்லது அவசர சிகிச்சை வழிகாட்டல்களை என்னிடம் தயங்காமல் கேளுங்கள்.`,
      displaySummary: 'REVIVE Voice Assistant Ready',
      isEmergency: false
    };
  } else if (lang === 'hi') {
    return {
      spokenText: `नमस्ते जी! मैं आपका रिवाइव ग्रामीण स्वास्थ्य साथी हूँ। आप मुझसे जरूरी दवाओं, अस्पताल में बेड, ब्लड बैंक या किसी भी आपातकालीन सहायता के बारे में पूछ सकते हैं। मैं आपकी पूरी मदद करूँगा।`,
      displaySummary: 'REVIVE Voice Assistant Ready',
      isEmergency: false
    };
  } else {
    return {
      spokenText: `Hello! I am Dr. Revive, your healthcare voice companion. You can ask me anytime about available medicines, ICU hospital beds, blood banks, or emergency hospital transfers. I am here to help you.`,
      displaySummary: 'REVIVE Voice Assistant Ready',
      isEmergency: false
    };
  }
}
