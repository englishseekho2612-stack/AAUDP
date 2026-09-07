/**
 * Curriculum & Academic Database Engine (Part 9)
 * 
 * Local-first IndexedDB storage with full fallback to localStorage.
 * Manages Courses, Subjects, Curriculum Hierarchy, Question Bank,
 * Assignments, Schedules, Revision Plans, and Assessments.
 */

import {
  Course,
  QuestionBankItem,
  Assignment,
  ScheduledLesson,
  RevisionPlan,
  AssessmentPlan,
  AcademicCalendarTerm,
  LessonTemplate,
  CurriculumLesson,
} from '../types/curriculum';
import { DEFAULT_LESSON_TEMPLATES } from '../data/defaultLessonTemplates';

const DB_NAME = 'ai_teaching_studio_curriculum_db';
const DB_VERSION = 1;

// Storage keys for localStorage fallback
const STORAGE_KEYS = {
  COURSES: 'ai_studio_courses',
  QUESTION_BANK: 'ai_studio_question_bank',
  ASSIGNMENTS: 'ai_studio_assignments',
  SCHEDULE: 'ai_studio_teaching_schedule',
  REVISION_PLANS: 'ai_studio_revision_plans',
  ASSESSMENT_PLANS: 'ai_studio_assessment_plans',
  CALENDAR_TERMS: 'ai_studio_calendar_terms',
  TEMPLATES: 'ai_studio_lesson_templates',
};

