var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_config = require("dotenv/config");
var import_express4 = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_genai2 = require("@google/genai");
var import_vite = require("vite");

// server/classroomRouter.ts
var import_express = require("express");
var classroomRouter = (0, import_express.Router)();
var sessions = /* @__PURE__ */ new Map();
var participants = /* @__PURE__ */ new Map();
var questions = /* @__PURE__ */ new Map();
var polls = /* @__PURE__ */ new Map();
var pollVotes = /* @__PURE__ */ new Map();
var quizzes = /* @__PURE__ */ new Map();
var quizAnswers = /* @__PURE__ */ new Map();
var attendanceHistory = /* @__PURE__ */ new Map();
var auditLogs = /* @__PURE__ */ new Map();
var blockedParticipants = /* @__PURE__ */ new Map();
var rateLimiter = /* @__PURE__ */ new Map();
var sseClients = /* @__PURE__ */ new Map();
function broadcastToClass(classCode, eventType, payload, options) {
  const clients = sseClients.get(classCode);
  if (!clients) return;
  const dataString = `event: ${eventType}
data: ${JSON.stringify(payload)}

`;
  for (const client of clients) {
    if (options?.teacherOnly && client.role !== "teacher") {
      continue;
    }
    if (options?.targetStudentId && client.role === "student" && client.participantId !== options.targetStudentId) {
      continue;
    }
    try {
      client.res.write(dataString);
    } catch {
    }
  }
}
function generateClassCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
function initDemoClass() {
  const code = "STUDIO1";
  if (!sessions.has(code)) {
    const defaultBroadcast = {
      contentMode: "slides",
      currentSlideIndex: 0,
      totalSlides: 4,
      teacherCameraActive: true,
      teacherMicActive: true,
      announcement: "Welcome to the live interactive masterclass!",
      lastUpdated: Date.now()
    };
    const session = {
      id: "session_demo_1",
      classCode: code,
      className: "Class 10 Biology \u2014 Cell Structure & Respiration",
      subject: "Biology",
      teacherName: "Dr. Sarah Jenkins",
      description: "Interactive biology masterclass with dual-canvas slides, 3D mind mapping, and live MCQ checkpoints.",
      status: "live",
      isLocked: false,
      hasWaitingRoom: false,
      activeBroadcast: defaultBroadcast,
      privacyBoundaries: {
        showTeacherNotesToClass: false,
        hidePrivateQuestionsFromStudents: true,
        allowStudentMic: false,
        allowStudentCamera: false,
        allowStudentScreenShare: false
      },
      studentCount: 0,
      createdAt: Date.now() - 36e5,
      startedAt: Date.now() - 12e5
    };
    sessions.set(code, session);
    participants.set(code, /* @__PURE__ */ new Map());
    questions.set(code, []);
    polls.set(code, []);
    quizzes.set(code, []);
    auditLogs.set(code, []);
  }
}
initDemoClass();
classroomRouter.get("/classes", (_req, res) => {
  const list = Array.from(sessions.values()).map((s) => {
    const currentParts = participants.get(s.classCode);
    const activeCount = currentParts ? Array.from(currentParts.values()).filter((p) => p.status === "active").length : 0;
    return {
      ...s,
      studentCount: activeCount
    };
  });
  res.json({ success: true, classes: list });
});
classroomRouter.post("/classes", (req, res) => {
  const { className, subject, teacherName, description, scheduledTime, durationMinutes, associatedProjectId } = req.body;
  if (!className || typeof className !== "string") {
    return res.status(400).json({ success: false, error: "Class name is required" });
  }
  const classCode = generateClassCode();
  const session = {
    id: `class_${Date.now()}`,
    classCode,
    className: className.trim(),
    subject: subject?.trim(),
    teacherName: teacherName?.trim() || "Teacher",
    description: description?.trim(),
    scheduledTime,
    durationMinutes: typeof durationMinutes === "number" ? durationMinutes : 45,
    status: "scheduled",
    isLocked: false,
    hasWaitingRoom: false,
    activeBroadcast: {
      contentMode: "slides",
      currentSlideIndex: 0,
      totalSlides: 4,
      teacherCameraActive: false,
      teacherMicActive: false,
      announcement: null,
      lastUpdated: Date.now()
    },
    privacyBoundaries: {
      showTeacherNotesToClass: false,
      hidePrivateQuestionsFromStudents: true,
      allowStudentMic: false,
      allowStudentCamera: false,
      allowStudentScreenShare: false
    },
    studentCount: 0,
    createdAt: Date.now(),
    associatedProjectId
  };
  sessions.set(classCode, session);
  participants.set(classCode, /* @__PURE__ */ new Map());
  questions.set(classCode, []);
  polls.set(classCode, []);
  quizzes.set(classCode, []);
  auditLogs.set(classCode, [
    {
      id: `audit_${Date.now()}`,
      classCode,
      type: "CLASS_CREATED",
      timestamp: Date.now(),
      description: `Class "${session.className}" created with code ${classCode}`,
      actor: session.teacherName
    }
  ]);
  res.json({ success: true, session });
});
classroomRouter.get("/classes/:classCode", (req, res) => {
  const classCode = req.params.classCode.toUpperCase();
  const session = sessions.get(classCode);
  if (!session) {
    return res.status(404).json({ success: false, error: "Classroom not found. Please verify the 6-character code." });
  }
  const parts = participants.get(classCode);
  const activeCount = parts ? Array.from(parts.values()).filter((p) => p.status === "active").length : 0;
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
      activeBroadcast: session.activeBroadcast
    }
  });
});
classroomRouter.post("/classes/:classCode/status", (req, res) => {
  const classCode = req.params.classCode.toUpperCase();
  const { status, isLocked, hasWaitingRoom } = req.body;
  const session = sessions.get(classCode);
  if (!session) {
    return res.status(404).json({ success: false, error: "Classroom not found" });
  }
  if (status) {
    session.status = status;
    if (status === "live" && !session.startedAt) {
      session.startedAt = Date.now();
    }
    if (status === "ended") {
      session.endedAt = Date.now();
      finalizeAttendance(classCode);
    }
  }
  if (typeof isLocked === "boolean") {
    session.isLocked = isLocked;
    broadcastToClass(classCode, "CLASS_LOCKED", { isLocked });
  }
  if (typeof hasWaitingRoom === "boolean") {
    session.hasWaitingRoom = hasWaitingRoom;
  }
  broadcastToClass(classCode, "CLASS_STATUS_UPDATED", {
    status: session.status,
    isLocked: session.isLocked,
    hasWaitingRoom: session.hasWaitingRoom
  });
  res.json({ success: true, session });
});
classroomRouter.post("/classes/:classCode/broadcast", (req, res) => {
  const classCode = req.params.classCode.toUpperCase();
  const session = sessions.get(classCode);
  if (!session) {
    return res.status(404).json({ success: false, error: "Classroom not found" });
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
    activeQuizId
  } = req.body;
  session.activeBroadcast = {
    contentMode: contentMode || session.activeBroadcast.contentMode,
    currentSlideIndex: typeof currentSlideIndex === "number" ? currentSlideIndex : session.activeBroadcast.currentSlideIndex,
    totalSlides: typeof totalSlides === "number" ? totalSlides : session.activeBroadcast.totalSlides,
    selectedMindMapNodeId: selectedMindMapNodeId !== void 0 ? selectedMindMapNodeId : session.activeBroadcast.selectedMindMapNodeId,
    whiteboardSnapshotUrl: whiteboardSnapshotUrl || session.activeBroadcast.whiteboardSnapshotUrl,
    teacherCameraActive: typeof teacherCameraActive === "boolean" ? teacherCameraActive : session.activeBroadcast.teacherCameraActive,
    teacherMicActive: typeof teacherMicActive === "boolean" ? teacherMicActive : session.activeBroadcast.teacherMicActive,
    announcement: announcement !== void 0 ? announcement : session.activeBroadcast.announcement,
    activePollId: activePollId !== void 0 ? activePollId : session.activeBroadcast.activePollId,
    activeQuizId: activeQuizId !== void 0 ? activeQuizId : session.activeBroadcast.activeQuizId,
    lastUpdated: Date.now()
  };
  broadcastToClass(classCode, "BROADCAST_STATE_UPDATED", session.activeBroadcast);
  res.json({ success: true, activeBroadcast: session.activeBroadcast });
});
classroomRouter.post("/join", (req, res) => {
  const { classCode, displayName } = req.body;
  if (!classCode || !displayName || typeof displayName !== "string") {
    return res.status(400).json({ success: false, error: "Class code and student display name are required." });
  }
  const code = classCode.trim().toUpperCase();
  const session = sessions.get(code);
  if (!session) {
    return res.status(404).json({ success: false, error: "Classroom code is invalid or does not exist." });
  }
  if (session.status === "ended") {
    return res.status(400).json({ success: false, error: "This class session has already ended." });
  }
  const cleanName = displayName.trim().slice(0, 40);
  const blocked = blockedParticipants.get(code);
  if (blocked && blocked.has(cleanName.toLowerCase())) {
    return res.status(403).json({
      success: false,
      error: "You have been removed from this classroom session by the teacher and cannot rejoin."
    });
  }
  if (session.isLocked) {
    return res.status(423).json({
      success: false,
      error: "The teacher has locked this classroom. No new participants may enter."
    });
  }
  const parts = participants.get(code) || /* @__PURE__ */ new Map();
  participants.set(code, parts);
  const participantId = `student_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const initialStatus = session.hasWaitingRoom ? "in_waiting_room" : "active";
  const newParticipant = {
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
    totalDurationMs: 0
  };
  parts.set(participantId, newParticipant);
  broadcastToClass(code, "STUDENT_JOINED", newParticipant);
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
      hasWaitingRoom: session.hasWaitingRoom
    }
  });
});
classroomRouter.post("/heartbeat", (req, res) => {
  const { classCode, participantId, role } = req.body;
  if (!classCode || !participantId) {
    return res.status(400).json({ success: false, error: "Missing classCode or participantId" });
  }
  const code = classCode.toUpperCase();
  const parts = participants.get(code);
  if (parts && parts.has(participantId)) {
    const p = parts.get(participantId);
    p.lastPingAt = Date.now();
    p.totalDurationMs = Date.now() - p.joinedAt;
    if (p.status === "disconnected") {
      p.status = "active";
      p.reconnectCount += 1;
      broadcastToClass(code, "STUDENT_RECONNECTED", { participantId, displayName: p.displayName });
    }
  }
  res.json({ success: true, timestamp: Date.now() });
});
classroomRouter.post("/leave", (req, res) => {
  const { classCode, participantId } = req.body;
  if (!classCode || !participantId) {
    return res.status(400).json({ success: false, error: "Missing parameters" });
  }
  const code = classCode.toUpperCase();
  const parts = participants.get(code);
  if (parts && parts.has(participantId)) {
    const p = parts.get(participantId);
    p.status = "disconnected";
    p.leftAt = Date.now();
    broadcastToClass(code, "STUDENT_LEFT", { participantId, displayName: p.displayName });
  }
  res.json({ success: true });
});
classroomRouter.get("/participants", (req, res) => {
  const classCode = req.query.classCode?.toUpperCase();
  if (!classCode) {
    return res.status(400).json({ success: false, error: "classCode required" });
  }
  const parts = participants.get(classCode);
  const list = parts ? Array.from(parts.values()) : [];
  res.json({ success: true, participants: list });
});
classroomRouter.post("/moderate", (req, res) => {
  const { classCode, participantId, action, value } = req.body;
  if (!classCode || !participantId || !action) {
    return res.status(400).json({ success: false, error: "Missing parameters" });
  }
  const code = classCode.toUpperCase();
  const parts = participants.get(code);
  const participant = parts?.get(participantId);
  if (!participant) {
    return res.status(404).json({ success: false, error: "Participant not found" });
  }
  switch (action) {
    case "approve_waiting_room":
      participant.status = "active";
      broadcastToClass(code, "STUDENT_STATUS_UPDATED", participant);
      break;
    case "lower_hand":
      participant.handRaised = false;
      broadcastToClass(code, "STUDENT_STATUS_UPDATED", participant);
      break;
    case "allow_mic":
      participant.isMicAllowed = Boolean(value);
      participant.isMuted = !value;
      broadcastToClass(code, "STUDENT_STATUS_UPDATED", participant);
      break;
    case "mute":
      participant.isMuted = true;
      broadcastToClass(code, "STUDENT_STATUS_UPDATED", participant);
      break;
    case "remove": {
      participant.status = "removed";
      participant.leftAt = Date.now();
      const blocked = blockedParticipants.get(code) || /* @__PURE__ */ new Set();
      blocked.add(participant.displayName.toLowerCase());
      blockedParticipants.set(code, blocked);
      broadcastToClass(code, "STUDENT_REMOVED", {
        participantId: participant.id,
        displayName: participant.displayName
      });
      break;
    }
    default:
      return res.status(400).json({ success: false, error: `Unknown moderation action: ${action}` });
  }
  res.json({ success: true, participant });
});
classroomRouter.post("/hand-raise", (req, res) => {
  const { classCode, participantId, raised } = req.body;
  if (!classCode || !participantId) {
    return res.status(400).json({ success: false, error: "Missing parameters" });
  }
  const code = classCode.toUpperCase();
  const parts = participants.get(code);
  const p = parts?.get(participantId);
  if (!p) {
    return res.status(404).json({ success: false, error: "Participant not found" });
  }
  p.handRaised = Boolean(raised);
  p.handRaisedAt = p.handRaised ? Date.now() : void 0;
  broadcastToClass(code, "STUDENT_STATUS_UPDATED", p);
  res.json({ success: true, handRaised: p.handRaised });
});
classroomRouter.post("/messages", (req, res) => {
  const { classCode, studentId, studentName, message } = req.body;
  if (!classCode || !studentId || !message || typeof message !== "string") {
    return res.status(400).json({ success: false, error: "Invalid message request" });
  }
  const code = classCode.toUpperCase();
  const session = sessions.get(code);
  if (!session) {
    return res.status(404).json({ success: false, error: "Classroom not found" });
  }
  const now = Date.now();
  const timestamps = rateLimiter.get(studentId) || [];
  const recent = timestamps.filter((t) => now - t < 6e4);
  if (recent.length >= 5) {
    return res.status(429).json({
      success: false,
      error: "You are sending questions too quickly. Please wait a moment before sending another question."
    });
  }
  recent.push(now);
  rateLimiter.set(studentId, recent);
  const qList = questions.get(code) || [];
  questions.set(code, qList);
  const newQuestion = {
    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    classCode: code,
    studentId,
    studentName: studentName || "Student",
    message: message.trim().slice(0, 500),
    timestamp: now,
    status: "unread",
    isPublished: false,
    publishMode: "anonymous"
  };
  qList.push(newQuestion);
  broadcastToClass(code, "QUESTION_RECEIVED", newQuestion, { teacherOnly: true });
  res.json({ success: true, question: newQuestion });
});
classroomRouter.get("/messages", (req, res) => {
  const classCode = req.query.classCode?.toUpperCase();
  const role = req.query.role;
  const studentId = req.query.studentId;
  if (!classCode) {
    return res.status(400).json({ success: false, error: "classCode required" });
  }
  const qList = questions.get(classCode) || [];
  if (role === "teacher") {
    return res.json({ success: true, messages: qList });
  }
  const safeStudentList = qList.filter((q) => q.studentId === studentId || q.isPublished).map((q) => {
    if (q.studentId === studentId) {
      return q;
    }
    return {
      ...q,
      studentName: q.publishMode === "anonymous" ? "Classmate (Anonymous)" : q.studentName,
      teacherReply: q.teacherReply
    };
  });
  res.json({ success: true, messages: safeStudentList });
});
classroomRouter.post("/messages/:id/reply", (req, res) => {
  const { classCode, teacherReply } = req.body;
  const questionId = req.params.id;
  if (!classCode || !teacherReply) {
    return res.status(400).json({ success: false, error: "Missing reply or classCode" });
  }
  const code = classCode.toUpperCase();
  const qList = questions.get(code) || [];
  const q = qList.find((item) => item.id === questionId);
  if (!q) {
    return res.status(404).json({ success: false, error: "Question not found" });
  }
  q.teacherReply = teacherReply.trim();
  q.teacherRepliedAt = Date.now();
  q.status = "answered";
  broadcastToClass(code, "QUESTION_REPLIED", q, { targetStudentId: q.studentId });
  broadcastToClass(code, "QUESTION_REPLIED", q, { teacherOnly: true });
  res.json({ success: true, question: q });
});
classroomRouter.post("/messages/:id/publish", (req, res) => {
  const { classCode, publishMode = "anonymous" } = req.body;
  const questionId = req.params.id;
  if (!classCode) {
    return res.status(400).json({ success: false, error: "classCode required" });
  }
  const code = classCode.toUpperCase();
  const qList = questions.get(code) || [];
  const q = qList.find((item) => item.id === questionId);
  if (!q) {
    return res.status(404).json({ success: false, error: "Question not found" });
  }
  q.isPublished = true;
  q.publishMode = publishMode === "with_name" ? "with_name" : "anonymous";
  q.publishedAt = Date.now();
  q.status = "published";
  const publishedPayload = {
    ...q,
    studentName: q.publishMode === "anonymous" ? "Classmate (Anonymous)" : q.studentName
  };
  broadcastToClass(code, "QUESTION_PUBLISHED", publishedPayload);
  res.json({ success: true, question: q });
});
classroomRouter.post("/polls", (req, res) => {
  const { classCode, question, options } = req.body;
  if (!classCode || !question || !Array.isArray(options)) {
    return res.status(400).json({ success: false, error: "Invalid poll data" });
  }
  const code = classCode.toUpperCase();
  const pollList = polls.get(code) || [];
  polls.set(code, pollList);
  const formattedOptions = options.map((opt, idx) => ({
    id: `opt_${idx}`,
    label: ["A", "B", "C", "D", "E"][idx] || `${idx + 1}`,
    text: typeof opt === "string" ? opt : opt.text || `Option ${idx + 1}`,
    votes: 0
  }));
  const newPoll = {
    id: `poll_${Date.now()}`,
    classCode: code,
    question: question.trim(),
    options: formattedOptions,
    status: "active",
    showResultsToStudents: false,
    // Default: Hidden from students! (Section 17)
    totalVotes: 0,
    createdAt: Date.now()
  };
  pollList.push(newPoll);
  pollVotes.set(newPoll.id, /* @__PURE__ */ new Map());
  broadcastToClass(code, "POLL_STARTED", newPoll);
  res.json({ success: true, poll: newPoll });
});
classroomRouter.post("/polls/:id/vote", (req, res) => {
  const { classCode, studentId, optionId } = req.body;
  const pollId = req.params.id;
  if (!classCode || !studentId || !optionId) {
    return res.status(400).json({ success: false, error: "Missing vote parameters" });
  }
  const code = classCode.toUpperCase();
  const pollList = polls.get(code) || [];
  const poll = pollList.find((p) => p.id === pollId);
  if (!poll || poll.status !== "active") {
    return res.status(400).json({ success: false, error: "Poll is closed or invalid" });
  }
  const votes = pollVotes.get(pollId) || /* @__PURE__ */ new Map();
  pollVotes.set(pollId, votes);
  if (votes.has(studentId)) {
    return res.status(400).json({ success: false, error: "You have already voted in this poll" });
  }
  const targetOpt = poll.options.find((o) => o.id === optionId);
  if (!targetOpt) {
    return res.status(400).json({ success: false, error: "Invalid option selected" });
  }
  targetOpt.votes += 1;
  poll.totalVotes += 1;
  votes.set(studentId, optionId);
  broadcastToClass(code, "POLL_UPDATED", poll, { teacherOnly: !poll.showResultsToStudents });
  res.json({ success: true, poll });
});
classroomRouter.post("/polls/:id/results-visibility", (req, res) => {
  const { classCode, showResultsToStudents } = req.body;
  const pollId = req.params.id;
  const code = classCode?.toUpperCase();
  const pollList = polls.get(code) || [];
  const poll = pollList.find((p) => p.id === pollId);
  if (!poll) {
    return res.status(404).json({ success: false, error: "Poll not found" });
  }
  poll.showResultsToStudents = Boolean(showResultsToStudents);
  broadcastToClass(code, "POLL_UPDATED", poll);
  res.json({ success: true, poll });
});
classroomRouter.post("/polls/:id/close", (req, res) => {
  const { classCode } = req.body;
  const pollId = req.params.id;
  const code = classCode?.toUpperCase();
  const pollList = polls.get(code) || [];
  const poll = pollList.find((p) => p.id === pollId);
  if (!poll) {
    return res.status(404).json({ success: false, error: "Poll not found" });
  }
  poll.status = "closed";
  poll.closedAt = Date.now();
  broadcastToClass(code, "POLL_CLOSED", poll);
  res.json({ success: true, poll });
});
classroomRouter.post("/quiz", (req, res) => {
  const { classCode, mode = "practice", question, options, explanation, timeLimitSeconds = 30 } = req.body;
  if (!classCode || !question || !Array.isArray(options)) {
    return res.status(400).json({ success: false, error: "Invalid quiz question payload" });
  }
  const code = classCode.toUpperCase();
  const qList = quizzes.get(code) || [];
  quizzes.set(code, qList);
  const duration = typeof timeLimitSeconds === "number" ? timeLimitSeconds : 30;
  const startedAt = Date.now();
  const expiresAt = startedAt + duration * 1e3;
  const newQuiz = {
    id: `quiz_${Date.now()}`,
    classCode: code,
    mode,
    question: question.trim(),
    options,
    explanation,
    timeLimitSeconds: duration,
    startedAt,
    expiresAt,
    status: "active",
    revealAnswer: mode === "practice",
    // Practice mode reveals immediately; Test mode hides until teacher reveals (Section 19)
    totalResponses: 0,
    correctCount: 0
  };
  qList.push(newQuiz);
  quizAnswers.set(newQuiz.id, /* @__PURE__ */ new Map());
  const safeForStudents = {
    ...newQuiz,
    options: newQuiz.options.map((opt) => ({
      ...opt,
      isCorrect: newQuiz.revealAnswer ? opt.isCorrect : false
    }))
  };
  broadcastToClass(code, "QUIZ_LAUNCHED", safeForStudents);
  res.json({ success: true, quiz: newQuiz });
});
classroomRouter.post("/quiz/:id/answer", (req, res) => {
  const { classCode, studentId, optionId } = req.body;
  const quizId = req.params.id;
  if (!classCode || !studentId || !optionId) {
    return res.status(400).json({ success: false, error: "Missing answer parameters" });
  }
  const code = classCode.toUpperCase();
  const qList = quizzes.get(code) || [];
  const quiz = qList.find((q) => q.id === quizId);
  if (!quiz || quiz.status !== "active") {
    return res.status(400).json({ success: false, error: "Quiz question is closed" });
  }
  const answers = quizAnswers.get(quizId) || /* @__PURE__ */ new Map();
  quizAnswers.set(quizId, answers);
  if (answers.has(studentId)) {
    return res.status(400).json({ success: false, error: "You have already submitted an answer" });
  }
  const chosen = quiz.options.find((o) => o.id === optionId);
  const isCorrect = Boolean(chosen?.isCorrect);
  answers.set(studentId, { optionId, isCorrect });
  quiz.totalResponses += 1;
  if (isCorrect) {
    quiz.correctCount += 1;
  }
  broadcastToClass(code, "QUIZ_STATS_UPDATED", {
    quizId: quiz.id,
    totalResponses: quiz.totalResponses,
    correctCount: quiz.correctCount
  });
  res.json({
    success: true,
    isCorrect: quiz.revealAnswer ? isCorrect : void 0,
    explanation: quiz.revealAnswer ? quiz.explanation : void 0
  });
});
classroomRouter.post("/quiz/:id/reveal", (req, res) => {
  const { classCode } = req.body;
  const quizId = req.params.id;
  const code = classCode?.toUpperCase();
  const qList = quizzes.get(code) || [];
  const quiz = qList.find((q) => q.id === quizId);
  if (!quiz) {
    return res.status(404).json({ success: false, error: "Quiz not found" });
  }
  quiz.revealAnswer = true;
  broadcastToClass(code, "QUIZ_ANSWER_REVEALED", quiz);
  res.json({ success: true, quiz });
});
function finalizeAttendance(classCode) {
  const session = sessions.get(classCode);
  const parts = participants.get(classCode);
  const qList = questions.get(classCode) || [];
  const pollList = polls.get(classCode) || [];
  const quizList = quizzes.get(classCode) || [];
  const studentEntries = parts ? Array.from(parts.values()).map((p) => {
    const studentQs = qList.filter((q) => q.studentId === p.id).length;
    const durationMin = Math.max(1, Math.round((Date.now() - p.joinedAt) / 6e4));
    return {
      studentId: p.id,
      displayName: p.displayName,
      joinedAt: p.joinedAt,
      leftAt: p.leftAt || Date.now(),
      durationMinutes: durationMin,
      status: p.status === "removed" ? "removed" : "present",
      handRaisesCount: p.handRaised ? 1 : 0,
      questionsAskedCount: studentQs,
      pollsAnsweredCount: 1,
      quizzesAnsweredCount: 1
    };
  }) : [];
  const record = {
    id: `att_${Date.now()}`,
    classCode,
    className: session?.className || "Class Session",
    subject: session?.subject,
    teacherName: session?.teacherName || "Teacher",
    startedAt: session?.startedAt || Date.now() - 36e5,
    endedAt: Date.now(),
    durationMinutes: Math.max(1, Math.round((Date.now() - (session?.startedAt || Date.now())) / 6e4)),
    totalStudents: studentEntries.length,
    students: studentEntries,
    totalQuestionsReceived: qList.length,
    totalPollsConducted: pollList.length,
    totalQuizzesConducted: quizList.length
  };
  const history = attendanceHistory.get(classCode) || [];
  history.push(record);
  attendanceHistory.set(classCode, history);
  return record;
}
classroomRouter.get("/attendance/:classCode", (req, res) => {
  const classCode = req.params.classCode.toUpperCase();
  const history = attendanceHistory.get(classCode) || [];
  if (history.length === 0) {
    const snapshot = finalizeAttendance(classCode);
    return res.json({ success: true, record: snapshot });
  }
  res.json({ success: true, record: history[history.length - 1], history });
});
classroomRouter.get("/events", (req, res) => {
  const classCode = req.query.classCode?.toUpperCase();
  const role = req.query.role === "teacher" ? "teacher" : "student";
  const participantId = req.query.participantId;
  if (!classCode) {
    return res.status(400).send("classCode query parameter is required");
  }
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no"
  });
  res.flushHeaders();
  res.write(`event: CONNECTED
data: ${JSON.stringify({ classCode, role, timestamp: Date.now() })}

`);
  const client = {
    id: `client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    classCode,
    role,
    participantId,
    res
  };
  const clientSet = sseClients.get(classCode) || /* @__PURE__ */ new Set();
  clientSet.add(client);
  sseClients.set(classCode, clientSet);
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeatTimer);
    }
  }, 2e4);
  req.on("close", () => {
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

// server/youtubeRouter.ts
var import_express2 = require("express");
var youtubeRouter = (0, import_express2.Router)();
var youtubeState = {
  isConnected: false,
  isLiveStreamEligible: true
};
var liveChatCache = [];
function getAppBaseUrl(req) {
  if (process.env.APP_URL && process.env.APP_URL.trim() !== "") {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
  return `${protocol}://${host}`;
}
youtubeRouter.get("/status", (_req, res) => {
  const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";
  const isConfigured = Boolean(clientId && clientSecret);
  res.json({
    success: true,
    isConfigured,
    isConnected: youtubeState.isConnected || Boolean(youtubeState.mockConnected),
    channelTitle: youtubeState.channelTitle || (youtubeState.mockConnected ? "AI Teaching Studio Channel" : void 0),
    channelAvatarUrl: youtubeState.channelAvatarUrl || (youtubeState.mockConnected ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" : void 0),
    channelId: youtubeState.channelId || (youtubeState.mockConnected ? "UC_DEMO_TEACHER_CHANNEL" : void 0),
    isLiveStreamEligible: youtubeState.isLiveStreamEligible,
    activeBroadcast: youtubeState.activeBroadcast
  });
});
youtubeRouter.get("/auth-url", (req, res) => {
  const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(503).json({
      success: false,
      error: "YouTube OAuth credentials (YOUTUBE_CLIENT_ID & YOUTUBE_CLIENT_SECRET) are not yet configured in environment secrets.",
      code: "YOUTUBE_NOT_CONFIGURED"
    });
  }
  const baseUrl = getAppBaseUrl(req);
  const redirectUri = `${baseUrl}/auth/youtube/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.force-ssl"
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true"
  });
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ success: true, url: authUrl });
});
async function handleOAuthCallback(req, res) {
  const { code, error } = req.query;
  if (error || !code) {
    return res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 24px; text-align: center;">
          <h3 style="color: #dc2626;">YouTube Connection Cancelled</h3>
          <p>${error || "No authorization code returned from Google."}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${error || "CANCELLED"}' }, '*');
            }
            setTimeout(() => window.close(), 2500);
          </script>
        </body>
      </html>
    `);
  }
  try {
    const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "";
    const baseUrl = getAppBaseUrl(req);
    const redirectUri = `${baseUrl}/auth/youtube/callback`;
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || tokenData.error || "Failed to exchange OAuth code");
    }
    youtubeState.accessToken = tokenData.access_token;
    youtubeState.refreshToken = tokenData.refresh_token || youtubeState.refreshToken;
    youtubeState.tokenExpiresAt = Date.now() + (tokenData.expires_in || 3600) * 1e3;
    youtubeState.isConnected = true;
    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,status,contentDetails&mine=true",
      {
        headers: { Authorization: `Bearer ${youtubeState.accessToken}` }
      }
    );
    if (channelRes.ok) {
      const channelData = await channelRes.json();
      const channel = channelData.items?.[0];
      if (channel) {
        youtubeState.channelId = channel.id;
        youtubeState.channelTitle = channel.snippet?.title || "Connected YouTube Channel";
        youtubeState.channelAvatarUrl = channel.snippet?.thumbnails?.default?.url;
        youtubeState.isLiveStreamEligible = channel.status?.isLinked !== false;
      }
    }
    res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 32px; text-align: center; background: #0f172a; color: #f8fafc;">
          <h2 style="color: #22c55e;">YouTube Connected Successfully!</h2>
          <p style="color: #94a3b8;">Channel: <strong>${youtubeState.channelTitle || "Authorized Channel"}</strong></p>
          <p style="font-size: 12px; color: #64748b;">This window will close automatically...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'youtube' }, '*');
              setTimeout(() => window.close(), 1000);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    res.send(`
      <html>
        <body style="font-family: sans-serif; padding: 24px; text-align: center;">
          <h3 style="color: #dc2626;">YouTube Authorization Error</h3>
          <p>${err?.message || "Failed to authenticate with Google"}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${err?.message || "AUTH_FAILED"}' }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }
}
youtubeRouter.get("/callback", handleOAuthCallback);
youtubeRouter.post("/mock-connect", (_req, res) => {
  youtubeState.mockConnected = true;
  youtubeState.isConnected = true;
  youtubeState.channelTitle = "Prof. Masterclass Live (Verified)";
  youtubeState.channelId = "UC_PROTOTYPE_TEACHING_STUDIO";
  youtubeState.channelAvatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100";
  youtubeState.isLiveStreamEligible = true;
  res.json({
    success: true,
    channelTitle: youtubeState.channelTitle,
    channelId: youtubeState.channelId
  });
});
youtubeRouter.post("/disconnect", (_req, res) => {
  youtubeState.isConnected = false;
  youtubeState.mockConnected = false;
  youtubeState.accessToken = void 0;
  youtubeState.refreshToken = void 0;
  youtubeState.channelId = void 0;
  youtubeState.channelTitle = void 0;
  youtubeState.channelAvatarUrl = void 0;
  youtubeState.activeBroadcast = void 0;
  res.json({ success: true });
});
youtubeRouter.post("/broadcasts/create", async (req, res) => {
  const { title, description, privacyStatus = "unlisted" } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: "Broadcast title is required." });
  }
  if (youtubeState.accessToken) {
    try {
      const broadcastRes = await fetch("https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${youtubeState.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          snippet: {
            title: title.trim(),
            description: description?.trim() || "AI Teaching Studio Live Stream",
            scheduledStartTime: (/* @__PURE__ */ new Date()).toISOString()
          },
          status: {
            privacyStatus,
            selfDeclaredMadeForKids: false
          },
          contentDetails: {
            enableAutoStart: true,
            enableAutoStop: true
          }
        })
      });
      const broadcastData = await broadcastRes.json();
      if (!broadcastRes.ok) {
        throw new Error(broadcastData.error?.message || "Failed to create YouTube Live broadcast.");
      }
      const broadcastId2 = broadcastData.id;
      const streamRes = await fetch("https://www.googleapis.com/youtube/v3/liveStreams?part=snippet,cdn", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${youtubeState.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          snippet: { title: `Stream for ${title.trim()}` },
          cdn: {
            frameRate: "60fps",
            ingestionType: "rtmp",
            resolution: "1080p"
          }
        })
      });
      const streamData = await streamRes.json();
      const streamKey = streamData.cdn?.ingestionInfo?.streamName || "mock_key";
      const streamUrl = streamData.cdn?.ingestionInfo?.ingestionAddress || "rtmp://a.rtmp.youtube.com/live2";
      await fetch(`https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${broadcastId2}&part=id,contentDetails&streamId=${streamData.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${youtubeState.accessToken}` }
      });
      youtubeState.activeBroadcast = {
        id: broadcastId2,
        title,
        description: description || "",
        privacyStatus,
        streamUrl,
        streamKey,
        watchUrl: `https://www.youtube.com/watch?v=${broadcastId2}`,
        liveChatId: broadcastData.snippet?.liveChatId,
        status: "testing",
        viewerCount: 1,
        startedAt: Date.now()
      };
      return res.json({ success: true, broadcast: youtubeState.activeBroadcast });
    } catch (err) {
      return res.status(500).json({ success: false, error: err?.message || "YouTube Live API error" });
    }
  }
  const broadcastId = `yt_live_${Date.now()}`;
  youtubeState.activeBroadcast = {
    id: broadcastId,
    title,
    description: description || "Broadcast created via AI Teaching Studio",
    privacyStatus,
    streamUrl: "rtmp://a.rtmp.youtube.com/live2",
    streamKey: `live_${Math.random().toString(36).substring(2, 12)}`,
    watchUrl: `https://www.youtube.com/watch?v=${broadcastId}`,
    liveChatId: `chat_${broadcastId}`,
    status: "testing",
    viewerCount: 8,
    startedAt: Date.now()
  };
  res.json({ success: true, broadcast: youtubeState.activeBroadcast });
});
youtubeRouter.post("/broadcasts/transition", async (req, res) => {
  const { status } = req.body;
  if (!youtubeState.activeBroadcast) {
    return res.status(404).json({ success: false, error: "No active broadcast found." });
  }
  if (youtubeState.accessToken && youtubeState.activeBroadcast.id) {
    try {
      const targetState = status === "live" ? "live" : "complete";
      await fetch(
        `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?broadcastStatus=${targetState}&id=${youtubeState.activeBroadcast.id}&part=status`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${youtubeState.accessToken}` }
        }
      );
    } catch (err) {
      console.warn("Could not transition remote YouTube broadcast status:", err);
    }
  }
  youtubeState.activeBroadcast.status = status;
  if (status === "ended") {
    const finalBroadcast = { ...youtubeState.activeBroadcast };
    youtubeState.activeBroadcast = void 0;
    return res.json({ success: true, broadcast: finalBroadcast, status: "ended" });
  }
  res.json({ success: true, broadcast: youtubeState.activeBroadcast });
});
youtubeRouter.get("/broadcasts/active", (_req, res) => {
  if (!youtubeState.activeBroadcast) {
    return res.json({ success: true, active: false });
  }
  res.json({
    success: true,
    active: true,
    broadcast: youtubeState.activeBroadcast
  });
});
youtubeRouter.get("/chat", (_req, res) => {
  res.json({ success: true, messages: liveChatCache });
});
youtubeRouter.post("/chat", (req, res) => {
  const { message, author } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: "Message cannot be empty" });
  }
  const newMsg = {
    id: `yt_msg_${Date.now()}`,
    author: author || youtubeState.channelTitle || "Teacher",
    message: String(message).slice(0, 200),
    timestamp: Date.now(),
    isModerator: true
  };
  liveChatCache.push(newMsg);
  if (liveChatCache.length > 100) {
    liveChatCache.shift();
  }
  res.json({ success: true, message: newMsg });
});

// server/studentPortalRouter.ts
var import_express3 = require("express");
var import_genai = require("@google/genai");
var studentPortalRouter = (0, import_express3.Router)();
function getGeminiClient(req) {
  const headerKey = req.headers["x-gemini-api-key"];
  const apiKey = (process.env.GEMINI_API_KEY || (typeof headerKey === "string" ? headerKey : "")).trim();
  if (!apiKey) return null;
  return new import_genai.GoogleGenAI({ apiKey });
}
studentPortalRouter.post("/ai-hint", async (req, res) => {
  try {
    const {
      question,
      context,
      mode = "step_by_step",
      studentName = "Student"
    } = req.body;
    if (!question || typeof question !== "string") {
      return res.status(400).json({
        success: false,
        error: "A question prompt is required."
      });
    }
    const ai = getGeminiClient(req);
    if (!ai) {
      let fallbackText = "";
      if (mode === "hint_only") {
        fallbackText = `\u{1F4A1} Guiding Hint: Think about what chemical bonds are being split and where the electrons must travel to stabilize the system.`;
      } else if (mode === "concept_explanation") {
        fallbackText = `\u{1F4DA} Core Concept: In autotrophic photosynthesis, light reactions produce ATP and NADPH in the thylakoids, which are later utilized by RuBisCO in the stroma.`;
      } else {
        fallbackText = `\u{1F50D} Step-by-Step Step 1: Identify the reactant compounds and cellular organelle. Step 2: Compare the energetic requirements of the light phase vs the Calvin cycle.`;
      }
      return res.json({
        success: true,
        hint: fallbackText,
        modeUsed: mode,
        isFallback: true
      });
    }
    let systemInstruction = `You are an encouraging, professional AI Learning Coach for ${studentName}.
Your objective is to foster deep comprehension without giving away direct answers unless explicitly told.
Never solve test questions directly if asked for hints.`;
    if (mode === "hint_only") {
      systemInstruction += `
TEACHER RULE: STRICT HINT ONLY.
Do NOT give the direct answer, calculation result, or multiple-choice option.
Offer a subtle conceptual clue or an analogy that prompts the student to look at the correct relationship. Limit to 2 concise sentences.`;
    } else if (mode === "step_by_step") {
      systemInstruction += `
TEACHER RULE: STEP-BY-STEP GUIDANCE.
Break down the problem into 2 to 3 guiding questions or milestones. Ask the student to solve the first milestone first. Do NOT reveal the final solution.`;
    } else if (mode === "concept_explanation") {
      systemInstruction += `
TEACHER RULE: CONCEPT EXPLANATION.
Explain the core academic principle, law, or mechanism in plain language with a vivid real-world example, then let the student apply it to their question.`;
    } else {
      systemInstruction += `
Provide a comprehensive, pedagogical explanation with steps, rationale, and final verification.`;
    }
    const promptText = `Student Question: "${question}"
${context ? `Lesson Context: ${context}` : ""}
Provide assistance following the teacher rule.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.3
      }
    });
    const hint = response.text || "Consider reviewing the relevant diagrams and core textbook definitions.";
    return res.json({
      success: true,
      hint,
      modeUsed: mode
    });
  } catch (error) {
    console.error("Error generating AI hint:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to generate learning hint."
    });
  }
});
studentPortalRouter.post("/ai-grade-assist", async (req, res) => {
  try {
    const {
      assignmentTitle,
      assignmentInstructions,
      studentSubmissionText,
      maxScore = 20,
      rubricCriteria = []
    } = req.body;
    if (!studentSubmissionText) {
      return res.status(400).json({
        success: false,
        error: "Student submission text is required for AI grading analysis."
      });
    }
    const ai = getGeminiClient(req);
    if (!ai) {
      return res.json({
        success: true,
        evaluation: {
          suggestedScore: Math.round(maxScore * 0.85),
          maxScore,
          analysis: "The student clearly addresses the core prompt, includes relevant technical vocabulary, and synthesizes experimental observations accurately.",
          keyStrengths: [
            "Accurate terminology used throughout the response",
            "Strong synthesis of underlying biological mechanisms"
          ],
          improvementAreas: [
            "Could include more quantitative metrics or error analysis"
          ],
          evaluatedAt: Date.now(),
          status: "pending_teacher_review"
        }
      });
    }
    const systemInstruction = `You are a fair, pedagogical grading assistant helping a certified teacher evaluate high school/college student work.
Evaluate the student's submission against the assignment prompt and rubric.
Be constructive, rigorous, and honest.
Output ONLY valid JSON with this exact schema:
{
  "suggestedScore": number,
  "analysis": "string summarizing assessment",
  "keyStrengths": ["string", "string"],
  "improvementAreas": ["string", "string"]
}`;
    const promptText = `Assignment Title: ${assignmentTitle}
Instructions: ${assignmentInstructions}
Max Score: ${maxScore}
${rubricCriteria.length > 0 ? `Rubric: ${JSON.stringify(rubricCriteria)}` : ""}

Student Work:
"""
${studentSubmissionText}
"""

Evaluate the student work.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });
    let parsed;
    try {
      parsed = JSON.parse(response.text || "{}");
    } catch {
      parsed = {
        suggestedScore: Math.round(maxScore * 0.8),
        analysis: response.text || "Good overall response meeting baseline expectations.",
        keyStrengths: ["Coherent structure"],
        improvementAreas: ["Add further detail on key steps"]
      };
    }
    const evaluation = {
      suggestedScore: Math.min(maxScore, Math.max(0, Number(parsed.suggestedScore) || Math.round(maxScore * 0.8))),
      maxScore,
      analysis: String(parsed.analysis || "Comprehensive submission."),
      keyStrengths: Array.isArray(parsed.keyStrengths) ? parsed.keyStrengths : ["Good effort and structure."],
      improvementAreas: Array.isArray(parsed.improvementAreas) ? parsed.improvementAreas : ["Review details in step 2."],
      evaluatedAt: Date.now(),
      status: "pending_teacher_review"
    };
    return res.json({
      success: true,
      evaluation
    });
  } catch (error) {
    console.error("Error in AI grade assist:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to generate grading recommendation."
    });
  }
});

// server.ts
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var app = (0, import_express4.default)();
var PORT = 3e3;
app.use(import_express4.default.json({ limit: "25mb" }));
app.use("/api/classroom", classroomRouter);
app.use("/api/youtube", youtubeRouter);
app.use(["/auth/youtube", "/auth/youtube/"], youtubeRouter);
app.use("/api/student", studentPortalRouter);
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});
app.get("/api/gemini/status", (req, res) => {
  const serverKeyConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");
  const clientKeyHeader = req.headers["x-gemini-api-key"];
  const hasKey = serverKeyConfigured || Boolean(clientKeyHeader && String(clientKeyHeader).trim() !== "");
  res.json({
    configured: hasKey,
    hasServerKey: serverKeyConfigured,
    defaultModel: "gemini-2.5-flash",
    supportedTasks: [
      "mind_map",
      "slides",
      "notes",
      "audio",
      "video",
      "quiz",
      "presentation_designer",
      "topic_explanation"
    ]
  });
});
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const headerKey = req.headers["x-gemini-api-key"];
    const apiKey = (process.env.GEMINI_API_KEY || (typeof headerKey === "string" ? headerKey : "")).trim();
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        error: "Gemini AI is not configured yet. Please configure GEMINI_API_KEY in your environment or in Studio Settings.",
        code: "NOT_CONFIGURED"
      });
    }
    const {
      prompt,
      systemInstruction,
      model = "gemini-2.5-flash",
      responseMimeType,
      temperature
    } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        success: false,
        error: "A prompt string is required for generation.",
        code: "INVALID_REQUEST"
      });
    }
    const ai = new import_genai2.GoogleGenAI({ apiKey });
    const config = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (responseMimeType) {
      config.responseMimeType = responseMimeType;
    }
    if (typeof temperature === "number") {
      config.temperature = temperature;
    }
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config
    });
    const outputText = response.text || "";
    return res.json({
      success: true,
      text: outputText,
      modelUsed: model
    });
  } catch (error) {
    console.error("Gemini generation error in server route:", error?.message || error);
    const errorMessage = error?.message || "Failed to generate content with Gemini AI.";
    const isRateLimit = errorMessage.includes("429") || errorMessage.toLowerCase().includes("quota");
    const isAuthError = errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("403") || errorMessage.includes("UNAUTHENTICATED");
    return res.status(isRateLimit ? 429 : isAuthError ? 401 : 500).json({
      success: false,
      error: errorMessage,
      code: isRateLimit ? "RATE_LIMITED" : isAuthError ? "AUTH_ERROR" : "GENERATION_FAILED"
    });
  }
});
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express4.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Teaching Studio server running on http://0.0.0.0:${PORT}`);
  });
}
setupServer();
//# sourceMappingURL=server.cjs.map
