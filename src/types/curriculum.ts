import { SupportedLanguage } from './project';

/**
 * Academic Curriculum & Course Management Data Models (Part 9)
 */

export type CurriculumBoard =
  | 'CBSE'
  | 'ICSE'
  | 'Cambridge (IGCSE/A-Levels)'
  | 'IB (International Baccalaureate)'
  | 'State Board'
  | 'National Curriculum'
  | 'Higher Education'
  | 'Vocational / Skill'
  | 'Custom / Other';

export type LessonStatus =
  | 'not_started'
  | 'planning'
  | 'content_ready'
  | 'ready_to_teach'
  | 'teaching_completed'
  | 'needs_revision'
  | 'completed'
  | 'archived';

export type ContentTag =
  | 'Important'
  | 'Revision'
  | 'Exam'
  | 'Homework'
  | 'Difficult'
  | 'Example'
  | 'Diagram'
  | 'Activity'
  | 'Foundation'
  | 'Advanced'
  | string;

export type QuestionType =
  | 'mcq'
  | 'true_false'
  | 'short_answer'
  | 'long_answer'
  | 'fill_blank'
  | 'application'
  | 'conceptual'
  | 'exam_style';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard' | 'advanced' | 'olympiad_exam';

export type AssessmentType = 'quiz' | 'unit_test' | 'chapter_test' | 'practice_test' | 'mock_test';

export interface AnswerKey {
  correctAnswer: string;
  explanation: string;
  sourceReference?: string;
  markingGuidance?: string;
}

export interface QuestionBankItem {
  id: string;
  courseId?: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  type: QuestionType;
  questionText: string;
  options?: string[]; // For MCQ
  correctOptionIndex?: number;
  answerKey: AnswerKey;
  marks: number;
  difficulty: QuestionDifficulty;
  sourceAttribution?: string;
  tags: ContentTag[];
  createdTimestamp: number;
  updatedTimestamp: number;
}

export interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  maxMarks: number;
  criteria?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  subjectId?: string;
  chapterId?: string;
  lessonId?: string;
  title: string;
  instructions: string;
  topic?: string;
  totalMarks: number;
  maxScore?: number;
  dueDate?: string; // YYYY-MM-DD
  questionIds?: string[]; // linked question bank items
  rubric: RubricCriterion[];
  attachments?: { name: string; url?: string; type: string }[];
  status: 'draft' | 'published' | 'closed' | 'archived';
  createdTimestamp: number;
  updatedTimestamp: number;
}

export interface LessonTemplate {
  id: string;
  name: string;
  description: string;
  sections: {
    title: string;
    description: string;
    estimatedMinutes: number;
    recommendedContentType?: 'slides' | 'mind_map' | 'notes' | 'quiz' | 'activity' | 'video';
  }[];
  isCustom?: boolean;
}

export interface LessonReadinessChecklist {
  hasSources: boolean;
  hasObjectives: boolean;
  hasSlides: boolean;
  hasMindMap: boolean;
  hasNotes: boolean;
  hasQuiz: boolean;
  hasAssignment: boolean;
  hasRecordingPlan: boolean;
  // Customizable required vs optional flags
  requiredKeys: string[];
}

export interface CurriculumLesson {
  id: string;
  topicId: string;
  chapterId: string;
  unitId: string;
  subjectId: string;
  courseId: string;
  title: string;
  orderIndex: number;
  status: LessonStatus;
  objectives: string[];
  estimatedDurationMinutes: number;
  tags: ContentTag[];
  
  // Link to existing TeachingProject (Part 1-8 engine)
  linkedProjectId?: string;
  teachingProjectId?: string;
  templateId?: string;
  teacherNotes?: string;
  
  // Directly stored or referenced content modules
  sourceRefs: { id: string; name: string; type: string }[];
  hasSlides: boolean;
  hasMindMap: boolean;
  hasNotes: boolean;
  hasQuiz: boolean;
  hasAssignment: boolean;
  hasRecording: boolean;
  hasEditedVideo: boolean;
  
  // Teacher-only notes & private script (strictly isolated from students)
  teacherPrivateNotes?: string;
  
  // Classroom session & YouTube video linkage
  lastClassroomSessionCode?: string;
  linkedYouTubeVideoId?: string;
  linkedVideoEditorProjectId?: string;
  
