import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  MessageSquare,
  Hand,
  Mic,
  MicOff,
  Radio,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart3,
  LogOut,
  Sparkles,
  Lock,
  Clock,
  Volume2,
  Smile,
} from 'lucide-react';
import { classroomService } from '../services/classroom/classroomClientService';
import {
  StudentParticipant,
  StudentPrivateQuestion,
  ClassPoll,
  ClassQuizQuestion,
  ClassroomBroadcastState,
} from '../types/classroom';

interface StudentClassroomViewProps {
  initialClassCode?: string;
  onExit: () => void;
}

export const StudentClassroomView: React.FC<StudentClassroomViewProps> = ({
  initialClassCode = '',
  onExit,
}) => {
  // Join Flow State
  const [classCode, setClassCode] = useState(initialClassCode);
  const [displayName, setDisplayName] = useState('');
  const [participant, setParticipant] = useState<StudentParticipant | null>(null);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Classroom Live State
  const [broadcastState, setBroadcastState] = useState<ClassroomBroadcastState | null>(null);
  const [publishedQuestions, setPublishedQuestions] = useState<StudentPrivateQuestion[]>([]);
  const [myQuestions, setMyQuestions] = useState<StudentPrivateQuestion[]>([]);
  const [activePoll, setActivePoll] = useState<ClassPoll | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<ClassQuizQuestion | null>(null);
  const [myPollVote, setMyPollVote] = useState<string | null>(null);
  const [myQuizAnswer, setMyQuizAnswer] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<{ isCorrect?: boolean; explanation?: string } | null>(null);
  const [quizRemainingSeconds, setQuizRemainingSeconds] = useState<number | null>(null);

  // Student Interaction Controls
  const [handRaised, setHandRaised] = useState(false);
  const [isMicAllowed, setIsMicAllowed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [questionSuccess, setQuestionSuccess] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('connected');

  // Heartbeat loop
  useEffect(() => {
    if (!participant || !classCode) return;

    const interval = setInterval(() => {
      classroomService.sendHeartbeat(classCode, participant.id, 'student');
    }, 15000);

    return () => clearInterval(interval);
  }, [participant, classCode]);

  // Quiz countdown timer
  useEffect(() => {
    if (!activeQuiz || activeQuiz.status !== 'active') {
      setQuizRemainingSeconds(null);
      return;
    }

    const updateTimer = () => {
      const rem = Math.max(0, Math.ceil((activeQuiz.expiresAt - Date.now()) / 1000));
      setQuizRemainingSeconds(rem);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeQuiz]);

  // Join Classroom Submit
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim() || !displayName.trim()) {
      setJoinError('Please enter both the class code and your name.');
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    const result = await classroomService.joinClass(classCode.trim(), displayName.trim());
    setIsJoining(false);

    if (result.success && result.participant) {
      setParticipant(result.participant);
      setClassInfo(result.classInfo);
      setBroadcastState(result.classInfo.activeBroadcast);
      subscribeToClassroom(result.participant);
    } else {
      setJoinError(result.error || 'Failed to join classroom.');
    }
  };

  // Subscribe to real-time events for this student
  const subscribeToClassroom = (currPart: StudentParticipant) => {
    classroomService.subscribeToClassEvents(
      currPart.classCode,
      'student',
      currPart.id,
      (ev) => {
        switch (ev.type) {
          case 'BROADCAST_STATE_UPDATED':
            setBroadcastState(ev.data);
            break;

          case 'STUDENT_STATUS_UPDATED':
            if (ev.data.id === currPart.id) {
              setParticipant(ev.data);
              setHandRaised(ev.data.handRaised);
              setIsMicAllowed(ev.data.isMicAllowed);
              setIsMuted(ev.data.isMuted);
            }
            break;

          case 'STUDENT_REMOVED':
            if (ev.data.participantId === currPart.id) {
              setParticipant((prev) => (prev ? { ...prev, status: 'removed' } : null));
            }
            break;

          case 'QUESTION_REPLIED':
            // Teacher replied privately to this student
            if (ev.data.studentId === currPart.id) {
              setMyQuestions((prev) => {
                const idx = prev.findIndex((q) => q.id === ev.data.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = ev.data;
                  return copy;
                }
                return [ev.data, ...prev];
              });
            }
            break;

          case 'QUESTION_PUBLISHED':
            setPublishedQuestions((prev) => [ev.data, ...prev]);
            break;

          case 'POLL_STARTED':
            setActivePoll(ev.data);
            setMyPollVote(null);
            break;

          case 'POLL_UPDATED':
            if (activePoll && activePoll.id === ev.data.id) {
              setActivePoll(ev.data);
            }
            break;

          case 'POLL_CLOSED':
            if (activePoll && activePoll.id === ev.data.id) {
              setActivePoll(null);
            }
            break;

          case 'QUIZ_LAUNCHED':
            setActiveQuiz(ev.data);
            setMyQuizAnswer(null);
            setQuizResult(null);
            break;

          case 'QUIZ_ANSWER_REVEALED':
            if (activeQuiz && activeQuiz.id === ev.data.id) {
              setActiveQuiz(ev.data);
            }
            break;

          case 'CLASS_STATUS_UPDATED':
            if (ev.data.status === 'ended') {
              setClassInfo((prev: any) => ({ ...prev, status: 'ended' }));
            }
            break;

          default:
            break;
        }
      }
    );
  };

  const handleToggleHandRaise = async () => {
    if (!participant) return;
    const nextState = !handRaised;
    setHandRaised(nextState);
    await classroomService.toggleHandRaise(classCode, participant.id, nextState);
  };

  const handleToggleMic = () => {
    if (!isMicAllowed) return;
    setIsMuted(!isMuted);
  };

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participant || !questionText.trim()) return;

    setQuestionError(null);
    const res = await classroomService.sendQuestion(
      classCode,
      participant.id,
      participant.displayName,
      questionText.trim()
    );

    if (res.success && res.question) {
      setMyQuestions((prev) => [res.question!, ...prev]);
      setQuestionText('');
      setQuestionSuccess(true);
      setTimeout(() => {
        setQuestionSuccess(false);
        setIsQuestionModalOpen(false);
      }, 1800);
    } else {
      setQuestionError(res.error || 'Failed to submit question.');
    }
  };

  const handleVotePoll = async (optionId: string) => {
    if (!activePoll || !participant || myPollVote) return;
    setMyPollVote(optionId);
    await classroomService.votePoll(classCode, activePoll.id, participant.id, optionId);
  };

  const handleAnswerQuiz = async (optionId: string) => {
    if (!activeQuiz || !participant || myQuizAnswer) return;
    setMyQuizAnswer(optionId);
    const res = await classroomService.answerQuiz(classCode, activeQuiz.id, participant.id, optionId);
    if (res.success) {
      setQuizResult(res);
    }
  };

  const handleLeaveClass = async () => {
    if (participant) {
      await classroomService.leaveClass(classCode, participant.id);
    }
    onExit();
  };

  // -------------------------------------------------------------------------
  // 1. JOIN FORM VIEW (If not joined yet)
  // -------------------------------------------------------------------------
  if (!participant) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div
          id="student-join-card"
          className="w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Join Live Classroom</h2>
            <p className="text-xs text-slate-400">
              Enter your class code and name to connect to your teacher&apos;s live studio.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4 text-xs">
            {joinError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl">
                {joinError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                6-Character Class Code
              </label>
              <input
                type="text"
                required
                maxLength={8}
                placeholder="e.g. STUDIO1"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                Your Display Name
              </label>
              <input
                type="text"
                required
                maxLength={40}
                placeholder="e.g. Alex Morgan"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-medium text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isJoining}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-blue-900/30 transition-all"
            >
              {isJoining ? 'Connecting to Room...' : 'Enter Classroom'}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={onExit}
              className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              Back to Studio Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 2. WAITING ROOM SCREEN (Section 7)
  // -------------------------------------------------------------------------
  if (participant.status === 'in_waiting_room') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center space-y-4">
          <Clock className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
          <h2 className="text-lg font-bold">You are in the Waiting Room</h2>
          <p className="text-xs text-slate-400">
            Teacher <strong>{classInfo?.teacherName || 'Teacher'}</strong> will admit you shortly.
            Please stay on this page.
          </p>
          <button
            onClick={handleLeaveClass}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Leave Waiting Room
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 3. REMOVED PARTICIPANT SCREEN (Section 33)
  // -------------------------------------------------------------------------
  if (participant.status === 'removed') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 border border-rose-800 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-rose-400">Removed from Classroom</h2>
          <p className="text-xs text-slate-400">
            You were removed from this session by the teacher and cannot rejoin this room.
          </p>
          <button
            onClick={onExit}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 4. ACTIVE STUDENT LIVE CLASSROOM VIEWPORT
  // -------------------------------------------------------------------------
  const isSessionEnded = classInfo?.status === 'ended';

  return (
    <div
      id="student-classroom-viewport"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none font-sans"
    >
      {/* Student Top Header (Minimal, focused, zero teacher clutter) */}
      <header className="h-14 px-4 sm:px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
              LIVE
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700 hidden sm:block" />
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-md">
              {classInfo?.className || 'Live Teaching Session'}
            </h1>
            <p className="text-[10px] text-slate-400">
              Instructor: {classInfo?.teacherName || 'Teacher'} • Room: {classCode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Student Badge */}
          <div className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
            {participant.displayName}
          </div>

          {/* Leave Button */}
          <button
            onClick={handleLeaveClass}
            title="Leave Classroom"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 hover:border-rose-800 border border-slate-700 text-xs text-slate-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* Pinned Teacher Announcement if active */}
      {broadcastState?.announcement && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-4 py-2 text-xs text-white border-b border-blue-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="font-semibold">Announcement:</span>
            <span>{broadcastState.announcement}</span>
          </div>
        </div>
      )}

      {/* Main Broadcast Stage */}
      <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden bg-slate-900/50">
        {isSessionEnded ? (
          <div className="text-center space-y-3 p-8 bg-slate-900/80 border border-slate-800 rounded-3xl max-w-md">
            <CheckCircle2 className="w-12 h-12 text-blue-400 mx-auto" />
            <h3 className="text-lg font-bold">Class Session Has Ended</h3>
            <p className="text-xs text-slate-400">
              The teacher has concluded this class. Thank you for participating!
            </p>
            <button
              onClick={onExit}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white cursor-pointer"
            >
              Exit to Home
            </button>
          </div>
        ) : (
          <div className="w-full h-full max-w-5xl max-h-[80vh] flex flex-col items-center justify-center relative">
            {/* Canvas / Presentation Display */}
            <div className="w-full h-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative flex items-center justify-center">
              {/* If Whiteboard */}
              {broadcastState?.contentMode === 'whiteboard' ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="p-4 rounded-3xl bg-slate-800/80 border border-slate-700 max-w-lg space-y-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                      Teacher Live Whiteboard
                    </span>
                    <p className="text-sm font-medium text-slate-200">
                      The instructor is actively drawing and explaining on the studio whiteboard.
                    </p>
                  </div>
                </div>
              ) : broadcastState?.contentMode === 'mind_map' ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="p-4 rounded-3xl bg-slate-800/80 border border-slate-700 max-w-lg space-y-2">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
                      Interactive 3D Mind Map
                    </span>
                    <p className="text-sm font-medium text-slate-200">
                      Exploring knowledge concepts and interconnected nodes with the teacher.
                    </p>
                  </div>
                </div>
              ) : (
                /* Default: Synchronized Slide Canvas */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="p-8 rounded-3xl bg-slate-850 border border-slate-700/80 max-w-xl w-full text-left space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        Slide {(broadcastState?.currentSlideIndex || 0) + 1} of{' '}
                        {broadcastState?.totalSlides || 4}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Synchronized Feed</span>
                    </div>

                    <h3 className="text-xl font-bold text-white leading-tight">
                      Cellular Structure, Mitochondria & ATP Respiration
                    </h3>

                    <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
                      <li>Outer and inner membrane folding (cristae) maximizing surface area.</li>
                      <li>Glycolysis in cytoplasm followed by the Krebs Cycle in the matrix.</li>
                      <li>Oxidative phosphorylation and the electron transport chain pump.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Teacher Camera Overlay (PiP corner) */}
              <div className="absolute top-4 right-4 w-36 h-24 sm:w-48 sm:h-32 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl overflow-hidden flex flex-col items-center justify-center">
                {broadcastState?.teacherCameraActive ? (
                  <div className="w-full h-full relative bg-slate-800 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300"
                      alt="Instructor Video"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-2 flex items-center gap-1 bg-slate-900/80 px-1.5 py-0.5 rounded text-[9px] text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{classInfo?.teacherName || 'Teacher'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-2 text-slate-500 text-[10px]">
                    <Users className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                    <span>Camera Off</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Active Poll Dialog for Student (Section 16, 17) */}
      {activePoll && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-40 w-full max-w-sm bg-slate-900 border border-blue-600/80 rounded-2xl p-4 shadow-2xl space-y-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4" />
              <span>Live Poll</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {myPollVote ? 'Vote Submitted' : 'Vote Now'}
            </span>
          </div>

          <p className="text-xs font-semibold text-white">{activePoll.question}</p>

          <div className="space-y-1.5 text-xs">
            {activePoll.options.map((opt) => {
              const isSelected = myPollVote === opt.id;
              const total = activePoll.totalVotes || 1;
              const pct = Math.round((opt.votes / total) * 100);

              return (
                <button
                  key={opt.id}
                  onClick={() => handleVotePoll(opt.id)}
                  disabled={Boolean(myPollVote)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all cursor-pointer relative overflow-hidden border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 font-bold'
                      : myPollVote
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {/* Results bar if revealed by teacher (Section 17) */}
                  {activePoll.showResultsToStudents && (
                    <div
                      className="absolute inset-y-0 left-0 bg-blue-500/20 pointer-events-none"
                      style={{ width: `${pct}%` }}
                    />
                  )}

                  <div className="flex justify-between items-center relative z-10">
                    <span>
                      {opt.label}. {opt.text}
                    </span>
                    {activePoll.showResultsToStudents && (
                      <span className="font-mono text-[10px] opacity-80">{pct}%</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Active MCQ Quiz Dialog for Student (Section 18, 19, 20) */}
      {activeQuiz && (
        <div className="fixed bottom-20 left-4 sm:left-6 z-40 w-full max-w-sm bg-slate-900 border border-purple-600/80 rounded-2xl p-4 shadow-2xl space-y-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>Live MCQ ({activeQuiz.mode} mode)</span>
            </span>

            {quizRemainingSeconds !== null && (
              <span className="text-xs font-mono font-bold bg-purple-950 text-purple-300 px-2 py-0.5 rounded-lg border border-purple-800">
                {quizRemainingSeconds}s
              </span>
            )}
          </div>

          <p className="text-xs font-semibold text-white">{activeQuiz.question}</p>

          <div className="space-y-1.5 text-xs">
            {activeQuiz.options.map((opt) => {
              const isSelected = myQuizAnswer === opt.id;
              const isRevealed = activeQuiz.revealAnswer;
              const isCorrectAnswer = opt.isCorrect;

              let btnStyle = 'bg-slate-800 text-slate-200 border-slate-700';
              if (isSelected) {
                btnStyle = 'bg-purple-600 text-white border-purple-500 font-bold';
              }
              if (isRevealed) {
                if (isCorrectAnswer) {
                  btnStyle = 'bg-emerald-600/90 text-white border-emerald-500 font-bold';
                } else if (isSelected && !isCorrectAnswer) {
                  btnStyle = 'bg-rose-600/90 text-white border-rose-500';
                }
              }

              return (
                <button
                  key={opt.id}
                  onClick={() => handleAnswerQuiz(opt.id)}
                  disabled={Boolean(myQuizAnswer)}
                  className={`w-full p-2.5 rounded-xl text-left transition-all cursor-pointer border ${btnStyle}`}
                >
                  <div className="flex justify-between items-center">
                    <span>
                      {opt.label}. {opt.text}
                    </span>
                    {isRevealed && isCorrectAnswer && (
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation if revealed */}
          {activeQuiz.revealAnswer && activeQuiz.explanation && (
            <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-[11px] text-slate-300">
              <span className="font-bold text-purple-400 block mb-0.5">Explanation:</span>
              {activeQuiz.explanation}
            </div>
          )}
        </div>
      )}

      {/* Published Questions Drawer / Floating Accordion if any (Section 14) */}
      {publishedQuestions.length > 0 && (
        <div className="fixed top-18 right-4 z-20 w-80 bg-slate-900/95 border border-slate-800 rounded-2xl p-3 shadow-xl space-y-2 max-h-48 overflow-y-auto text-xs hidden lg:block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Class Q&A Broadcast
          </span>
          {publishedQuestions.map((q) => (
            <div key={q.id} className="p-2 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
              <p className="text-slate-200 font-medium">&ldquo;{q.message}&rdquo;</p>
              <span className="text-[10px] text-slate-400 block">— {q.studentName}</span>
              {q.teacherReply && (
                <p className="text-[11px] text-blue-400 pt-1 border-t border-slate-700">
                  <span className="font-bold">Teacher:</span> {q.teacherReply}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Student Action Bar (Bottom docked controls, Section 71) */}
      <footer className="h-16 px-4 sm:px-6 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-2">
          {/* Ask Teacher Button (Opens Strict Teacher-Only Chat) */}
          <button
            id="btn-student-ask-teacher"
            onClick={() => setIsQuestionModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Ask Teacher</span>
          </button>

          {/* Raise Hand Button */}
          <button
            id="btn-student-raise-hand"
            onClick={handleToggleHandRaise}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              handRaised
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
            }`}
          >
            <Hand className="w-4 h-4" />
            <span>{handRaised ? 'Hand Raised' : 'Raise Hand'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Microphone status & toggle (Only enabled if teacher allowed it! Section 22) */}
          <button
            onClick={handleToggleMic}
            disabled={!isMicAllowed}
            title={
              isMicAllowed
                ? isMuted
                  ? 'Microphone is Muted (Click to Unmute)'
                  : 'Microphone is Live'
                : 'Teacher has muted student microphone'
            }
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              !isMicAllowed
                ? 'bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed'
                : isMuted
                ? 'bg-slate-800 text-slate-300 border border-slate-700 cursor-pointer hover:bg-slate-750'
                : 'bg-emerald-600 text-white border border-emerald-500 cursor-pointer'
            }`}
          >
            {isMicAllowed ? (
              isMuted ? (
                <>
                  <MicOff className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">Muted</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-white animate-pulse" />
                  <span className="hidden sm:inline">Mic Live</span>
                </>
              )
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mic Locked</span>
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Private Question Modal (Strict Teacher-Only, Section 10 - 15) */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Ask Question to Teacher</h3>
              </div>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-blue-950/40 border border-blue-900 rounded-xl text-[11px] text-blue-300 flex items-start gap-2">
              <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Your message is private. Only the instructor will receive it. Other students cannot
                read this question.
              </span>
            </div>

            {questionError && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs">
                {questionError}
              </div>
            )}

            {questionSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-emerald-300">
                  Question sent privately to the teacher!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendQuestion} className="space-y-3">
                <textarea
                  rows={3}
                  required
                  placeholder="Type your question here..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuestionModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Send to Teacher
                  </button>
                </div>
              </form>
            )}

            {/* My Previous Questions & Replies */}
            {myQuestions.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Your Questions & Replies ({myQuestions.length})
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto text-xs">
                  {myQuestions.map((q) => (
                    <div key={q.id} className="p-2.5 bg-slate-800/80 rounded-xl space-y-1">
                      <p className="text-slate-200">&ldquo;{q.message}&rdquo;</p>
                      {q.teacherReply ? (
                        <div className="text-[11px] text-emerald-400 pl-2 border-l-2 border-emerald-500">
                          <span className="font-bold">Teacher:</span> {q.teacherReply}
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-400">Waiting for reply...</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
