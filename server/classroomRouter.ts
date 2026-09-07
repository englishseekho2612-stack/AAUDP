import { Router, Request, Response } from 'express';
import {
  ClassroomSession,
  StudentParticipant,
  StudentPrivateQuestion,
  ClassPoll,
  ClassQuizQuestion,
  ClassroomAttendanceRecord,
  ClassroomAuditEvent,
  ClassroomBroadcastState,
  PollOption,
} from '../src/types/classroom.js';

export const classroomRouter = Router();

// ---------------------------------------------------------------------------
// IN-MEMORY REAL-TIME STORAGE (Separated from personal local projects)
// ---------------------------------------------------------------------------
const sessions = new Map<string, ClassroomSession>();
const participants = new Map<string, Map<string, StudentParticipant>>();
const questions = new Map<string, StudentPrivateQuestion[]>();
const polls = new Map<string, ClassPoll[]>();
const pollVotes = new Map<string, Map<string, string>>(); // pollId -> Map<studentId, optionId>
const quizzes = new Map<string, ClassQuizQuestion[]>();
const quizAnswers = new Map<string, Map<string, { optionId: string; isCorrect: boolean }>>(); // quizId -> Map<studentId, ans>
const attendanceHistory = new Map<string, ClassroomAttendanceRecord[]>();
const auditLogs = new Map<string, ClassroomAuditEvent[]>();
const blockedParticipants = new Map<string, Set<string>>(); // classCode -> Set<studentId>
const rateLimiter = new Map<string, number[]>(); // studentId -> timestamps

// SSE Connected Clients Map
interface SSEClient {
  id: string;
  classCode: string;
  role: 'teacher' | 'student';
  participantId?: string;
  res: Response;
}
const sseClients = new Map<string, Set<SSEClient>>(); // classCode -> Set<SSEClient>

// Helper to broadcast SSE events safely respecting strict privacy boundaries
function broadcastToClass(
  classCode: string,
  eventType: string,
  payload: any,
  options?: {
    teacherOnly?: boolean;
    targetStudentId?: string;
  }
) {
  const clients = sseClients.get(classCode);
  if (!clients) return;

  const dataString = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;

  for (const client of clients) {
    if (options?.teacherOnly && client.role !== 'teacher') {
      continue;
    }
    if (options?.targetStudentId && client.role === 'student' && client.participantId !== options.targetStudentId) {
      continue;
    }
    try {
      client.res.write(dataString);
    } catch {
      // client connection will be cleaned up on error
    }
  }
}

// Generate human-friendly 6-character uppercase class code (e.g., "ENG101", "BIO204")
function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Seed a default demo class if empty for immediate ready-to-test experience
function initDemoClass() {
  const code = 'STUDIO1';
  if (!sessions.has(code)) {
    const defaultBroadcast: ClassroomBroadcastState = {
      contentMode: 'slides',
      currentSlideIndex: 0,
      totalSlides: 4,
      teacherCameraActive: true,
      teacherMicActive: true,
      announcement: 'Welcome to the live interactive masterclass!',
      lastUpdated: Date.now(),
    };

    const session: ClassroomSession = {
      id: 'session_demo_1',
      classCode: code,
      className: 'Class 10 Biology — Cell Structure & Respiration',
      subject: 'Biology',
      teacherName: 'Dr. Sarah Jenkins',
      description: 'Interactive biology masterclass with dual-canvas slides, 3D mind mapping, and live MCQ checkpoints.',
      status: 'live',
      isLocked: false,
      hasWaitingRoom: false,
      activeBroadcast: defaultBroadcast,
      privacyBoundaries: {
        showTeacherNotesToClass: false,
        hidePrivateQuestionsFromStudents: true,
        allowStudentMic: false,
        allowStudentCamera: false,
        allowStudentScreenShare: false,
      },
      studentCount: 0,
      createdAt: Date.now() - 3600000,
      startedAt: Date.now() - 1200000,
    };
    sessions.set(code, session);
    participants.set(code, new Map());
    questions.set(code, []);
    polls.set(code, []);
    quizzes.set(code, []);
    auditLogs.set(code, []);
  }
}
initDemoClass();

// ---------------------------------------------------------------------------
// 1. CLASSROOM SESSIONS & MANAGEMENT
// ---------------------------------------------------------------------------