  // Versioning
  version: number;
  lastTaughtDate?: string;
  createdTimestamp: number;
  updatedTimestamp: number;
}

export interface CurriculumTopic {
  id: string;
  chapterId: string;
  unitId: string;
  subjectId: string;
  courseId: string;
  title: string;
  orderIndex: number;
  description?: string;
  lessons: CurriculumLesson[];
}

export interface CurriculumChapter {
  id: string;
  unitId: string;
  subjectId: string;
  courseId: string;
  title: string;
  orderIndex: number;
  description?: string;
  topics: CurriculumTopic[];
  revisionStatus?: 'not_scheduled' | 'scheduled' | 'completed';
  assessmentStatus?: 'not_scheduled' | 'scheduled' | 'completed';
}

export interface CurriculumUnit {
  id: string;
  subjectId: string;
  courseId: string;
  title: string;
  orderIndex: number;
  description?: string;
  chapters: CurriculumChapter[];
}

export interface CourseBatch {
  id: string;
  name: string; // e.g. "Section A", "Morning Batch"
  studentCount?: number;
  notes?: string;
}

export interface CourseSubject {
  id: string;
  courseId: string;
  name: string; // e.g. "Biology", "Physics", "English Literature"
  code?: string;
  description?: string;
  units: CurriculumUnit[];
}

export interface AcademicCalendarTerm {
  id: string;
  name: string; // e.g. "Term 1", "Semester 1", "Midterm"
  startDate: string; // YYYY-MM-DD
  endDate: string;
  teachingDays: number[]; // 0 = Sun, 1 = Mon ...
  holidays: { date: string; name: string }[];
  examPeriods: { startDate: string; endDate: string; title: string }[];
}

export interface ScheduledLesson {
  id: string;
  courseId: string;
  subjectId: string;
  lessonId: string;
  lessonTitle: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  durationMinutes: number;
  batchId?: string;
  isCompleted: boolean;
  notes?: string;
}

export interface RevisionPlan {
  id: string;
  courseId: string;
  subjectId: string;
  chapterIds: string[];
  title: string;
  targetDate: string;
  durationMinutes: number;
  keyTopics: string[];
  recommendedQuizId?: string;
  weakAreasIdentified?: string[];
  isApprovedByTeacher: boolean;
  status: 'planned' | 'in_progress' | 'completed';
}

export interface AssessmentPlan {
  id: string;
  courseId: string;
  subjectId: string;
  type: AssessmentType;
  title: string;
  targetDate: string;
  durationMinutes: number;
  totalMarks: number;
  chapterIds: string[];
  questionIds: string[];
  status: 'draft' | 'ready' | 'conducted' | 'reviewed';
}

export interface Course {
  id: string;
  name: string; // e.g. "Class 10 Science"
  subject: string; // primary subject or umbrella
  classGrade: string; // e.g. "Class 10", "Grade 12", "Undergrad Year 1"
  academicYear: string; // e.g. "2026–27"
  language: SupportedLanguage;
  board: CurriculumBoard;
  description?: string;
  batches: CourseBatch[];
  subjects: CourseSubject[];
  isArchived?: boolean;
  targetCompletionDate?: string; // YYYY-MM-DD
  weeklyTeachingHours?: number;
  createdTimestamp: number;
  updatedTimestamp: number;
}

export interface ContentItem {
  id: string;
  name: string;
  type:
    | 'presentation'
    | 'mind_map'
    | 'notes'
    | 'video'
    | 'audio'
    | 'quiz'
    | 'question'
    | 'assignment'
    | 'source'
    | 'recording'
    | 'backup';
  courseId?: string;
  subjectId?: string;
  chapterId?: string;
  lessonId?: string;
  projectId?: string;
  tags: ContentTag[];
  summary?: string;
  createdTimestamp: number;
  updatedTimestamp: number;
  sizeBytes?: number;
  isSharedReference?: boolean;
}

/**
 * AI Origin tagging for curriculum items
 */
export type ContentOrigin = 'SOURCE_CURRICULUM' | 'AI_SUGGESTION' | 'TEACHER_ADDITION';

export interface CurriculumAISuggestion {
  origin: ContentOrigin;
  sourceCitation?: string;
  title: string;
  description?: string;
  estimatedLessons?: number;
  chapters?: {
    title: string;
    description: string;
    topics: {
      title: string;
      estimatedMinutes: number;
      learningObjectives: string[];
    }[];
  }[];
}
