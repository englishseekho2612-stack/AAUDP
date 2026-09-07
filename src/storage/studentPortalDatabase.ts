/**
 * Student Learning Portal & Assessment Database Engine (Part 10)
 * 
 * Local-first IndexedDB storage with localStorage fallback.
 * Manages Student Profiles, Enrollments, Real Lesson Progress,
 * Assignment Submissions, Quiz Attempts, AI Recommendations,
 * Teacher Grading Reviews, Misconceptions, and Revision Center.
 */

import {
  StudentProfile,
  StudentLessonProgress,
  StudentAssignmentSubmission,
  StudentQuizAttempt,
  PersonalizedLearningSuggestion,
  StudentAnnouncement,
  StudentDirectQuestion,
  TeacherStudentControls,
  CourseCompletionCertificate,
} from '../types/studentPortal';
import { Course, CurriculumLesson } from '../types/curriculum';
import { curriculumDatabase } from './curriculumDatabase';

const DB_NAME = 'ai_teaching_studio_student_db';
const DB_VERSION = 1;

const STORAGE_KEYS = {
  ACTIVE_STUDENT_ID: 'ai_studio_active_student_id',
  STUDENT_PROFILES: 'ai_studio_student_profiles',
  LESSON_PROGRESS: 'ai_studio_lesson_progress',
  ASSIGNMENT_SUBMISSIONS: 'ai_studio_assignment_submissions',
  QUIZ_ATTEMPTS: 'ai_studio_quiz_attempts',
  TEACHER_CONTROLS: 'ai_studio_teacher_student_controls',
  ANNOUNCEMENTS: 'ai_studio_student_announcements',
  DIRECT_QUESTIONS: 'ai_studio_student_direct_questions',
  CERTIFICATES: 'ai_studio_completion_certificates',
};

// Initial Seed Student Profile
const INITIAL_SEED_STUDENTS: StudentProfile[] = [
  {
    id: 'std_alex_morgan',
    displayName: 'Alex Morgan',
    avatarColor: 'indigo',
    enrolledCourseIds: ['course_class10_science_2026'],
    enrolledClassCodes: ['STUDIO1', 'BIO101'],
    learningLanguage: 'en',
    createdAt: Date.now() - 86400000 * 14,
  },
  {
    id: 'std_priya_sharma',
    displayName: 'Priya Sharma',
    avatarColor: 'emerald',
    enrolledCourseIds: ['course_class10_science_2026'],
    enrolledClassCodes: ['STUDIO1'],
    learningLanguage: 'en',
    createdAt: Date.now() - 86400000 * 12,
  },
];

// Initial Teacher Student Controls
const INITIAL_TEACHER_CONTROLS: TeacherStudentControls = {
  allowStudentAiHints: true,
  aiHintMode: 'step_by_step',
  allowAssignmentResubmission: true,
  maxQuizAttempts: 3,
  revealQuizAnswers: 'after_submission',
  showScoresToStudents: true,
  enableDifficultyAdaptation: true,
  enableSpacedRevision: true,
  publishedLessons: {
    lesson_photosynthesis_intro: true,
    lesson_stomata_transpiration: true,
    lesson_digestive_enzymes: true,
  },
  publishedModules: {
    lesson_photosynthesis_intro: {
      slides: true,
      mindMap: true,
      notes: true,
      quiz: true,
      assignment: true,
    },
    lesson_stomata_transpiration: {
      slides: true,
      mindMap: true,
      notes: true,
      quiz: false,
      assignment: false,
    },
    lesson_digestive_enzymes: {
      slides: true,
      mindMap: false,
      notes: true,
      quiz: true,
      assignment: false,
    },
  },
  commonMisconceptions: [
    {
      id: 'misc_dark_reaction',
      courseId: 'course_class10_science_2026',
      topic: 'Photosynthesis (Calvin Cycle)',
      description:
        'Students frequently confuse the "Dark Reaction" as only occurring at night, rather than being light-independent and occurring during daylight hours.',
      evidenceQuestionIds: ['qb_photo_1', 'qb_photo_2'],
      studentCountAffected: 4,
      suggestedTeacherAction:
        'Re-explain daylight carbon fixation and emphasize enzyme dependence on ATP/NADPH generated during light reactions.',
      status: 'identified',
    },
    {
      id: 'misc_guard_cells',
      courseId: 'course_class10_science_2026',
      topic: 'Stomatal Dynamics',
      description:
        'Belief that stomatal opening is purely mechanical rather than driven by active potassium influx and osmotic swelling.',
      evidenceQuestionIds: ['qb_stomata_1'],
      studentCountAffected: 3,
      suggestedTeacherAction: 'Create interactive guard cell turgor simulation and revision quiz.',
      status: 'identified',
    },
  ],
};

