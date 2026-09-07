import { SupportedLanguage } from './project';
import { QuestionType, QuestionDifficulty, RubricCriterion, LessonStatus } from './curriculum';

/**
 * AI Teaching Studio — Part 10 Data Models
 * Student Learning Portal, Assessment Engine, Assignment Submissions,
 * Quiz Attempts, Revision Center, Personalized Learning, and Teacher Controls.
 */

export type UserRole = 'teacher' | 'student';

export type SubmissionStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'late'
  | 'graded'
  | 'returned';

export type AiHintMode =
  | 'hint_only'
  | 'step_by_step'
  | 'concept_explanation'
  | 'full_answer';

export type AnswerRevealTiming =
  | 'immediately'
  | 'after_submission'
  | 'teacher_manual'
  | 'never';

export type LearningSuggestionType =
  | 'review_topic'
  | 'practice_topic'
  | 'watch_lesson'
  | 'attempt_quiz'
  | 'spaced_revision';

export type PracticeDifficulty = 'basic' | 'standard' | 'advanced';

export interface StudentProfile {
  id: string; // e.g., "std_alex_morgan"
  displayName: string;
  avatarColor: string;
  enrolledCourseIds: string[];
  enrolledClassCodes: string[];
  learningLanguage: SupportedLanguage;
  createdAt: number;
}

export interface StudentLessonProgress {
  studentId: string;
  courseId: string;
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  slidesViewed: number[];
  notesRead: boolean;
  mindMapExplored: boolean;
  timeSpentSeconds: number;
  lastAccessedAt: number;
  completedAt?: number;
}

export interface AssignmentSubmissionAttachment {
  name: string;
  url?: string;
  type: string;
  sizeBytes?: number;
}

export interface AssignmentQuestionAnswer {
  questionId: string;
  responseText: string;
  marksAwarded?: number;
  teacherComment?: string;
}

export interface AiGradingEvaluation {
  suggestedScore: number;
  maxScore: number;
  analysis: string;
  keyStrengths: string[];
  improvementAreas: string[];
  evaluatedAt: number;
  status: 'pending_teacher_review' | 'accepted' | 'edited' | 'rejected';
}

export interface StudentAssignmentSubmission {
  id: string;
  assignmentId: string;
  courseId: string;
  lessonId?: string;
  studentId: string;
  studentName: string;
  attemptNumber: number;
  status: SubmissionStatus;
  textContent: string;
  attachments: AssignmentSubmissionAttachment[];
  answers: AssignmentQuestionAnswer[];
  score?: number;
  maxScore: number;
  feedback?: string;
  rubricScores?: { criterionId: string; score: number; comment?: string }[];
  aiEvaluation?: AiGradingEvaluation;
  submittedAt?: number;
  teacherGradedAt?: number;
  isResubmissionAllowed?: boolean;
}

export interface QuizAttemptAnswer {
  questionId: string;
  selectedOptionIndex?: number;
  textResponse?: string;
  isCorrect?: boolean;
  marksAwarded?: number;
  feedback?: string;
}

export interface StudentQuizAttempt {
  id: string;
  quizId: string; // Assessment plan ID or lesson quiz ID
  quizTitle: string;
  courseId: string;
  lessonId?: string;
  studentId: string;
  studentName: string;
  attemptNumber: number;
  startedAt: number;
  completedAt?: number;
  durationSeconds: number;
  score: number;
  totalPossibleScore: number;
  percentage: number;
  answers: QuizAttemptAnswer[];
  status: 'in_progress' | 'submitted' | 'graded';
  teacherFeedback?: string;
}

export interface PersonalizedLearningSuggestion {
  id: string;
  studentId: string;
  courseId: string;
  type: LearningSuggestionType;
  title: string;
  description: string;
  reason: string; // e.g. "Triggered by 45% score on Nutrition Quiz"
  topicId?: string;
  lessonId?: string;
  targetQuizId?: string;
  difficulty: PracticeDifficulty;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'dismissed' | 'completed';
  createdTimestamp: number;
}

export interface StudentAnnouncement {
  id: string;
  courseId: string;
  classCode?: string;
  title: string;
  content: string;
  type: 'class' | 'lesson' | 'assignment' | 'revision' | 'general';
  priority?: 'high' | 'normal' | 'low';
  publishedAt: number;
  teacherName: string;
  targetDueDate?: string;
  actionLink?: {
    label: string;
    tab: 'dashboard' | 'courses' | 'assignments' | 'quizzes' | 'revision';
    targetId?: string;
  };
}

export interface StudentDirectQuestion {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  lessonId?: string;
  topicTitle?: string;
  question: string;
  status: 'pending' | 'replied' | 'published_anonymous' | 'published_class';
  teacherReply?: string;
  repliedAt?: number;
  timestamp: number;
  aiHintHistory?: {
    timestamp: number;
    mode: AiHintMode;
    content: string;
  }[];
}

export interface CommonMisconception {
  id: string;
  courseId: string;
  topic: string;
  description: string;
  evidenceQuestionIds: string[];
  studentCountAffected: number;
  suggestedTeacherAction: string;
  status: 'identified' | 'addressed';
}

export interface TeacherStudentControls {
  allowStudentAiHints: boolean;
  aiHintMode: AiHintMode;
  allowAssignmentResubmission: boolean;
  maxQuizAttempts: number;
  revealQuizAnswers: AnswerRevealTiming;
  showScoresToStudents: boolean;
  enableDifficultyAdaptation: boolean;
  enableSpacedRevision: boolean;
  // Controls what content students can view per lesson
  publishedLessons: Record<string, boolean>; // lessonId -> boolean
  publishedModules: Record<
    string,
    {
      slides: boolean;
      mindMap: boolean;
      notes: boolean;
      quiz: boolean;
      assignment: boolean;
    }
  >;
  commonMisconceptions: CommonMisconception[];
}

export interface CourseCompletionCertificate {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  teacherName: string;
  institutionName?: string;
  issuedAt: number;
  gradeAverage: number;
  verificationCode: string;
}
