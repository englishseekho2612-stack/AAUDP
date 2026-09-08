import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage, ThemeMode } from '../types/project';
import { projectRepository } from '../storage/projectRepository';
import { systemLogger, SystemLogEntry } from '../services/logging/systemLogger';
import { backupService } from '../services/storage/backupService';
import { ArpitAcademyLogo } from '../components/common/ArpitAcademyLogo';
import { AppView } from '../types/navigation';
import {
  Sun,
  Moon,
  Monitor,
  Globe,
  Mic,
  Video,
  Radio,
  HardDrive,
  Shield,
  Info,
  Sparkles,
  Users,
  CheckCircle2,
  Copy,
  Trash2,
  RefreshCw,
  Sliders,
  Check,
  Download,
  Upload,
  Folder,
  FolderOpen,
  Laptop,
} from 'lucide-react';
import { DesktopService } from '../services/desktop/desktopService';

type SettingsTab =
  | 'general'
  | 'ai'
  | 'audio'
  | 'video'
  | 'classroom'
  | 'youtube'
  | 'storage'
  | 'security'
  | 'about';

interface SettingsViewProps {
  onNavigate?: (view: AppView) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigate }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { projects, showToast } = useProject();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // GENERAL
  const [interfaceLanguage, setInterfaceLanguage] = useState<SupportedLanguage>('en');
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  // AI
  const [selectedModel, setSelectedModel] = useState<'gemini-2.5-flash' | 'gemini-1.5-pro'>('gemini-2.5-flash');
  const [strictSourceGrounding, setStrictSourceGrounding] = useState(true);
  const [aiOutputDetail, setAiOutputDetail] = useState<'concise' | 'balanced' | 'comprehensive'>('comprehensive');

  // AUDIO
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(true);
  const [voiceCommandTrigger, setVoiceCommandTrigger] = useState<'push_to_talk' | 'always_listening'>('push_to_talk');

  // VIDEO
  const [cameraDefaultOn, setCameraDefaultOn] = useState(false);
  const [defaultResolution, setDefaultResolution] = useState<'720p' | '1080p'>('1080p');
  const [defaultFramerate, setDefaultFramerate] = useState<'30fps' | '60fps'>('30fps');

  // CLASSROOM
  const [defaultTeacherName, setDefaultTeacherName] = useState('Teacher');
  const [defaultWaitingRoom, setDefaultWaitingRoom] = useState(false);
  const [allowStudentMics, setAllowStudentMics] = useState(false);
  const [showTeacherNotesToStudents, setShowTeacherNotesToStudents] = useState(false);

  // YOUTUBE
  const [defaultPrivacy, setDefaultPrivacy] = useState<'unlisted' | 'public' | 'private'>('unlisted');
  const [autoChatModeration, setAutoChatModeration] = useState(true);

  // STORAGE
  const [storageStats, setStorageStats] = useState<{
    projectCount: number;
    dataSizeBytes: number;
    mediaSizeBytes: number;
  }>({ projectCount: projects.length, dataSizeBytes: 0, mediaSizeBytes: 0 });

  // SECURITY & LOGS
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [copiedLogs, setCopiedLogs] = useState(false);

  // DESKTOP ENVIRONMENT INFO
  const [desktopInfo, setDesktopInfo] = useState<{
    isElectron: boolean;
    platform: string;
    version: string;
    arch?: string;
  }>({
    isElectron: DesktopService.isElectron(),
    platform: DesktopService.isWindows() ? 'win32' : 'web',
    version: '1.0.0',
  });

  useEffect(() => {
    if (DesktopService.isElectron()) {
      DesktopService.getAppInfo()
        .then((info) => {
          if (info) {
            setDesktopInfo({
              isElectron: true,
              platform: info.platform,
              version: info.version,
              arch: info.arch,
            });
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    loadStorageStats();
    setLogs(systemLogger.getLogs());
    return systemLogger.subscribe(() => setLogs(systemLogger.getLogs()));
  }, [projects]);

  const loadStorageStats = async () => {
    try {
      const stats = await projectRepository.getStorageUsage();
      setStorageStats(stats);
    } catch {
      // ignore
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCopyLogs = () => {
    const report = systemLogger.copyDiagnosticReport();
    navigator.clipboard.writeText(report);
    setCopiedLogs(true);
    showToast('Diagnostic log copied (all credentials redacted).', 'info');
    setTimeout(() => setCopiedLogs(false), 2500);
  };

  const handleClearLogs = () => {
    systemLogger.clearLogs();
    showToast('System logs cleared.', 'info');
  };

  const handleExportFullBackup = () => {
    if (projects.length === 0) {
      showToast('No projects to backup.', 'info');
      return;
    }
    try {
      backupService.exportProjectBackup(projects[0]);
      showToast('Backup archive generated and downloaded.', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Backup failed.', 'error');
    }
  };

  const navItems: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
    { id: 'general', label: 'General', icon: <Sliders className="w-4 h-4" /> },
    { id: 'ai', label: 'AI Engine', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'audio', label: 'Audio & DSP', icon: <Mic className="w-4 h-4" /> },
    { id: 'video', label: 'Video & Media', icon: <Video className="w-4 h-4" /> },
    { id: 'classroom', label: 'Classroom', icon: <Users className="w-4 h-4" /> },
    { id: 'youtube', label: 'YouTube Live', icon: <Radio className="w-4 h-4" /> },
    { id: 'storage', label: 'Storage & Backup', icon: <HardDrive className="w-4 h-4" /> },
    { id: 'security', label: 'Security & Privacy', icon: <Shield className="w-4 h-4" /> },
    { id: 'about', label: 'About', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div id="settings-view-container" className="max-w-5xl mx-auto space-y-6 pb-16 text-left">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
          Studio Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configure hardware, Gemini AI engine, classroom privacy boundaries, local storage, and security.
        </p>
      </div>

      {/* 9-Section Navigation Bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 scrollbar-none">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      <div className="space-y-6">
        {/* 1. GENERAL */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Appearance & Theme
              </h2>
              <div className="grid grid-cols-3 gap-3 max-w-sm">
                {[
                  { mode: 'light' as ThemeMode, label: 'Light', icon: <Sun className="w-4 h-4" /> },
                  { mode: 'dark' as ThemeMode, label: 'Dark', icon: <Moon className="w-4 h-4" /> },
                  { mode: 'system' as ThemeMode, label: 'System', icon: <Monitor className="w-4 h-4" /> },
                ].map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => setTheme(item.mode)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
                      theme === item.mode
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Interface Language
              </h2>
              <select
                value={interfaceLanguage}
                onChange={(e) => setInterfaceLanguage(e.target.value as SupportedLanguage)}
                className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs max-w-xs cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label} ({lang.nativeLabel})
                  </option>
                ))}
              </select>
            </section>
          </div>
        )}

        {/* 2. AI ENGINE */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Gemini Model Configuration
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setSelectedModel('gemini-2.5-flash')}
                  className={`p-4 rounded-xl border cursor-pointer space-y-1.5 transition-all ${
                    selectedModel === 'gemini-2.5-flash'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      Gemini 2.5 Flash
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 px-2 py-0.5 rounded font-bold">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ultra low latency, optimal for instant interactive mind mapping, slide structuring, and quizzes.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedModel('gemini-1.5-pro')}
                  className={`p-4 rounded-xl border cursor-pointer space-y-1.5 transition-all ${
                    selectedModel === 'gemini-1.5-pro'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      Gemini 1.5 Pro
                    </span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 px-2 py-0.5 rounded font-bold">
                      DEEP ANALYSIS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Extended context processing for massive multi-chapter PDF source documents.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                    Strict Source Grounding
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Require AI to explicitly cite lesson source materials and flag ungrounded inferences.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={strictSourceGrounding}
                  onChange={(e) => setStrictSourceGrounding(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>
            </section>
          </div>
        )}

        {/* 3. AUDIO & DSP */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Audio Hardware DSP & Enhancement
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                      Acoustic Echo Cancellation
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Prevents microphone feedback during live teaching with loudspeaker playback.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={echoCancellation}
                    onChange={(e) => setEchoCancellation(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                      Vocal Noise Suppression
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Filters low-frequency ambient rumble (80Hz high-pass filter).
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={noiseSuppression}
                    onChange={(e) => setNoiseSuppression(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                      Voice Commands Safety
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Require Push-to-Talk and explicit confirmation for destructive actions (Clear, Stop, Delete).
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={voiceCommandsEnabled}
                    onChange={(e) => setVoiceCommandsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 4. VIDEO & MEDIA */}
        {activeTab === 'video' && (
          <div className="space-y-4">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Camera & Recording Quality Defaults
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Recording Resolution
                  </label>
                  <select
                    value={defaultResolution}
                    onChange={(e) => setDefaultResolution(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs cursor-pointer"
                  >
                    <option value="720p">720p HD (Low memory)</option>
                    <option value="1080p">1080p Full HD (Default)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Target Frame Rate
                  </label>
                  <select
                    value={defaultFramerate}
                    onChange={(e) => setDefaultFramerate(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs cursor-pointer"
                  >
                    <option value="30fps">30 FPS (Standard)</option>
                    <option value="60fps">60 FPS (Fluid Canvas)</option>
                  </select>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 5. CLASSROOM */}
        {activeTab === 'classroom' && (
          <div className="space-y-4">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Classroom Privacy & Host Defaults
              </h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Default Teacher Display Name
                  </label>
                  <input
                    type="text"
                    value={defaultTeacherName}
                    onChange={(e) => setDefaultTeacherName(e.target.value)}
                    className="p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs max-w-sm w-full"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                      Enable Waiting Room by Default
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Require teacher manual approval before participants can join the session.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={defaultWaitingRoom}
                    onChange={(e) => setDefaultWaitingRoom(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                      Strict Teacher Notes Isolation
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Private teacher notes and answers are permanently hidden from student screens.
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg">
                    ENFORCED
                  </span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 6. YOUTUBE LIVE */}
        {activeTab === 'youtube' && (
          <div className="space-y-4">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                YouTube Live Broadcast Defaults
              </h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Default Stream Privacy
                  </label>
                  <select
                    value={defaultPrivacy}
                    onChange={(e) => setDefaultPrivacy(e.target.value as any)}
                    className="p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-xs max-w-sm cursor-pointer"
                  >
                    <option value="unlisted">Unlisted (Recommended — link only)</option>
                    <option value="public">Public (Searchable to everyone)</option>
                    <option value="private">Private (Only authorized users)</option>
                  </select>
                </div>

                <div className="p-3 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-xl text-xs space-y-1 text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-red-600 dark:text-red-400 block">
                    Clean Feed Guarantee
                  </span>
                  <p className="text-[11px] text-slate-500">
                    The YouTube broadcast pipeline is strictly isolated. Student chats, raised hands, and teacher notes are never routed to YouTube stream frames.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* 7. STORAGE & BACKUP */}
        {activeTab === 'storage' && (
          <div className="space-y-4">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Local Storage & Project Backup
              </h2>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Projects</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {storageStats.projectCount}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Metadata</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatBytes(storageStats.dataSizeBytes)}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 block">Media & Blobs</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatBytes(storageStats.mediaSizeBytes)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleExportFullBackup}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full Backup Archive</span>
                </button>

                {onNavigate && (
                  <button
                    onClick={() => onNavigate('storage_manager')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors border border-slate-300 dark:border-slate-700"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Open Advanced Storage Manager</span>
                  </button>
                )}
              </div>

              {/* Windows Desktop Local Application Folders */}
              {desktopInfo.isElectron && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <FolderOpen className="w-4 h-4 text-amber-500" />
                    <span>Windows Local Application Data Folders</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Direct access to local private directories managed by AI Teaching Studio on your Windows system.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => DesktopService.openDataFolder('userData')}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      <Folder className="w-3.5 h-3.5 text-indigo-500" />
                      <span>App Data Root</span>
                    </button>
                    <button
                      onClick={() => DesktopService.openDataFolder('projects')}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      <Folder className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Projects</span>
                    </button>
                    <button
                      onClick={() => DesktopService.openDataFolder('recordings')}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      <Folder className="w-3.5 h-3.5 text-red-500" />
                      <span>Recordings</span>
                    </button>
                    <button
                      onClick={() => DesktopService.openDataFolder('exports')}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      <Folder className="w-3.5 h-3.5 text-blue-500" />
                      <span>Exports</span>
                    </button>
                    <button
                      onClick={() => DesktopService.openDataFolder('backups')}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      <Folder className="w-3.5 h-3.5 text-purple-500" />
                      <span>Backups</span>
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* 8. SECURITY & PRIVACY */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Automated System Diagnostic Test (QA)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verify hardware permissions, local database health, and audio/video pipeline readiness.
                  </p>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('system_qa')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-colors shrink-0"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Run Full System Diagnostic Check</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    System Diagnostic Log (Sanitized)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    All API keys, secrets, and private student data are automatically masked.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLogs}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLogs ? 'Copied' : 'Copy Diagnostic Info'}</span>
                  </button>
                  <button
                    onClick={handleClearLogs}
                    className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Logs</span>
                  </button>
                </div>
              </div>

              <div className="h-64 overflow-y-auto bg-slate-950 text-slate-300 font-mono text-[11px] p-3 rounded-xl space-y-1.5 border border-slate-800">
                {logs.length === 0 ? (
                  <div className="text-slate-600 text-center py-10">No diagnostic logs recorded.</div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2">
                      <span className="text-slate-500 shrink-0">[{log.formattedTime}]</span>
                      <span
                        className={`font-bold shrink-0 ${
                          log.level === 'error'
                            ? 'text-rose-400'
                            : log.level === 'warn'
                            ? 'text-amber-400'
                            : 'text-indigo-400'
                        }`}
                      >
                        [{log.category}]
                      </span>
                      <span className="break-all">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* 9. ABOUT */}
        {activeTab === 'about' && (
          <div className="space-y-4">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-white p-1 border-2 border-emerald-600/30 shadow-sm shrink-0">
                  <ArpitAcademyLogo className="w-full h-full" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    ARPIT ACADEMY UDAIPURA
                  </h2>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Learn • Teach • Understand · With Arpit Sir
                  </p>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Created by Arpit Digital Hub • Version 1.0.0 (Production Release)
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Official educational institution platform for Arpit Academy Udaipura. Providing teachers and students with digital lesson synthesis, interactive mind maps, live interactive whiteboard participation, lecture recordings, and comprehensive curriculum assessments.
              </p>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Platform / Shell:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {desktopInfo.isElectron
                      ? `Windows Desktop Application (${desktopInfo.arch || 'x64'})`
                      : 'Web & Android Hybrid Client'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Data Isolation:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Local Device Storage (Cloud Sync: NO)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Runtime Architecture:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Vite 5 + React 18 + Express 4</span>
                </div>
                <div className="flex justify-between">
                  <span>Persistence:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">IndexedDB + LocalStorage (Offline First)</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Engine:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Google Gemini API (Server-Side Proxy)</span>
                </div>
                <div className="flex justify-between">
                  <span>Classroom Protocol:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Server-Sent Events (SSE) + WebSocket Ready</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
