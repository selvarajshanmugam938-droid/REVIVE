import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, X, Sparkles, AlertCircle, Bot, User as UserIcon, Phone, Navigation, Pill, Building2, Droplet, Cpu, Tv, Terminal, Radio } from 'lucide-react';
import { ReviveLogo } from './ReviveLogo';
import { Language, AssistantMessage } from '../../types';
import { getTranslation } from '../../locales';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  userDistrict: string;
  onSelectAction?: (action: string, payload?: any) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  language,
  onLanguageChange,
  userDistrict,
  onSelectAction
}) => {
  const t = getTranslation(language);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  
  // Hardware Kiosk & Speaker Out State
  const [showHardwareKiosk, setShowHardwareKiosk] = useState(false);
  const [hardwareOledLines, setHardwareOledLines] = useState<{
    line1: string;
    line2: string;
    line3: string;
    line4: string;
  }>({
    line1: 'REVIVE KIOSK-01',
    line2: 'SPEAKER READY',
    line3: '24kHz I2S DAC',
    line4: 'ASK ANY DOUBT...'
  });
  const [hardwareLed, setHardwareLed] = useState<'GREEN' | 'RED'>('GREEN');

  // Voice Persona & Male/Female Voice selection
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('revive_voice_gender') as 'male' | 'female') || 'male';
    }
    return 'male';
  });
  const [voiceSpeed, setVoiceSpeed] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('revive_voice_speed');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0.5 && val <= 2.5) return val;
      }
    }
    return 1.0;
  });
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const lastTranscriptRef = useRef<string>('');
  const isListeningRef = useRef<boolean>(false);
  const voiceSpeedRef = useRef<number>(voiceSpeed);
  const lastSpokenTextRef = useRef<string>('');
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Synchronization and anti-drift refs
  const speechSessionIdRef = useRef<number>(0);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const watchdogTimerRef = useRef<any>(null);
  const heartbeatTimerRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionDispatchedRef = useRef<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);

  // Keep voiceSpeedRef in sync with voiceSpeed state
  useEffect(() => {
    voiceSpeedRef.current = voiceSpeed;
  }, [voiceSpeed]);

  // Sync available browser voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      try {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          setAvailableVoices(v);
        }
      } catch (e) {}
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Keep isListeningRef in sync
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Clean up timers and in-flight operations on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (abortControllerRef.current) {
        try { abortControllerRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  // Initialize initial greeting when modal opens or language changes
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      let initialGreeting = '';
      if (language === 'ta') {
        initialGreeting = `வணக்கம்! நான் உங்கள் 'ரிவைவ்' மருத்துவ வழிகாட்டி. மருந்துகள், மருத்துவமனை படுக்கைகள், இரத்த வங்கி அல்லது அவசர உதவிகள் குறித்து நீங்கள் என்னிடம் கேட்கலாம்.`;
      } else if (language === 'hi') {
        initialGreeting = `नमस्ते! मैं आपका 'रिवाइव' स्वास्थ्य सहायक हूँ। आप मुझसे दवाओं की उपलब्धता, आईसीयू बेड, ब्लड बैंक या रेफरल के बारे में पूछ सकते हैं।`;
      } else {
        initialGreeting = `Hello! I am REVIVE, your healthcare navigation assistant. You can speak or type to check medicine stock, ICU hospital beds, blood units, or medical referrals.`;
      }

      setMessages([
        {
          id: `msg-init`,
          sender: 'assistant',
          text: initialGreeting,
          language,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [isOpen, language]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isListening, isLoading]);

  // Web Speech Recognition setup with Interim Results & single-dispatch guard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;

        const langMap: Record<Language, string> = {
          en: 'en-IN',
          ta: 'ta-IN',
          hi: 'hi-IN'
        };
        recognition.lang = langMap[language] || 'en-IN';

        recognition.onstart = () => {
          setIsListening(true);
          setSpeechError(null);
          lastTranscriptRef.current = '';
          sessionDispatchedRef.current = false;
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const currentWords = (finalTranscript || interimTranscript).trim();
          if (currentWords) {
            lastTranscriptRef.current = currentWords;
            setInputText(currentWords);

            // Reset existing silence timer
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
            }

            // If final result arrived from Web Speech, send immediately without duplicates
            if (finalTranscript.trim()) {
              if (!sessionDispatchedRef.current) {
                sessionDispatchedRef.current = true;
                const textToSend = finalTranscript.trim();
                lastTranscriptRef.current = '';
                try { recognition.stop(); } catch (e) {}
                setIsListening(false);
                handleSendMessage(textToSend);
              }
              return;
            }

            // Rapid 550ms silence auto-trigger for natural voice interaction
            silenceTimerRef.current = setTimeout(() => {
              if (!sessionDispatchedRef.current && lastTranscriptRef.current && lastTranscriptRef.current.trim().length > 1) {
                sessionDispatchedRef.current = true;
                const textToSend = lastTranscriptRef.current.trim();
                lastTranscriptRef.current = '';
                try { recognition.stop(); } catch (e) {}
                setIsListening(false);
                handleSendMessage(textToSend);
              }
            }, 550);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition notice:', event.error);
          setIsListening(false);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          if (event.error === 'not-allowed') {
            setSpeechError('Microphone permission denied. Please allow microphone in browser settings.');
          } else if (event.error === 'no-speech') {
            setSpeechError('No speech heard. Tap mic again or click a quick keyword below.');
            setTimeout(() => setSpeechError(null), 3000);
          } else if (event.error === 'aborted') {
            setSpeechError(null);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

          // If speech was captured and hasn't been sent yet, send it cleanly once
          if (!sessionDispatchedRef.current && lastTranscriptRef.current && lastTranscriptRef.current.trim().length > 1) {
            sessionDispatchedRef.current = true;
            const textToSend = lastTranscriptRef.current.trim();
            lastTranscriptRef.current = '';
            handleSendMessage(textToSend);
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [language]);

  // Synchronous Audio Engine Unlocker for mobile and desktop browser autoplay compliance
  const unlockAudioEngine = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioCtx();
        }
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
    } catch (e) {}
  };

  // Heartbeat helper to overcome Chromium's 15-second speech freeze bug
  const startHeartbeat = () => {
    stopHeartbeat();
    heartbeatTimerRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 4000);
  };

  const stopHeartbeat = () => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  };

  // Toggle Speech Recognition with Instant TTS Barge-In
  const toggleListening = () => {
    unlockAudioEngine();
    stopSpeaking();
    setSpeechError(null);

    if (!recognitionRef.current) {
      setSpeechError('Speech recognition is not supported in this browser. Please type your query or tap a quick keyword.');
      return;
    }

    if (isListening) {
      // User tapped mic button while listening to finish immediately
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      const pendingText = (lastTranscriptRef.current || inputText).trim();
      lastTranscriptRef.current = '';
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);

      if (!sessionDispatchedRef.current && pendingText) {
        sessionDispatchedRef.current = true;
        handleSendMessage(pendingText);
      }
    } else {
      lastTranscriptRef.current = '';
      setInputText('');
      sessionDispatchedRef.current = false;
      setTimeout(() => {
        try {
          const langMap: Record<Language, string> = {
            en: 'en-IN',
            ta: 'ta-IN',
            hi: 'hi-IN'
          };
          recognitionRef.current.lang = langMap[language] || 'en-IN';
          recognitionRef.current.start();
        } catch (err: any) {
          console.warn('Speech start notice:', err);
          try {
            recognitionRef.current.stop();
            setTimeout(() => {
              try { recognitionRef.current.start(); } catch (e) {}
            }, 80);
          } catch (e) {}
        }
      }, 50);
    }
  };

  // Stop speaking immediately across all audio engines: Web Audio, HTML5 Audio, and SpeechSynthesis
  const stopSpeaking = () => {
    // 1. Invalidate any in-flight async operations
    speechSessionIdRef.current += 1;

    // 2. Clear watchdogs and heartbeats
    stopHeartbeat();
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }

    // 3. Abort active network requests
    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort(); } catch (e) {}
      abortControllerRef.current = null;
    }

    // 4. Stop and disconnect Web Audio Source
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.onended = null;
        activeSourceRef.current.stop(0);
        activeSourceRef.current.disconnect();
      } catch (e) {}
      activeSourceRef.current = null;
    }

    // 5. Pause and release HTML5 Audio
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.onplay = null;
        currentAudioRef.current.onended = null;
        currentAudioRef.current.onerror = null;
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current.src = '';
      } catch (e) {}
      currentAudioRef.current = null;
    }

    // 6. Cancel and resume SpeechSynthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        if (activeUtteranceRef.current) {
          activeUtteranceRef.current.onstart = null;
          activeUtteranceRef.current.onend = null;
          activeUtteranceRef.current.onerror = null;
        }
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {}
    }
    activeUtteranceRef.current = null;

    // 7. Reset UI speaking state
    setIsSpeaking(false);
  };

  // Clean up any ongoing audio when unmounting
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try { audioContextRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  // Switch voice gender & persist preference
  const handleVoiceGenderChange = (newGender: 'male' | 'female') => {
    unlockAudioEngine();
    setVoiceGender(newGender);
    if (typeof window !== 'undefined') {
      localStorage.setItem('revive_voice_gender', newGender);
    }
    testVoice(newGender, voiceSpeedRef.current);
  };

  // Switch voice playback speed & persist preference with immediate audio preview
  const handleVoiceSpeedChange = (newSpeed: number) => {
    unlockAudioEngine();
    setVoiceSpeed(newSpeed);
    voiceSpeedRef.current = newSpeed;
    if (typeof window !== 'undefined') {
      localStorage.setItem('revive_voice_speed', String(newSpeed));
    }

    // If assistant was already speaking, replay the text immediately at the new speed!
    if (isSpeaking && lastSpokenTextRef.current) {
      speakText(lastSpokenTextRef.current, voiceGender, newSpeed);
    } else {
      // Immediate audio confirmation clip at the exact new speed
      let sampleText = '';
      if (language === 'ta') {
        sampleText = `குரல் வேகம் ${newSpeed}x ஆக மாற்றப்பட்டது.`;
      } else if (language === 'hi') {
        sampleText = `बोलने की गति ${newSpeed}x सेट की गई।`;
      } else {
        sampleText = `Voice speed set to ${newSpeed}x.`;
      }
      speakText(sampleText, voiceGender, newSpeed);
    }
  };

  // Immediate Audio Sample Test for selected voice and speed
  const testVoice = (genderToTest: 'male' | 'female', speedToTest?: number) => {
    unlockAudioEngine();
    const currentSpd = speedToTest !== undefined ? speedToTest : voiceSpeedRef.current;
    let sampleText = '';
    if (language === 'ta') {
      sampleText = genderToTest === 'male'
        ? `வணக்கம்! நான் உங்கள் ரிவைவ் ஆண் மருத்துவர் வழிகாட்டி. வேகம் ${currentSpd}x. நான் உங்களுக்கு எவ்வாறு உதவ வேண்டும்?`
        : `வணக்கம்! நான் உங்கள் ரிவைவ் பெண் மருத்துவ வழிகாட்டி. வேகம் ${currentSpd}x. நான் உங்களுக்கு எவ்வாறு உதவ வேண்டும்?`;
    } else if (language === 'hi') {
      sampleText = genderToTest === 'male'
        ? `नमस्ते! मैं आपका रिवाइव पुरुष डॉक्टर सहायक हूँ। गति ${currentSpd}x। मैं आपकी क्या सहायता कर सकता हूँ?`
        : `नमस्ते! मैं आपकी रिवाइव महिला स्वास्थ्य सहायिका हूँ। गति ${currentSpd}x। मैं आपकी क्या सहायता कर सकती हूँ?`;
    } else {
      sampleText = genderToTest === 'male'
        ? `Hello! This is REVIVE male doctor assistant at ${currentSpd}x speed. How may I help you?`
        : `Hello! This is REVIVE female care assistant at ${currentSpd}x speed. How may I help you?`;
    }
    speakText(sampleText, genderToTest, currentSpd);
  };

  // Fallback to browser SpeechSynthesis with persistent Utterance reference (anti-GC)
  const speakWithBrowserSpeechSynthesis = (
    cleanText: string,
    activeGender: 'male' | 'female',
    activeSpeed: number,
    speechId: number
  ) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSpeaking(false);
      return;
    }

    if (speechSessionIdRef.current !== speechId) {
      return;
    }

    try {
      if (activeUtteranceRef.current) {
        activeUtteranceRef.current.onstart = null;
        activeUtteranceRef.current.onend = null;
        activeUtteranceRef.current.onerror = null;
        activeUtteranceRef.current = null;
      }
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      // Keep persistent ref in activeUtteranceRef to prevent Chromium from garbage collecting utterance mid-speech!
      activeUtteranceRef.current = utterance;

      const langMap: Record<Language, string> = {
        en: 'en-IN',
        ta: 'ta-IN',
        hi: 'hi-IN'
      };
      const targetLang = langMap[language] || 'en-IN';
      utterance.lang = targetLang;

      const allVoices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
      const langPrefix = targetLang.split('-')[0].toLowerCase();

      const matchedLangVoices = allVoices.filter(v => {
        const vLang = (v.lang || '').toLowerCase().replace('_', '-');
        return (
          vLang.startsWith(langPrefix) ||
          (langPrefix === 'ta' && (v.name.toLowerCase().includes('tamil') || v.name.includes('தமிழ்'))) ||
          (langPrefix === 'hi' && (v.name.toLowerCase().includes('hindi') || v.name.includes('हिन्दी')))
        );
      });

      const femaleKeywords = [
        'female', 'zira', 'heera', 'priya', 'kalpana', 'swara', 'veena',
        'susan', 'catherine', 'hazel', 'karen', 'woman', 'girl'
      ];
      const maleKeywords = [
        'male', 'ravi', 'david', 'george', 'guy', 'prabhat', 'valluvar', 'madhav',
        'mark', 'james', 'richard', 'daniel', 'kumar', 'suresh', 'alex', 'fred',
        'deep', 'man', 'boy'
      ];

      let chosenVoice: SpeechSynthesisVoice | undefined;

      if (activeGender === 'female') {
        chosenVoice = matchedLangVoices.find(v => {
          const lower = v.name.toLowerCase();
          return femaleKeywords.some(kw => lower.includes(kw));
        });
        if (!chosenVoice && matchedLangVoices.length > 0) {
          chosenVoice = matchedLangVoices[0];
        }
        utterance.pitch = 1.25;
      } else {
        chosenVoice = matchedLangVoices.find(v => {
          const lower = v.name.toLowerCase();
          return maleKeywords.some(kw => lower.includes(kw)) && !femaleKeywords.some(kw => lower.includes(kw));
        });
        if (!chosenVoice && matchedLangVoices.length > 0) {
          chosenVoice = matchedLangVoices[0];
        }
        utterance.pitch = 0.85;
      }

      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      const rate = Math.max(0.5, Math.min(2.0, Number(activeSpeed) || 1.0));
      utterance.rate = rate;

      const finishSpeech = () => {
        if (speechSessionIdRef.current === speechId) {
          stopHeartbeat();
          if (watchdogTimerRef.current) {
            clearTimeout(watchdogTimerRef.current);
            watchdogTimerRef.current = null;
          }
          activeUtteranceRef.current = null;
          setIsSpeaking(false);
        }
      };

      utterance.onstart = () => {
        if (speechSessionIdRef.current === speechId) {
          setIsSpeaking(true);
          startHeartbeat();
        }
      };

      utterance.onend = () => {
        finishSpeech();
      };

      utterance.onerror = (evt) => {
        finishSpeech();
      };

      // Watchdog safety timer: Guarantees UI returns to idle even if browser drops onend
      const expectedDurationMs = Math.max(3000, Math.ceil((cleanText.length / (10 * rate)) * 1000) + 3000);
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = setTimeout(() => {
        if (speechSessionIdRef.current === speechId) {
          console.warn('[REVIVE Voice] Watchdog safety timeout: resetting speaking state');
          finishSpeech();
        }
      }, expectedDurationMs);

      setTimeout(() => {
        if (speechSessionIdRef.current === speechId) {
          try {
            window.speechSynthesis.speak(utterance);
          } catch (err) {
            finishSpeech();
          }
        }
      }, 50);
    } catch (e) {
      if (speechSessionIdRef.current === speechId) {
        setIsSpeaking(false);
      }
    }
  };

  // High-Fidelity Audio + Gender & Speed Synthesizer
  const speakText = async (text: string, overrideGender?: 'male' | 'female', overrideSpeed?: number) => {
    if (!ttsEnabled || typeof window === 'undefined') return;

    const cleanText = text
      .replace(/[*_~`#]/g, '')
      .replace(/\((.*?)\)/g, '$1')
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleanText) return;

    // 1. Immediately cancel any prior audio playback
    stopSpeaking();

    // 2. Capture fresh speech session ID
    const currentSpeechId = speechSessionIdRef.current;
    lastSpokenTextRef.current = text;
    setIsSpeaking(true);

    const activeGender = overrideGender || voiceGender;
    const activeSpeed = overrideSpeed !== undefined ? overrideSpeed : voiceSpeedRef.current;
    const langCode = language === 'ta' ? 'ta' : language === 'hi' ? 'hi' : 'en';

    // 3. Create fresh AbortController for network fetch
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // 1. Primary Neural TTS via server (/api/tts)
      const ttsUrl = `/api/tts?text=${encodeURIComponent(cleanText)}&lang=${langCode}`;
      const response = await fetch(ttsUrl, { signal: abortController.signal });

      if (speechSessionIdRef.current !== currentSpeechId) return;

      if (!response.ok) {
        throw new Error(`TTS server responded with status ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      if (speechSessionIdRef.current !== currentSpeechId) return;

      // Use Web Audio API for precise male/female vocal formants and speed
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioCtx();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          try {
            await ctx.resume();
          } catch (e) {}
        }

        if (speechSessionIdRef.current !== currentSpeechId) return;

        if (ctx.state === 'suspended') {
          throw new Error('AudioContext blocked by autoplay policy');
        }

        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        if (speechSessionIdRef.current !== currentSpeechId) return;

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        const rate = Math.max(0.5, Math.min(2.5, Number(activeSpeed) || 1.0));
        source.playbackRate.value = rate;

        if (activeGender === 'male') {
          // Male Doctor Voice: Lower pitch into baritone register + chest warmth EQ
          source.detune.value = -360;
          const lowFilter = ctx.createBiquadFilter();
          lowFilter.type = 'lowshelf';
          lowFilter.frequency.value = 240;
          lowFilter.gain.value = 5;
          source.connect(lowFilter);
          lowFilter.connect(ctx.destination);
        } else {
          // Female Voice: Crisp, caring female healthcare assistant timbre
          source.detune.value = 40;
          const clarityFilter = ctx.createBiquadFilter();
          clarityFilter.type = 'peaking';
          clarityFilter.frequency.value = 2800;
          clarityFilter.gain.value = 2;
          source.connect(clarityFilter);
          clarityFilter.connect(ctx.destination);
        }

        source.onended = () => {
          if (speechSessionIdRef.current === currentSpeechId) {
            if (watchdogTimerRef.current) {
              clearTimeout(watchdogTimerRef.current);
              watchdogTimerRef.current = null;
            }
            setIsSpeaking(false);
            activeSourceRef.current = null;
          }
        };

        activeSourceRef.current = source;
        source.start(0);

        // Web Audio safety watchdog
        const durationMs = Math.ceil(((audioBuffer.duration || 5) / rate) * 1000) + 2000;
        if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = setTimeout(() => {
          if (speechSessionIdRef.current === currentSpeechId) {
            stopSpeaking();
          }
        }, durationMs);

        return;
      }

      // If Web Audio API not supported, fall back to HTML5 Audio element
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const blobUrl = URL.createObjectURL(blob);
      const audio = new Audio(blobUrl);
      audio.playbackRate = Math.max(0.5, Math.min(2.5, Number(activeSpeed) || 1.0));
      audio.onended = () => {
        if (speechSessionIdRef.current === currentSpeechId) {
          setIsSpeaking(false);
          currentAudioRef.current = null;
        }
        URL.revokeObjectURL(blobUrl);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        if (speechSessionIdRef.current === currentSpeechId) {
          speakWithBrowserSpeechSynthesis(cleanText, activeGender, activeSpeed, currentSpeechId);
        }
      };
      currentAudioRef.current = audio;
      await audio.play();
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (speechSessionIdRef.current === currentSpeechId) {
        speakWithBrowserSpeechSynthesis(cleanText, activeGender, activeSpeed, currentSpeechId);
      }
    }
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText !== undefined ? queryText : inputText).trim();
    if (!textToSend) return;

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // 1. Immediately cancel any prior speech playback when a new query is asked
    stopSpeaking();

    // 2. Unlock browser audio engine within the click/submit user gesture context
    unlockAudioEngine();

    const userMsg: AssistantMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      language,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          language,
          district: userDistrict
        })
      });

      if (!response.ok) throw new Error('Query failed');
      const data = await response.json();

      const assistantMsg: AssistantMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: data.reply,
        language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        referencedData: data.referencedData
      };

      setMessages(prev => [...prev, assistantMsg]);
      const textToSpeak = data.spokenText || data.reply;
      speakText(textToSpeak);

      // Update simulated hardware OLED lines & LED state if provided
      if (data.hardwareDisplay) {
        setHardwareOledLines(data.hardwareDisplay);
      }
      if (data.hardwareIndicators) {
        setHardwareLed(data.hardwareIndicators.isEmergency ? 'RED' : 'GREEN');
      }
    } catch (err) {
      const fallbackMsg: AssistantMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: language === 'ta'
          ? 'மன்னிக்கவும், தகவல் பெறுவதில் சிறிய தாமதம். அவசர உதவிக்கு 108 அழைக்கவும்.'
          : language === 'hi'
          ? 'क्षमा करें, जानकारी प्राप्त करने में असमर्थ। आपातकालीन सहायता के लिए 108 डायल करें।'
          : 'Could not connect to the healthcare database. For urgent help, please call 108.',
        language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl h-[92vh] max-h-[720px] bg-[#FEF7F8]/95 dark:bg-[#0D1921]/95 backdrop-blur-2xl rounded-3xl border border-white/70 dark:border-teal-500/20 shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
      >
        {/* Assistant Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#22819A] to-[#1a667b] text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <ReviveLogo size="sm" showTagline={false} isDark={true} />
            <div>
              <div className="flex items-center gap-2">
                <h2 id="assistant-title" className="font-bold text-base sm:text-lg">
                  {t.askReviveTitle}
                </h2>
                {onLanguageChange ? (
                  <div className="flex items-center gap-1 bg-white/20 rounded-full p-0.5">
                    {(['en', 'ta', 'hi'] as Language[]).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => {
                          stopSpeaking();
                          onLanguageChange(lang);
                        }}
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                          language === lang
                            ? 'bg-white text-[#22819A] shadow-xs'
                            : 'text-white/80 hover:text-white'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-[#FEF7F8]">
                    {language.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-[#90C2E7] font-medium line-clamp-1">
                {t.askReviveSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Hardware Kiosk Mode Toggle */}
            <button
              onClick={() => setShowHardwareKiosk(!showHardwareKiosk)}
              className={`px-3 py-1.5 rounded-xl transition text-xs font-bold flex items-center gap-1.5 min-h-[44px] ${
                showHardwareKiosk
                  ? 'bg-cyan-400 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Toggle Hardware Kiosk OLED & Audio-Out Simulation"
              aria-label="Hardware Kiosk Mode"
            >
              <Cpu className="w-4 h-4" />
              <span className="hidden sm:inline">Hardware Kiosk</span>
              <span className={`w-2 h-2 rounded-full ${showHardwareKiosk ? 'bg-emerald-600 animate-ping' : 'bg-emerald-400'}`} />
            </button>

            <button
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                }
                setTtsEnabled(!ttsEnabled);
              }}
              className={`p-2 rounded-xl transition min-h-[44px] min-w-[44px] flex items-center justify-center ${
                ttsEnabled ? 'bg-white/20 text-white' : 'bg-black/20 text-white/50'
              }`}
              title={ttsEnabled ? 'Mute Voice' : 'Enable Voice Audio'}
              aria-label="Toggle voice output"
            >
              {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            <button
              onClick={() => {
                stopSpeaking();
                if (recognitionRef.current) {
                  try { recognitionRef.current.stop(); } catch(e){}
                }
                onClose();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voice Persona & Gender Selector Bar (Male & Female Voice Options) */}
        <div className="px-3 sm:px-4 py-2 bg-slate-100/95 dark:bg-slate-800/95 border-b border-slate-200/80 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
              Voice:
            </span>

            {/* Male vs Female Voice Switcher */}
            <div className="inline-flex rounded-xl p-0.5 bg-slate-200/90 dark:bg-slate-900/80 border border-slate-300/70 dark:border-slate-700 shadow-2xs">
              {/* Male Doctor Voice */}
              <button
                type="button"
                onClick={() => handleVoiceGenderChange('male')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  voiceGender === 'male'
                    ? 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] text-white shadow-xs scale-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-white/40'
                }`}
                title="Select Male Voice (Doctor Persona)"
              >
                <span>👨‍⚕️</span>
                <span>{t.voiceMale || 'Male Voice'}</span>
                {voiceGender === 'male' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-200 animate-pulse" />
                )}
              </button>

              {/* Female Nurse Voice */}
              <button
                type="button"
                onClick={() => handleVoiceGenderChange('female')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  voiceGender === 'female'
                    ? 'bg-gradient-to-r from-[#22819A] to-[#14b8a6] text-white shadow-xs scale-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 hover:bg-white/40'
                }`}
                title="Select Female Voice (Care Guide Persona)"
              >
                <span>👩‍⚕️</span>
                <span>{t.voiceFemale || 'Female Voice'}</span>
                {voiceGender === 'female' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-200 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Voice Speed Quick Pill Buttons & Dropdown */}
            <div className="flex items-center gap-1 bg-slate-200/90 dark:bg-slate-900/80 p-0.5 rounded-xl border border-slate-300/70 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold px-1.5 uppercase">
                {t.voiceSpeed || 'Speed'}:
              </span>

              {/* Quick speed selector pills */}
              {[0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => {
                const isActive = Math.abs(voiceSpeed - spd) < 0.05;
                return (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => handleVoiceSpeedChange(spd)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                      isActive
                        ? 'bg-[#0ea5e9] text-white shadow-xs scale-105'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-white/50 dark:hover:bg-slate-800'
                    }`}
                    title={`Set voice speed to ${spd}x`}
                  >
                    {spd}x
                  </button>
                );
              })}

              {/* Full Speed Dropdown for Custom Options */}
              <select
                value={voiceSpeed}
                onChange={(e) => handleVoiceSpeedChange(parseFloat(e.target.value))}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg px-1.5 py-0.5 text-[10px] focus:outline-none cursor-pointer"
                aria-label="Voice playback speed custom selection"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1.0">1.0x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="1.75">1.75x</option>
                <option value="2.0">2.0x</option>
              </select>
            </div>

            {/* Quick Test Audio Button */}
            <button
              type="button"
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                } else {
                  testVoice(voiceGender, voiceSpeed);
                }
              }}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-2xs flex items-center gap-1.5 transition active:scale-95"
              title={isSpeaking ? 'Stop playback' : `Test ${voiceGender} voice at ${voiceSpeed}x speed`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-rose-600 dark:text-rose-400">Stop Speaking</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#0ea5e9]" />
                  <span>{t.voiceTest || 'Test Voice'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Waveform & Speaking/Listening Indicator Banner */}
        {(isListening || isSpeaking || isLoading) && (
          <div className="py-2.5 px-4 bg-[#90C2E7]/20 border-b border-[#90C2E7]/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {/* Animated Audio Waveform */}
              <div className="flex items-center gap-1 h-5">
                <span className="w-1 bg-[#22819A] rounded-full animate-[bounce_0.6s_infinite_100ms] h-3" />
                <span className="w-1 bg-[#22819A] rounded-full animate-[bounce_0.6s_infinite_200ms] h-5" />
                <span className="w-1 bg-[#22819A] rounded-full animate-[bounce_0.6s_infinite_300ms] h-4" />
                <span className="w-1 bg-[#22819A] rounded-full animate-[bounce_0.6s_infinite_150ms] h-5" />
                <span className="w-1 bg-[#22819A] rounded-full animate-[bounce_0.6s_infinite_250ms] h-2" />
              </div>

              <span className="text-xs font-bold text-[#22819A]">
                {isListening && t.voiceListening}
                {isLoading && t.voiceProcessing}
                {isSpeaking && t.voiceSpeaking}
              </span>
            </div>

            {/* Instant Barge-In / Interrupt Button */}
            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 text-[11px] font-bold rounded-xl border border-rose-200 shadow-xs flex items-center gap-1.5 transition active:scale-95"
                title="Interrupt assistant"
              >
                <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                <span>Stop Speaking</span>
              </button>
            )}
          </div>
        )}

        {/* Speech Error Banner if any */}
        {speechError && (
          <div className="p-2.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="flex-1">{speechError}</span>
            <button onClick={() => setSpeechError(null)} className="text-amber-900 font-bold px-1.5 py-0.5">✕</button>
          </div>
        )}

        {/* Hardware Kiosk Mode Live OLED Display & I2S Speaker Panel */}
        {showHardwareKiosk && (
          <div className="p-3 bg-slate-900 text-white border-b border-teal-500/30 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 font-mono">
                <span className="p-1 bg-teal-500/20 text-teal-400 rounded-md">
                  <Tv className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold text-teal-300">REVIVE-VOICE-KIOSK01 (ESP32/RPi I2S DAC)</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ONLINE
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${hardwareLed === 'RED' ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                  <span>LED: {hardwareLed}</span>
                </span>
                <span>•</span>
                <span>DAC: 24kHz MONO</span>
                <span>•</span>
                <span className={isSpeaking ? 'text-teal-300 font-bold' : 'text-slate-500'}>
                  SPEAKER: {isSpeaking ? 'AUDIO PLAYING' : 'STANDBY'}
                </span>
              </div>
            </div>

            {/* Simulated 128x64 OLED Display Screen */}
            <div className="bg-black p-3 rounded-xl border border-cyan-900/60 font-mono text-xs shadow-inner flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5 text-cyan-300">
                <div className="text-cyan-200 font-bold">{hardwareOledLines.line1}</div>
                <div className="text-cyan-300">{hardwareOledLines.line2}</div>
                <div className="text-cyan-400 text-[11px]">{hardwareOledLines.line3}</div>
                <div className="text-amber-300 font-semibold text-[11px]">{hardwareOledLines.line4}</div>
              </div>

              {/* Speaker Audio Waveform */}
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-cyan-950">
                <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-cyan-300 animate-pulse' : 'text-slate-600'}`} />
                <div className="flex items-center gap-1 h-5">
                  {[10, 20, 14, 26, 18, 22, 12, 16].map((h, idx) => (
                    <span
                      key={idx}
                      className={`w-1 bg-cyan-400 rounded-full transition-all ${
                        isSpeaking ? 'animate-pulse' : 'opacity-30'
                      }`}
                      style={{ height: isSpeaking ? `${h}px` : '4px' }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-cyan-400 font-mono">
                  {isSpeaking ? 'AUDIO OUT' : 'MUTED'}
                </span>
              </div>
            </div>

            {/* Quick Test Doubt Buttons on Hardware Kiosk */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Hardware Doubts:</span>
              <button
                type="button"
                onClick={() => handleSendMessage('பாராசிட்டமால் மாத்திரை எங்கு கிடைக்கும்')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-[11px] border border-slate-700 transition"
              >
                💊 பாராசிட்டமால் (TA)
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('बुखार की दवा कहां मिलेगी')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-[11px] border border-slate-700 transition"
              >
                💊 बुखार दवा (HI)
              </button>
              <button
                type="button"
                onClick={() => handleSendMessage('Emergency ICU bed available')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-[11px] border border-slate-700 transition"
              >
                🏥 ICU Bed (EN)
              </button>
            </div>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-2xl bg-[#22819A] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 sm:p-4 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-[#22819A] text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line font-medium">{msg.text}</p>

                  {/* Referenced Data Visual Card if any */}
                  {msg.referencedData?.items && msg.referencedData.items.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      {Array.from(
                        new Map(
                          msg.referencedData.items.map((item: any) => [
                            item.pharmacyName || item.name || item.bloodBankName || item.id,
                            item
                          ])
                        ).values()
                      ).slice(0, 2).map((item: any, idx: number) => {
                        const isMed = msg.referencedData.type === 'medicines';
                        const isBed = msg.referencedData.type === 'beds';
                        const isBlood = msg.referencedData.type === 'blood';

                        const title = isMed
                          ? item.medicineName
                          : isBed
                          ? item.name
                          : `${item.bloodGroup || 'O+'} Blood (${item.unitsAvailable || 0} Units)`;

                        const subtitle = isMed
                          ? item.pharmacyName
                          : isBed
                          ? `${item.district || userDistrict} District`
                          : item.bloodBankName;

                        const phone = item.pharmacyPhone || item.emergencyPhone || item.phone || item.emergencyContact;
                        const lat = item.pharmacyLat || item.lat;
                        const lng = item.pharmacyLng || item.lng;

                        return (
                          <div
                            key={idx}
                            className="p-2.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex flex-col gap-1.5 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {isMed && <Pill className="w-3.5 h-3.5 text-[#22819A] shrink-0" />}
                                  {isBed && <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                  {isBlood && <Droplet className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate text-[13px]">
                                    {title}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  {subtitle}
                                </p>
                              </div>
                              {item.distanceKm !== undefined && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#22819A]/10 text-[#22819A] shrink-0">
                                  {item.distanceKm} km
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px]">
                              <span className="font-medium text-slate-600 dark:text-slate-300">
                                {isMed && (item.stockQuantity ? `Stock: ${item.stockQuantity} units` : 'In Stock')}
                                {isBed && (item.beds ? `${item.beds.find((b: any) => b.category === 'ICU')?.availableBeds || item.beds[0]?.availableBeds || 0} ICU/Beds Ready` : 'Beds Ready')}
                                {isBlood && (item.is24x7 ? '24x7 Bank' : 'Verified Inventory')}
                              </span>

                              <div className="flex items-center gap-1.5">
                                {phone && (
                                  <a
                                    href={`tel:${phone}`}
                                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>Call</span>
                                  </a>
                                )}
                                {lat && lng && (
                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold text-[10px] flex items-center gap-1 transition"
                                  >
                                    <Navigation className="w-3 h-3" />
                                    <span>Nav</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className={`text-[10px] mt-1.5 flex items-center justify-end gap-1 ${isUser ? 'text-teal-100' : 'text-slate-400'}`}>
                    <span>{msg.timestamp}</span>
                    {!isUser && ttsEnabled && (
                      <button
                        onClick={() => speakText(msg.text)}
                        className="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#0ea5e9] transition flex items-center gap-1 font-semibold text-[10px]"
                        title={voiceGender === 'male' ? 'Replay with Male Doctor Voice' : 'Replay with Female Voice'}
                        aria-label="Replay audio"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{voiceGender === 'male' ? '👨‍⚕️' : '👩‍⚕️'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-2xl bg-[#90C2E7] text-[#22819A] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-8 h-8 rounded-2xl bg-[#22819A] text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#22819A] animate-spin" />
                <span>{t.voiceProcessing}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Rural Keywords & Prompts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#22819A] shrink-0 bg-[#90C2E7]/30 px-2 py-1 rounded-md">
            {language === 'ta' ? 'விரைவு சொல்' : language === 'hi' ? 'त्वरित शब्द' : 'Quick Word'}:
          </span>
          {(
            language === 'ta'
              ? ['பாராசிட்டமால்', 'டோலோ 650', 'ICU படுக்கை', 'O+ இரத்தம்', 'பாம்பு கடி மருந்து', '108 ஆம்புலன்ஸ்']
              : language === 'hi'
              ? ['पैरासिटामोल', 'डोलो 650', 'आईसीयू बेड', 'O+ रक्त', 'एंटीवेनम', '108 एम्बुलेंस']
              : ['Paracetamol', 'Dolo 650', 'ICU Bed', 'O+ Blood', 'Snake Antivenom', 'ORS', '108 Ambulance']
          ).map((kw, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(kw)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-[#22819A] hover:text-white text-slate-800 text-xs font-semibold whitespace-nowrap border border-slate-200 shadow-2xs transition active:scale-95 shrink-0"
            >
              {kw}
            </button>
          ))}
        </div>

        {/* Input Bar with Prominent Microphone */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Prominent Rural Voice Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-2xl min-h-[50px] min-w-[50px] flex items-center justify-center transition-all duration-200 shadow-md ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse scale-105 shadow-red-500/30'
                  : 'bg-[#22819A] hover:bg-[#1a667b] text-white'
              }`}
              title={isListening ? (language === 'ta' ? 'பேசி முடித்ததும் தட்டவும் (உடனே அனுப்ப)' : language === 'hi' ? 'बोलने के बाद तुरंत भेजने के लिए टैप करें' : 'Tap to Send Immediately') : 'Speak to REVIVE'}
              aria-label={isListening ? 'Tap to Send' : 'Speak to REVIVE'}
            >
              {isListening ? <Send className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Text Input with Real-time Speech Transcription display */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? (language === 'ta' ? 'கேட்கிறது... பேசுங்கள்...' : language === 'hi' ? 'सुन रहा हूँ... बोलिए...' : 'Listening... Speak your question...') : t.typeYourQuestion}
              className={`flex-1 border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition min-h-[48px] ${
                isListening
                  ? 'bg-rose-50/50 border-rose-300 text-rose-950 focus:ring-rose-400 placeholder:text-rose-400 font-medium'
                  : 'bg-slate-100 border-slate-200 focus:border-[#22819A] focus:bg-white text-slate-900 focus:ring-[#90C2E7]'
              }`}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-3 min-h-[50px] min-w-[50px] rounded-2xl bg-[#90C2E7] hover:bg-[#7db4db] disabled:opacity-50 text-[#22819A] font-bold flex items-center justify-center shadow transition active:scale-95"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          {/* Accessibility Safety Subtext */}
          <p className="text-[10px] text-slate-400 text-center mt-2 leading-tight">
            {t.safetyWarning}
          </p>
        </div>
      </div>
    </div>
  );
};
