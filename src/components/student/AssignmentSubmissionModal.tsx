import React, { useState, useEffect } from 'react';
import { Assignment } from '../../types/curriculum';
import {
  StudentProfile,
  StudentAssignmentSubmission,
  AssignmentSubmissionAttachment,
} from '../../types/studentPortal';
import { studentPortalService } from '../../services/studentPortalService';
import { studentPortalDatabase } from '../../storage/studentPortalDatabase';
import {
  X,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Save,
  Send,
  Award,
  Paperclip,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface AssignmentSubmissionModalProps {
  assignment: Assignment;
  student: StudentProfile;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const AssignmentSubmissionModal: React.FC<AssignmentSubmissionModalProps> = ({
  assignment,
  student,
  onClose,
  onSubmitted,
}) => {
  const [submission, setSubmission] = useState<StudentAssignmentSubmission | null>(null);
  const [textContent, setTextContent] = useState('');
  const [attachments, setAttachments] = useState<AssignmentSubmissionAttachment[]>([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSubmission();
  }, [assignment.id, student.id]);

  const loadSubmission = async () => {
    const existing = await studentPortalDatabase.getSubmissionByAssignmentAndStudent(
      assignment.id,
      student.id
    );
    if (existing) {
      setSubmission(existing);
      setTextContent(existing.textContent);
      setAttachments(existing.attachments || []);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    await studentPortalService.saveAssignmentDraft({
      assignmentId: assignment.id,
      studentId: student.id,
      studentName: student.displayName,
      courseId: assignment.courseId,
      textContent,
      attachments,
      maxScore: assignment.maxScore,
    });
    setIsSavingDraft(false);
    setLastSavedTime(new Date().toLocaleTimeString());
    loadSubmission();
  };

  const handleAddAttachmentSimulated = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newAtt: AssignmentSubmissionAttachment = {
      name: file.name,
      type: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    };
    setAttachments((prev) => [...prev, newAtt]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    await handleSaveDraft();
    const existing = await studentPortalDatabase.getSubmissionByAssignmentAndStudent(
      assignment.id,
      student.id
    );
    if (existing) {
      await studentPortalService.submitAssignmentFinal(existing.id);
    }
    setIsSubmitting(false);
    setShowConfirmModal(false);
    await loadSubmission();
    if (onSubmitted) onSubmitted();
  };

  const isGraded = submission?.status === 'graded' || submission?.status === 'returned';
  const isSubmitted = submission?.status === 'submitted' || isGraded;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Assignment Details
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {assignment.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Due Date Bar */}
          <div className="p-4 bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Due Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {assignment.dueDate || 'No explicit deadline'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Marks</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {assignment.maxScore} points
                </span>
              </div>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                isGraded
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : isSubmitted
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
            >
              {submission?.status ? submission.status.replace('_', ' ') : 'Not Started'}
            </span>
          </div>

          {/* Teacher Instructions */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Teacher Instructions
            </h3>
            <div className="p-4 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {assignment.instructions}
            </div>
          </div>

          {/* Rubric Criteria if present */}
          {assignment.rubric && assignment.rubric.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Evaluation Rubric
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {assignment.rubric.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>{r.title}</span>
                      <span className="text-indigo-600">{r.maxMarks} marks</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{r.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If Graded: Show Returned Score & Teacher Feedback */}
          {isGraded && (
            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                    Graded Submission Result
                  </h3>
                </div>
                <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {submission?.score} / {assignment.maxScore} marks
                </span>
              </div>

              {submission?.feedback && (
                <div className="p-3 bg-white dark:bg-slate-850 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 text-xs text-slate-700 dark:text-slate-300">
                  <strong>Teacher Feedback:</strong> {submission.feedback}
                </div>
              )}
            </div>
          )}

          {/* Student Work Submission Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Your Written Response
              </h3>
              {lastSavedTime && (
                <span className="text-[11px] text-slate-400">Draft saved at {lastSavedTime}</span>
              )}
            </div>

            <textarea
              rows={6}
              disabled={isSubmitted && !submission?.isResubmissionAllowed}
              placeholder="Write your detailed assignment answer, experimental data, or methodology here..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-sans leading-relaxed disabled:opacity-80"
            />

            {/* Attachments list & File Upload */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Uploaded Attachments & Charts ({attachments.length})
              </span>

              <div className="flex flex-wrap gap-2">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-700"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{att.name}</span>
                    {(!isSubmitted || submission?.isResubmissionAllowed) && (
                      <button
                        onClick={() => handleRemoveAttachment(i)}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {(!isSubmitted || submission?.isResubmissionAllowed) && (
                <label className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer border border-dashed border-slate-300 dark:border-slate-600">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Attach Document or Image</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleAddAttachmentSimulated}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            {(!isSubmitted || submission?.isResubmissionAllowed) && (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
                </button>

                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!textContent.trim() || isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Turn In Assignment</span>
                </button>
              </>
            )}

            {isSubmitted && !submission?.isResubmissionAllowed && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Submitted</span>
              </span>
            )}
          </div>
        </div>

        {/* Final Submission Confirmation Dialog */}
        {showConfirmModal && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Confirm Assignment Submission
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Are you ready to turn in <strong>{assignment.title}</strong>? Your submission will be locked and sent to Dr. Sarah Jenkins for grading.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Keep Editing
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  {isSubmitting ? 'Submitting...' : 'Yes, Turn In'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
