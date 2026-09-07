/**
 * AI Teaching Studio — Part 05 Data Models
 * Online Classroom, Real-time Interaction, Teacher-Only Chat,
 * Polls, Quizzes, Attendance, and Official YouTube Live Integration.
 */

export type ClassroomStatus = 'scheduled' | 'live' | 'ended';
export type ParticipantStatus = 'active' | 'in_waiting_room' | 'disconnected' | 'removed';
export type QuizMode = 'practice' | 'test' | 'challenge';

export interface ClassroomPrivacyBoundaries {
  readonly showTeacherNotesToClass: false;
  readonly hidePrivateQuestionsFromStudents: true;
  allowStudentMic: boolean;
  allowStudentCamera: boolean;
  allowStudentScreenShare: boolean;
}

export interface ClassroomBroadcastState {
  contentMode: 'slides' | 'mind_map' | 'visual_tree' | 'whiteboard' | 'camera_content' | 'screen_share';
  currentSlideIndex: number;
  totalSlides: number;
  selectedMindMapNodeId?: string | null;
  whiteboardSnapshotUrl?: string;
  teacherCameraActive: boolean;
  teacherMicActive: boolean;
  announcement?: string | null;
  activePollId?: string | null;
  activeQuizId?: string | null;
  lastUpdated: number;
}

export interface ClassroomSession {
  id: string;
  classCode: string; // e.g. "ENG101", "BIO402"
  className: string;
  subject?: string;
  teacherName: string;
  description?: string;
  scheduledTime?: string;
  durationMinutes?: number;
  status: ClassroomStatus;
  isLocked: boolean;
  hasWaitingRoom: boolean;
  activeBroadcast: ClassroomBroadcastState;
  privacyBoundaries: ClassroomPrivacyBoundaries;
  studentCount: number;
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
  associatedProjectId?: string;
}

export interface StudentParticipant {
  id: string; // unique session/socket id
  classCode: string;
  displayName: string;
  joinedAt: number;
  leftAt?: number;
  status: ParticipantStatus;
  handRaised: boolean;
  handRaisedAt?: number;
  isMicAllowed: boolean;
  isMuted: boolean;
  reconnectCount: number;
  lastPingAt: number;
  totalDurationMs: number;
}

export interface StudentPrivateQuestion {
  id: string;
  classCode: string;
  studentId: string;
  studentName: string;
  message: string;
  timestamp: number;
  status: 'unread' | 'read' | 'answered' | 'published';
  teacherReply?: string;
  teacherRepliedAt?: number;
  isPublished: boolean;
  publishMode: 'anonymous' | 'with_name';
  publishedAt?: number;
}

export interface PollOption {
  id: string;
  label: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
  votes: number;
}

export interface ClassPoll {
  id: string;
  classCode: string;
  question: string;
  options: PollOption[];
  status: 'active' | 'closed';
  showResultsToStudents: boolean; // Teacher controls visibility!
  totalVotes: number;
  createdAt: number;
  closedAt?: number;
}

export interface QuizOption {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface ClassQuizQuestion {
  id: string;
  classCode: string;
  mode: QuizMode;
  question: string;
  options: QuizOption[];
  explanation?: string;
  timeLimitSeconds: number; // 10, 20, 30, 60, custom
  startedAt?: number;
  expiresAt?: number;
  status: 'active' | 'closed';
  revealAnswer: boolean;
  totalResponses: number;
  correctCount: number;
}

export interface AttendanceStudentEntry {
  studentId: string;
  displayName: string;
  joinedAt: number;
  leftAt?: number;
  durationMinutes: number;
  status: 'present' | 'late' | 'left_early' | 'removed';
  handRaisesCount: number;
  questionsAskedCount: number;
  pollsAnsweredCount: number;
  quizzesAnsweredCount: number;
}

export interface ClassroomAttendanceRecord {
  id: string;
  classCode: string;
  className: string;
  subject?: string;
  teacherName: string;
  startedAt: number;
  endedAt?: number;
  durationMinutes: number;
  totalStudents: number;
  students: AttendanceStudentEntry[];
  totalQuestionsReceived: number;
  totalPollsConducted: number;
  totalQuizzesConducted: number;
}

export interface YouTubeLiveState {
  isConnected: boolean;
  channelTitle?: string;
  channelAvatarUrl?: string;
  channelId?: string;
  streamTitle: string;
  description: string;
  privacyStatus: 'public' | 'unlisted' | 'private';
  broadcastStatus: 'idle' | 'testing' | 'live' | 'ended';
  liveStreamId?: string;
  broadcastId?: string;
  streamUrl?: string;
  streamKey?: string;
  viewerCount: number;
  liveChatId?: string;
  startedAt?: number;
  endedAt?: number;
  chatMessages: {
    id: string;
    author: string;
    message: string;
    timestamp: number;
    isModerator?: boolean;
  }[];
}

export interface ClassroomAuditEvent {
  id: string;
  classCode: string;
  type:
    | 'CLASS_CREATED'
    | 'CLASS_STARTED'
    | 'CLASS_LOCKED'
    | 'CLASS_UNLOCKED'
    | 'STUDENT_JOINED'
    | 'STUDENT_LEFT'
    | 'STUDENT_REMOVED'
    | 'HAND_RAISED'
    | 'HAND_LOWERED'
    | 'MIC_PERMITTED'
    | 'MIC_REVOKED'
    | 'QUESTION_RECEIVED'
    | 'QUESTION_REPLIED'
    | 'QUESTION_PUBLISHED'
    | 'POLL_STARTED'
    | 'POLL_CLOSED'
    | 'POLL_RESULTS_REVEALED'
    | 'QUIZ_LAUNCHED'
    | 'QUIZ_CLOSED'
    | 'QUIZ_ANSWER_REVEALED'
    | 'CLASS_ENDED';
  timestamp: number;
  description: string;
  actor: string; // 'teacher' | student name
}
