import React, { useState, useEffect } from 'react';
import { Assignment } from '../../types/curriculum';
import { StudentProfile } from '../../types/studentPortal';
import { studentPortalService } from '../../services/studentPortalService';
import { AssignmentSubmissionModal } from './AssignmentSubmissionModal';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Award,
  Filter,
} from 'lucide-react';

interface StudentAssignmentsTabProps {
  student: StudentProfile;
  onOpenAssignmentModal?: (assignmentId: string) => void;
}

export const StudentAssignmentsTab: React.FC<StudentAssignmentsTabProps> = ({
  student,
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    loadAssignments();
  }, [student.id]);

  const loadAssignments = async () => {
    const list = await studentPortalService.getAssignmentsForStudent(student.id);
    setItems(list);
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return item.status === 'not_started' || item.status === 'in_progress';
    if (filter === 'submitted') return item.status === 'submitted';
    if (filter === 'graded') return item.status === 'graded';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-2xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Assignments & Projects
            </h2>
            <p className="text-xs text-slate-500">
              Turn in laboratory reports, essays, and problems assigned by your teacher.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'pending', 'submitted', 'graded'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize cursor-pointer transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Assignments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const a = item.assignment as Assignment;
          const status = item.status;

          return (
            <div
              key={a.id}
              onClick={() => setSelectedAssignment(a)}
              className="p-5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer space-y-4 transition-all shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    status === 'graded'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : status === 'submitted'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {status.replace('_', ' ')}
                </span>

                <span className="text-xs font-bold text-indigo-600">
                  {a.maxScore || a.totalMarks} marks
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {a.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {a.instructions}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Due: {a.dueDate || 'Flexible'}</span>
                </span>

                {item.submission?.score !== undefined ? (
                  <span className="font-bold text-emerald-600">
                    Score: {item.submission.score}/{a.maxScore || a.totalMarks}
                  </span>
                ) : (
                  <span className="text-indigo-600 font-semibold">Open details →</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assignment Modal */}
      {selectedAssignment && (
        <AssignmentSubmissionModal
          assignment={selectedAssignment}
          student={student}
          onClose={() => setSelectedAssignment(null)}
          onSubmitted={() => {
            loadAssignments();
            setSelectedAssignment(null);
          }}
        />
      )}
    </div>
  );
};
