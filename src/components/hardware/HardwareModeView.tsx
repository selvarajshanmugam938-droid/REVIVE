import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  RefreshCw,
  Wifi,
  WifiOff,
  Cpu,
  Tv,
  Settings,
  Send,
  Phone,
  ArrowLeft,
  Radio,
  Sparkles,
  Bot,
  Activity,
  Info,
  Sliders,
  Power,
  Copy,
  Check,
  Building2,
  Pill,
  Droplet,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Language, VoiceAssistantState, HardwareDevice, HardwareLcdState } from '../../types';
import { getTranslation } from '../../locales';

interface HardwareModeViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  userDistrict: string;
  onExit: () => void;
}

interface MessageTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  referencedData?: {
    type: 'MEDICINE' | 'BED' | 'BLOOD' | 'GENERAL';
    items: any[];
  };
}

export const HardwareModeView: React.FC<HardwareModeViewProps> = ({
  language,
  onLanguageChange,
  userDistrict,
  onExit
}) => {
  const t = getTranslation(language);

  // Startup Animation Experience
  const [showStartup, setShowStartup] = useState(true);
  const [startupStep, setStartupStep] = useState<number>(0); // 0: Logo, 1: Hello, 2: Ready to listen

  // State Machine
  const [voiceState, setVoiceState] = useState<VoiceAssistantState>('READY');
  const [isMuted, setIsMuted] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showFallbackInput, setShowFallbackInput] = useState(false);
  const [showToolkit, setShowToolkit] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Device & Simulation State
  const [isSimulated, setIsSimulated] = useState(true);
  const [deviceOnline, setDeviceOnline] = useState(true);
  const [deviceData, setDeviceData] = useState<HardwareDevice | null>(null);

  // 16x2 LCD Character State (Fixed 16 characters per line)
  const [lcdState, setLcdState] = useState<HardwareLcdState>({
    line1: 'REVIVE READY    ',
    line2: 'How can I help? ',
    backlight: true,
    state: 'READY'
  });

  // Conversation turns
  const [conversation, setConversation] = useState<MessageTurn[]>([
    {
      id: 'welcome-01',
      role: 'assistant',
      text: language === 'ta'
        ? 'வணக்கம்! நான் உங்கள் REVIVE நல்வாழ்வுத் தோழன். நான் உங்களுக்கு மருந்து இருப்பு மற்றும் மருத்துவமனை படுக்கைகள் பற்றிய தகவல்களை வழங்க தயாராக இருக்கிறேன்.'
        : language === 'hi'
        ? 'नमस्ते! मैं आपका REVIVE स्वास्थ्य साथी हूँ। मैं आपको अस्पताल के बिस्तर और दवाओं की उपलब्धता की जानकारी देने के लिए तैयार हूँ।'
        : 'Hello! Your REVIVE is here. I am ready to listen and assist you with medicine stock and hospital beds. How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Audio Voice Settings
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female');
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);

  // Active audio refs
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const watchdogTimerRef = useRef<any>(null);

  // Sync scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Fetch Hardware Device Status & Active LCD
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/hardware/devices');
        if (res.ok) {
          const data = await res.json();
          const box = data.devices?.find((d: any) => d.deviceCode === 'REVIVE-BOX-01');
          if (box) {
            setDeviceData(box);
            setIsSimulated(box.isSimulated);
            setDeviceOnline(box.status === 'ONLINE');
          }
          if (data.activeLcd) {
            setLcdState(data.activeLcd);
          }
        }
      } catch (err) {
        console.warn('Hardware status poll warning:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  // Startup Animation Sequence
  useEffect(() => {
    if (!showStartup) return;

    // Step 0 -> Step 1: "Hello! Your REVIVE is here." (after 800ms)
    const t1 = setTimeout(() => {
      setStartupStep(1);
    }, 800);

    // Step 1 -> Step 2: "I'm ready to listen. How can I help you today?" (after 2200ms)
    const t2 = setTimeout(() => {
      setStartupStep(2);
      // Play brief soothing welcome audio chime or speech
      const welcomeText = language === 'ta'
        ? 'வணக்கம்! நான் கேட்க தயாராக இருக்கிறேன். உங்களுக்கு இன்று என்ன உதவி தேவை?'
        : language === 'hi'
        ? 'नमस्ते! मैं सुनने के लिए तैयार हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?'
        : "Hello! Your REVIVE is here. I'm ready to listen. How can I help you today?";
      
      playAudioResponse(welcomeText, language, false);
    }, 2200);

    // Step 2 -> End startup: (after 4800ms)
    const t3 = setTimeout(() => {
      setShowStartup(false);
    }, 4800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [showStartup, language]);

  // Push LCD update to server & local state
  const updateLcd = async (line1: string, line2: string, state: VoiceAssistantState) => {
    const padded1 = line1.slice(0, 16).padEnd(16, ' ');
    const padded2 = line2.slice(0, 16).padEnd(16, ' ');
    setLcdState({
      line1: padded1,
      line2: padded2,
      backlight: true,
      state
    });

    try {
      await fetch('/api/hardware/lcd-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line1: padded1, line2: padded2, state })
      });
    } catch (e) {
      // Non-blocking
    }
  };

  // Halts any ongoing audio playback and cleans up
  const stopAllAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  };

  // Safe playback using Neural TTS endpoint with browser fallback
  const playAudioResponse = (text: string, lang: Language, updateState = true) => {
    stopAllAudio();

    if (updateState) {
      setVoiceState('SPEAKING');
      updateLcd('REVIVE SPEAKING', text.slice(0, 16), 'SPEAKING');
    }

    // Safety watchdog: reset after 20s if audio stalls
    watchdogTimerRef.current = setTimeout(() => {
      if (voiceState === 'SPEAKING' || updateState) {
        setVoiceState('READY');
        updateLcd('REVIVE READY', 'How can I help?', 'READY');
      }
    }, 20000);

    try {
      const audioUrl = `/api/tts?lang=${lang}&text=${encodeURIComponent(text)}`;
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
        currentAudioRef.current = null;
        if (updateState) {
          setVoiceState('READY');
          updateLcd('REVIVE READY', 'How can I help?', 'READY');
        }
      };

      audio.onerror = () => {
        // Fallback to SpeechSynthesis if network drops
        fallbackBrowserSpeech(text, lang, updateState);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          fallbackBrowserSpeech(text, lang, updateState);
        });
      }
    } catch (err) {
      fallbackBrowserSpeech(text, lang, updateState);
    }
  };

  // Browser speech synthesis fallback
  const fallbackBrowserSpeech = (text: string, lang: Language, updateState = true) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (updateState) setVoiceState('READY');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ta' ? 'ta-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = voiceSpeed;
      
      utterance.onend = () => {
        if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
        if (updateState) {
          setVoiceState('READY');
          updateLcd('REVIVE READY', 'How can I help?', 'READY');
        }
      };

      utterance.onerror = () => {
        if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
        if (updateState) {
          setVoiceState('READY');
          updateLcd('REVIVE READY', 'How can I help?', 'READY');
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      if (updateState) setVoiceState('READY');
    }
  };

  // Stop Speaking Button Action
  const handleStopSpeaking = () => {
    stopAllAudio();
    setVoiceState('READY');
    updateLcd('REVIVE READY', 'How can I help?', 'READY');
  };

  // Process User Query
  const submitVoiceQuery = async (queryText: string) => {
    if (!queryText.trim()) return;

    // Add user turn
    const userTurn: MessageTurn = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: queryText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...conversation, userTurn];
    setConversation(newHistory);
    setInputText('');

    // Update state machine to PROCESSING
    setVoiceState('PROCESSING');
    updateLcd('THINKING...', queryText.slice(0, 16), 'PROCESSING');

    try {
      // Send to Hardware Voice API with conversation history context
      const res = await fetch('/api/hardware/voice-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          language,
          district: userDistrict,
          deviceId: 'REVIVE-BOX-01',
          conversationHistory: newHistory.slice(-4).map(h => ({ role: h.role, text: h.text }))
        })
      });

      if (!res.ok) {
        throw new Error('Server returned an error');
      }

      const data = await res.json();
      const spokenText = data.spokenText || data.reply || 'Data received.';

      // Assistant turn
      const assistantTurn: MessageTurn = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        text: spokenText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        referencedData: data.referencedData
      };

      setConversation(prev => [...prev, assistantTurn]);

      // Update 16x2 LCD display
      if (data.lcdDisplay) {
        setLcdState({
          line1: data.lcdDisplay.line1,
          line2: data.lcdDisplay.line2,
          backlight: true,
          state: 'SPEAKING'
        });
      }

      // Play audio out
      playAudioResponse(spokenText, language, true);
    } catch (error) {
      console.error('Error in voice query:', error);
      const errReply = language === 'ta'
        ? 'மன்னிக்கவும், தகவல் பெறுவதில் சிறிய சிக்கல் ஏற்பட்டது. தயவுசெய்து மீண்டும் கேளுங்கள்.'
        : language === 'hi'
        ? 'क्षमा करें, जानकारी प्राप्त करने में समस्या हुई। कृपया दोबारा पूछें।'
        : 'I apologize, I had trouble retrieving that information. Please ask again.';

      setConversation(prev => [
        ...prev,
        {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          text: errReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      playAudioResponse(errReply, language, true);
    }
  };

  // Start Mic Listening with Barge-in Interruption
  const handleToggleListening = () => {
    // If speaking, Barge-In! Interrupt immediately and listen
    if (voiceState === 'SPEAKING') {
      stopAllAudio();
      setVoiceState('INTERRUPTED');
      updateLcd('INTERRUPTED', 'Listening again', 'INTERRUPTED');
      setTimeout(() => startListening(), 250);
      return;
    }

    if (voiceState === 'LISTENING') {
      stopListening();
      return;
    }

    startListening();
  };

  const startListening = () => {
    stopAllAudio();

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setShowFallbackInput(true);
      setVoiceState('PERMISSION_REQUIRED');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        isListeningRef.current = true;
        setVoiceState('LISTENING');
        updateLcd('LISTENING...', 'Speak to mic...', 'LISTENING');
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join('');

        if (transcript) {
          setInputText(transcript);
          updateLcd('HEARING YOU:', transcript.slice(0, 16), 'LISTENING');
        }

        if (event.results[0].isFinal) {
          recognition.stop();
          submitVoiceQuery(transcript);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        isListeningRef.current = false;
        if (err.error === 'not-allowed') {
          setVoiceState('PERMISSION_REQUIRED');
        } else {
          setVoiceState('READY');
          updateLcd('REVIVE READY', 'How can I help?', 'READY');
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        if (voiceState === 'LISTENING') {
          setVoiceState('READY');
          updateLcd('REVIVE READY', 'How can I help?', 'READY');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setShowFallbackInput(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    isListeningRef.current = false;
    setVoiceState('READY');
    updateLcd('REVIVE READY', 'How can I help?', 'READY');
  };

  // Toggle Simulation State
  const handleToggleSimulator = async () => {
    try {
      const nextStatus = !deviceOnline;
      const res = await fetch('/api/hardware/simulate-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: nextStatus })
      });
      if (res.ok) {
        setDeviceOnline(nextStatus);
        if (!nextStatus) {
          updateLcd('REVIVE OFFLINE', 'Check Wi-Fi link', 'OFFLINE');
        } else {
          updateLcd('REVIVE READY', 'How can I help?', 'READY');
        }
      }
    } catch (e) {
      console.warn('Toggle failed', e);
    }
  };

  // Quick sample queries
  const samplePrompts = language === 'ta'
    ? [
        'பாராசிட்டமால் மருந்து இருப்பு எங்கு உள்ளது?',
        'அருகிலுள்ள அவசர ICU படுக்கைகள் எங்கே கிடைக்கும்?',
        'எனக்கு நெஞ்சு வலி, அவசர உதவி தேவை'
      ]
    : language === 'hi'
    ? [
        'पैरासिटामोल कहाँ उपलब्ध है?',
        'निकटतम आईसीयू बेड की जानकारी दें',
        'आपातकालीन 108 एम्बुलेंस की सहायता चाहिए'
      ]
    : [
        'Where is Paracetamol available in stock?',
        'Are there ICU beds available in Coimbatore?',
        'Chest pain emergency, connect to hospital'
      ];

  // Copy ESP32 Arduino code snippet
  const copyArduinoCode = () => {
    const code = `// ==========================================
// REVIVE Box - ESP32 Smart Healthcare Node
// Hardware: ESP32-WROOM-32, INMP441 (I2S Mic),
//           MAX98357A (I2S Amp), 16x2 LCD (I2C 0x27)
// ==========================================
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <driver/i2s.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:3000";
const char* deviceCode = "REVIVE-BOX-01";

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22); // SDA=GPIO21, SCL=GPIO22
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("REVIVE BOOTING..");
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("REVIVE CONNECTED");
  lcd.setCursor(0, 1);
  lcd.print("Ready for audio ");
}

void loop() {
  // 1. Heartbeat every 10s to sync 16x2 LCD
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(String(serverUrl) + "/api/hardware/heartbeat");
    http.addHeader("Content-Type", "application/json");
    
    StaticJsonDocument<128> doc;
    doc["deviceCode"] = deviceCode;
    doc["wifiRssi"] = WiFi.RSSI();
    String reqBody;
    serializeJson(doc, reqBody);
    
    int httpCode = http.POST(reqBody);
    if (httpCode == 200) {
      String payload = http.getString();
      StaticJsonDocument<512> resDoc;
      deserializeJson(resDoc, payload);
      
      const char* l1 = resDoc["lcdDisplay"]["line1"];
      const char* l2 = resDoc["lcdDisplay"]["line2"];
      if (l1 && l2) {
        lcd.setCursor(0, 0);
        lcd.print(l1);
        lcd.setCursor(0, 1);
        lcd.print(l2);
      }
    }
    http.end();
  }
  delay(10000);
}`;
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none relative overflow-x-hidden">
      {/* ============================================================ */}
      {/* 1. STARTUP ANIMATION OVERLAY */}
      {/* ============================================================ */}
      {showStartup && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="relative flex items-center justify-center mb-8">
            {/* Breathing outer glow rings */}
            <div className="absolute w-44 h-44 rounded-full bg-emerald-500/20 animate-ping opacity-60 pointer-events-none" />
            <div className="absolute w-36 h-36 rounded-full bg-teal-500/25 animate-pulse duration-1000 pointer-events-none" />
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 shadow-2xl shadow-emerald-500/30 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                <Bot className="w-12 h-12 text-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="max-w-md space-y-4">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {startupStep >= 1 ? 'Hello! Your REVIVE is here.' : 'REVIVE Box'}
            </h1>
            <p className="text-base text-slate-300 leading-relaxed font-medium">
              {startupStep >= 2
                ? 'I’m ready to listen. How can I help you today?'
                : 'Initializing ESP32 audio engine & 16x2 LCD display...'}
            </p>

            {/* Subtitle in regional language */}
            {startupStep >= 2 && (
              <p className="text-sm text-emerald-400/90 font-medium">
                {language === 'ta'
                  ? 'வணக்கம்! நான் கேட்க தயாராக இருக்கிறேன்.'
                  : language === 'hi'
                  ? 'नमस्ते! मैं सुनने के लिए तैयार हूँ।'
                  : 'Rural Healthcare Voice Companion'}
              </p>
            )}
          </div>

          <div className="mt-10 flex items-center gap-4">
            <button
              onClick={() => setShowStartup(false)}
              className="px-5 py-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold tracking-wide border border-slate-700 transition"
            >
              Skip Welcome
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. DEDICATED HARDWARE TOP STATUS BAR */}
      {/* ============================================================ */}
      <header className="w-full bg-slate-900/95 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Connection Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
                <Radio className="w-4 h-4 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm tracking-tight text-white">REVIVE Box</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase tracking-wider">
                    ESP32 I2S
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>District: {userDistrict}</span>
                </div>
              </div>
            </div>

            {/* Clear Status Label: SIMULATION vs PHYSICAL */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-xs">
              {isSimulated ? (
                <>
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-amber-300">
                    DEV SIMULATION (Browser Audio & Simulated I2S)
                  </span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-emerald-300">
                    ESP32 HARDWARE CONNECTED
                  </span>
                  <span className="text-slate-400 text-[10px] font-mono">
                    {deviceData?.ipAddress || '192.168.1.142'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Controls: Language, Toolkit, Exit */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <div className="flex bg-slate-800/90 rounded-xl p-1 border border-slate-700">
              {(['en', 'ta', 'hi'] as Language[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    language === lang
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {lang === 'en' ? 'EN' : lang === 'ta' ? 'தமிழ்' : 'हिंदी'}
                </button>
              ))}
            </div>

            {/* Hardware Architecture / Developer Toolkit Modal Trigger */}
            <button
              onClick={() => setShowToolkit(!showToolkit)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
              title="ESP32 Wiring & Firmware Toolkit"
            >
              <Cpu className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden md:inline">ESP32 Toolkit</span>
            </button>

            {/* Exit Hardware Mode */}
            <button
              onClick={() => {
                stopAllAudio();
                onExit();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-200 text-slate-300 border border-slate-700 hover:border-rose-800/80 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit Mode</span>
            </button>
          </div>
        </div>
      </header>

      {/* Simulation Banner on Mobile */}
      <div className="sm:hidden px-4 py-1.5 bg-amber-950/40 border-b border-amber-800/50 text-[11px] text-amber-300 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Cpu className="w-3 h-3 text-amber-400" />
          <span>DEV SIMULATION (Browser Audio & Simulated I2S)</span>
        </span>
        <button
          onClick={handleToggleSimulator}
          className="text-[10px] underline text-amber-200"
        >
          {deviceOnline ? 'Simulate Offline' : 'Simulate Online'}
        </button>
      </div>

      {/* ============================================================ */}
      {/* 3. MAIN HARDWARE VIEW CONTAINER */}
      {/* ============================================================ */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center justify-between gap-6">
        {/* ========================================== */}
        {/* PHYSICAL 16x2 LCD SCREEN SIMULATION */}
        {/* ========================================== */}
        <div className="w-full max-w-md bg-slate-900 border-4 border-slate-800 rounded-2xl p-4 shadow-2xl shadow-black/60 relative">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-emerald-400" />
              <span>16x2 HD44780 LCD [I2C 0x27]</span>
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
              voiceState === 'SPEAKING'
                ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                : voiceState === 'LISTENING'
                ? 'bg-blue-900/80 text-blue-300 border border-blue-700'
                : voiceState === 'PROCESSING'
                ? 'bg-purple-900/80 text-purple-300 border border-purple-700'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {voiceState}
            </span>
          </div>

          {/* Authentic LCD Character Matrix Backlight */}
          <div className="bg-[#09351e] border-2 border-[#124d2d] rounded-xl p-3 shadow-inner font-mono text-[#43f888] tracking-widest leading-relaxed select-text select-none">
            <div className="text-sm sm:text-base font-bold whitespace-pre overflow-hidden text-ellipsis drop-shadow-[0_0_8px_rgba(67,248,136,0.6)]">
              {lcdState.line1}
            </div>
            <div className="text-sm sm:text-base font-bold whitespace-pre overflow-hidden text-ellipsis drop-shadow-[0_0_8px_rgba(67,248,136,0.6)]">
              {lcdState.line2}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>INMP441 [I2S MIC]</span>
            <span>MAX98357A [I2S DAC]</span>
            <span>ESP32-WROOM</span>
          </div>
        </div>

        {/* ========================================== */}
        {/* BREATHING VOICE ORB & STATE MACHINE DISPLAY */}
        {/* ========================================== */}
        <div className="flex flex-col items-center justify-center my-2 sm:my-4 relative">
          {/* Animated Pulsing Halo */}
          <div className={`relative flex items-center justify-center cursor-pointer transition-all duration-500 ${
            voiceState === 'SPEAKING' ? 'scale-110' : voiceState === 'LISTENING' ? 'scale-105' : 'scale-100'
          }`}
          onClick={handleToggleListening}
          >
            {/* Outer rings */}
            <div className={`absolute rounded-full transition-all duration-700 pointer-events-none ${
              voiceState === 'LISTENING'
                ? 'w-48 h-48 bg-blue-500/20 animate-ping'
                : voiceState === 'SPEAKING'
                ? 'w-52 h-52 bg-emerald-500/25 animate-pulse'
                : voiceState === 'PROCESSING'
                ? 'w-48 h-48 bg-purple-500/20 animate-spin'
                : 'w-40 h-40 bg-teal-500/10'
            }`} />

            <div className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full flex items-center justify-center p-1.5 shadow-2xl transition-all duration-300 ${
              voiceState === 'SPEAKING'
                ? 'bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 shadow-emerald-500/40'
                : voiceState === 'LISTENING'
                ? 'bg-gradient-to-tr from-blue-600 via-cyan-400 to-emerald-400 shadow-blue-500/50 animate-pulse'
                : voiceState === 'PROCESSING'
                ? 'bg-gradient-to-tr from-purple-600 via-pink-500 to-indigo-500 shadow-purple-500/40'
                : 'bg-gradient-to-tr from-slate-700 via-teal-800 to-slate-800 shadow-teal-900/30'
            }`}>
              <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center text-center p-3 relative overflow-hidden">
                {voiceState === 'LISTENING' ? (
                  <>
                    <Mic className="w-10 h-10 text-blue-400 animate-bounce" />
                    <span className="text-[10px] font-bold text-blue-300 mt-1 uppercase tracking-wider">Listening</span>
                  </>
                ) : voiceState === 'SPEAKING' ? (
                  <>
                    <Volume2 className="w-10 h-10 text-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-300 mt-1 uppercase tracking-wider">Speaking</span>
                  </>
                ) : voiceState === 'PROCESSING' ? (
                  <>
                    <RefreshCw className="w-10 h-10 text-purple-400 animate-spin" />
                    <span className="text-[10px] font-bold text-purple-300 mt-1 uppercase tracking-wider">Thinking</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-10 h-10 text-teal-400" />
                    <span className="text-[10px] font-bold text-teal-300 mt-1 uppercase tracking-wider">Ready</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Current State Machine Indicator */}
          <div className="mt-4 text-center">
            <span className="text-xs font-semibold tracking-wide text-slate-400">
              {voiceState === 'LISTENING'
                ? 'Listening to your voice... (Speak now)'
                : voiceState === 'SPEAKING'
                ? 'REVIVE is speaking through loudspeaker'
                : voiceState === 'PROCESSING'
                ? 'Searching verified healthcare database...'
                : 'Tap microphone or speak to ask question'}
            </span>
          </div>
        </div>

        {/* ========================================== */}
        {/* CONVERSATION HISTORY & ACTION CARDS */}
        {/* ========================================== */}
        <div className="w-full max-w-2xl bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col max-h-72 overflow-y-auto space-y-3.5 shadow-inner">
          {conversation.map(turn => (
            <div
              key={turn.id}
              className={`flex flex-col ${turn.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                  turn.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-xs shadow-md'
                    : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-bl-xs shadow-md'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                  {turn.role === 'assistant' ? (
                    <>
                      <Bot className="w-3 h-3 text-emerald-400" />
                      <span className="font-semibold text-emerald-300">Dr. Revive (Companion)</span>
                    </>
                  ) : (
                    <span>Patient ({turn.timestamp})</span>
                  )}
                </div>
                <p className="font-normal">{turn.text}</p>

                {/* Grounded Data Card Attachment (if available) */}
                {turn.referencedData && turn.referencedData.items && turn.referencedData.items.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-2">
                    <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      {turn.referencedData.type === 'MEDICINE' && <Pill className="w-3.5 h-3.5 text-emerald-400" />}
                      {turn.referencedData.type === 'BED' && <Building2 className="w-3.5 h-3.5 text-blue-400" />}
                      {turn.referencedData.type === 'BLOOD' && <Droplet className="w-3.5 h-3.5 text-rose-400" />}
                      <span>Verified Nearby Options:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {turn.referencedData.items.slice(0, 2).map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-200 truncate">
                              {item.pharmacyName || item.name || item.bloodBankName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {item.distanceKm ? `${item.distanceKm} km away` : 'District Center'}
                            </div>
                          </div>
                          {(item.pharmacyPhone || item.phone || item.emergencyPhone) && (
                            <a
                              href={`tel:${item.pharmacyPhone || item.phone || item.emergencyPhone}`}
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call: {item.pharmacyPhone || item.phone || item.emergencyPhone}</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Sample Question Pills */}
        <div className="w-full max-w-2xl flex flex-wrap items-center justify-center gap-2">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => submitVoiceQuery(prompt)}
              className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition hover:border-emerald-700/60"
            >
              "{prompt}"
            </button>
          ))}
        </div>

        {/* ========================================== */}
        {/* VOICE CONTROLS & BARGE-IN INTERACTION */}
        {/* ========================================== */}
        <div className="w-full max-w-md flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-4 w-full">
            {/* Mute Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-2xl border transition ${
                isMuted
                  ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Primary Action Button (Tap to talk / Stop listening / Barge-in) */}
            <button
              onClick={handleToggleListening}
              className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm tracking-wide shadow-xl flex items-center justify-center gap-2.5 transition active:scale-95 ${
                voiceState === 'SPEAKING'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                  : voiceState === 'LISTENING'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {voiceState === 'SPEAKING' ? (
                <>
                  <Mic className="w-5 h-5 animate-bounce" />
                  <span>Tap to Barge-In (Interrupt & Ask)</span>
                </>
              ) : voiceState === 'LISTENING' ? (
                <>
                  <Square className="w-5 h-5" />
                  <span>Tap when Finished Speaking</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>Tap to Speak Question</span>
                </>
              )}
            </button>

            {/* Instant Stop Audio Button (Active during speech) */}
            {voiceState === 'SPEAKING' && (
              <button
                onClick={handleStopSpeaking}
                className="p-3.5 rounded-2xl bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-600/30 transition animate-in zoom-in-75 duration-150"
                title="Stop audio playback immediately"
              >
                <Square className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Toggle text fallback */}
          <div className="w-full flex items-center justify-between text-xs text-slate-400 px-2">
            <button
              onClick={() => setShowFallbackInput(!showFallbackInput)}
              className="text-slate-400 hover:text-emerald-400 transition underline underline-offset-4 flex items-center gap-1"
            >
              {showFallbackInput ? 'Hide Keyboard Input' : 'Type Question (Noisy Environment)'}
            </button>

            {/* Voice persona gender selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Doctor Voice:</span>
              <button
                onClick={() => setVoiceGender(voiceGender === 'female' ? 'male' : 'female')}
                className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-semibold"
              >
                {voiceGender === 'female' ? 'Dr. Revive (Female)' : 'Dr. Revive (Male)'}
              </button>
            </div>
          </div>

          {/* Fallback Text Input */}
          {showFallbackInput && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitVoiceQuery(inputText);
              }}
              className="w-full flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask medicine stock, hospital beds, blood..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </main>

      {/* ============================================================ */}
      {/* 4. ESP32 DEVELOPER TOOLKIT & ARCHITECTURE MODAL */}
      {/* ============================================================ */}
      {showToolkit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">ESP32 Hardware Architecture & Wiring</h3>
                  <p className="text-xs text-slate-400">Physical REVIVE Box Circuit & Firmware Integration</p>
                </div>
              </div>
              <button
                onClick={() => setShowToolkit(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Hardware Pinout Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Component Wiring to ESP32-WROOM-32
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" />
                    <span>INMP441 I2S Mic</span>
                  </div>
                  <div className="text-slate-300 font-mono text-[11px] space-y-1">
                    <div>• SD  → GPIO 32</div>
                    <div>• WS  → GPIO 25</div>
                    <div>• SCK → GPIO 33</div>
                    <div>• VDD → 3.3V, GND → GND</div>
                    <div>• L/R → GND (Left Chan)</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                  <div className="font-bold text-teal-400 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>MAX98357A I2S Amp</span>
                  </div>
                  <div className="text-slate-300 font-mono text-[11px] space-y-1">
                    <div>• DIN  → GPIO 22</div>
                    <div>• BCLK → GPIO 26</div>
                    <div>• LRC  → GPIO 27</div>
                    <div>• VIN  → 5V, GND → GND</div>
                    <div>• GAIN → Open (12dB)</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                  <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5" />
                    <span>16x2 LCD I2C Module</span>
                  </div>
                  <div className="text-slate-300 font-mono text-[11px] space-y-1">
                    <div>• SDA → GPIO 21</div>
                    <div>• SCL → GPIO 22 (or 19)</div>
                    <div>• VCC → 5V</div>
                    <div>• GND → GND</div>
                    <div>• I2C Address: 0x27</div>
                  </div>
                </div>
              </div>
            </div>

            {/* REST & Audio Endpoints */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                2. Real-Time Hardware Endpoints
              </h4>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2 text-slate-300">
                <div><span className="text-emerald-400">POST</span> /api/hardware/voice-query <span className="text-slate-500">- Send spoken text & receive MP3 audio + 16x2 LCD lines</span></div>
                <div><span className="text-blue-400">GET</span> /api/hardware/voice-audio?query=... <span className="text-slate-500">- Direct chunked stream to MAX98357A DAC</span></div>
                <div><span className="text-purple-400">POST</span> /api/hardware/heartbeat <span className="text-slate-500">- Periodic device ping + receive updated LCD strings</span></div>
                <div><span className="text-amber-400">GET</span> /api/hardware/lcd-state <span className="text-slate-500">- Current 16x2 character lines</span></div>
              </div>
            </div>

            {/* Arduino Firmware Sketch */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  3. Production Arduino C++ Firmware Snippet
                </h4>
                <button
                  onClick={copyArduinoCode}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {codeCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{codeCopied ? 'Copied!' : 'Copy Sketch'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300/90 overflow-x-auto max-h-48">
{`// REVIVE Box - ESP32 Smart Healthcare Node
#include <WiFi.h>
#include <HTTPClient.h>
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 16, 2);

void syncLcdWithServer() {
  HTTPClient http;
  http.begin("http://YOUR_SERVER:3000/api/hardware/heartbeat");
  http.addHeader("Content-Type", "application/json");
  // LCD automatically receives synchronized 16x2 characters
}`}
              </pre>
            </div>

            {/* Simulator Toggle Switch */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-white">Hardware Device Simulation</div>
                <div className="text-xs text-slate-400">Toggle simulated box online/offline state for testing</div>
              </div>
              <button
                onClick={handleToggleSimulator}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  deviceOnline
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'bg-rose-600 text-white hover:bg-rose-500'
                }`}
              >
                {deviceOnline ? 'Status: ONLINE (Click to Test Offline)' : 'Status: OFFLINE (Click to Reconnect)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
