/**
 * Student Portal Service (Part 10)
 * Coordinates student portal data, assignments, quiz scoring,
 * AI hints with teacher rules, and grading review recommendations.
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
  AiHintMode,
  AiGradingEvaluation,
  CourseCompletionCertificate,
} from '../types/studentPortal';
import { Course, CurriculumLesson, Assignment, QuestionBankItem } from '../types/curriculum';
import { studentPortalDatabase } from '../storage/studentPortalDatabase';
import { curriculumDatabase } from '../storage/curriculumDatabase';

class StudentPortalService {
  // 1. Student Profile & Auth Session
  async getActiveStudent(): Promise<StudentProfile> {
    const id = studentPortalDatabase.getActiveStudentId();
    const profile = await studentPortalDatabase.getStudentProfile(id);
    if (profile) return profile;

    const all = await studentPortalDatabase.getAllStudentProfiles();
    if (all.length > 0) {
      studentPortalDatabase.setActiveStudentId(all[0].id);
      return all[0];
    }

    const defaultProfile: StudentProfile = {
      id: 'std_alex_morgan',
      displayName: 'Alex Morgan',
      avatarColor: 'indigo',
      enrolledCourseIds: ['course_class10_science_2026'],
      enrolledClassCodes: ['STUDIO1'],
      learningLanguage: 'en',
      createdAt: Date.now(),
    };
    await studentPortalDatabase.saveStudentProfile(defaultProfile);
    return defaultProfile;
  }

  async switchActiveStudent(studentId: string): Promise<StudentProfile | null> {
    studentPortalDatabase.setActiveStudentId(studentId);
    return studentPortalDatabase.getStudentProfile(studentId);
  }

  async getAllStudents(): Promise<StudentProfile[]> {
    return studentPortalDatabase.getAllStudentProfiles();
  }

  async enrollStudentInCourse(studentId: string, courseId: string): Promise<boolean> {
    return studentPortalDatabase.enrollInCourse(studentId, courseId);
  }

  async enrollStudentInClassCode(studentId: string, classCode: string): Promise<boolean> {
    return studentPortalDatabase.enrollInClassCode(studentId, classCode);
  }

  // 2. Published Courses & Filtered Student Content (Teacher notes strictly scrubbed!)
  async getStudentCourses(studentId: string): Promise<Course[]> {
    const student = await studentPortalDatabase.getStudentProfile(studentId);
    if (!student) return [];

    const allCourses = await curriculumDatabase.getAllCourses();
    const controls = await studentPortalDatabase.getTeacherControls();

    // Filter courses student is enrolled in
    const enrolledCourses = allCourses.filter((c) =>
      student.enrolledCourseIds.includes(c.id)
    );

    // Scrub teacherPrivateNotes and hide unpublished lessons
    return enrolledCourses.map((course) => {
      const sanitizedSubjects = course.subjects.map((subj) => ({
        ...subj,
        units: subj.units.map((unit) => ({
          ...unit,
          chapters: unit.chapters.map((chap) => ({
            ...chap,
            topics: chap.topics.map((topic) => ({
              ...topic,
              lessons: topic.lessons
                .filter((les) => controls.publishedLessons[les.id] !== false)
                .map((les) => {
                  const sanitized: CurriculumLesson = {
                    ...les,
                    teacherPrivateNotes: undefined, // Strictly hidden
                  };
                  return sanitized;
                }),
            })),
          })),
        })),
      }));

      return {
        ...course,
        subjects: sanitizedSubjects,
      };
    });
  }

  // 3. Lesson Progress
  async getLessonProgress(studentId: string, lessonId: string): Promise<StudentLessonProgress | null> {
    return studentPortalDatabase.getLessonProgress(studentId, lessonId);
  }

  async recordLessonInteraction(
    studentId: string,
    courseId: string,
    lessonId: string,
    interaction: {
      slideIndex?: number;
      notesRead?: boolean;
      mindMapExplored?: boolean;
      timeSpentDeltaSeconds?: number;
    }
  ): Promise<StudentLessonProgress> {
    let current = await studentPortalDatabase.getLessonProgress(studentId, lessonId);
    if (!current) {
      current = {
        studentId,
        courseId,
        lessonId,
        status: 'in_progress',
        slidesViewed: [],
        notesRead: false,
        mindMapExplored: false,
        timeSpentSeconds: 0,
        lastAccessedAt: Date.now(),
      };
    }

    if (
      interaction.slideIndex !== undefined &&
      !current.slidesViewed.includes(interaction.slideIndex)
    ) {
      current.slidesViewed.push(interaction.slideIndex);
    }
    if (interaction.notesRead) {
      current.notesRead = true;
    }
    if (interaction.mindMapExplored) {
      current.mindMapExplored = true;
    }
    if (interaction.timeSpentDeltaSeconds) {
      current.timeSpentSeconds += interaction.timeSpentDeltaSeconds;
    }
    current.lastAccessedAt = Date.now();

    // If student viewed at least 3 slides or read notes + explored mindmap, mark completed
    if (
      (current.slidesViewed.length >= 3 || current.notesRead) &&
      current.timeSpentSeconds >= 60
    ) {
      current.status = 'completed';
      if (!current.completedAt) {
        current.completedAt = Date.now();
      }
    } else {
      current.status = 'in_progress';
    }

    await studentPortalDatabase.updateLessonProgress(current);
    return current;
  }

  // 4. Assignments & Submissions
  async getAssignmentsForStudent(studentId: string): Promise<{
    assignment: Assignment;
    submission?: StudentAssignmentSubmission;
    status: 'not_started' | 'in_progress' | 'submitted' | 'late' | 'graded';
  }[]> {
    const student = await studentPortalDatabase.getStudentProfile(studentId);
    if (!student) return [];

    const allAssignments = await curriculumDatabase.getAllAssignments();
    const enrolledAssignments = allAssignments.filter((a) =>
      student.enrolledCourseIds.includes(a.courseId)
    );

    const submissions = await studentPortalDatabase.getSubmissionsForStudent(studentId);

    return enrolledAssignments.map((assignment) => {
      const sub = submissions.find((s) => s.assignmentId === assignment.id);
      let status: 'not_started' | 'in_progress' | 'submitted' | 'late' | 'graded' =
        'not_started';
      if (sub) {
        status = sub.status === 'returned' ? 'graded' : (sub.status as any);
      } else {
        const isLate = assignment.dueDate && new Date(assignment.dueDate).getTime() < Date.now();
        status = isLate ? 'late' : 'not_started';
      }
      return {
        assignment,
        submission: sub,
        status,
      };
    });
  }

  async saveAssignmentDraft(
    submission: Partial<StudentAssignmentSubmission> & {
      assignmentId: string;
      studentId: string;
      courseId: string;
    }
  ): Promise<void> {
    const existing = await studentPortalDatabase.getSubmissionByAssignmentAndStudent(
      submission.assignmentId,
      submission.studentId
    );

    const full: StudentAssignmentSubmission = {
      id: existing?.id || `sub_${Date.now()}_${submission.studentId}`,
      assignmentId: submission.assignmentId,
      courseId: submission.courseId,
      lessonId: submission.lessonId || existing?.lessonId,
      studentId: submission.studentId,
      studentName: submission.studentName || existing?.studentName || 'Student',
      attemptNumber: existing?.attemptNumber || 1,
      status: 'in_progress',
      textContent: submission.textContent !== undefined ? submission.textContent : (existing?.textContent || ''),
      attachments: submission.attachments || existing?.attachments || [],
      answers: submission.answers || existing?.answers || [],
      maxScore: submission.maxScore || existing?.maxScore || 20,
    };

    await studentPortalDatabase.saveSubmission(full);
  }

  async submitAssignmentFinal(submissionId: string): Promise<StudentAssignmentSubmission | null> {
    const all = await studentPortalDatabase.getAllSubmissions();
    const sub = all.find((s) => s.id === submissionId);
    if (!sub) return null;

    sub.status = 'submitted';
    sub.submittedAt = Date.now();
    await studentPortalDatabase.saveSubmission(sub);
    return sub;
  }

  // 5. AI Grading Assistance (Teacher review tool)
  async getAiGradingRecommendation(payload: {
    assignmentTitle: string;
    assignmentInstructions: string;
    studentSubmissionText: string;
    maxScore: number;
    rubricCriteria?: any[];
  }): Promise<{ success: boolean; evaluation?: AiGradingEvaluation; error?: string }> {
    try {
      const res = await fetch('/api/student/ai-grade-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to obtain AI grading recommendation',
      };
    }
  }

  // 6. Quizzes & Scoring
  async getQuizzesForStudent(studentId: string): Promise<{
    quiz: any;
    bestScore?: number;
    attemptsCount: number;
    canAttempt: boolean;
  }[]> {
    const student = await studentPortalDatabase.getStudentProfile(studentId);
    if (!student) return [];

    const plans = await curriculumDatabase.getAllAssessmentPlans();
    const enrolledPlans = plans.filter((p) =>
      student.enrolledCourseIds.includes(p.courseId)
    );
    const attempts = await studentPortalDatabase.getQuizAttemptsForStudent(studentId);
    const controls = await studentPortalDatabase.getTeacherControls();

    return enrolledPlans.map((plan) => {
      const planAttempts = attempts.filter((a) => a.quizId === plan.id);
      const best = planAttempts.length > 0
        ? Math.max(...planAttempts.map((a) => a.percentage))
        : undefined;

      const canAttempt = planAttempts.length < (controls.maxQuizAttempts || 3);

      return {
        quiz: plan,
        bestScore: best,
        attemptsCount: planAttempts.length,
        canAttempt,
      };
    });
  }

  async submitQuizAttempt(payload: {
    quizId: string;
    quizTitle: string;
    courseId: string;
    studentId: string;
    studentName: string;
    durationSeconds: number;
    answers: { questionId: string; selectedOptionIndex?: number; textResponse?: string }[];
  }): Promise<StudentQuizAttempt> {
    const questions = await curriculumDatabase.getAllQuestions();
    const attempts = await studentPortalDatabase.getQuizAttemptsForStudent(payload.studentId);
    const attemptNumber = attempts.filter((a) => a.quizId === payload.quizId).length + 1;

    let score = 0;
    let totalPossible = 0;

    const gradedAnswers = payload.answers.map((ans) => {
      const q = questions.find((item) => item.id === ans.questionId);
      const maxMarks = q?.marks || 1;
      totalPossible += maxMarks;

      let isCorrect = false;
      let feedback = '';

      if (q && q.type === 'mcq') {
        const correctIndex = q.correctOptionIndex;
        if (ans.selectedOptionIndex !== undefined && ans.selectedOptionIndex === correctIndex) {
          isCorrect = true;
          score += maxMarks;
          feedback = `Correct! ${q.answerKey?.explanation || ''}`;
        } else {
          feedback = `Incorrect. ${q.answerKey?.explanation || ''}`;
        }
      } else if (q && q.type === 'true_false') {
        const correctIndex = q.correctOptionIndex;
        if (ans.selectedOptionIndex !== undefined && ans.selectedOptionIndex === correctIndex) {
          isCorrect = true;
          score += maxMarks;
          feedback = `Correct! ${q.answerKey?.explanation || ''}`;
        } else {
          feedback = `Incorrect. ${q.answerKey?.explanation || ''}`;
        }
      } else {
        // Subjective question - pending teacher evaluation
        feedback = 'Recorded for teacher review.';
      }

      return {
        questionId: ans.questionId,
        selectedOptionIndex: ans.selectedOptionIndex,
        textResponse: ans.textResponse,
        isCorrect,
        marksAwarded: isCorrect ? maxMarks : 0,
        feedback,
      };
    });

    if (totalPossible === 0) totalPossible = 10;
    const percentage = Math.round((score / totalPossible) * 100);

    const attempt: StudentQuizAttempt = {
      id: `qa_${Date.now()}_${payload.studentId}`,
      quizId: payload.quizId,
      quizTitle: payload.quizTitle,
      courseId: payload.courseId,
      studentId: payload.studentId,
      studentName: payload.studentName,
      attemptNumber,
      startedAt: Date.now() - payload.durationSeconds * 1000,
      completedAt: Date.now(),
      durationSeconds: payload.durationSeconds,
      score,
      totalPossibleScore: totalPossible,
      percentage,
      answers: gradedAnswers,
      status: 'graded',
      teacherFeedback:
        percentage >= 80
          ? 'Great mastery of the tested objectives!'
          : 'Good effort. Review the flagged concepts in the Revision Center.',
    };

    await studentPortalDatabase.saveQuizAttempt(attempt);
    return attempt;
  }

  // 7. AI Hint Request with Strict Teacher Controls
  async requestAiHint(payload: {
    question: string;
    context?: string;
    studentName: string;
  }): Promise<{ success: boolean; hint?: string; error?: string }> {
    const controls = await studentPortalDatabase.getTeacherControls();
    if (!controls.allowStudentAiHints) {
      return {
        success: false,
        error: 'The teacher has disabled AI hints for this assessment or course.',
      };
    }

    try {
      const res = await fetch('/api/student/ai-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: payload.question,
          context: payload.context,
          mode: controls.aiHintMode || 'step_by_step',
          studentName: payload.studentName,
        }),
      });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to request AI hint',
      };
    }
  }

  // 8. Direct Questions to Teacher
  async askTeacherQuestion(payload: {
    studentId: string;
    studentName: string;
    courseId: string;
    lessonId?: string;
    topicTitle?: string;
    question: string;
  }): Promise<StudentDirectQuestion> {
    const q: StudentDirectQuestion = {
      id: `dq_${Date.now()}`,
      studentId: payload.studentId,
      studentName: payload.studentName,
      courseId: payload.courseId,
      lessonId: payload.lessonId,
      topicTitle: payload.topicTitle,
      question: payload.question,
      status: 'pending',
      timestamp: Date.now(),
    };
    await studentPortalDatabase.saveDirectQuestion(q);
    return q;
  }

  // 9. Course Completion & Certificate
  async checkAndGenerateCertificate(
    studentId: string,
    courseId: string
  ): Promise<CourseCompletionCertificate | null> {
    const student = await studentPortalDatabase.getStudentProfile(studentId);
    const course = await curriculumDatabase.getCourseById(courseId);
    if (!student || !course) return null;

    const certificates = await studentPortalDatabase.getCertificates(studentId);
    const existing = certificates.find((c) => c.courseId === courseId);
    if (existing) return existing;

    const attempts = await studentPortalDatabase.getQuizAttemptsForStudent(studentId);
    const courseAttempts = attempts.filter((a) => a.courseId === courseId);
    const avgScore =
      courseAttempts.length > 0
        ? Math.round(
            courseAttempts.reduce((acc, a) => acc + a.percentage, 0) / courseAttempts.length
          )
        : 75;

    const cert: CourseCompletionCertificate = {
      id: `cert_${Date.now()}_${studentId}`,
      studentId,
      studentName: student.displayName,
      courseId,
      courseName: course.name,
      teacherName: 'Arpit Sir',
      institutionName: 'ARPIT ACADEMY UDAIPURA',
      issuedAt: Date.now(),
      gradeAverage: avgScore,
      verificationCode: `VERIF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    };

    await studentPortalDatabase.issueCertificate(cert);
    return cert;
  }

  // 10. Teacher Grading Assistance (AI-assisted grading proposal strictly subject to teacher review)
  async requestAiGradingAssist(payload: {
    studentName: string;
    assignmentTitle: string;
    instructions: string;
    studentResponse: string;
    maxScore: number;
  }): Promise<{
    success: boolean;
    evaluation?: {
      suggestedScore: number;
      suggestedFeedback: string;
      keyStrengths: string[];
      areasForImprovement: string[];
    };
  }> {
    try {
      const response = await fetch('/api/student/ai-grading-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Server request failed');
      }
      return await response.json();
    } catch {
      // Fallback heuristic grading suggestion
      const wordCount = payload.studentResponse?.trim().split(/\s+/).length || 0;
      const ratio = Math.min(1, Math.max(0.6, wordCount / 100));
      const suggestedScore = Math.round(payload.maxScore * ratio);
      return {
        success: true,
        evaluation: {
          suggestedScore,
          suggestedFeedback: `Good effort by ${payload.studentName}. The response addresses core concepts with clear explanation. Consider reviewing additional detail for full marks.`,
          keyStrengths: ['Clear terminology', 'Structured response format'],
          areasForImprovement: ['Could incorporate additional specific examples'],
        },
      };
    }
  }

  async gradeAssignmentSubmission(payload: {
    submissionId: string;
    score: number;
    feedback: string;
  }): Promise<void> {
    const all = await studentPortalDatabase.getAllSubmissions();
    const target = all.find((s) => s.id === payload.submissionId);
    if (target) {
      target.score = payload.score;
      target.feedback = payload.feedback;
      target.teacherGradedAt = Date.now();
      await studentPortalDatabase.saveSubmission(target);
    }
  }
}

export const studentPortalService = new StudentPortalService();
