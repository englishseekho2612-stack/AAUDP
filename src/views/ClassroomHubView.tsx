import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Play,
  Calendar,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  Radio,
  Lock,
  ArrowRight,
  Sparkles,
  BookOpen,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { ClassroomSession } from '../types/classroom';
import { classroomService } from '../services/classroom/classroomClientService';
import { CreateClassModal } from '../components/classroom/CreateClassModal';
import { AttendanceModal } from '../components/classroom/AttendanceModal';
import { Project } from '../types/project';

interface ClassroomHubViewProps {
  onStartTeachingStudio: (classCode: string, projectId?: string) => void;
  onJoinAsStudent: (classCode: string) => void;
  projects?: Project[];
  activeProjectId?: string | null;
}

export const ClassroomHubView: React.FC<ClassroomHubViewProps> = ({
  onStartTeachingStudio,
  onJoinAsStudent,
  projects = [],
  activeProjectId,
}) => {
  const [classes, setClasses] = useState<ClassroomSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [attendanceClassCode, setAttendanceClassCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Quick student join form in hub
  const [quickCode, setQuickCode] = useState('');

  const loadClasses = async () => {
    setLoading(true);
    const list = await classroomService.getClasses();
    setClasses(list);
    setLoading(false);
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleClassCreated = (newCode: string) => {
    loadClasses();
    onStartTeachingStudio(newCode);
  };

  return (
    <div id="classroom-hub-view" className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900/90 via-indigo-900/80 to-slate-900 border border-blue-800/60 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-400/40 text-blue-300">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
              Interactive Online Classroom Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Connect Live with Your Students
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Host live teaching sessions with real-time synchronized slides, interactive 3D mind
            maps, private teacher-only student chat, instant polls, and MCQ challenges.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-create-class-hub"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-900/40 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Class</span>
          </button>
        </div>
      </div>

      {/* Two Column Section: Quick Join Widget & Classes List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Quick Join as Student Widget */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 dark:bg-purple-950/60 text-purple-600 rounded-xl border border-purple-200 dark:border-purple-800">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Student Portal
                </h3>
                <p className="text-[11px] text-slate-500">Test or join as a student</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Have a 6-character class code from a teacher? Join directly into the student view.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                maxLength={8}
                placeholder="Enter Code (e.g. STUDIO1)"
                value={quickCode}
                onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono font-bold tracking-widest text-xs uppercase"
              />

              <button
                onClick={() => {
                  if (quickCode.trim()) onJoinAsStudent(quickCode.trim());
                }}
                disabled={!quickCode.trim()}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Join as Student</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Privacy Architecture Notice Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-500" />
              <span>Strict Privacy Architecture</span>
            </span>
            <ul className="text-[11px] space-y-1 list-disc list-inside text-slate-500">
              <li>No student-to-student messaging</li>
              <li>Teacher notes never broadcast</li>
              <li>Student questions are private by default</li>
              <li>Official YouTube Live integration</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Classroom Sessions List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>My Classroom Sessions</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {classes.length}
              </span>
            </h2>

            <button
              onClick={loadClasses}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Refresh Sessions
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading classrooms...</div>
          ) : classes.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3">
              <Users className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No Classroom Sessions Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create your first class to generate a 6-character room code and launch the Teaching
                Studio with live student participation.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Create Classroom
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((cls) => {
                const isLive = cls.status === 'live';
                return (
                  <div
                    key={cls.id}
                    className="p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            {cls.subject || 'General Subject'}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                            {cls.className}
                          </h3>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                            isLive
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                              : cls.status === 'ended'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {cls.status}
                        </span>
                      </div>

                      {cls.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">{cls.description}</p>
                      )}

                      {/* Code & Connected Students Badge */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-bold">CODE:</span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                            {cls.classCode}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopy(cls.classCode)}
                            title="Copy Class Code"
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            {copiedCode === cls.classCode ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>{cls.studentCount || 0} students</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setAttendanceClassCode(cls.classCode)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-semibold cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Attendance</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {/* Student Preview button */}
                        <button
                          onClick={() => onJoinAsStudent(cls.classCode)}
                          title="Open as Student"
                          className="px-2.5 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
                        >
                          Join
                        </button>

                        {/* Start / Open Teaching Studio */}
                        <button
                          onClick={() =>
                            onStartTeachingStudio(cls.classCode, cls.associatedProjectId)
                          }
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isLive ? 'Resume Studio' : 'Start Studio'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onClassCreated={handleClassCreated}
        projects={projects}
        activeProjectId={activeProjectId}
      />

      {/* Attendance & Engagement Report Modal */}
      {attendanceClassCode && (
        <AttendanceModal
          isOpen={Boolean(attendanceClassCode)}
          onClose={() => setAttendanceClassCode(null)}
          classCode={attendanceClassCode}
        />
      )}
    </div>
  );
};
