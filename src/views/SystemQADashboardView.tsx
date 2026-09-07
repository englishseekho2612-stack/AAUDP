import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ArrowLeft,
  Activity,
  Cpu,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  systemQAService,
  ModuleDiagnosticResult,
  DiagnosticStatus,
} from '../services/qa/systemQAService';

interface SystemQADashboardViewProps {
  onBack: () => void;
}

export const SystemQADashboardView: React.FC<SystemQADashboardViewProps> = ({ onBack }) => {
  const [results, setResults] = useState<ModuleDiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const data = await systemQAService.runFullDiagnostics();
      setResults(data);
    } catch (e) {
      console.error('QA Diagnostics error:', e);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusBadge = (status: DiagnosticStatus) => {
    switch (status) {
      case 'working':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Operational
          </span>
        );
      case 'warning':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[10px] flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Warning / Preview
          </span>
        );
      case 'error':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-[10px] flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Error
          </span>
        );
      case 'not_configured':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-bold text-[10px]">
            Not Configured
          </span>
        );
    }
  };

  return (
    <div
      id="system-qa-dashboard-root"
      className="max-w-5xl mx-auto space-y-6 pb-12 select-none"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              ARPIT ACADEMY UDAIPURA — System Diagnostic Check
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Automated multi-layer verification and diagnostic health report
            </p>
          </div>
        </div>

        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>Run All Tests</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Hardware & Runtime Diagnostic Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
            <Cpu className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Audio Engine</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Web Audio DSP</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
            <Activity className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Media Stream</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">MediaRecorder 30fps</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
            <Zap className="w-5 h-5 text-purple-500 dark:text-purple-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">AI Processing</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Gemini 2.5 Flash</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-bold">Local Storage</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">IndexedDB Binary</span>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Architecture Module Verification Results
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {results.map((res) => (
              <div
                key={res.id}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                      {res.part}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{res.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{res.summary}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      {res.latencyMs}ms
                    </span>
                    {getStatusBadge(res.status)}
                  </div>
                </div>

                {/* Sub-check list */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {res.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
