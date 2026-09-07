import React, { useState, useEffect } from 'react';
import {
  ScheduledLesson,
  Course,
  RevisionPlan,
} from '../../types/curriculum';
import { curriculumDatabase } from '../../storage/curriculumDatabase';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface ScheduleCalendarTabProps {
  course: Course;
}

export const ScheduleCalendarTab: React.FC<ScheduleCalendarTabProps> = ({ course }) => {
  const [schedules, setSchedules] = useState<ScheduledLesson[]>([]);
  const [revisionPlans, setRevisionPlans] = useState<RevisionPlan[]>([]);
  const [filterView, setFilterView] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');

  // Add schedule modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [duration, setDuration] = useState(45);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [course.id]);

  const loadData = async () => {
    const sList = await curriculumDatabase.getAllSchedules();
    const rList = await curriculumDatabase.getAllRevisionPlans();
    setSchedules(sList);
    setRevisionPlans(rList);
  };

  const handleToggleComplete = async (item: ScheduledLesson) => {
    const updated: ScheduledLesson = {
      ...item,
      isCompleted: !item.isCompleted,
    };
    await curriculumDatabase.saveSchedule(updated);
    await loadData();
  };

  const handleDeleteSchedule = async (id: string) => {
    await curriculumDatabase.deleteSchedule(id);
    await loadData();
  };

  const handleSaveNewSchedule = async () => {
    if (!lessonTitle.trim()) return;
    const newSchedule: ScheduledLesson = {
      id: `sched_${Date.now()}`,
      courseId: course.id,
      subjectId: course.subjects?.[0]?.id || 'subj_default',
      lessonId: `les_sched_${Date.now()}`,
      lessonTitle: lessonTitle.trim(),
      scheduledDate,
      scheduledTime,
      durationMinutes: duration,
      batchId: course.batches?.[0]?.id,
      isCompleted: false,
      notes: notes.trim(),
    };
    await curriculumDatabase.saveSchedule(newSchedule);
    await loadData();
    setShowAddModal(false);
    setLessonTitle('');
    setNotes('');
  };

  // Pacing Calculation
  const totalLessonsInCurriculum = course.subjects?.reduce(
    (acc, s) =>
      acc +
      s.units.reduce(
        (uAcc, u) =>
          uAcc + u.chapters.reduce((cAcc, c) => cAcc + c.topics.reduce((tAcc, t) => tAcc + t.lessons.length, 0), 0),
        0
      ),
    0
  ) || 12;

  const completedSchedulesCount = schedules.filter((s) => s.isCompleted).length;
  const remainingLessons = Math.max(0, totalLessonsInCurriculum - completedSchedulesCount);
  const weeklyHours = course.weeklyTeachingHours || 4;
  const lessonsPerWeek = Math.max(1, Math.round((weeklyHours * 60) / 45));
  const estimatedWeeksNeeded = Math.ceil(remainingLessons / lessonsPerWeek);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredSchedules = schedules.filter((s) => {
    if (filterView === 'today') return s.scheduledDate === todayStr;
    if (filterView === 'upcoming') return s.scheduledDate >= todayStr && !s.isCompleted;
    if (filterView === 'completed') return s.isCompleted;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Pacing & Progress Intelligence Card (Section 46) */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50/70 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Curriculum Pacing & Completion Projections
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pacing tracker comparing planned target completion ({course.targetCompletionDate || 'Target Unset'}) with delivered sessions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {completedSchedulesCount} of {totalLessonsInCurriculum} Delivered
              </div>
              <div className="text-[11px] text-slate-500">
                {Math.round((completedSchedulesCount / (totalLessonsInCurriculum || 1)) * 100)}% Coverage
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.round((completedSchedulesCount / (totalLessonsInCurriculum || 1)) * 100))}%`,
            }}
          />
        </div>

        {/* Realistic Pacing Note */}
        <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
          <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <span>
            <span className="font-semibold">Pacing Guidance:</span> At your configured allocation of {weeklyHours} teaching hours/week (~{lessonsPerWeek} lessons/week), completing the remaining {remainingLessons} lesson(s) will require approximately <span className="font-semibold text-slate-900 dark:text-slate-100">{estimatedWeeksNeeded} teaching week(s)</span>.{' '}
            <span className="italic text-slate-400">(Projection is an estimated guideline; adjust schedule as needed for exam revisions).</span>
          </span>
        </div>
      </div>

      {/* Schedule Table & Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'all', label: 'All Sessions' },
              { id: 'today', label: 'Today' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'completed', label: 'Delivered' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterView(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterView === f.id
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Lesson
          </button>
        </div>

        {/* Schedule List */}
        <div className="space-y-2">
          {filteredSchedules.length === 0 && (
            <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
              No scheduled lessons found for this filter.
            </div>
          )}

          {filteredSchedules.map((s) => (
            <div
              key={s.id}
              className={`p-3.5 rounded-xl border transition-colors flex items-center justify-between ${
                s.isCompleted
                  ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleComplete(s)}
                  className={`p-1 rounded-full ${
                    s.isCompleted
                      ? 'text-emerald-600'
                      : 'text-slate-300 dark:text-slate-600 hover:text-emerald-500'
                  }`}
                  title={s.isCompleted ? 'Mark as Pending' : 'Mark as Delivered'}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </button>

                <div>
                  <div className={`text-xs font-semibold ${s.isCompleted ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                    {s.lessonTitle}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" /> {s.scheduledDate} at {s.scheduledTime}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {s.durationMinutes}m
                    </span>
                    {s.notes && (
                      <>
                        <span>•</span>
                        <span className="italic text-slate-400">{s.notes}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteSchedule(s.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Schedule Teaching Session
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Lesson Title
                </label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="e.g. Photosynthesis: Light Reactions"
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 45)}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Session Notes (Lab prep, slides, etc.)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Set up smartboard slides and lab apparatus"
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewSchedule}
                disabled={!lessonTitle.trim()}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded text-xs font-semibold"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
