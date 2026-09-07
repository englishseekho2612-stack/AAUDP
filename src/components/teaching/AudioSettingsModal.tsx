import React, { useState, useEffect } from 'react';
import {
  audioEngine,
  DEFAULT_ADVANCED_AUDIO_SETTINGS,
} from '../../services/teaching/audioEngine';
import {
  AudioDevice,
  AudioPreset,
  AdvancedAudioSettings,
} from '../../types/teaching';
import {
  Mic,
  Volume2,
  Sparkles,
  Sliders,
  Play,
  Square,
  RefreshCw,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Headphones,
  Check,
} from 'lucide-react';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceSelected?: (deviceId: string) => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  onClose,
  onDeviceSelected,
}) => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');
  const [preset, setPreset] = useState<AudioPreset>('clear_teaching');
  const [advanced, setAdvanced] = useState<AdvancedAudioSettings>(
    DEFAULT_ADVANCED_AUDIO_SETTINGS
  );
  const [micLevel, setMicLevel] = useState<number>(0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Mic test states
  const [isTestRecording, setIsTestRecording] = useState<boolean>(false);
  const [testAudioUrl, setTestAudioUrl] = useState<string | null>(null);
  const [isPlayingTest, setIsPlayingTest] = useState<boolean>(false);
  const [testPlayMode, setTestPlayMode] = useState<'original' | 'enhanced'>('enhanced');

  useEffect(() => {
    if (!isOpen) return;

    // Detect devices
    audioEngine.detectAudioDevices().then((devs) => {
      setDevices(devs);
      const state = audioEngine.getState();
      setActiveDeviceId(state.activeDeviceId || devs[0]?.deviceId || '');
      setPreset(state.preset);
      setAdvanced(state.advanced);
    });

    // Subscribe to real-time meter
    const unsubMeter = audioEngine.onMeterUpdate((lvl) => {
      setMicLevel(lvl);
    });

    // Subscribe to device change events
    const unsubDev = audioEngine.onDeviceChange((newDevs) => {
      setDevices(newDevs);
    });

    return () => {
      unsubMeter();
      unsubDev();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeviceChange = async (newDeviceId: string) => {
    setActiveDeviceId(newDeviceId);
    try {
      await audioEngine.startInputStream(newDeviceId);
      onDeviceSelected?.(newDeviceId);
    } catch (e) {
      console.warn('Failed to switch audio input device:', e);
    }
  };

  const handlePresetChange = (newPreset: AudioPreset) => {
    setPreset(newPreset);
    audioEngine.setPreset(newPreset);
    setAdvanced(audioEngine.getState().advanced);
  };

  const handleAutoEnhance = () => {
    const updated = audioEngine.autoEnhance();
    setPreset('clear_teaching');
    setAdvanced(updated);
  };

  const handleStartMicTest = () => {
    setIsTestRecording(true);
    setTestAudioUrl(null);
    audioEngine.startMicTestRecording();
  };

  const handleStopMicTest = async () => {
    setIsTestRecording(false);
    const url = await audioEngine.stopMicTestRecording();
    setTestAudioUrl(url);
  };

  const handlePlayTest = (mode: 'original' | 'enhanced') => {
    setTestPlayMode(mode);
    setIsPlayingTest(true);
    audioEngine.playTestSample(mode);
    setTimeout(() => {
      setIsPlayingTest(false);
    }, 4500);
  };

  const handleUpdateAdvancedSetting = (key: keyof AdvancedAudioSettings, value: any) => {
    const next = { ...advanced, [key]: value };
    setAdvanced(next);
    audioEngine.updateAdvancedSettings({ [key]: value });
  };

  return (
    <div
      id="audio-settings-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Microphone & Audio DSP Enhancement
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real hardware calibration, noise suppression & voice clarity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* SECTION 1: Hardware Device Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Microphone Input Device
            </label>
            <select
              id="select-audio-input-device"
              value={activeDeviceId}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Real-time Level Meter */}
          <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                Live Input Level
              </span>
              <span className="font-mono text-slate-500">
                {micLevel > 0.05 ? `${Math.round(micLevel * 100)}%` : 'No Signal / Muted'}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  micLevel > 0.8
                    ? 'bg-rose-500'
                    : micLevel > 0.5
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(3, micLevel * 100))}%` }}
              />
            </div>
          </div>

          {/* SECTION 2: MIC TEST & A/B COMPARISON (Sections 11 & 18) */}
          <div className="border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <Headphones className="w-4 h-4 text-indigo-500" />
                  Hardware Mic Test & A/B Comparison
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Record a 3-second sample to preview Original vs. Enhanced DSP
                </p>
              </div>

              {!isTestRecording ? (
                <button
                  id="btn-record-mic-test"
                  onClick={handleStartMicTest}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Record Test</span>
                </button>
              ) : (
                <button
                  id="btn-stop-mic-test"
                  onClick={handleStopMicTest}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs animate-pulse transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Test</span>
                </button>
              )}
            </div>

            {/* Test Sample Playback & A/B switch */}
            {testAudioUrl && (
              <div className="pt-2 border-t border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayTest('original')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                      testPlayMode === 'original' && isPlayingTest
                        ? 'bg-slate-700 text-white ring-2 ring-slate-400'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Play className="w-3 h-3" />
                    <span>Original (Raw)</span>
                  </button>

                  <button
                    onClick={() => handlePlayTest('enhanced')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      testPlayMode === 'enhanced' && isPlayingTest
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Enhanced (DSP)</span>
                  </button>
                </div>

                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Test Ready
                </span>
              </div>
            )}
          </div>

          {/* SECTION 3: AUDIO PRESETS (Section 19) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Enhancement Presets
              </label>
              <button
                id="btn-auto-enhance-audio"
                onClick={handleAutoEnhance}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Auto-Enhance</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'clear_teaching', name: 'Clear Teaching', desc: 'Noise cut + Speech clarity' },
                { id: 'studio', name: 'Studio Voice', desc: 'Broadcast warmth + Compression' },
                { id: 'natural', name: 'Natural', desc: 'Unfiltered microphone sound' },
                { id: 'custom', name: 'Custom', desc: 'Manual sliders & EQ' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id as AudioPreset)}
                  className={`p-3 rounded-2xl text-left border cursor-pointer transition-all ${
                    preset === p.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-950 dark:text-indigo-200'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{p.name}</span>
                    {preset === p.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block leading-tight">
                    {p.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 4: ADVANCED AUDIO CONTROLS (Section 20) */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                Advanced Audio DSP Controls
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="p-4 space-y-4 bg-white dark:bg-slate-900 text-xs">
                {/* Voice Clarity Boost (peaking filter) */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Voice Clarity Boost (Presence EQ)</span>
                    <span className="font-bold">+{advanced.voiceClarityBoostDb.toFixed(1)} dB</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="0.5"
                    value={advanced.voiceClarityBoostDb}
                    onChange={(e) =>
                      handleUpdateAdvancedSetting(
                        'voiceClarityBoostDb',
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* High Pass Rumble Cut (Fan/AC removal) */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Low Rumble / Fan Cut (High-Pass)</span>
                    <span className="font-bold">{advanced.highPassFilterHz} Hz</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="160"
                    step="5"
                    value={advanced.highPassFilterHz}
                    onChange={(e) =>
                      handleUpdateAdvancedSetting(
                        'highPassFilterHz',
                        parseInt(e.target.value, 10)
                      )
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Dynamics Compression Threshold */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Voice Leveling (Compression Threshold)</span>
                    <span className="font-bold">{advanced.compressionThresholdDb} dB</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="-10"
                    step="1"
                    value={advanced.compressionThresholdDb}
                    onChange={(e) =>
                      handleUpdateAdvancedSetting(
                        'compressionThresholdDb',
                        parseInt(e.target.value, 10)
                      )
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Output Gain */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Output Volume Gain</span>
                    <span className="font-bold">{(advanced.outputGain * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={advanced.outputGain}
                    onChange={(e) =>
                      handleUpdateAdvancedSetting(
                        'outputGain',
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Hardware flags */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={advanced.noiseSuppression}
                      onChange={(e) =>
                        handleUpdateAdvancedSetting('noiseSuppression', e.target.checked)
                      }
                      className="rounded accent-indigo-600"
                    />
                    <span>Noise Suppression</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={advanced.echoCancellation}
                      onChange={(e) =>
                        handleUpdateAdvancedSetting('echoCancellation', e.target.checked)
                      }
                      className="rounded accent-indigo-600"
                    />
                    <span>Echo Cancellation</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-end">
          <button
            id="btn-close-audio-settings"
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            Apply & Use Audio
          </button>
        </div>
      </div>
    </div>
  );
};