// GET /api/classroom/classes - List all classes for teacher dashboard
classroomRouter.get('/classes', (_req: Request, res: Response) => {
  const list = Array.from(sessions.values()).map((s) => {
    const currentParts = participants.get(s.classCode);
    const activeCount = currentParts ? Array.from(currentParts.values()).filter((p) => p.status === 'active').length : 0;
    return {
      ...s,
      studentCount: activeCount,
    };
  });
  res.json({ success: true, classes: list });
});

// POST /api/classroom/classes - Create new class (Section 3)
classroomRouter.post('/classes', (req: Request, res: Response) => {
  const { className, subject, teacherName, description, scheduledTime, durationMinutes, associatedProjectId } = req.body;

  if (!className || typeof className !== 'string') {
    return res.status(400).json({ success: false, error: 'Class name is required' });
  }

  const classCode = generateClassCode();
  const session: ClassroomSession = {
    id: `class_${Date.now()}`,
    classCode,
    className: className.trim(),
    subject: subject?.trim(),
    teacherName: teacherName?.trim() || 'Teacher',
    description: description?.trim(),
    scheduledTime,
    durationMinutes: typeof durationMinutes === 'number' ? durationMinutes : 45,
    status: 'scheduled',
    isLocked: false,
    hasWaitingRoom: false,
    activeBroadcast: {
      contentMode: 'slides',
      currentSlideIndex: 0,
      totalSlides: 4,
      teacherCameraActive: false,
      teacherMicActive: false,
      announcement: null,
      lastUpdated: Date.now(),
    },
    privacyBoundaries: {
      showTeacherNotesToClass: false,
      hidePrivateQuestionsFromStudents: true,
      allowStudentMic: false,
      allowStudentCamera: false,
      allowStudentScreenShare: false,
    },
    studentCount: 0,
    createdAt: Date.now(),
    associatedProjectId,
  };

  sessions.set(classCode, session);
  participants.set(classCode, new Map());
  questions.set(classCode, []);
  polls.set(classCode, []);
  quizzes.set(classCode, []);
  auditLogs.set(classCode, [
    {
      id: `audit_${Date.now()}`,
      classCode,
      type: 'CLASS_CREATED',
      timestamp: Date.now(),
      description: `Class "${session.className}" created with code ${classCode}`,
      actor: session.teacherName,
    },
  ]);

  res.json({ success: true, session });
});

// GET /api/classroom/classes/:classCode - Get single class info & public metadata
classroomRouter.get('/classes/:classCode', (req: Request, res: Response) => {
  const classCode = req.params.classCode.toUpperCase();
  const session = sessions.get(classCode);

  if (!session) {
    return res.status(404).json({ success: false, error: 'Classroom not found. Please verify the 6-character code.' });
  }

  const parts = participants.get(classCode);
  const activeCount = parts ? Array.from(parts.values()).filter((p) => p.status === 'active').length : 0;

  // Safe representation (never leak teacher private notes or sensitive server state)
  res.json({
    success: true,
    classInfo: {
      classCode: session.classCode,
      className: session.className,
      subject: session.subject,
      teacherName: session.teacherName,
      status: session.status,
      isLocked: session.isLocked,
      hasWaitingRoom: session.hasWaitingRoom,
      studentCount: activeCount,
      activeBroadcast: session.activeBroadcast,
    },
  });
});

// POST /api/classroom/classes/:classCode/status - Update class status (Start / Pause / End)
classroomRouter.post('/classes/:classCode/status', (req: Request, res: Response) => {
  const classCode = req.params.classCode.toUpperCase();
  const { status, isLocked, hasWaitingRoom } = req.body;
  const session = sessions.get(classCode);

  if (!session) {
    return res.status(404).json({ success: false, error: 'Classroom not found' });
  }

  if (status) {
    session.status = status;
    if (status === 'live' && !session.startedAt) {
      session.startedAt = Date.now();
    }
    if (status === 'ended') {
      session.endedAt = Date.now();
      // Record attendance record at end of class
      finalizeAttendance(classCode);
    }
  }

  if (typeof isLocked === 'boolean') {
    session.isLocked = isLocked;
    broadcastToClass(classCode, 'CLASS_LOCKED', { isLocked });
  }

  if (typeof hasWaitingRoom === 'boolean') {
    session.hasWaitingRoom = hasWaitingRoom;
  }

  broadcastToClass(classCode, 'CLASS_STATUS_UPDATED', {
    status: session.status,
    isLocked: session.isLocked,
    hasWaitingRoom: session.hasWaitingRoom,
  });

  res.json({ success: true, session });
});

