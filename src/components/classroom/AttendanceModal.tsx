import React, { useState, useEffect } from 'react';
import { X, Users, Download, Clock, CheckCircle2, MessageSquare, Hand, FileText } from 'lucide-react';
import { classroomService } from '../../services/classroom/classroomClientService';
import { ClassroomAttendanceRecord } from '../../types/classroom';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  classCode: string;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  classCode,
}) => {
  const [record, setRecord] = useState<ClassroomAttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !classCode) return;
    let mounted = true;
    setLoading(true);

    classroomService.getAttendance(classCode).then((data) => {
      if (mounted) {
        setRecord(data);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [isOpen, classCode]);

  if (!isOpen) return null;

  // Export to CSV (Section 60)
  const handleExportCSV = () => {
    if (!record) return;

    const headers = [
      'Student Name',
      'Status',
      'Joined At',
      'Duration (Minutes)',
      'Questions Asked',
      'Hand Raises',
    ];

    const rows = record.students.map((s) => [
      `"${s.displayName.replace(/"/g, '""')}"`,
      s.status,
      new Date(s.joinedAt).toLocaleTimeString(),
      s.durationMinutes,
      s.questionsAskedCount,
      s.handRaisesCount,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_${classCode}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON (Section 61)
  const handleExportJSON = () => {
    if (!record) return;
    const jsonStr = JSON.stringify(record, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_${classCode}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="attendance-modal"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Session Attendance & Engagement Report
              </h3>
              <p className="text-xs text-slate-500">
                Classroom Code: <strong className="font-mono">{classCode}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading attendance data...</div>
          ) : !record || record.students.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No students recorded in this session yet.
            </div>
          ) : (
            <>
              {/* Top Statistics Bar */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-500 block">Total Students</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {record.totalStudents}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-500 block">Session Duration</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {record.durationMinutes}m
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-500 block">Questions Asked</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {record.totalQuestionsReceived}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-500 block">Polls / Quizzes</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {record.totalPollsConducted + record.totalQuizzesConducted}
                  </span>
                </div>
              </div>

              {/* Student Detail Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                    <tr>
                      <th className="p-2.5">Student</th>
                      <th className="p-2.5">Join Time</th>
                      <th className="p-2.5">Duration</th>
                      <th className="p-2.5 text-center">Questions</th>
                      <th className="p-2.5 text-center">Hand Raises</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {record.students.map((s) => (
                      <tr key={s.studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-100">
                          {s.displayName}
                        </td>
                        <td className="p-2.5 text-slate-500">
                          {new Date(s.joinedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-2.5 text-slate-500 font-mono">{s.durationMinutes} min</td>
                        <td className="p-2.5 text-center text-slate-700 dark:text-slate-300">
                          {s.questionsAskedCount}
                        </td>
                        <td className="p-2.5 text-center text-slate-700 dark:text-slate-300">
                          {s.handRaisesCount}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                              s.status === 'present'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={!record || record.students.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              disabled={!record || record.students.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