// Seed sample course so teacher immediately has rich structure to explore and test
const INITIAL_SEED_COURSE: Course = {
  id: 'course_class10_science_2026',
  name: 'Class 10 Science (Comprehensive)',
  subject: 'Science',
  classGrade: 'Class 10',
  academicYear: '2026–27',
  language: 'en',
  board: 'CBSE',
  description: 'Full academic curriculum covering Biology, Chemistry, and Physics with interactive mind maps, problem-solving, and laboratory demonstrations.',
  weeklyTeachingHours: 4,
  targetCompletionDate: '2027-02-28',
  createdTimestamp: Date.now() - 86400000 * 10,
  updatedTimestamp: Date.now() - 86400000 * 2,
  batches: [
    { id: 'batch_10a', name: 'Section 10-A (Morning)', studentCount: 32 },
    { id: 'batch_10b', name: 'Section 10-B (Afternoon)', studentCount: 28 },
  ],
  subjects: [
    {
      id: 'subj_biology',
      courseId: 'course_class10_science_2026',
      name: 'Biology',
      code: 'BIO-10',
      description: 'Life processes, reproduction, genetics, and ecology.',
      units: [
        {
          id: 'unit_life_processes',
          subjectId: 'subj_biology',
          courseId: 'course_class10_science_2026',
          title: 'Unit 1: Life Processes & Homeostasis',
          orderIndex: 0,
          description: 'Cellular and physiological mechanisms for sustaining life.',
          chapters: [
            {
              id: 'chap_nutrition',
              unitId: 'unit_life_processes',
              subjectId: 'subj_biology',
              courseId: 'course_class10_science_2026',
              title: 'Chapter 1: Nutrition & Photosynthesis',
              orderIndex: 0,
              description: 'Autotrophic and heterotrophic modes of food acquisition.',
              revisionStatus: 'scheduled',
              assessmentStatus: 'scheduled',
              topics: [
                {
                  id: 'topic_autotrophic',
                  chapterId: 'chap_nutrition',
                  unitId: 'unit_life_processes',
                  subjectId: 'subj_biology',
                  courseId: 'course_class10_science_2026',
                  title: 'Autotrophic Nutrition',
                  orderIndex: 0,
                  lessons: [
                    {
                      id: 'lesson_photosynthesis_intro',
                      topicId: 'topic_autotrophic',
                      chapterId: 'chap_nutrition',
                      unitId: 'unit_life_processes',
                      subjectId: 'subj_biology',
                      courseId: 'course_class10_science_2026',
                      title: 'Photosynthesis: Light Reactions & Calvin Cycle',
                      orderIndex: 0,
                      status: 'ready_to_teach',
                      objectives: [
                        'Explain the dual phases of photosynthetic energy conversion',
                        'Differentiate chlorophyll excitation from carbohydrate reduction',
                        'Analyze limiting environmental factors for photosynthetic rate',
                      ],
                      estimatedDurationMinutes: 45,
                      tags: ['Important', 'Exam', 'Diagram'],
                      sourceRefs: [{ id: 'src_ncert_bio', name: 'NCERT Class 10 Biology Ch 6.pdf', type: 'pdf' }],
                      hasSlides: true,
                      hasMindMap: true,
                      hasNotes: true,
                      hasQuiz: true,
                      hasAssignment: true,
                      hasRecording: false,
                      hasEditedVideo: false,
                      teacherPrivateNotes: 'Make sure to emphasize the stomata guard cell osmotic mechanism before the pop quiz.',
                      version: 2,
                      createdTimestamp: Date.now() - 86400000 * 5,
                      updatedTimestamp: Date.now() - 86400000 * 1,
                    },
                    {
                      id: 'lesson_stomata_transpiration',
                      topicId: 'topic_autotrophic',
                      chapterId: 'chap_nutrition',
                      unitId: 'unit_life_processes',
                      subjectId: 'subj_biology',
                      courseId: 'course_class10_science_2026',
                      title: 'Stomatal Dynamics & Gas Exchange',
                      orderIndex: 1,
                      status: 'content_ready',
                      objectives: [
                        'Demonstrate the action of guard cells under varying light intensities',
                        'Evaluate the trade-off between carbon fixation and transpiration loss',
                      ],
                      estimatedDurationMinutes: 40,
                      tags: ['Activity', 'Diagram'],
                      sourceRefs: [],
                      hasSlides: true,
                      hasMindMap: true,
                      hasNotes: true,
                      hasQuiz: false,
                      hasAssignment: false,
                      hasRecording: false,
                      hasEditedVideo: false,
                      version: 1,
                      createdTimestamp: Date.now() - 86400000 * 4,
                      updatedTimestamp: Date.now() - 86400000 * 2,
                    },
                  ],
                },
                {
                  id: 'topic_heterotrophic',
                  chapterId: 'chap_nutrition',
                  unitId: 'unit_life_processes',
                  subjectId: 'subj_biology',
                  courseId: 'course_class10_science_2026',
                  title: 'Heterotrophic Nutrition & Human Digestion',
                  orderIndex: 1,
                  lessons: [
                    {
                      id: 'lesson_human_digestive_system',
                      topicId: 'topic_heterotrophic',
                      chapterId: 'chap_nutrition',
                      unitId: 'unit_life_processes',
                      subjectId: 'subj_biology',
                      courseId: 'course_class10_science_2026',
                      title: 'Enzyme Catalysis in the Human Alimentary Canal',
                      orderIndex: 0,
                      status: 'planning',
                      objectives: [
                        'Map the role of salivary amylase, pepsin, and pancreatic lipase',
                        'Describe villi surface area adaptations in the ileum',
                      ],
                      estimatedDurationMinutes: 50,
                      tags: ['Important', 'Difficult'],
                      sourceRefs: [],
                      hasSlides: false,
                      hasMindMap: true,
                      hasNotes: false,
                      hasQuiz: false,
                      hasAssignment: false,
                      hasRecording: false,
                      hasEditedVideo: false,
                      version: 1,
                      createdTimestamp: Date.now() - 86400000 * 3,
                      updatedTimestamp: Date.now() - 86400000 * 1,
                    },
                  ],
                },
              ],
            },
            {
              id: 'chap_respiration',
              unitId: 'unit_life_processes',
              subjectId: 'subj_biology',
              courseId: 'course_class10_science_2026',
              title: 'Chapter 2: Respiration & Gas Exchange',
              orderIndex: 1,
              description: 'Cellular ATP generation through aerobic and anaerobic pathways.',
              topics: [
                {
                  id: 'topic_cellular_respiration',
                  chapterId: 'chap_respiration',
                  unitId: 'unit_life_processes',
                  subjectId: 'subj_biology',
                  courseId: 'course_class10_science_2026',
                  title: 'Aerobic vs Anaerobic Respiration',
                  orderIndex: 0,
                  lessons: [
                    {
                      id: 'lesson_atp_glycolysis',
                      topicId: 'topic_cellular_respiration',
                      chapterId: 'chap_respiration',
                      unitId: 'unit_life_processes',
                      subjectId: 'subj_biology',
                      courseId: 'course_class10_science_2026',
                      title: 'Glycolysis, Krebs Cycle & Fermentation',
                      orderIndex: 0,
                      status: 'not_started',
                      objectives: ['Compare ATP yields between aerobic and lactic acid pathways'],
                      estimatedDurationMinutes: 45,
                      tags: ['Exam'],
                      sourceRefs: [],
                      hasSlides: false,
                      hasMindMap: false,
                      hasNotes: false,
                      hasQuiz: false,
                      hasAssignment: false,
                      hasRecording: false,
                      hasEditedVideo: false,
                      version: 1,
                      createdTimestamp: Date.now() - 86400000 * 2,
                      updatedTimestamp: Date.now() - 86400000 * 2,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const INITIAL_SEED_QUESTIONS: QuestionBankItem[] = [
  {
    id: 'qb_photo_1',
    courseId: 'course_class10_science_2026',
    subjectId: 'subj_biology',
    chapterId: 'chap_nutrition',
    topicId: 'topic_autotrophic',
    type: 'mcq',
    questionText: 'During light reactions of photosynthesis, photolysis of water molecules directly yields which of the following?',
    options: [
      'Carbon dioxide and Glucose',
      'Hydrogen ions, Electrons, and Molecular Oxygen',
      'ATP, NADPH, and Fructose',
      'Pyruvate and Lactic Acid',
    ],
    correctOptionIndex: 1,
    answerKey: {
      correctAnswer: 'Hydrogen ions, Electrons, and Molecular Oxygen',
      explanation: 'Photolysis occurs at the Oxygen-Evolving Complex of Photosystem II (2H2O → 4H+ + 4e- + O2).',
      sourceReference: 'NCERT Ch 6, p. 96',
      markingGuidance: '1 mark for correct option selection.',
    },
    marks: 1,
    difficulty: 'medium',
    tags: ['Exam', 'Important'],
    createdTimestamp: Date.now() - 86400000 * 4,
    updatedTimestamp: Date.now() - 86400000 * 4,
  },
  {
    id: 'qb_photo_2',
    courseId: 'course_class10_science_2026',
    subjectId: 'subj_biology',
    chapterId: 'chap_nutrition',
    topicId: 'topic_autotrophic',
    type: 'conceptual',
    questionText: 'Explain why desert plants take up carbon dioxide at night, and describe how this adaptation conserves vital water.',
    answerKey: {
      correctAnswer: 'Desert plants utilize CAM (Crassulacean Acid Metabolism) pathway. They open stomata at night to capture CO2 as malic acid when temperatures and transpiration rates are lowest, and keep stomata closed during blistering daytime sunlight while releasing CO2 internally for photosynthesis.',
      explanation: 'Adaptation balances carbon fixation with minimization of transpirational water loss in arid environments.',
      markingGuidance: '2 marks for naming nocturnal stomatal opening / CAM pathway; 2 marks for explaining water conservation mechanism and daytime closed stomata.',
    },
    marks: 4,
    difficulty: 'hard',
    tags: ['Difficult', 'Exam', 'Application'],
    createdTimestamp: Date.now() - 86400000 * 3,
    updatedTimestamp: Date.now() - 86400000 * 3,
  },
  {
    id: 'qb_digest_1',
    courseId: 'course_class10_science_2026',
    subjectId: 'subj_biology',
    chapterId: 'chap_nutrition',
    topicId: 'topic_heterotrophic',
    type: 'short_answer',
    questionText: 'State the physiological significance of emulsification of dietary fats by bile salts in the duodenum.',
    answerKey: {
      correctAnswer: 'Bile salts physically break down large lipid globules into microscopic droplets (micelles), vastly increasing the surface area available for enzymatic hydrolysis by pancreatic lipase.',
      explanation: 'Lipases are water-soluble enzymes and can only act at the lipid-water interface.',
      markingGuidance: '1 mark for surface area amplification, 1 mark for enabling efficient lipase activity.',
    },
    marks: 2,
    difficulty: 'medium',
    tags: ['Important', 'Foundation'],
    createdTimestamp: Date.now() - 86400000 * 2,
    updatedTimestamp: Date.now() - 86400000 * 2,
  },
];

const INITIAL_SEED_ASSIGNMENT: Assignment = {
  id: 'asg_photosynthesis_investigation',
  courseId: 'course_class10_science_2026',
  subjectId: 'subj_biology',
  chapterId: 'chap_nutrition',
  lessonId: 'lesson_photosynthesis_intro',
  title: 'Investigative Worksheet: Light Intensity & Stomatal Transpiration',
  instructions: 'Review the photosynthesis mind map and laboratory diagrams. Complete the comparative analysis table and calculate the rate of transpiration under varying artificial LED wavelengths.',
  topic: 'Autotrophic Nutrition Laboratory Analysis',
  totalMarks: 20,
  dueDate: '2026-10-15',
  questionIds: ['qb_photo_1', 'qb_photo_2'],
  rubric: [
    { id: 'rub_1', title: 'Conceptual Scientific Accuracy', description: 'Correct application of photolysis and stomatal mechanics.', maxMarks: 10 },
    { id: 'rub_2', title: 'Data Interpretation & Graphs', description: 'Accurate graph plotting of transpiration rates.', maxMarks: 6 },
    { id: 'rub_3', title: 'Clarity of Presentation', description: 'Structured scientific terminology and legibility.', maxMarks: 4 },
  ],
  status: 'published',
  createdTimestamp: Date.now() - 86400000 * 2,
  updatedTimestamp: Date.now() - 86400000 * 1,
};

class CurriculumDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isIndexedDBAvailable = true;

  constructor() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.isIndexedDBAvailable = false;
    }
  }

  private getDB(): Promise<IDBDatabase> {
    if (!this.isIndexedDBAvailable) {
      return Promise.reject(new Error('IndexedDB not available'));
    }

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('courses')) {
            db.createObjectStore('courses', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('question_bank')) {
            const qStore = db.createObjectStore('question_bank', { keyPath: 'id' });
            qStore.createIndex('courseId', 'courseId', { unique: false });
            qStore.createIndex('type', 'type', { unique: false });
          }
          if (!db.objectStoreNames.contains('assignments')) {
            db.createObjectStore('assignments', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('schedules')) {
            db.createObjectStore('schedules', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('revision_plans')) {
            db.createObjectStore('revision_plans', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('assessment_plans')) {
            db.createObjectStore('assessment_plans', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('calendar_terms')) {
            db.createObjectStore('calendar_terms', { keyPath: 'id' });
          }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          this.isIndexedDBAvailable = false;
          reject(req.error);
        };
      } catch (err) {
        this.isIndexedDBAvailable = false;
        reject(err);
      }
    });

    return this.dbPromise;
  }

  // --- Generic LocalStorage Helpers ---
  private getLocal<T>(key: string, defaultValue: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setLocal<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage write failed for key:', key, e);
    }
  }

  // ================= COURSES =================
  async getAllCourses(): Promise<Course[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(['courses'], 'readonly');
        const store = tx.objectStore('courses');
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as Course[]) || [];
          if (list.length === 0) {
            // Seed initial course
            this.saveCourse(INITIAL_SEED_COURSE);
            resolve([INITIAL_SEED_COURSE]);
          } else {
            resolve(list.sort((a, b) => b.updatedTimestamp - a.updatedTimestamp));
          }
        };
        req.onerror = () => {
          resolve(this.getCoursesFromLocal());
        };
      });
    } catch {
      return this.getCoursesFromLocal();
    }
  }

  private getCoursesFromLocal(): Course[] {
    const list = this.getLocal<Course[]>(STORAGE_KEYS.COURSES, []);
    if (list.length === 0) {
      this.setLocal(STORAGE_KEYS.COURSES, [INITIAL_SEED_COURSE]);
      return [INITIAL_SEED_COURSE];
    }
    return list.sort((a, b) => b.updatedTimestamp - a.updatedTimestamp);
  }

  async getCourseById(id: string): Promise<Course | null> {
    const courses = await this.getAllCourses();
    return courses.find((c) => c.id === id) || null;
  }

  async saveCourse(course: Course): Promise<void> {
    const updated: Course = {
      ...course,
      updatedTimestamp: Date.now(),
    };

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['courses'], 'readwrite');
        const store = tx.objectStore('courses');
        const req = store.put(updated);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback
      const list = this.getCoursesFromLocal();
      const idx = list.findIndex((c) => c.id === updated.id);
      if (idx >= 0) list[idx] = updated;
      else list.push(updated);
      this.setLocal(STORAGE_KEYS.COURSES, list);
    }
  }

  async deleteCourse(courseId: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['courses'], 'readwrite');
        const store = tx.objectStore('courses');
        const req = store.delete(courseId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = this.getCoursesFromLocal().filter((c) => c.id !== courseId);
      this.setLocal(STORAGE_KEYS.COURSES, list);
    }
    return true;
  }

  async duplicateCourse(courseId: string, copyContent: boolean = true): Promise<Course | null> {
    const original = await this.getCourseById(courseId);
    if (!original) return null;

    const newCourseId = `course_${Date.now()}`;
    const duplicated: Course = JSON.parse(JSON.stringify(original));
    duplicated.id = newCourseId;
    duplicated.name = `${original.name} (Copy)`;
    duplicated.createdTimestamp = Date.now();
    duplicated.updatedTimestamp = Date.now();

    duplicated.subjects = duplicated.subjects.map((subj) => {
      const newSubjId = `subj_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      return {
        ...subj,
        id: newSubjId,
        courseId: newCourseId,
        units: subj.units.map((unit, uIdx) => {
          const newUnitId = `unit_${Date.now()}_${uIdx}`;
          return {
            ...unit,
            id: newUnitId,
            courseId: newCourseId,
            subjectId: newSubjId,
            chapters: unit.chapters.map((chap, cIdx) => {
              const newChapId = `chap_${Date.now()}_${uIdx}_${cIdx}`;
              return {
                ...chap,
                id: newChapId,
                courseId: newCourseId,
                subjectId: newSubjId,
                unitId: newUnitId,
                topics: chap.topics.map((top, tIdx) => {
                  const newTopId = `top_${Date.now()}_${uIdx}_${cIdx}_${tIdx}`;
                  return {
                    ...top,
                    id: newTopId,
                    courseId: newCourseId,
                    subjectId: newSubjId,
                    unitId: newUnitId,
                    chapterId: newChapId,
                    lessons: top.lessons.map((les, lIdx) => {
                      const newLesId = `les_${Date.now()}_${uIdx}_${cIdx}_${tIdx}_${lIdx}`;
                      return {
                        ...les,
                        id: newLesId,
                        courseId: newCourseId,
                        subjectId: newSubjId,
                        unitId: newUnitId,
                        chapterId: newChapId,
                        topicId: newTopId,
                        status: copyContent ? les.status : 'planning',
                        linkedProjectId: copyContent ? les.linkedProjectId : undefined,
                        hasSlides: copyContent ? les.hasSlides : false,
                        hasMindMap: copyContent ? les.hasMindMap : false,
                        hasNotes: copyContent ? les.hasNotes : true,
                        hasQuiz: copyContent ? les.hasQuiz : false,
                        hasAssignment: copyContent ? les.hasAssignment : false,
                        hasRecording: false,
                        hasEditedVideo: false,
                        createdTimestamp: Date.now(),
                        updatedTimestamp: Date.now(),
                      };
                    }),
                  };
                }),
              };
            }),
          };
        }),
      };
    });

    await this.saveCourse(duplicated);
    return duplicated;
  }

  // ================= QUESTION BANK =================
  async getAllQuestions(): Promise<QuestionBankItem[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(['question_bank'], 'readonly');
        const store = tx.objectStore('question_bank');
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as QuestionBankItem[]) || [];
          if (list.length === 0) {
            INITIAL_SEED_QUESTIONS.forEach((q) => this.saveQuestion(q));
            resolve(INITIAL_SEED_QUESTIONS);
          } else {
            resolve(list.sort((a, b) => b.updatedTimestamp - a.updatedTimestamp));
          }
        };
        req.onerror = () => resolve(this.getQuestionsFromLocal());
      });
    } catch {
      return this.getQuestionsFromLocal();
    }
  }

  private getQuestionsFromLocal(): QuestionBankItem[] {
    const list = this.getLocal<QuestionBankItem[]>(STORAGE_KEYS.QUESTION_BANK, []);
    if (list.length === 0) {
      this.setLocal(STORAGE_KEYS.QUESTION_BANK, INITIAL_SEED_QUESTIONS);
      return INITIAL_SEED_QUESTIONS;
    }
    return list;
  }

  async saveQuestion(question: QuestionBankItem): Promise<void> {
    const updated: QuestionBankItem = {
      ...question,
      updatedTimestamp: Date.now(),
    };
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['question_bank'], 'readwrite');
        const store = tx.objectStore('question_bank');
        const req = store.put(updated);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = this.getQuestionsFromLocal();
      const idx = list.findIndex((q) => q.id === updated.id);
      if (idx >= 0) list[idx] = updated;
      else list.push(updated);
      this.setLocal(STORAGE_KEYS.QUESTION_BANK, list);
    }
  }

  async deleteQuestion(id: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['question_bank'], 'readwrite');
        const store = tx.objectStore('question_bank');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = this.getQuestionsFromLocal().filter((q) => q.id !== id);
      this.setLocal(STORAGE_KEYS.QUESTION_BANK, list);
    }
    return true;
  }

  // ================= ASSIGNMENTS =================
  async getAllAssignments(): Promise<Assignment[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(['assignments'], 'readonly');
        const store = tx.objectStore('assignments');
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as Assignment[]) || [];
          if (list.length === 0) {
            this.saveAssignment(INITIAL_SEED_ASSIGNMENT);
            resolve([INITIAL_SEED_ASSIGNMENT]);
          } else {
            resolve(list);
          }
        };
        req.onerror = () => resolve(this.getAssignmentsFromLocal());
      });
    } catch {
      return this.getAssignmentsFromLocal();
    }
  }

  private getAssignmentsFromLocal(): Assignment[] {
    const list = this.getLocal<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    if (list.length === 0) {
      this.setLocal(STORAGE_KEYS.ASSIGNMENTS, [INITIAL_SEED_ASSIGNMENT]);
      return [INITIAL_SEED_ASSIGNMENT];
    }
    return list;
  }

  async saveAssignment(assignment: Assignment): Promise<void> {
    const updated: Assignment = {
      ...assignment,
      updatedTimestamp: Date.now(),
    };
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['assignments'], 'readwrite');
        const store = tx.objectStore('assignments');
        const req = store.put(updated);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = this.getAssignmentsFromLocal();
      const idx = list.findIndex((a) => a.id === updated.id);
      if (idx >= 0) list[idx] = updated;
      else list.push(updated);
      this.setLocal(STORAGE_KEYS.ASSIGNMENTS, list);
    }
  }

  async deleteAssignment(id: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['assignments'], 'readwrite');
        const store = tx.objectStore('assignments');
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      const list = this.getAssignmentsFromLocal().filter((a) => a.id !== id);
      this.setLocal(STORAGE_KEYS.ASSIGNMENTS, list);
    }
    return true;
  }

  // ================= SCHEDULE & CALENDAR =================
  async getAllSchedules(): Promise<ScheduledLesson[]> {
    return this.getLocal<ScheduledLesson[]>(STORAGE_KEYS.SCHEDULE, [
      {
        id: 'sched_photo_1',
        courseId: 'course_class10_science_2026',
        subjectId: 'subj_biology',
        lessonId: 'lesson_photosynthesis_intro',
        lessonTitle: 'Photosynthesis: Light Reactions & Calvin Cycle',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '10:00',
        durationMinutes: 45,
        batchId: 'batch_10a',
        isCompleted: false,
        notes: 'Prepare projector and chlorophyll absorption spectra slides.',
      },
    ]);
  }

  async saveSchedule(schedule: ScheduledLesson): Promise<void> {
    const list = await this.getAllSchedules();
    const idx = list.findIndex((s) => s.id === schedule.id);
    if (idx >= 0) list[idx] = schedule;
    else list.push(schedule);
    this.setLocal(STORAGE_KEYS.SCHEDULE, list);
  }

  async deleteSchedule(id: string): Promise<void> {
    const list = (await this.getAllSchedules()).filter((s) => s.id !== id);
    this.setLocal(STORAGE_KEYS.SCHEDULE, list);
  }

  // ================= REVISION & ASSESSMENT PLANS =================
  async getAllRevisionPlans(): Promise<RevisionPlan[]> {
    return this.getLocal<RevisionPlan[]>(STORAGE_KEYS.REVISION_PLANS, [
      {
        id: 'rev_life_processes_term1',
        courseId: 'course_class10_science_2026',
        subjectId: 'subj_biology',
        chapterIds: ['chap_nutrition'],
        title: 'Mid-Term Rapid Revision: Nutrition & Enzymes',
        targetDate: '2026-10-20',
        durationMinutes: 60,
        keyTopics: ['Light reaction photolysis', 'Stomatal guard cells', 'Duodenum digestive enzymes'],
        weakAreasIdentified: ['CAM plant adaptation mechanism', 'Emulsification enzyme kinetics'],
        isApprovedByTeacher: true,
        status: 'planned',
      },
    ]);
  }

  async saveRevisionPlan(plan: RevisionPlan): Promise<void> {
    const list = await this.getAllRevisionPlans();
    const idx = list.findIndex((p) => p.id === plan.id);
    if (idx >= 0) list[idx] = plan;
    else list.push(plan);
    this.setLocal(STORAGE_KEYS.REVISION_PLANS, list);
  }

  async getAllAssessmentPlans(): Promise<AssessmentPlan[]> {
    return this.getLocal<AssessmentPlan[]>(STORAGE_KEYS.ASSESSMENT_PLANS, [
      {
        id: 'asmt_unit1_test',
        courseId: 'course_class10_science_2026',
        subjectId: 'subj_biology',
        type: 'unit_test',
        title: 'Unit 1 Mastery Test: Life Processes',
        targetDate: '2026-10-25',
        durationMinutes: 45,
        totalMarks: 25,
        chapterIds: ['chap_nutrition', 'chap_respiration'],
        questionIds: ['qb_photo_1', 'qb_photo_2', 'qb_digest_1'],
        status: 'ready',
      },
    ]);
  }

  async saveAssessmentPlan(plan: AssessmentPlan): Promise<void> {
    const list = await this.getAllAssessmentPlans();
    const idx = list.findIndex((p) => p.id === plan.id);
    if (idx >= 0) list[idx] = plan;
    else list.push(plan);
    this.setLocal(STORAGE_KEYS.ASSESSMENT_PLANS, list);
  }

  // ================= CUSTOM LESSON TEMPLATES =================
  async getLessonTemplates(): Promise<LessonTemplate[]> {
    const custom = this.getLocal<LessonTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
    return [...DEFAULT_LESSON_TEMPLATES, ...custom];
  }

  async saveCustomTemplate(tpl: LessonTemplate): Promise<void> {
    const custom = this.getLocal<LessonTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
    const idx = custom.findIndex((t) => t.id === tpl.id);
    if (idx >= 0) custom[idx] = tpl;
    else custom.push(tpl);
    this.setLocal(STORAGE_KEYS.TEMPLATES, custom);
  }
}

export const curriculumDatabase = new CurriculumDatabase();