// POST /api/classroom/classes/:classCode/broadcast - Teacher updates broadcast feed
classroomRouter.post('/classes/:classCode/broadcast', (req: Request, res: Response) => {
  const classCode = req.params.classCode.toUpperCase();
  const session = sessions.get(classCode);

  if (!session) {
    return res.status(404).json({ success: false, error: 'Classroom not found' });
  }

  const {
    contentMode,
    currentSlideIndex,
    totalSlides,
    selectedMindMapNodeId,
    whiteboardSnapshotUrl,
    teacherCameraActive,
    teacherMicActive,
    announcement,
    activePollId,
    activeQuizId,
  } = req.body;

  session.activeBroadcast = {
    contentMode: contentMode || session.activeBroadcast.contentMode,
    currentSlideIndex: typeof currentSlideIndex === 'number' ? currentSlideIndex : session.activeBroadcast.currentSlideIndex,
    totalSlides: typeof totalSlides === 'number' ? totalSlides : session.activeBroadcast.totalSlides,
    selectedMindMapNodeId: selectedMindMapNodeId !== undefined ? selectedMindMapNodeId : session.activeBroadcast.selectedMindMapNodeId,
    whiteboardSnapshotUrl: whiteboardSnapshotUrl || session.activeBroadcast.whiteboardSnapshotUrl,
    teacherCameraActive: typeof teacherCameraActive === 'boolean' ? teacherCameraActive : session.activeBroadcast.teacherCameraActive,
    teacherMicActive: typeof teacherMicActive === 'boolean' ? teacherMicActive : session.activeBroadcast.teacherMicActive,
    announcement: announcement !== undefined ? announcement : session.activeBroadcast.announcement,
    activePollId: activePollId !== undefined ? activePollId : session.activeBroadcast.activePollId,
    activeQuizId: activeQuizId !== undefined ? activeQuizId : session.activeBroadcast.activeQuizId,
    lastUpdated: Date.now(),
  };

  // Broadcast to all connected students and teacher windows
  broadcastToClass(classCode, 'BROADCAST_STATE_UPDATED', session.activeBroadcast);

  res.json({ success: true, activeBroadcast: session.activeBroadcast });
});

// ---------------------------------------------------------------------------
// 2. STUDENT JOIN, LEAVE, WAITING ROOM & ATTENDANCE TRACKING
// ---------------------------------------------------------------------------