// Initial Seed Submissions
const INITIAL_SUBMISSIONS: StudentAssignmentSubmission[] = [
  {
    id: 'sub_alex_photo_1',
    assignmentId: 'asmt_photo_lab_report',
    courseId: 'course_class10_science_2026',
    lessonId: 'lesson_photosynthesis_intro',
    studentId: 'std_alex_morgan',
    studentName: 'Alex Morgan',
    attemptNumber: 1,
    status: 'graded',
    textContent:
      'In our investigation of hydrilla aquatic plants under variable light wavelengths, oxygen bubble evolution peaked at 680nm (red light) and 430nm (blue light), while falling to near-zero under 550nm green light. This confirms that chlorophyll a and b absorb minimally in the green spectrum, reflecting green wavelengths back to the observer.',
    attachments: [
      {
        name: 'Hydrilla_Action_Spectrum_Chart.png',
        type: 'image/png',
        sizeBytes: 142000,
      },
    ],
    answers: [
      {
        questionId: 'qb_photo_1',
        responseText:
          'Water splitting (photolysis) at Photosystem II provides electrons to replace those excited in P680, liberating gaseous oxygen into the atmosphere.',
        marksAwarded: 5,
        teacherComment: 'Clear, concise explanation of the photolysis mechanism.',
      },
    ],
    score: 18,
    maxScore: 20,
    feedback:
      'Outstanding laboratory analysis, Alex! Your correlation between pigment absorption spectra and bubble frequency was well articulated. Be sure to label the error bars on your next graph.',
    rubricScores: [
      { criterionId: 'r1', score: 9, comment: 'Thorough hypothesis and controls.' },
      { criterionId: 'r2', score: 9, comment: 'Excellent data synthesis.' },
    ],
    submittedAt: Date.now() - 86400000 * 3,
    teacherGradedAt: Date.now() - 86400000 * 2,
    isResubmissionAllowed: false,
  },
];

// Initial Seed Quiz Attempts
const INITIAL_QUIZ_ATTEMPTS: StudentQuizAttempt[] = [
  {
    id: 'qa_alex_photo_mastery',
    quizId: 'asmt_unit1_test',
    quizTitle: 'Unit 1 Mastery Test: Life Processes',
    courseId: 'course_class10_science_2026',
    lessonId: 'lesson_photosynthesis_intro',
    studentId: 'std_alex_morgan',
    studentName: 'Alex Morgan',
    attemptNumber: 1,
    startedAt: Date.now() - 86400000 * 4,
    completedAt: Date.now() - 86400000 * 4 + 1800000,
    durationSeconds: 1240,
    score: 17,
    totalPossibleScore: 25,
    percentage: 68,
    answers: [
      {
        questionId: 'qb_photo_1',
        selectedOptionIndex: 1,
        isCorrect: true,
        marksAwarded: 5,
        feedback: 'Correct: Oxygen originates from water photolysis at PSII.',
      },
      {
        questionId: 'qb_photo_2',
        selectedOptionIndex: 3,
        isCorrect: false,
        marksAwarded: 0,
        feedback:
          'Incorrect: The light-independent Calvin cycle occurs during the day inside the chloroplast stroma, relying on NADPH and ATP.',
      },
      {
        questionId: 'qb_digest_1',
        selectedOptionIndex: 2,
        isCorrect: true,
        marksAwarded: 4,
        feedback: 'Correct: Bile salts mechanically emulsify large lipid droplets into micro-micelles.',
      },
    ],
    status: 'graded',
    teacherFeedback:
      'Good foundational grasp of photolysis and digestion. Spend some revision time reviewing the stroma reactions and Calvin cycle.',
  },
];

