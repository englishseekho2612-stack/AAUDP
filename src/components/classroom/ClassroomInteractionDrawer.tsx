import React, { useState, useEffect } from 'react';
import {
  Users,
  MessageSquare,
  BarChart3,
  HelpCircle,
  X,
  Send,
  Check,
  CheckCircle2,
  Hand,
  Mic,
  MicOff,
  UserX,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Clock,
  Radio,
  Share2,
  Copy,
  AlertCircle,
  Volume2,
  Sparkles,
} from 'lucide-react';
import {
  StudentParticipant,
  StudentPrivateQuestion,
  ClassPoll,
  ClassQuizQuestion,
  ClassroomSession,
} from '../../types/classroom';
import { classroomService } from '../../services/classroom/classroomClientService';

interface ClassroomInteractionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  classCode: string;
  session?: ClassroomSession | null;
  className?: string;
  onSessionUpdated?: (updated: ClassroomSession) => void;
  availableQuizQuestions?: {
    id: string;
    question: string;
    options: { id: string; label: string; text: string; isCorrect: boolean }[];
    explanation?: string;
  }[];
}

type TabType = 'roster' | 'chat' | 'polls' | 'quiz';

export const ClassroomInteractionDrawer: React.FC<ClassroomInteractionDrawerProps> = ({
  isOpen,
  onClose,
  classCode,
  session,
  onSessionUpdated,
  availableQuizQuestions = [],
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [participants, setParticipants] = useState<StudentParticipant[]>([]);
  const [questions, setQuestions] = useState<StudentPrivateQuestion[]>([]);
  const [polls, setPolls] = useState<ClassPoll[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<ClassQuizQuestion | null>(null);

  // Actions state
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [copiedCode, setCopiedCode] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [isLocked, setIsLocked] = useState(session?.isLocked || false);

  // Poll creation form
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollOptions, setNewPollOptions] = useState<string[]>(['', '', '', '']);

  // Quiz creation form
  const [quizMode, setQuizMode] = useState<'practice' | 'test' | 'challenge'>('practice');
  const [quizTimer, setQuizTimer] = useState<number>(30);
  const [selectedPresetQuizId, setSelectedPresetQuizId] = useState<string>('');
  const [customQuizQuestion, setCustomQuizQuestion] = useState('');
  const [customQuizOptions, setCustomQuizOptions] = useState<
    { text: string; isCorrect: boolean }[]
  >([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);

  // Load initial data and subscribe to real-time events
  useEffect(() => {
    if (!classCode) return;

    let mounted = true;

    const loadData = async () => {
      const [parts, msgs] = await Promise.all([
        classroomService.getParticipants(classCode),
        classroomService.getMessages(classCode, 'teacher'),
      ]);
      if (mounted) {
        setParticipants(parts);
        setQuestions(msgs);
      }
    };

    loadData();

    // Subscribe to SSE / BroadcastChannel events
    const unsubscribe = classroomService.subscribeToClassEvents(
      classCode,
      'teacher',
      undefined,
      (ev) => {
        if (!mounted) return;
        switch (ev.type) {
          case 'STUDENT_JOINED':
          case 'STUDENT_STATUS_UPDATED':
          case 'STUDENT_RECONNECTED':
          case 'STUDENT_LEFT':
          case 'STUDENT_REMOVED':
            classroomService.getParticipants(classCode).then((p) => {
              if (mounted) setParticipants(p);
            });
            break;

          case 'QUESTION_RECEIVED':
          case 'QUESTION_REPLIED':
          case 'QUESTION_PUBLISHED':
            classroomService.getMessages(classCode, 'teacher').then((m) => {
              if (mounted) setQuestions(m);
            });
            break;

          case 'POLL_STARTED':
          case 'POLL_UPDATED':
          case 'POLL_CLOSED':
            if (ev.data) {
              setPolls((prev) => {
                const idx = prev.findIndex((p) => p.id === ev.data.id);
                if (idx >= 0) {
                  const updated = [...prev];
                  updated[idx] = ev.data;
                  return updated;
                }
                return [ev.data, ...prev];
              });
            }
            break;

          case 'QUIZ_LAUNCHED':
          case 'QUIZ_STATS_UPDATED':
          case 'QUIZ_ANSWER_REVEALED':
            if (ev.data) {
              setActiveQuiz(ev.data);
            }
            break;

          case 'CLASS_LOCKED':
            if (ev.data && typeof ev.data.isLocked === 'boolean') {
              setIsLocked(ev.data.isLocked);
            }
            break;

          default:
            break;
        }
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [classCode]);

  if (!isOpen) return null;

  // Unread questions count
  const unreadQuestions = questions.filter((q) => q.status === 'unread').length;
  // Raised hands count
  const raisedHands = participants.filter((p) => p.handRaised && p.status === 'active');

  const handleCopyClassCode = () => {
    navigator.clipboard.writeText(classCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleToggleLock = async () => {
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    await classroomService.updateClassStatus(classCode, undefined, nextLocked);
  };

  const handleSendAnnouncement = async () => {
    if (!announcementText.trim()) return;
    await classroomService.updateBroadcastState(classCode, {
      announcement: announcementText.trim(),
    });
    setAnnouncementText('');
  };

  const handleClearAnnouncement = async () => {
    await classroomService.updateBroadcastState(classCode, {
      announcement: null,
    });
  };

  // Participant moderation
  const handleLowerHand = async (studentId: string) => {
    await classroomService.moderateParticipant(classCode, studentId, 'lower_hand');
  };

  const handleToggleMic = async (p: StudentParticipant) => {
    await classroomService.moderateParticipant(classCode, p.id, 'allow_mic', !p.isMicAllowed);
  };

  const handleRemoveStudent = async (p: StudentParticipant) => {
    const confirm = window.confirm(
      `Are you sure you want to remove ${p.displayName} from this classroom? They will be blocked from rejoining.`
    );
    if (confirm) {
      await classroomService.moderateParticipant(classCode, p.id, 'remove');
    }
  };

  // Question replies
  const handleSendReply = async (qId: string) => {
    const reply = replyTextMap[qId];
    if (!reply || !reply.trim()) return;
    await classroomService.replyToQuestion(classCode, qId, reply.trim());
    setReplyTextMap((prev) => ({ ...prev, [qId]: '' }));
  };

  const handlePublishQuestion = async (qId: string, mode: 'anonymous' | 'with_name') => {
    await classroomService.publishQuestion(classCode, qId, mode);
  };

  // Poll creation
  const handleCreatePoll = async () => {
    if (!newPollQuestion.trim()) return;
    const validOpts = newPollOptions.filter((o) => o.trim() !== '');
    if (validOpts.length < 2) {
      alert('Please provide at least 2 poll options.');
      return;
    }
    await classroomService.createPoll(classCode, newPollQuestion.trim(), validOpts);
    setNewPollQuestion('');
    setNewPollOptions(['', '', '', '']);
  };

  const handleClosePoll = async (pollId: string) => {
    await classroomService.closePoll(classCode, pollId);
  };

  const handleTogglePollResults = async (pollId: string, currentVal: boolean) => {
    await classroomService.setPollResultsVisibility(classCode, pollId, !currentVal);
  };

  // Quiz launch
  const handleLaunchPresetQuiz = async () => {
    const chosen = availableQuizQuestions.find((q) => q.id === selectedPresetQuizId);
    if (!chosen) return;

    await classroomService.launchQuiz(classCode, {
      mode: quizMode,
      question: chosen.question,
      options: chosen.options,
      explanation: chosen.explanation,
      timeLimitSeconds: quizTimer,
    });
  };

  const handleLaunchCustomQuiz = async () => {
    if (!customQuizQuestion.trim()) return;
    const filled = customQuizOptions.filter((o) => o.text.trim() !== '');
    if (filled.length < 2) {
      alert('Please provide at least 2 options for the quiz.');
      return;
    }
    const formatted = filled.map((opt, idx) => ({
      id: `opt_${idx}`,
      label: ['A', 'B', 'C', 'D'][idx] || `${idx + 1}`,
      text: opt.text.trim(),
      isCorrect: opt.isCorrect,
    }));

    await classroomService.launchQuiz(classCode, {
      mode: quizMode,
      question: customQuizQuestion.trim(),
      options: formatted,
      timeLimitSeconds: quizTimer,
    });

    setCustomQuizQuestion('');
  };

  const handleRevealQuizAnswer = async (quizId: string) => {
    await classroomService.revealQuizAnswer(classCode, quizId);
  };

  return (
    <div
      id="classroom-interaction-drawer"
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 border border-blue-200 dark:border-blue-800">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Interactive Classroom
              </h3>
              <span className="text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded flex items-center gap-1">
                CODE: {classCode}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {participants.filter((p) => p.status === 'active').length} connected •{' '}
              {raisedHands.length} hands raised
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Copy Link */}
          <button
            onClick={handleCopyClassCode}
            title="Copy Student Join Code"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            {copiedCode ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {/* Lock Class Toggle */}
          <button
            onClick={handleToggleLock}
            title={isLocked ? 'Classroom is Locked (Click to Unlock)' : 'Classroom is Unlocked (Click to Lock)'}
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              isLocked
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('chat')}
          className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'chat'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-850'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Questions</span>
          {unreadQuestions > 0 && (
            <span className="w-4 h-4 text-[10px] font-bold bg-rose-600 text-white rounded-full flex items-center justify-center">
              {unreadQuestions}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'roster'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-850'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Roster</span>
          {raisedHands.length > 0 && (
            <span className="w-4 h-4 text-[10px] font-bold bg-amber-500 text-white rounded-full flex items-center justify-center">
              {raisedHands.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('polls')}
          className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'polls'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-850'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Polls</span>
        </button>

        <button
          onClick={() => setActiveTab('quiz')}
          className={`py-2.5 flex items-center justify-center gap-1.5 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'quiz'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-850'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>MCQ Quiz</span>
        </button>
      </div>

      {/* Main Tab Viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================================================================= */}
        {/* TAB 1: TEACHER-ONLY PRIVATE STUDENT CHAT (Section 10 - 15)       */}
        {/* ================================================================= */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Strict Privacy Guaranteed:</span>
                <p className="text-[11px] text-blue-600/90 dark:text-blue-300/90">
                  Student questions are private to the teacher. No other student sees these messages
                  unless you click &quot;Publish to Class&quot;.
                </p>
              </div>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12 space-y-2 text-slate-400">
                <MessageSquare className="w-10 h-10 mx-auto stroke-1" />
                <p className="text-xs">No student questions yet.</p>
                <p className="text-[11px] text-slate-500">
                  Students can ask questions via the &quot;Ask Teacher&quot; button in their view.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{q.studentName}</span>
                        {q.isPublished && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                            Published {q.publishMode === 'anonymous' ? '(Anon)' : ''}
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(q.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      &ldquo;{q.message}&rdquo;
                    </p>

                    {/* Existing Teacher Reply */}
                    {q.teacherReply && (
                      <div className="pl-3 border-l-2 border-blue-500 text-[11px] text-blue-600 dark:text-blue-400">
                        <span className="font-bold block">Your Reply:</span>
                        <span>{q.teacherReply}</span>
                      </div>
                    )}

                    {/* Reply Input */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <input
                        type="text"
                        placeholder="Reply privately to student..."
                        value={replyTextMap[q.id] || ''}
                        onChange={(e) =>
                          setReplyTextMap((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply(q.id)}
                        className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleSendReply(q.id)}
                        className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer"
                        title="Send Private Reply"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Publish Actions */}
                    {!q.isPublished && (
                      <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500">
                        <span>Publish to Class:</span>
                        <button
                          onClick={() => handlePublishQuestion(q.id, 'anonymous')}
                          className="px-2 py-0.5 bg-slate-200 dark:bg-slate-750 hover:bg-slate-300 dark:hover:bg-slate-700 rounded font-semibold cursor-pointer"
                        >
                          Anonymous (Default)
                        </button>
                        <button
                          onClick={() => handlePublishQuestion(q.id, 'with_name')}
                          className="px-2 py-0.5 bg-slate-200 dark:bg-slate-750 hover:bg-slate-300 dark:hover:bg-slate-700 rounded font-semibold cursor-pointer"
                        >
                          Show Name
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: ROSTER & MODERATION (Section 21 - 25, 32 - 34)              */}
        {/* ================================================================= */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            {/* Quick Broadcast Announcement to All Students (Section 36) */}
            <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Class Announcement Banner
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. Quiz starts in 2 minutes..."
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendAnnouncement()}
                  className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
                <button
                  onClick={handleSendAnnouncement}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Broadcast
                </button>
                <button
                  onClick={handleClearAnnouncement}
                  title="Clear Active Announcement"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Raised Hands Alert Callout (Section 21) */}
            {raisedHands.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-200">
                  <Hand className="w-4 h-4 text-amber-600 animate-bounce" />
                  <span>Raised Hands Queue ({raisedHands.length})</span>
                </div>
                <div className="space-y-1.5">
                  {raisedHands.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-amber-200 dark:border-amber-900"
                    >
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {p.displayName} wants to ask a question
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleMic(p)}
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded cursor-pointer ${
                            p.isMicAllowed
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {p.isMicAllowed ? 'Mute' : 'Allow Mic'}
                        </button>
                        <button
                          onClick={() => handleLowerHand(p.id)}
                          className="px-2 py-0.5 text-[11px] bg-slate-100 text-slate-600 rounded hover:bg-slate-200 cursor-pointer"
                        >
                          Lower
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Participants Roster List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Connected Students ({participants.length})
              </span>

              {participants.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No students have joined yet. Share code <strong>{classCode}</strong> with your class.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            p.status === 'active'
                              ? 'bg-emerald-500'
                              : p.status === 'disconnected'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                            {p.displayName}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            Status: {p.status} {p.reconnectCount > 0 ? `(${p.reconnectCount} reconnects)` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Student Mic Toggle (Section 22) */}
                        <button
                          onClick={() => handleToggleMic(p)}
                          title={p.isMicAllowed ? 'Mute Student' : 'Allow Student to Speak'}
                          className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                            p.isMicAllowed
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                          }`}
                        >
                          {p.isMicAllowed ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                        </button>

                        {/* Remove Student (Section 33) */}
                        <button
                          onClick={() => handleRemoveStudent(p)}
                          title="Remove from Classroom"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: LIVE POLLS (Section 16, 17)                                */}
        {/* ================================================================= */}
        {activeTab === 'polls' && (
          <div className="space-y-4 text-xs">
            {/* Create Poll Card */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                Launch Live Poll
              </span>
              <input
                type="text"
                placeholder="Question (e.g. What is the primary theme?)"
                value={newPollQuestion}
                onChange={(e) => setNewPollQuestion(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />

              <div className="space-y-1.5">
                {newPollOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-5 font-bold text-slate-500">
                      {['A', 'B', 'C', 'D'][i]}
                    </span>
                    <input
                      type="text"
                      placeholder={`Option ${['A', 'B', 'C', 'D'][i]}`}
                      value={opt}
                      onChange={(e) => {
                        const updated = [...newPollOptions];
                        updated[i] = e.target.value;
                        setNewPollOptions(updated);
                      }}
                      className="flex-1 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleCreatePoll}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Start Poll
              </button>
            </div>

            {/* Poll History & Active Poll Cards */}
            <div className="space-y-3">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                Poll Activity
              </span>

              {polls.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No polls created yet in this session.
                </p>
              ) : (
                polls.map((poll) => {
                  const total = poll.totalVotes || 1;
                  return (
                    <div
                      key={poll.id}
                      className="p-3.5 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {poll.question}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            poll.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {poll.status}
                        </span>
                      </div>

                      {/* Distribution Bars */}
                      <div className="space-y-1.5">
                        {poll.options.map((opt) => {
                          const pct = Math.round((opt.votes / total) * 100);
                          return (
                            <div key={opt.id} className="space-y-0.5">
                              <div className="flex justify-between text-[11px]">
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {opt.label}. {opt.text}
                                </span>
                                <span className="font-mono text-slate-500">
                                  {opt.votes} ({pct}%)
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Controls (Section 16, 17) */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <button
                          onClick={() => handleTogglePollResults(poll.id, poll.showResultsToStudents)}
                          className={`flex items-center gap-1 font-semibold cursor-pointer ${
                            poll.showResultsToStudents
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {poll.showResultsToStudents ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Results Visible to Class</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hidden from Students</span>
                            </>
                          )}
                        </button>

                        {poll.status === 'active' && (
                          <button
                            onClick={() => handleClosePoll(poll.id)}
                            className="text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                          >
                            Stop Poll
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: LIVE MCQ QUIZ (Section 18 - 20)                            */}
        {/* ================================================================= */}
        {activeTab === 'quiz' && (
          <div className="space-y-4 text-xs">
            {/* Mode & Timer Selector */}
            <div className="p-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                Quiz Mode & Synchronized Timer
              </span>

              <div className="grid grid-cols-3 gap-2">
                {(['practice', 'test', 'challenge'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setQuizMode(m)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold capitalize cursor-pointer border ${
                      quizMode === m
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {m} Mode
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Timer:</span>
                {[10, 20, 30, 60].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setQuizTimer(sec)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs cursor-pointer ${
                      quizTimer === sec
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Launch from Part 03 Quiz Bank if available */}
            {availableQuizQuestions.length > 0 && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Launch from Project Quiz Bank</span>
                </span>
                <select
                  value={selectedPresetQuizId}
                  onChange={(e) => setSelectedPresetQuizId(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="">Select question from project...</option>
                  {availableQuizQuestions.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.question.slice(0, 60)}...
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleLaunchPresetQuiz}
                  disabled={!selectedPresetQuizId}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl cursor-pointer"
                >
                  Launch Question to Class
                </button>
              </div>
            )}

            {/* Custom Question Launcher */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                Custom Question
              </span>
              <input
                type="text"
                placeholder="Question text..."
                value={customQuizQuestion}
                onChange={(e) => setCustomQuizQuestion(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />

              <div className="space-y-1.5">
                {customQuizOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const updated = customQuizOptions.map((o, idx) => ({
                          ...o,
                          isCorrect: idx === i,
                        }));
                        setCustomQuizOptions(updated);
                      }}
                      className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center cursor-pointer ${
                        opt.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                      title={opt.isCorrect ? 'Correct Answer' : 'Click to mark correct'}
                    >
                      {['A', 'B', 'C', 'D'][i]}
                    </button>
                    <input
                      type="text"
                      placeholder={`Option ${['A', 'B', 'C', 'D'][i]}`}
                      value={opt.text}
                      onChange={(e) => {
                        const updated = [...customQuizOptions];
                        updated[i].text = e.target.value;
                        setCustomQuizOptions(updated);
                      }}
                      className="flex-1 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleLaunchCustomQuiz}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Launch Custom Quiz Question
              </button>
            </div>

            {/* Active Quiz Stats Card */}
            {activeQuiz && (
              <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 dark:text-blue-100">
                    Live Question Active
                  </span>
                  <span className="font-mono font-bold text-blue-600">
                    {activeQuiz.totalResponses} responses
                  </span>
                </div>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                  {activeQuiz.question}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-900">
                  <span className="text-[11px] text-slate-500">
                    Mode: <strong className="capitalize">{activeQuiz.mode}</strong>
                  </span>
                  {!activeQuiz.revealAnswer && (
                    <button
                      onClick={() => handleRevealQuizAnswer(activeQuiz.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                    >
                      Reveal Correct Answer
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