// POST /api/classroom/join - Student joins class (Section 6, 7, 30)
classroomRouter.post('/join', (req: Request, res: Response) => {
  const { classCode, displayName } = req.body;

  if (!classCode || !displayName || typeof displayName !== 'string') {
    return res.status(400).json({ success: false, error: 'Class code and student display name are required.' });
  }

  const code = classCode.trim().toUpperCase();
  const session = sessions.get(code);

  if (!session) {
    return res.status(404).json({ success: false, error: 'Classroom code is invalid or does not exist.' });
  }

  if (session.status === 'ended') {
    return res.status(400).json({ success: false, error: 'This class session has already ended.' });
  }

  const cleanName = displayName.trim().slice(0, 40);

  // Check if student was removed / blocked by teacher (Section 33)
  const blocked = blockedParticipants.get(code);
  if (blocked && blocked.has(cleanName.toLowerCase())) {
    return res.status(403).json({
      success: false,
      error: 'You have been removed from this classroom session by the teacher and cannot rejoin.',
    });
  }

  // Check if class is locked (Section 34)
  if (session.isLocked) {
    return res.status(423).json({
      success: false,
      error: 'The teacher has locked this classroom. No new participants may enter.',
    });
  }

  const parts = participants.get(code) || new Map();
  participants.set(code, parts);

  const participantId = `student_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const initialStatus = session.hasWaitingRoom ? 'in_waiting_room' : 'active';

  const newParticipant: StudentParticipant = {
    id: participantId,
    classCode: code,
    displayName: cleanName,
    joinedAt: Date.now(),
    status: initialStatus,
    handRaised: false,
    isMicAllowed: false,
    isMuted: true,
    reconnectCount: 0,
    lastPingAt: Date.now(),
    totalDurationMs: 0,
  };

  parts.set(participantId, newParticipant);

  // Notify teacher
  broadcastToClass(code, 'STUDENT_JOINED', newParticipant);

  res.json({
    success: true,
    participant: newParticipant,
    classInfo: {
      classCode: session.classCode,
      className: session.className,
      subject: session.subject,
      teacherName: session.teacherName,
      status: session.status,
      activeBroadcast: session.activeBroadcast,
      hasWaitingRoom: session.hasWaitingRoom,
    },
  });
});

// POST /api/classroom/heartbeat - Student/Teacher presence ping (Section 65)
classroomRouter.post('/heartbeat', (req: Request, res: Response) => {
  const { classCode, participantId, role } = req.body;
  if (!classCode || !participantId) {
    return res.status(400).json({ success: false, error: 'Missing classCode or participantId' });
  }

  const code = classCode.toUpperCase();
  const parts = participants.get(code);
  if (parts && parts.has(participantId)) {
    const p = parts.get(participantId)!;
    p.lastPingAt = Date.now();
    p.totalDurationMs = Date.now() - p.joinedAt;
    if (p.status === 'disconnected') {
      p.status = 'active';
      p.reconnectCount += 1;
      broadcastToClass(code, 'STUDENT_RECONNECTED', { participantId, displayName: p.displayName });
    }
  }

  res.json({ success: true, timestamp: Date.now() });
});

// POST /api/classroom/leave - Participant voluntarily leaves class
classroomRouter.post('/leave', (req: Request, res: Response) => {
  const { classCode, participantId } = req.body;
  if (!classCode || !participantId) {
    return res.status(400).json({ success: false, error: 'Missing parameters' });
  }

  const code = classCode.toUpperCase();
  const parts = participants.get(code);
  if (parts && parts.has(participantId)) {
    const p = parts.get(participantId)!;
    p.status = 'disconnected';
    p.leftAt = Date.now();
    broadcastToClass(code, 'STUDENT_LEFT', { participantId, displayName: p.displayName });
  }

  res.json({ success: true });
});

// GET /api/classroom/participants - List participants (Teacher view)
classroomRouter.get('/participants', (req: Request, res: Response) => {
  const classCode = (req.query.classCode as string)?.toUpperCase();
  if (!classCode) {
    return res.status(400).json({ success: false, error: 'classCode required' });
  }

  const parts = participants.get(classCode);
  const list = parts ? Array.from(parts.values()) : [];
  res.json({ success: true, participants: list });
});

// POST /api/classroom/moderate - Teacher moderation controls (Section 21, 22, 32, 33, 73)
classroomRouter.post('/moderate', (req: Request, res: Response) => {
  const { classCode, participantId, action, value } = req.body;
  if (!classCode || !participantId || !action) {
    return res.status(400).json({ success: false, error: 'Missing parameters' });
  }

  const code = classCode.toUpperCase();
  const parts = participants.get(code);
  const participant = parts?.get(participantId);

  if (!participant) {
    return res.status(404).json({ success: false, error: 'Participant not found' });
  }

  switch (action) {
    case 'approve_waiting_room':
      participant.status = 'active';
      broadcastToClass(code, 'STUDENT_STATUS_UPDATED', participant);
      break;

    case 'lower_hand':
      participant.handRaised = false;
      broadcastToClass(code, 'STUDENT_STATUS_UPDATED', participant);
      break;

    case 'allow_mic':
      participant.isMicAllowed = Boolean(value);
      participant.isMuted = !value;
      broadcastToClass(code, 'STUDENT_STATUS_UPDATED', participant);
      break;

    case 'mute':
      participant.isMuted = true;
      broadcastToClass(code, 'STUDENT_STATUS_UPDATED', participant);
      break;

    case 'remove': {
      // Remove student from classroom and block rejoining (Section 33)
      participant.status = 'removed';
      participant.leftAt = Date.now();
      const blocked = blockedParticipants.get(code) || new Set();
      blocked.add(participant.displayName.toLowerCase());
      blockedParticipants.set(code, blocked);

      broadcastToClass(code, 'STUDENT_REMOVED', {
        participantId: participant.id,
        displayName: participant.displayName,
      });
      break;
    }

    default:
      return res.status(400).json({ success: false, error: `Unknown moderation action: ${action}` });
  }

  res.json({ success: true, participant });
});

// POST /api/classroom/hand-raise - Student raises/lowers hand (Section 21)
classroomRouter.post('/hand-raise', (req: Request, res: Response) => {
  const { classCode, participantId, raised } = req.body;
  if (!classCode || !participantId) {
    return res.status(400).json({ success: false, error: 'Missing parameters' });
  }

  const code = classCode.toUpperCase();
  const parts = participants.get(code);
  const p = parts?.get(participantId);

  if (!p) {
    return res.status(404).json({ success: false, error: 'Participant not found' });
  }

  p.handRaised = Boolean(raised);
  p.handRaisedAt = p.handRaised ? Date.now() : undefined;

  broadcastToClass(code, 'STUDENT_STATUS_UPDATED', p);

  res.json({ success: true, handRaised: p.handRaised });
});

// ---------------------------------------------------------------------------
// 3. STRICT TEACHER-ONLY CHAT & RATE LIMITING (Section 10 - 15, 72)
// ---------------------------------------------------------------------------

// POST /api/classroom/messages - Student sends question (Strict Teacher-Only)
classroomRouter.post('/messages', (req: Request, res: Response) => {
  const { classCode, studentId, studentName, message } = req.body;

  if (!classCode || !studentId || !message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid message request' });
  }

  const code = classCode.toUpperCase();
  const session = sessions.get(code);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Classroom not found' });
  }

  // Rate Limiter: Max 5 questions per 60 seconds per student (Section 15, 76)
  const now = Date.now();
  const timestamps = rateLimiter.get(studentId) || [];
  const recent = timestamps.filter((t) => now - t < 60000);
  if (recent.length >= 5) {
    return res.status(429).json({
      success: false,
      error: 'You are sending questions too quickly. Please wait a moment before sending another question.',
    });
  }
  recent.push(now);
  rateLimiter.set(studentId, recent);

  const qList = questions.get(code) || [];
  questions.set(code, qList);

  const newQuestion: StudentPrivateQuestion = {
    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    classCode: code,
    studentId,
    studentName: studentName || 'Student',
    message: message.trim().slice(0, 500),
    timestamp: now,
    status: 'unread',
    isPublished: false,
    publishMode: 'anonymous',
  };

  qList.push(newQuestion);

  // CRITICAL PRIVACY ARCHITECTURE:
  // ONLY broadcast to the teacher! Other students NEVER receive this message directly.
  broadcastToClass(code, 'QUESTION_RECEIVED', newQuestion, { teacherOnly: true });

  res.json({ success: true, question: newQuestion });
});

// GET /api/classroom/messages - Fetch messages with strict role-based privacy
classroomRouter.get('/messages', (req: Request, res: Response) => {
  const classCode = (req.query.classCode as string)?.toUpperCase();
  const role = req.query.role as string;
  const studentId = req.query.studentId as string;

  if (!classCode) {
    return res.status(400).json({ success: false, error: 'classCode required' });
  }

  const qList = questions.get(classCode) || [];

  // If teacher: Return all messages
  if (role === 'teacher') {
    return res.json({ success: true, messages: qList });
  }

  // If student: Return ONLY own messages + teacher-published questions! (Section 10, 11, 75)
  const safeStudentList = qList
    .filter((q) => q.studentId === studentId || q.isPublished)
    .map((q) => {
      if (q.studentId === studentId) {
        return q; // student sees their own question + teacher's private reply
      }
      // Published question from another student: respect anonymity setting (Section 14)
      return {
        ...q,
        studentName: q.publishMode === 'anonymous' ? 'Classmate (Anonymous)' : q.studentName,
        teacherReply: q.teacherReply,
      };
    });

  res.json({ success: true, messages: safeStudentList });
});

// POST /api/classroom/messages/:id/reply - Teacher replies privately (Section 13)
classroomRouter.post('/messages/:id/reply', (req: Request, res: Response) => {
  const { classCode, teacherReply } = req.body;
  const questionId = req.params.id;

  if (!classCode || !teacherReply) {
    return res.status(400).json({ success: false, error: 'Missing reply or classCode' });
  }

  const code = classCode.toUpperCase();
  const qList = questions.get(code) || [];
  const q = qList.find((item) => item.id === questionId);

  if (!q) {
    return res.status(404).json({ success: false, error: 'Question not found' });
  }

  q.teacherReply = teacherReply.trim();
  q.teacherRepliedAt = Date.now();
  q.status = 'answered';

  // Send reply ONLY to that student and teacher (Section 13)
  broadcastToClass(code, 'QUESTION_REPLIED', q, { targetStudentId: q.studentId });
  broadcastToClass(code, 'QUESTION_REPLIED', q, { teacherOnly: true });

  res.json({ success: true, question: q });
});

// POST /api/classroom/messages/:id/publish - Teacher publishes question to class (Section 14)
classroomRouter.post('/messages/:id/publish', (req: Request, res: Response) => {
  const { classCode, publishMode = 'anonymous' } = req.body;
  const questionId = req.params.id;

  if (!classCode) {
    return res.status(400).json({ success: false, error: 'classCode required' });
  }

  const code = classCode.toUpperCase();
  const qList = questions.get(code) || [];
  const q = qList.find((item) => item.id === questionId);

  if (!q) {
    return res.status(404).json({ success: false, error: 'Question not found' });
  }

  q.isPublished = true;
  q.publishMode = publishMode === 'with_name' ? 'with_name' : 'anonymous';
  q.publishedAt = Date.now();
  q.status = 'published';

  // Broadcast published question to entire class
  const publishedPayload = {
    ...q,
    studentName: q.publishMode === 'anonymous' ? 'Classmate (Anonymous)' : q.studentName,
  };
  broadcastToClass(code, 'QUESTION_PUBLISHED', publishedPayload);

  res.json({ success: true, question: q });
});

// ---------------------------------------------------------------------------
// 4. LIVE POLL ENGINE (Section 16, 17)
// ---------------------------------------------------------------------------

// POST /api/classroom/polls - Teacher creates/starts a live poll
classroomRouter.post('/polls', (req: Request, res: Response) => {
  const { classCode, question, options } = req.body;
  if (!classCode || !question || !Array.isArray(options)) {
    return res.status(400).json({ success: false, error: 'Invalid poll data' });
  }

  const code = classCode.toUpperCase();
  const pollList = polls.get(code) || [];
  polls.set(code, pollList);

  const formattedOptions: PollOption[] = options.map((opt: any, idx: number) => ({
    id: `opt_${idx}`,
    label: ['A', 'B', 'C', 'D', 'E'][idx] || `${idx + 1}`,
    text: typeof opt === 'string' ? opt : opt.text || `Option ${idx + 1}`,
    votes: 0,
  }));

  const newPoll: ClassPoll = {
    id: `poll_${Date.now()}`,
    classCode: code,
    question: question.trim(),
    options: formattedOptions,
    status: 'active',
    showResultsToStudents: false, // Default: Hidden from students! (Section 17)
    totalVotes: 0,
    createdAt: Date.now(),
  };

  pollList.push(newPoll);
  pollVotes.set(newPoll.id, new Map());

  // Broadcast poll start to class
  broadcastToClass(code, 'POLL_STARTED', newPoll);

  res.json({ success: true, poll: newPoll });
});

// POST /api/classroom/polls/:id/vote - Student submits poll vote
classroomRouter.post('/polls/:id/vote', (req: Request, res: Response) => {
  const { classCode, studentId, optionId } = req.body;
  const pollId = req.params.id;

  if (!classCode || !studentId || !optionId) {
    return res.status(400).json({ success: false, error: 'Missing vote parameters' });
  }

  const code = classCode.toUpperCase();
  const pollList = polls.get(code) || [];
  const poll = pollList.find((p) => p.id === pollId);

  if (!poll || poll.status !== 'active') {
    return res.status(400).json({ success: false, error: 'Poll is closed or invalid' });
  }

  const votes = pollVotes.get(pollId) || new Map();
  pollVotes.set(pollId, votes);

  if (votes.has(studentId)) {
    return res.status(400).json({ success: false, error: 'You have already voted in this poll' });
  }

  const targetOpt = poll.options.find((o) => o.id === optionId);
  if (!targetOpt) {
    return res.status(400).json({ success: false, error: 'Invalid option selected' });
  }

  targetOpt.votes += 1;
  poll.totalVotes += 1;
  votes.set(studentId, optionId);

  // Send live update to teacher immediately; students only see if showResultsToStudents is true
  broadcastToClass(code, 'POLL_UPDATED', poll, { teacherOnly: !poll.showResultsToStudents });

  res.json({ success: true, poll });
});

// POST /api/classroom/polls/:id/results-visibility - Teacher toggles results visibility
classroomRouter.post('/polls/:id/results-visibility', (req: Request, res: Response) => {
  const { classCode, showResultsToStudents } = req.body;
  const pollId = req.params.id;

  const code = classCode?.toUpperCase();
  const pollList = polls.get(code) || [];
  const poll = pollList.find((p) => p.id === pollId);

  if (!poll) {
    return res.status(404).json({ success: false, error: 'Poll not found' });
  }

  poll.showResultsToStudents = Boolean(showResultsToStudents);
  broadcastToClass(code, 'POLL_UPDATED', poll);

  res.json({ success: true, poll });
});

// POST /api/classroom/polls/:id/close - Teacher stops poll
classroomRouter.post('/polls/:id/close', (req: Request, res: Response) => {
  const { classCode } = req.body;
  const pollId = req.params.id;

  const code = classCode?.toUpperCase();
  const pollList = polls.get(code) || [];
  const poll = pollList.find((p) => p.id === pollId);

  if (!poll) {
    return res.status(404).json({ success: false, error: 'Poll not found' });
  }

  poll.status = 'closed';
  poll.closedAt = Date.now();
  broadcastToClass(code, 'POLL_CLOSED', poll);

  res.json({ success: true, poll });
});

// ---------------------------------------------------------------------------
// 5. LIVE MCQ QUIZ ENGINE (Section 18 - 20)
// ---------------------------------------------------------------------------

// POST /api/classroom/quiz - Teacher launches quiz question
classroomRouter.post('/quiz', (req: Request, res: Response) => {
  const { classCode, mode = 'practice', question, options, explanation, timeLimitSeconds = 30 } = req.body;

  if (!classCode || !question || !Array.isArray(options)) {
    return res.status(400).json({ success: false, error: 'Invalid quiz question payload' });
  }

  const code = classCode.toUpperCase();
  const qList = quizzes.get(code) || [];
  quizzes.set(code, qList);

  const duration = typeof timeLimitSeconds === 'number' ? timeLimitSeconds : 30;
  const startedAt = Date.now();
  const expiresAt = startedAt + duration * 1000;

  const newQuiz: ClassQuizQuestion = {
    id: `quiz_${Date.now()}`,
    classCode: code,
    mode,
    question: question.trim(),
    options,
    explanation,
    timeLimitSeconds: duration,
    startedAt,
    expiresAt,
    status: 'active',
    revealAnswer: mode === 'practice', // Practice mode reveals immediately; Test mode hides until teacher reveals (Section 19)
    totalResponses: 0,
    correctCount: 0,
  };

  qList.push(newQuiz);
  quizAnswers.set(newQuiz.id, new Map());

  // Broadcast to students (hide isCorrect field if revealAnswer is false)
  const safeForStudents: ClassQuizQuestion = {
    ...newQuiz,
    options: newQuiz.options.map((opt) => ({
      ...opt,
      isCorrect: newQuiz.revealAnswer ? opt.isCorrect : false,
    })),
  };

  broadcastToClass(code, 'QUIZ_LAUNCHED', safeForStudents);

  res.json({ success: true, quiz: newQuiz });
});

// POST /api/classroom/quiz/:id/answer - Student submits answer
classroomRouter.post('/quiz/:id/answer', (req: Request, res: Response) => {
  const { classCode, studentId, optionId } = req.body;
  const quizId = req.params.id;

  if (!classCode || !studentId || !optionId) {
    return res.status(400).json({ success: false, error: 'Missing answer parameters' });
  }

  const code = classCode.toUpperCase();
  const qList = quizzes.get(code) || [];
  const quiz = qList.find((q) => q.id === quizId);

  if (!quiz || quiz.status !== 'active') {
    return res.status(400).json({ success: false, error: 'Quiz question is closed' });
  }

  const answers = quizAnswers.get(quizId) || new Map();
  quizAnswers.set(quizId, answers);

  if (answers.has(studentId)) {
    return res.status(400).json({ success: false, error: 'You have already submitted an answer' });
  }

  const chosen = quiz.options.find((o) => o.id === optionId);
  const isCorrect = Boolean(chosen?.isCorrect);

  answers.set(studentId, { optionId, isCorrect });
  quiz.totalResponses += 1;
  if (isCorrect) {
    quiz.correctCount += 1;
  }

  // Live response stats to teacher
  broadcastToClass(code, 'QUIZ_STATS_UPDATED', {
    quizId: quiz.id,
    totalResponses: quiz.totalResponses,
    correctCount: quiz.correctCount,
  });

  res.json({
    success: true,
    isCorrect: quiz.revealAnswer ? isCorrect : undefined,
    explanation: quiz.revealAnswer ? quiz.explanation : undefined,
  });
});

// POST /api/classroom/quiz/:id/reveal - Teacher reveals answer (Section 19)
classroomRouter.post('/quiz/:id/reveal', (req: Request, res: Response) => {
  const { classCode } = req.body;
  const quizId = req.params.id;

  const code = classCode?.toUpperCase();
  const qList = quizzes.get(code) || [];
  const quiz = qList.find((q) => q.id === quizId);

  if (!quiz) {
    return res.status(404).json({ success: false, error: 'Quiz not found' });
  }

  quiz.revealAnswer = true;
  broadcastToClass(code, 'QUIZ_ANSWER_REVEALED', quiz);

  res.json({ success: true, quiz });
});

// ---------------------------------------------------------------------------
// 6. ATTENDANCE & HISTORIC RECORDS (Section 25, 26, 59, 60, 61)
// ---------------------------------------------------------------------------

function finalizeAttendance(classCode: string): ClassroomAttendanceRecord {
  const session = sessions.get(classCode);
  const parts = participants.get(classCode);
  const qList = questions.get(classCode) || [];
  const pollList = polls.get(classCode) || [];
  const quizList = quizzes.get(classCode) || [];

  const studentEntries = parts
    ? Array.from(parts.values()).map((p) => {
        const studentQs = qList.filter((q) => q.studentId === p.id).length;
        const durationMin = Math.max(1, Math.round((Date.now() - p.joinedAt) / 60000));
        return {
          studentId: p.id,
          displayName: p.displayName,
          joinedAt: p.joinedAt,
          leftAt: p.leftAt || Date.now(),
          durationMinutes: durationMin,
          status: p.status === 'removed' ? ('removed' as const) : ('present' as const),
          handRaisesCount: p.handRaised ? 1 : 0,
          questionsAskedCount: studentQs,
          pollsAnsweredCount: 1,
          quizzesAnsweredCount: 1,
        };
      })
    : [];

  const record: ClassroomAttendanceRecord = {
    id: `att_${Date.now()}`,
    classCode,
    className: session?.className || 'Class Session',
    subject: session?.subject,
    teacherName: session?.teacherName || 'Teacher',
    startedAt: session?.startedAt || Date.now() - 3600000,
    endedAt: Date.now(),
    durationMinutes: Math.max(1, Math.round((Date.now() - (session?.startedAt || Date.now())) / 60000)),
    totalStudents: studentEntries.length,
    students: studentEntries,
    totalQuestionsReceived: qList.length,
    totalPollsConducted: pollList.length,
    totalQuizzesConducted: quizList.length,
  };

  const history = attendanceHistory.get(classCode) || [];
  history.push(record);
  attendanceHistory.set(classCode, history);

  return record;
}

// GET /api/classroom/attendance/:classCode - Get attendance report
classroomRouter.get('/attendance/:classCode', (req: Request, res: Response) => {
  const classCode = req.params.classCode.toUpperCase();
  const history = attendanceHistory.get(classCode) || [];

  if (history.length === 0) {
    // Generate active interim attendance snapshot
    const snapshot = finalizeAttendance(classCode);
    return res.json({ success: true, record: snapshot });
  }

  res.json({ success: true, record: history[history.length - 1], history });
});

// ---------------------------------------------------------------------------
// 7. REAL-TIME SERVER-SENT EVENTS (SSE) STREAM
// ---------------------------------------------------------------------------
classroomRouter.get('/events', (req: Request, res: Response) => {
  const classCode = (req.query.classCode as string)?.toUpperCase();
  const role = (req.query.role as string) === 'teacher' ? 'teacher' : 'student';
  const participantId = req.query.participantId as string;

  if (!classCode) {
    return res.status(400).send('classCode query parameter is required');
  }

  // Standard Server-Sent Events headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  // Send initial connection acknowledgement
  res.write(`event: CONNECTED\ndata: ${JSON.stringify({ classCode, role, timestamp: Date.now() })}\n\n`);

  const client: SSEClient = {
    id: `client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    classCode,
    role,
    participantId,
    res,
  };

  const clientSet = sseClients.get(classCode) || new Set();
  clientSet.add(client);
  sseClients.set(classCode, clientSet);

  // Keep-alive heartbeat every 20 seconds to prevent proxy disconnects
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeatTimer);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeatTimer);
    const currentSet = sseClients.get(classCode);
    if (currentSet) {
      currentSet.delete(client);
      if (currentSet.size === 0) {
        sseClients.delete(classCode);
      }
    }
  });
});
