import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  Thermometer,
  Gauge,
  Zap,
  RefreshCw,
  Radio,
  CheckCircle2,
  AlertCircle,
  Volume2,
  VolumeX,
  Play,
  Square,
  Terminal,
  Tv,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { IoTDevice, Language } from '../../types';
import { getTranslation } from '../../locales';

interface IoTMonitorProps {
  language: Language;
}

export const IoTMonitor: React.FC<IoTMonitorProps> = ({ language }) => {
  const t = getTranslation(language);
  const [devices, setDevices] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastPulse, setLastPulse] = useState<string>('Just now');

  // Voice Kiosk Hardware Interactive Testing State
  const [activeVoiceQuery, setActiveVoiceQuery] = useState('பாராசிட்டமால் மாத்திரை எங்கு கிடைக்கும்');
  const [selectedVoiceLang, setSelectedVoiceLang] = useState<'ta' | 'hi' | 'en'>('ta');
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hardwareResponse, setHardwareResponse] = useState<any>(null);
  const [activeAudioObj, setActiveAudioObj] = useState<HTMLAudioElement | null>(null);

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/iot/devices');
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch (e) {
      console.warn('IoT fetch error:', e);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleSimulatePulse = async (deviceCode: string) => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/iot/simulate-pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceCode,
          telemetry: {
            occupancy: Math.random() > 0.4,
            pressure: Math.round(55 + Math.random() * 35),
            heartRate: Math.round(72 + Math.random() * 18),
            spO2: Math.round(96 + Math.random() * 3)
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDevices(prev => prev.map(d => d.deviceCode === deviceCode ? data.device : d));
        setLastPulse(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.warn('Simulate pulse error:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  // Trigger Hardware Voice Query on REVIVE-VOICE-KIOSK01
  const handleTestHardwareVoice = async (queryText?: string, langOverride?: 'ta' | 'hi' | 'en') => {
    const q = queryText || activeVoiceQuery;
    const l = langOverride || selectedVoiceLang;
    if (!q.trim()) return;

    setIsTestingVoice(true);
    if (activeAudioObj) {
      activeAudioObj.pause();
      setActiveAudioObj(null);
      setIsPlayingAudio(false);
    }

    try {
      const res = await fetch('/api/hardware/voice-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          language: l,
          district: 'Coimbatore',
          deviceId: 'REVIVE-VOICE-KIOSK01',
          returnAudio: true
        })
      });

      if (res.ok) {
        const data = await res.json();
        setHardwareResponse(data);

        // Play the audio out directly through browser speaker to simulate kiosk DAC
        if (data.audioUrl) {
          const audio = new Audio(data.audioUrl);
          audio.onplay = () => setIsPlayingAudio(true);
          audio.onended = () => {
            setIsPlayingAudio(false);
            setActiveAudioObj(null);
          };
          audio.onerror = () => {
            setIsPlayingAudio(false);
            setActiveAudioObj(null);
          };
          setActiveAudioObj(audio);
          audio.play().catch(e => console.warn('Audio autoplay notice:', e));
        }

        // Refresh device telemetry in list
        fetchDevices();
      }
    } catch (e) {
      console.warn('Hardware voice query error:', e);
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleStopAudio = () => {
    if (activeAudioObj) {
      activeAudioObj.pause();
      setActiveAudioObj(null);
      setIsPlayingAudio(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="p-4 sm:p-5 bg-white/90 backdrop-blur-md rounded-3xl border border-[#CDD4DD]/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {t.iotDashboard}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              ESP32 / LoRaWAN Connected Bed Sensors & Oxygen Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
            <span>Telemetry Bus Live</span>
          </span>
        </div>
      </div>

      {/* IoT Hardware Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map((device) => {
          const isVoiceNode = device.deviceType === 'VOICE_ASSISTANT_NODE' || device.type === 'VOICE_ASSISTANT_NODE';
          const signal = device.signalStrength !== undefined ? device.signalStrength : (device.signalRssi || -55);
          const battery = device.batteryLevel !== undefined ? device.batteryLevel : (device.batteryPercentage || 100);
          const facility = device.facilityName || 'Rural Health Centre';
          const location = device.locationLabel || device.wardName || 'Field Node';
          const deviceLabel = device.deviceLabel || device.type || 'Telemetry Node';
          const lastSeenTime = device.lastSeen || device.lastPing || new Date().toISOString();

          if (isVoiceNode) {
            return (
              <div
                key={device.id}
                className="p-5 md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl border border-teal-500/40 shadow-xl space-y-5"
              >
                {/* Voice Kiosk Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-500/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-500/20 border border-teal-400/40 text-teal-300 rounded-2xl shadow-inner">
                      <Volume2 className="w-6 h-6 animate-pulse text-teal-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black bg-teal-400/20 text-teal-300 px-2.5 py-1 rounded-lg border border-teal-400/30">
                          {device.deviceCode}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          HARDWARE ONLINE
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          ESP32 / I2S DAC 24kHz
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-white mt-1.5 flex items-center gap-2">
                        <span>{deviceLabel}</span>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      </h3>
                      <p className="text-xs text-slate-300">{facility} • {location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Speaker Out</span>
                      <span className="font-bold text-teal-300">{isPlayingAudio ? 'PLAYING NOW' : 'READY (STANDBY)'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Signal</span>
                      <span className="font-bold text-emerald-400">{signal} dBm</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-semibold uppercase">Power</span>
                      <span className="font-bold text-emerald-400">{battery}% (AC/Batt)</span>
                    </div>
                  </div>
                </div>

                {/* Simulated 128x64 Hardware OLED Screen & Audio Player */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Left: 128x64 Monochrome OLED Display Preview */}
                  <div className="lg:col-span-5 bg-black p-4 rounded-2xl border-2 border-slate-700 shadow-2xl font-mono text-xs relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-cyan-900 pb-1.5 mb-2 text-[10px] text-cyan-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Tv className="w-3 h-3 text-cyan-400" />
                        <span>OLED SSD1306 (128x64)</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${hardwareResponse?.hardwareIndicators?.isEmergency ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                        <span>{hardwareResponse?.hardwareIndicators?.ledColor || 'LED: GREEN'}</span>
                      </span>
                    </div>

                    <div className="space-y-1 text-cyan-300 min-h-[90px] flex flex-col justify-center">
                      <div className="font-bold tracking-wider text-cyan-200">
                        {hardwareResponse?.hardwareDisplay?.line1 || '> REVIVE RURAL KIOSK'}
                      </div>
                      <div className="text-cyan-300">
                        {hardwareResponse?.hardwareDisplay?.line2 || '> VOICE SPEAKER READY'}
                      </div>
                      <div className="text-cyan-400 text-[11px]">
                        {hardwareResponse?.hardwareDisplay?.line3 || '> LANG: TA / HI / EN'}
                      </div>
                      <div className="text-amber-300 font-semibold text-[11px]">
                        {hardwareResponse?.hardwareDisplay?.line4 || '> ASK HARDWARE DOUBT'}
                      </div>
                    </div>

                    {/* Audio Waveform Effect */}
                    <div className="mt-3 pt-2 border-t border-cyan-950 flex items-center justify-between text-[10px] text-cyan-500">
                      <span>I2S AUDIO-OUT:</span>
                      <div className="flex items-center gap-1">
                        {[12, 24, 16, 32, 20, 28, 14, 22].map((h, idx) => (
                          <span
                            key={idx}
                            className={`w-1 bg-cyan-400 rounded-full transition-all ${
                              isPlayingAudio ? 'animate-pulse' : 'opacity-40'
                            }`}
                            style={{ height: isPlayingAudio ? `${h}px` : '6px' }}
                          />
                        ))}
                      </div>
                      <span className="font-bold">{isPlayingAudio ? 'ACTIVE' : 'IDLE'}</span>
                    </div>
                  </div>

                  {/* Right: Interactive Hardware Query Simulator */}
                  <div className="lg:col-span-7 bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                        <span>Ask Hardware Kiosk (Simulate Physical Mic & Audio-Out)</span>
                      </span>

                      {/* Language Selection */}
                      <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-700 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVoiceLang('ta');
                            setActiveVoiceQuery('பாராசிட்டமால் மாத்திரை எங்கு கிடைக்கும்');
                          }}
                          className={`px-2 py-0.5 rounded font-bold ${selectedVoiceLang === 'ta' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}
                        >
                          தமிழ் (TA)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVoiceLang('hi');
                            setActiveVoiceQuery('बुखार की दवा कहां मिलेगी');
                          }}
                          className={`px-2 py-0.5 rounded font-bold ${selectedVoiceLang === 'hi' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}
                        >
                          हिन्दी (HI)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVoiceLang('en');
                            setActiveVoiceQuery('Where is Paracetamol in stock');
                          }}
                          className={`px-2 py-0.5 rounded font-bold ${selectedVoiceLang === 'en' ? 'bg-teal-600 text-white' : 'text-slate-400'}`}
                        >
                          English (EN)
                        </button>
                      </div>
                    </div>

                    {/* Quick Query Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {selectedVoiceLang === 'ta' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveVoiceQuery('பாராசிட்டமால் மாத்திரை எங்கு கிடைக்கும்');
                              handleTestHardwareVoice('பாராசிட்டமால் மாத்திரை எங்கு கிடைக்கும்', 'ta');
                            }}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-teal-200 transition"
                          >
                            💊 பாராசிட்டமால்
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveVoiceQuery('அவசர ICU படுக்கை தேவை');
                              handleTestHardwareVoice('அவசர ICU படுக்கை தேவை', 'ta');
                            }}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-teal-200 transition"
                          >
                            🏥 ICU படுக்கை
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveVoiceQuery('O பாசிட்டிவ் இரத்தம் வேண்டும்');
                              handleTestHardwareVoice('O பாசிட்டிவ் இரத்தம் வேண்டும்', 'ta');
                            }}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-teal-200 transition"
                          >
                            🩸 O+ இரத்தம்
                          </button>
                        </>
                      )}

                      {selectedVoiceLang === 'hi' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveVoiceQuery('पैरासिटामोल दवा कहां उपलब्ध है');
                              handleTestHardwareVoice('पैरासिटामोल दवा कहां उपलब्ध है', 'hi');
                            }}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-teal-200 transition"
                          >
                            💊 पैरासिटामोल
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveVoiceQuery('आईसीयू बेड की स्थिति क्या है');
                              handleTestHardwareVoice('आईसीयू बेड की स्थिति क्या है', 'hi');
                            }}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-teal-200 transition"
                          >
                            🏥 आईसीयू बेड
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveVoiceQuery('ब्लड बैंक में खून चाहिए');
                              handleTestHardwareVoice('ब्लड बैंक में खून चाहिए', 'hi');
                            }}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-teal-200 transition"
                          >
                            🩸 ब्लड बैंक
                          </button>
                        </>
                      )}

                      {selectedVoiceLang === 'en' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveVoiceQuery('Where is Paracetamol in stock');
                              handleTestHardwareVoice('Where is Paracetamol in stock', 'en');
                            }}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-teal-200 transition"
                          >
                            💊 Paracetamol
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveVoiceQuery('Need emergency ICU hospital bed');
                              handleTestHardwareVoice('Need emergency ICU hospital bed', 'en');
                            }}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-teal-200 transition"
                          >
                            🏥 ICU Bed
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveVoiceQuery('O positive blood units available');
                              handleTestHardwareVoice('O positive blood units available', 'en');
                            }}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-teal-200 transition"
                          >
                            🩸 O+ Blood
                          </button>
                        </>
                      )}
                    </div>

                    {/* Custom Input & Action Button */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={activeVoiceQuery}
                        onChange={(e) => setActiveVoiceQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTestHardwareVoice()}
                        placeholder="Type or speak hardware query..."
                        className="flex-1 bg-slate-900/90 text-white text-xs px-3 py-2 rounded-xl border border-slate-600 focus:outline-none focus:border-teal-400 placeholder:text-slate-500"
                      />

                      <button
                        type="button"
                        onClick={() => handleTestHardwareVoice()}
                        disabled={isTestingVoice}
                        className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        {isTestingVoice ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        <span>Ask Hardware</span>
                      </button>

                      {isPlayingAudio && (
                        <button
                          type="button"
                          onClick={handleStopAudio}
                          className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1 transition"
                        >
                          <Square className="w-3.5 h-3.5" />
                          <span>Mute</span>
                        </button>
                      )}
                    </div>

                    {/* Spoken Response Preview */}
                    {hardwareResponse?.spokenText && (
                      <div className="p-2.5 bg-slate-900/90 rounded-xl border border-teal-500/30 text-xs space-y-1">
                        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block">
                          Humanized Spoken Output (Playing to Hardware Audio Out):
                        </span>
                        <p className="text-slate-200 leading-relaxed italic">
                          "{hardwareResponse.spokenText}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hardware API Developer Footnote */}
                <div className="pt-2 border-t border-teal-500/20 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Terminal className="w-3.5 h-3.5 text-teal-400" />
                    <span>ESP32 Audio Stream: </span>
                    <code className="text-teal-300 font-bold bg-black/40 px-1.5 py-0.5 rounded">
                      GET /api/hardware/voice-audio?query=...&lang=ta
                    </code>
                  </span>
                  <span>Neural 24kHz Mono MP3 • Direct I2S MAX98357A Support</span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={device.id}
              className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-indigo-300 transition"
            >
              {/* Device Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200">
                      {device.deviceCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      ONLINE
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mt-2">{facility}</h3>
                  <p className="text-xs text-slate-500">{location} • {deviceLabel}</p>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-400 block font-semibold">Signal RSSI</span>
                  <span className="font-bold text-slate-700">{signal} dBm</span>
                </div>
              </div>

              {/* Telemetry Metrics Display */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {device.telemetry?.occupancy !== undefined && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Bed Status</span>
                    <span className={`text-sm font-black ${device.telemetry.occupancy ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {device.telemetry.occupancy ? 'Occupied' : 'Vacant'}
                    </span>
                  </div>
                )}

                {device.telemetry?.pressure !== undefined && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Pressure Sensor</span>
                    <span className="text-sm font-black text-slate-800">
                      {device.telemetry.pressure} mmHg
                    </span>
                  </div>
                )}

                {device.telemetry?.heartRate && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Pulse Rate</span>
                    <span className="text-sm font-black text-indigo-700">
                      {device.telemetry.heartRate} bpm
                    </span>
                  </div>
                )}

                {device.telemetry?.temperature !== undefined && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Cold-Chain Temp</span>
                    <span className="text-sm font-black text-blue-700">
                      {device.telemetry.temperature} °C
                    </span>
                  </div>
                )}

                {device.telemetry?.flowRate !== undefined && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Oxygen Pipeline</span>
                    <span className="text-sm font-black text-emerald-700">
                      {device.telemetry.flowRate} L/min
                    </span>
                  </div>
                )}

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Battery Life</span>
                  <span className="text-sm font-black text-slate-700">
                    {battery}%
                  </span>
                </div>
              </div>

              {/* Action Button: Simulate Hardware Transmission */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  Last Sync: {new Date(lastSeenTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                <button
                  onClick={() => handleSimulatePulse(device.deviceCode)}
                  disabled={isSimulating}
                  className="px-4 py-2 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Simulate IoT Pulse</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