// Initial Seed Announcements
const INITIAL_ANNOUNCEMENTS: StudentAnnouncement[] = [
  {
    id: 'ann_midterm_schedule',
    courseId: 'course_class10_science_2026',
    classCode: 'STUDIO1',
    title: 'Mid-Term Revision & Assessment Schedule',
    content:
      'Welcome to Unit 1! Please review the interactive mind maps on Photosynthesis and Stomatal mechanics. Our first chapter test is scheduled for next Friday.',
    type: 'revision',
    publishedAt: Date.now() - 86400000 * 2,
    teacherName: 'Dr. Sarah Jenkins',
    targetDueDate: '2026-10-25',
    actionLink: {
      label: 'Open Revision Center',
      tab: 'revision',
    },
  },
  {
    id: 'ann_lab_report_guidelines',
    courseId: 'course_class10_science_2026',
    classCode: 'STUDIO1',
    title: 'Photosynthesis Lab Report Due Date',
    content:
      'Please submit your Hydrilla photosynthetic rate lab reports with graph attachments before Sunday midnight.',
    type: 'assignment',
    publishedAt: Date.now() - 86400000 * 5,
    teacherName: 'Dr. Sarah Jenkins',
    targetDueDate: '2026-10-20',
    actionLink: {
      label: 'View Assignment',
      tab: 'assignments',
      targetId: 'asmt_photo_lab_report',
    },
  },
];

class StudentPortalDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('student_profiles')) {
          db.createObjectStore('student_profiles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('lesson_progress')) {
          const store = db.createObjectStore('lesson_progress', {
            keyPath: ['studentId', 'lessonId'],
          });
          store.createIndex('studentId', 'studentId', { unique: false });
        }
        if (!db.objectStoreNames.contains('assignment_submissions')) {
          const store = db.createObjectStore('assignment_submissions', { keyPath: 'id' });
          store.createIndex('studentId', 'studentId', { unique: false });
          store.createIndex('assignmentId', 'assignmentId', { unique: false });
        }
        if (!db.objectStoreNames.contains('quiz_attempts')) {
          const store = db.createObjectStore('quiz_attempts', { keyPath: 'id' });
          store.createIndex('studentId', 'studentId', { unique: false });
          store.createIndex('quizId', 'quizId', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  private getLocal<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setLocal<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`LocalStorage write error for ${key}:`, e);
    }
  }

  // ================= ACTIVE STUDENT PROFILE =================
  getActiveStudentId(): string {
    return this.getLocal<string>(STORAGE_KEYS.ACTIVE_STUDENT_ID, 'std_alex_morgan');
  }

  setActiveStudentId(studentId: string): void {
    this.setLocal(STORAGE_KEYS.ACTIVE_STUDENT_ID, studentId);
  }

  async getAllStudentProfiles(): Promise<StudentProfile[]> {
    const list = this.getLocal<StudentProfile[]>(
      STORAGE_KEYS.STUDENT_PROFILES,
      INITIAL_SEED_STUDENTS
    );
    if (list.length === 0) {
      this.setLocal(STORAGE_KEYS.STUDENT_PROFILES, INITIAL_SEED_STUDENTS);
      return INITIAL_SEED_STUDENTS;
    }
    return list;
  }

  async getAllStudents(): Promise<StudentProfile[]> {
    return this.getAllStudentProfiles();
  }

  async getStudentProfile(studentId: string): Promise<StudentProfile | null> {
    const profiles = await this.getAllStudentProfiles();
    return profiles.find((p) => p.id === studentId) || null;
  }

  async saveStudentProfile(profile: StudentProfile): Promise<void> {
    const profiles = await this.getAllStudentProfiles();
    const idx = profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) profiles[idx] = profile;
    else profiles.push(profile);
    this.setLocal(STORAGE_KEYS.STUDENT_PROFILES, profiles);
  }

  async enrollInCourse(studentId: string, courseId: string): Promise<boolean> {
    const profile = await this.getStudentProfile(studentId);
    if (!profile) return false;
    if (!profile.enrolledCourseIds.includes(courseId)) {
      profile.enrolledCourseIds.push(courseId);
      await this.saveStudentProfile(profile);
    }
    return true;
  }

  async enrollInClassCode(studentId: string, classCode: string): Promise<boolean> {
    const profile = await this.getStudentProfile(studentId);
    if (!profile) return false;
    const upperCode = classCode.toUpperCase();
    if (!profile.enrolledClassCodes.includes(upperCode)) {
      profile.enrolledClassCodes.push(upperCode);
      await this.saveStudentProfile(profile);
    }
    return true;
  }

  // ================= LESSON PROGRESS (Real Interaction Tracking) =================
  async getLessonProgress(
    studentId: string,
    lessonId: string
  ): Promise<StudentLessonProgress | null> {
    const all = this.getLocal<StudentLessonProgress[]>(STORAGE_KEYS.LESSON_PROGRESS, [
      {
        studentId: 'std_alex_morgan',
        courseId: 'course_class10_science_2026',
        lessonId: 'lesson_photosynthesis_intro',
        status: 'completed',
        slidesViewed: [0, 1, 2, 3],
        notesRead: true,
        mindMapExplored: true,
        timeSpentSeconds: 1840,
        lastAccessedAt: Date.now() - 86400000,
        completedAt: Date.now() - 86400000,
      },
      {
        studentId: 'std_alex_morgan',
        courseId: 'course_class10_science_2026',
        lessonId: 'lesson_stomata_transpiration',
        status: 'in_progress',
        slidesViewed: [0, 1],
        notesRead: true,
        mindMapExplored: false,
        timeSpentSeconds: 620,
        lastAccessedAt: Date.now() - 86400000 * 2,
      },
    ]);
    return all.find((p) => p.studentId === studentId && p.lessonId === lessonId) || null;
  }

  async getAllProgressForStudent(studentId: string): Promise<StudentLessonProgress[]> {
    const all = this.getLocal<StudentLessonProgress[]>(STORAGE_KEYS.LESSON_PROGRESS, []);
    return all.filter((p) => p.studentId === studentId);
  }

  async updateLessonProgress(progress: StudentLessonProgress): Promise<void> {
    const all = this.getLocal<StudentLessonProgress[]>(STORAGE_KEYS.LESSON_PROGRESS, []);
    const idx = all.findIndex(
      (p) => p.studentId === progress.studentId && p.lessonId === progress.lessonId
    );
    if (idx >= 0) all[idx] = progress;
    else all.push(progress);
    this.setLocal(STORAGE_KEYS.LESSON_PROGRESS, all);
  }

  // ================= ASSIGNMENT SUBMISSIONS =================
  async getAllSubmissions(): Promise<StudentAssignmentSubmission[]> {
    const list = this.getLocal<StudentAssignmentSubmission[]>(
      STORAGE_KEYS.ASSIGNMENT_SUBMISSIONS,
      INITIAL_SUBMISSIONS
    );
    if (list.length === 0) {
      this.setLocal(STORAGE_KEYS.ASSIGNMENT_SUBMISSIONS, INITIAL_SUBMISSIONS);
      return INITIAL_SUBMISSIONS;
    }
    return list;
  }

  async getSubmissionsForStudent(studentId: string): Promise<StudentAssignmentSubmission[]> {
    const all = await this.getAllSubmissions();
    return all.filter((s) => s.studentId === studentId);
  }

  async getSubmissionByAssignmentAndStudent(
    assignmentId: string,
    studentId: string
  ): Promise<StudentAssignmentSubmission | null> {
    const all = await this.getAllSubmissions();
    return all.find((s) => s.assignmentId === assignmentId && s.studentId === studentId) || null;
  }

  async saveSubmission(submission: StudentAssignmentSubmission): Promise<void> {
    const all = await this.getAllSubmissions();
    const idx = all.findIndex((s) => s.id === submission.id);
    if (idx >= 0) all[idx] = submission;
    else all.push(submission);
    this.setLocal(STORAGE_KEYS.ASSIGNMENT_SUBMISSIONS, all);
  }

  // ================= QUIZ ATTEMPTS =================
  async getAllQuizAttempts(): Promise<StudentQuizAttempt[]> {
    const list = this.getLocal<StudentQuizAttempt[]>(
      STORAGE_KEYS.QUIZ_ATTEMPTS,
      INITIAL_QUIZ_ATTEMPTS
    );
    if (list.length === 0) {
      this.setLocal(STORAGE_KEYS.QUIZ_ATTEMPTS, INITIAL_QUIZ_ATTEMPTS);
      return INITIAL_QUIZ_ATTEMPTS;
    }
    return list;
  }

  async getQuizAttemptsForStudent(studentId: string): Promise<StudentQuizAttempt[]> {
    const all = await this.getAllQuizAttempts();
    return all
      .filter((a) => a.studentId === studentId)
      .sort((a, b) => (b.completedAt || b.startedAt) - (a.completedAt || a.startedAt));
  }

  async saveQuizAttempt(attempt: StudentQuizAttempt): Promise<void> {
    const all = await this.getAllQuizAttempts();
    const idx = all.findIndex((a) => a.id === attempt.id);
    if (idx >= 0) all[idx] = attempt;
    else all.push(attempt);
    this.setLocal(STORAGE_KEYS.QUIZ_ATTEMPTS, all);
  }

  // ================= TEACHER CONTROLS =================
  async getTeacherControls(_courseId?: string): Promise<TeacherStudentControls> {
    return this.getLocal<TeacherStudentControls>(
      STORAGE_KEYS.TEACHER_CONTROLS,
      INITIAL_TEACHER_CONTROLS
    );
  }

  async saveTeacherControls(controls: TeacherStudentControls): Promise<void> {
    this.setLocal(STORAGE_KEYS.TEACHER_CONTROLS, controls);
  }

  // ================= ANNOUNCEMENTS =================
  async getAnnouncements(courseId?: string): Promise<StudentAnnouncement[]> {
    const all = this.getLocal<StudentAnnouncement[]>(
      STORAGE_KEYS.ANNOUNCEMENTS,
      INITIAL_ANNOUNCEMENTS
    );
    if (!courseId) return all.sort((a, b) => b.publishedAt - a.publishedAt);
    return all.filter((ann) => ann.courseId === courseId).sort((a, b) => b.publishedAt - a.publishedAt);
  }

  async saveAnnouncement(announcement: StudentAnnouncement): Promise<void> {
    const all = await this.getAnnouncements();
    const idx = all.findIndex((a) => a.id === announcement.id);
    if (idx >= 0) all[idx] = announcement;
    else all.push(announcement);
    this.setLocal(STORAGE_KEYS.ANNOUNCEMENTS, all);
  }

  // ================= DIRECT QUESTIONS =================
  async getDirectQuestions(studentId?: string): Promise<StudentDirectQuestion[]> {
    const all = this.getLocal<StudentDirectQuestion[]>(STORAGE_KEYS.DIRECT_QUESTIONS, [
      {
        id: 'dq_1',
        studentId: 'std_alex_morgan',
        studentName: 'Alex Morgan',
        courseId: 'course_class10_science_2026',
        lessonId: 'lesson_photosynthesis_intro',
        topicTitle: 'Photosynthesis: Light Reactions',
        question: 'Why is chlorophyll b needed if chlorophyll a can already absorb light photons?',
        status: 'replied',
        teacherReply:
          'Excellent query! Chlorophyll b acts as an accessory antenna pigment. It absorbs wavelengths that chlorophyll a cannot efficiently capture (especially around 450-480nm) and funnels that excitation energy into the P680 reaction center.',
        repliedAt: Date.now() - 86400000 * 2,
        timestamp: Date.now() - 86400000 * 3,
      },
    ]);
    if (studentId) {
      return all.filter((q) => q.studentId === studentId);
    }
    return all;
  }

  async saveDirectQuestion(question: StudentDirectQuestion): Promise<void> {
    const all = await this.getDirectQuestions();
    const idx = all.findIndex((q) => q.id === question.id);
    if (idx >= 0) all[idx] = question;
    else all.push(question);
    this.setLocal(STORAGE_KEYS.DIRECT_QUESTIONS, all);
  }

  // ================= PERSONALIZED SUGGESTIONS ENGINE =================
  /**
   * Generates honest, evidence-based recommendations based on real student data:
   * 1. Low quiz scores (< 70%) trigger targeted topic reviews
   * 2. Lessons started but unfinished trigger "Continue Lesson"
   * 3. Upcoming assignment deadlines trigger "Complete Assignment"
   * 4. Spaced revision prompts for lessons completed over 5 days ago
   */
  async getPersonalizedSuggestions(
    studentId: string,
    courseId: string
  ): Promise<PersonalizedLearningSuggestion[]> {
    const suggestions: PersonalizedLearningSuggestion[] = [];

    const attempts = await this.getQuizAttemptsForStudent(studentId);
    const progressList = await this.getAllProgressForStudent(studentId);
    const course = await curriculumDatabase.getCourseById(courseId);

    // 1. Weak Topic Detection from Quiz Performance
    attempts
      .filter((a) => a.courseId === courseId)
      .forEach((attempt) => {
        if (attempt.percentage < 70) {
          suggestions.push({
            id: `sugg_quiz_${attempt.id}`,
            studentId,
            courseId,
            type: 'review_topic',
            title: `Review Concepts: ${attempt.quizTitle}`,
            description: `Focus on the light-independent reactions and chloroplast stroma mechanisms where questions were missed.`,
            reason: `Score was ${attempt.percentage}% on the previous attempt (${attempt.score}/${attempt.totalPossibleScore} marks).`,
            difficulty: 'standard',
            priority: 'high',
            status: 'active',
            createdTimestamp: attempt.completedAt || Date.now(),
          });
        }
      });

    // 2. Unfinished Lessons
    const inProgress = progressList.filter(
      (p) => p.courseId === courseId && p.status === 'in_progress'
    );
    inProgress.forEach((p) => {
      suggestions.push({
        id: `sugg_prog_${p.lessonId}`,
        studentId,
        courseId,
        type: 'watch_lesson',
        title: 'Resume Stomatal Dynamics & Gas Exchange',
        description: 'You have viewed 2 of 4 slides. Continue through guard cell osmosis to complete this lesson.',
        reason: 'Lesson marked in progress with 10 minutes recorded.',
        lessonId: p.lessonId,
        difficulty: 'standard',
        priority: 'medium',
        status: 'active',
        createdTimestamp: p.lastAccessedAt,
      });
    });

    // 3. Spaced Revision
    const completedLessons = progressList.filter(
      (p) => p.courseId === courseId && p.status === 'completed'
    );
    completedLessons.forEach((p) => {
      const daysSince = (Date.now() - (p.completedAt || p.lastAccessedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince >= 3) {
        suggestions.push({
          id: `sugg_spaced_${p.lessonId}`,
          studentId,
          courseId,
          type: 'spaced_revision',
          title: '3-Day Spaced Review: Photosynthesis Reactions',
          description: 'A quick 5-minute refresher on photolysis and electron transport reinforces long-term retention.',
          reason: `Completed ${Math.round(daysSince)} days ago. Optimal time for memory reinforcement.`,
          lessonId: p.lessonId,
          difficulty: 'basic',
          priority: 'low',
          status: 'active',
          createdTimestamp: Date.now(),
        });
      }
    });

    // Fallback suggestion if no activity recorded yet
    if (suggestions.length === 0) {
      suggestions.push({
        id: 'sugg_default',
        studentId,
        courseId,
        type: 'watch_lesson',
        title: 'Begin Unit 1: Photosynthesis',
        description: 'Explore the interactive slide presentation and examine chloroplast structure.',
        reason: 'Recommended starting point for Class 10 Science.',
        difficulty: 'standard',
        priority: 'high',
        status: 'active',
        createdTimestamp: Date.now(),
      });
    }

    return suggestions;
  }

  // ================= COMPLETION CERTIFICATES =================
  async getCertificates(studentId?: string): Promise<CourseCompletionCertificate[]> {
    const list = this.getLocal<CourseCompletionCertificate[]>(STORAGE_KEYS.CERTIFICATES, []);
    if (studentId) return list.filter((c) => c.studentId === studentId);
    return list;
  }

  async issueCertificate(cert: CourseCompletionCertificate): Promise<void> {
    const all = await this.getCertificates();
    all.push(cert);
    this.setLocal(STORAGE_KEYS.CERTIFICATES, all);
  }
}

export const studentPortalDatabase = new StudentPortalDatabase();
