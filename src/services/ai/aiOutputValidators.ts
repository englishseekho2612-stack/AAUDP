/**
 * AI Output Validators & Sanitizers
 * Section 12 & Section 25: Validates and repairs structured Gemini responses
 */

import {
  MindMapContent,
  MindMapNode,
  MindMapNodeType,
  PresentationContent,
  SlideItem,
  NotesContent,
  NoteSection,
  QuizContent,
  QuizQuestion,
  AudioContent,
  VideoContent,
  TopicExplanationContent,
} from '../../types/ai';

export function extractJsonFromText(rawText: string): unknown {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('AI returned an empty response.');
  }

  let cleaned = rawText.trim();

  // Strip markdown code fences if model wrapped response in ```json ... ```
  if (cleaned.startsWith('```')) {
    const firstNewline = cleaned.indexOf('\n');
    const lastFence = cleaned.lastIndexOf('```');
    if (firstNewline !== -1 && lastFence > firstNewline) {
      cleaned = cleaned.substring(firstNewline + 1, lastFence).trim();
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Attempt safe substring extraction between first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate);
      } catch (nestedErr: any) {
        throw new Error(`AI response is not valid JSON: ${nestedErr?.message || 'Parse error'}`);
      }
    }
    throw new Error('Could not parse structured JSON from AI output.');
  }
}

// -------------------------------------------------------------------------
// MIND MAP & VISUAL TREE VALIDATOR WITH SAFE AUTO-REPAIR
// -------------------------------------------------------------------------
const VALID_NODE_TYPES: MindMapNodeType[] = [
  'ROOT',
  'CONCEPT',
  'SUBTOPIC',
  'DEFINITION',
  'EXAMPLE',
  'PROCESS',
  'COMPARISON',
  'IMPORTANT POINT',
  'QUESTION',
  'FORMULA',
  'SUMMARY',
];

export function validateMindMap(raw: unknown): MindMapContent {
  const data = raw as any;
  if (!data || typeof data !== 'object') {
    throw new Error('Mind map output must be an object.');
  }

  const id = String(data.id || `mindmap_${Date.now()}`);
  const title = String(data.title || 'Untitled Knowledge Map');
  const summary = typeof data.summary === 'string' ? data.summary : '';
  const validDisplayModes = ['tree', 'radial', 'outline', 'visual_tree', 'mind_map'];
  const displayMode = validDisplayModes.includes(data.displayMode)
    ? data.displayMode
    : 'tree';

  // Safe repair: if rootNode is missing, construct a valid fallback root from available fields
  let rawRoot = data.rootNode;
  if (!rawRoot || typeof rawRoot !== 'object') {
    rawRoot = {
      id: 'root_repaired',
      title: title || 'Central Topic',
      shortDescription: summary || 'Overview concept',
      detailedExplanation: summary || '',
      children: [],
    };
  }

  const seenIds = new Set<string>();

  function sanitizeNode(
    node: any,
    parentId: string | null = null,
    ancestorIds: Set<string> = new Set()
  ): MindMapNode {
    // Generate or de-duplicate ID
    let rawId = String(node.id || `node_${Math.random().toString(36).substring(2, 8)}`);
    if (seenIds.has(rawId)) {
      rawId = `${rawId}_${Math.random().toString(36).substring(2, 6)}`;
    }
    seenIds.add(rawId);

    // Circular reference protection: if node ID is in ancestorIds, break loop
    if (ancestorIds.has(rawId)) {
      console.warn(`[AI Validator] Circular parent reference detected on node ${rawId}. Pruning cycle.`);
      rawId = `cycled_node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      seenIds.add(rawId);
    }

    const currentAncestors = new Set(ancestorIds);
    currentAncestors.add(rawId);

    // Normalize nodeType
    let nodeType: MindMapNodeType | undefined = undefined;
    if (typeof node.nodeType === 'string') {
      const upper = node.nodeType.toUpperCase().trim() as MindMapNodeType;
      if (VALID_NODE_TYPES.includes(upper)) {
        nodeType = upper;
      }
    }
    if (!nodeType) {
      if (!parentId) {
        nodeType = 'ROOT';
      } else if (node.title?.toLowerCase().includes('example')) {
        nodeType = 'EXAMPLE';
      } else if (node.title?.toLowerCase().includes('definition') || node.title?.toLowerCase().includes('meaning')) {
        nodeType = 'DEFINITION';
      } else if (node.title?.toLowerCase().includes('question') || node.title?.toLowerCase().includes('mcq')) {
        nodeType = 'QUESTION';
      } else if (node.title?.toLowerCase().includes('formula') || node.title?.toLowerCase().includes('law')) {
        nodeType = 'FORMULA';
      } else if (node.title?.toLowerCase().includes('summary') || node.title?.toLowerCase().includes('conclusion')) {
        nodeType = 'SUMMARY';
      } else if (node.title?.toLowerCase().includes('process') || node.title?.toLowerCase().includes('mechanism')) {
        nodeType = 'PROCESS';
      } else {
        nodeType = parentId.startsWith('root') ? 'CONCEPT' : 'SUBTOPIC';
      }
    }

    const validImportance = ['low', 'medium', 'high', 'critical'].includes(node.importance)
      ? node.importance
      : undefined;

    const validDifficulty = ['beginner', 'intermediate', 'advanced'].includes(node.difficulty)
      ? node.difficulty
      : undefined;

    const validVisibility = ['public', 'teacher_only', 'student_published'].includes(node.visibility)
      ? node.visibility
      : 'public';

    return {
      id: rawId,
      parentId,
      title: String(node.title || 'Untitled Concept').trim(),
      shortDescription: String(node.shortDescription || '').trim(),
      detailedExplanation: String(node.detailedExplanation || node.shortDescription || '').trim(),
      nodeType,
      keyPoints: Array.isArray(node.keyPoints) ? node.keyPoints.map(String).filter(Boolean) : [],
      examples: Array.isArray(node.examples) ? node.examples.map(String).filter(Boolean) : [],
      questions: Array.isArray(node.questions) ? node.questions.map(String).filter(Boolean) : [],
      sourceReferences: Array.isArray(node.sourceReferences)
        ? node.sourceReferences
            .filter((ref: any) => ref && (ref.sourceName || ref.location))
            .map((ref: any) => ({
              sourceName: String(ref.sourceName || 'Source Reference'),
              location: String(ref.location || 'Section'),
              snippet: typeof ref.snippet === 'string' ? ref.snippet : undefined,
            }))
        : [],
      teacherNotes: typeof node.teacherNotes === 'string' ? node.teacherNotes : '',
      isExpanded: node.isExpanded !== false && node.expanded !== false,
      expanded: node.expanded !== false && node.isExpanded !== false,
      editable: node.editable !== false,
      visibility: validVisibility,
      importance: validImportance,
      difficulty: validDifficulty,
      order: typeof node.order === 'number' ? node.order : undefined,
      tags: Array.isArray(node.tags) ? node.tags.map(String) : [],
      color: typeof node.color === 'string' ? node.color : undefined,
      themeMetadata: typeof node.themeMetadata === 'object' && node.themeMetadata !== null ? node.themeMetadata : undefined,
      isExamFocus: Boolean(node.isExamFocus || node.importance === 'critical' || node.importance === 'high'),
      children: Array.isArray(node.children)
        ? node.children
            .filter((c: any) => c && typeof c === 'object')
            .map((child: any) => sanitizeNode(child, rawId, currentAncestors))
        : [],
    };
  }

  const rootNode = sanitizeNode(rawRoot, null, new Set());

  return {
    id,
    title,
    summary,
    displayMode,
    rootNode,
    version: typeof data.version === 'number' ? data.version : 1,
    lastEditedBy: data.lastEditedBy === 'teacher' ? 'teacher' : 'ai',
  };
}

// -------------------------------------------------------------------------
// SLIDES / PRESENTATION VALIDATOR
// -------------------------------------------------------------------------
export function validatePresentation(raw: unknown): PresentationContent {
  const data = raw as any;
  if (!data || typeof data !== 'object') {
    throw new Error('Presentation output must be an object.');
  }

  const id = String(data.id || `pres_${Date.now()}`);
  const title = String(data.title || 'Untitled Presentation');
  const description = String(data.description || '');
  const targetAudience = typeof data.targetAudience === 'string' ? data.targetAudience : undefined;
  const estimatedDurationMinutes = Number(data.estimatedDurationMinutes) || 30;

  if (!Array.isArray(data.slides) || data.slides.length === 0) {
    throw new Error('Presentation must contain at least one slide.');
  }

  const slides: SlideItem[] = data.slides.map((s: any, idx: number) => ({
    id: String(s.id || `slide_${idx + 1}`),
    order: Number(s.order) || idx + 1,
    title: String(s.title || `Slide ${idx + 1}`),
    subtitle: typeof s.subtitle === 'string' ? s.subtitle : '',
    content: String(s.content || ''),
    bullets: Array.isArray(s.bullets) ? s.bullets.map(String) : [],
    speakerNotes: String(s.speakerNotes || ''),
    visualSuggestions: String(s.visualSuggestions || ''),
    layout: ['standard', 'split', 'title_only', 'quote', 'summary', 'comparison'].includes(s.layout)
      ? s.layout
      : 'standard',
    sourceReferences: Array.isArray(s.sourceReferences)
      ? s.sourceReferences.map((ref: any) => ({
          sourceName: String(ref.sourceName || 'Source Reference'),
          location: String(ref.location || 'Text location'),
        }))
      : [],
    teacherNotes: typeof s.teacherNotes === 'string' ? s.teacherNotes : '',
  }));

  return {
    id,
    title,
    description,
    targetAudience,
    estimatedDurationMinutes,
    slides,
  };
}

// -------------------------------------------------------------------------
// NOTES VALIDATOR
// -------------------------------------------------------------------------
export function validateNotes(raw: unknown): NotesContent {
  const data = raw as any;
  if (!data || typeof data !== 'object') {
    throw new Error('Notes output must be an object.');
  }

  const id = String(data.id || `notes_${Date.now()}`);
  const title = String(data.title || 'Study Notes');
  const subject = typeof data.subject === 'string' ? data.subject : '';
  const grade = typeof data.grade === 'string' ? data.grade : '';
  const format = ['summary', 'detailed', 'exam', 'comprehensive'].includes(data.format)
    ? data.format
    : 'comprehensive';

  if (!Array.isArray(data.sections) || data.sections.length === 0) {
    throw new Error('Notes must contain at least one section.');
  }

  const sections: NoteSection[] = data.sections.map((sec: any, idx: number) => ({
    id: String(sec.id || `sec_${idx + 1}`),
    heading: String(sec.heading || `Section ${idx + 1}`),
    type: ['summary', 'detailed', 'exam_notes', 'key_points', 'important_terms', 'qa'].includes(sec.type)
      ? sec.type
      : 'detailed',
    content: String(sec.content || ''),
    bullets: Array.isArray(sec.bullets) ? sec.bullets.map(String) : undefined,
    terms: Array.isArray(sec.terms)
      ? sec.terms.map((t: any) => ({
          term: String(t.term || ''),
          definition: String(t.definition || ''),
          example: typeof t.example === 'string' ? t.example : undefined,
        }))
      : undefined,
    qaList: Array.isArray(sec.qaList)
      ? sec.qaList.map((qa: any) => ({
          question: String(qa.question || ''),
          answer: String(qa.answer || ''),
          examTip: typeof qa.examTip === 'string' ? qa.examTip : undefined,
        }))
      : undefined,
    sourceReferences: Array.isArray(sec.sourceReferences)
      ? sec.sourceReferences.map((ref: any) => ({
          sourceName: String(ref.sourceName || 'Source Reference'),
          location: String(ref.location || 'Text location'),
        }))
      : [],
    teacherNotes: typeof sec.teacherNotes === 'string' ? sec.teacherNotes : '',
  }));

  return {
    id,
    title,
    subject,
    grade,
    format,
    sections,
  };
}

// -------------------------------------------------------------------------
// QUIZ VALIDATOR (Section 25: exactly one correct answer, no duplicate options)
// -------------------------------------------------------------------------
export function validateQuiz(raw: unknown): QuizContent {
  const data = raw as any;
  if (!data || typeof data !== 'object') {
    throw new Error('Quiz output must be an object.');
  }

  const id = String(data.id || `quiz_${Date.now()}`);
  const title = String(data.title || 'Assessment Quiz');
  const difficulty = String(data.difficulty || 'medium');

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error('Quiz must contain at least one question.');
  }

  const questions: QuizQuestion[] = data.questions.map((q: any, idx: number) => {
    const rawOptions = Array.isArray(q.options) ? q.options.map(String) : [];
    // Ensure no duplicate options
    const uniqueOptions = Array.from(new Set(rawOptions));
    const correctAnswer = String(q.correctAnswer || uniqueOptions[0] || 'A');

    // If MCQ and correctAnswer is not in options, append or normalize it
    if (q.type !== 'short_answer' && !uniqueOptions.includes(correctAnswer) && uniqueOptions.length > 0) {
      uniqueOptions[0] = correctAnswer;
    }

    return {
      id: String(q.id || `q_${idx + 1}`),
      type: ['mcq', 'true_false', 'short_answer'].includes(q.type) ? q.type : 'mcq',
      question: String(q.question || `Question ${idx + 1}`),
      options: uniqueOptions,
      correctAnswer,
      explanation: String(q.explanation || 'Answer grounded in source text.'),
      difficulty: ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
      sourceReference: {
        sourceName: String(q.sourceReference?.sourceName || 'Source Document'),
        location: String(q.sourceReference?.location || 'Cited Section'),
      },
    };
  });

  return {
    id,
    title,
    totalQuestions: questions.length,
    difficulty: difficulty as any,
    questions,
  };
}

// -------------------------------------------------------------------------
// AUDIO VALIDATOR
// -------------------------------------------------------------------------
export function validateAudio(raw: unknown): AudioContent {
  const data = raw as any;
  if (!data || typeof data !== 'object') {
    throw new Error('Audio output must be an object.');
  }

  return {
    id: String(data.id || `audio_${Date.now()}`),
    title: String(data.title || 'Spoken Lesson'),
    audioType: ['explanation', 'podcast', 'revision', 'summary', 'storytelling'].includes(data.audioType)
      ? data.audioType
      : 'explanation',
    script: String(data.script || ''),
    durationEstimateSeconds: Number(data.durationEstimateSeconds) || 180,
    language: (data.language || 'en') as any,
    voiceStyle: String(data.voiceStyle || 'Warm teaching voice'),
    segments: Array.isArray(data.segments)
      ? data.segments.map((seg: any) => ({
          speaker: String(seg.speaker || 'Teacher'),
          text: String(seg.text || ''),
          timestamp: typeof seg.timestamp === 'string' ? seg.timestamp : '00:00',
          tone: typeof seg.tone === 'string' ? seg.tone : undefined,
        }))
      : [],
    sourceReferences: Array.isArray(data.sourceReferences)
      ? data.sourceReferences.map((ref: any) => ({
          sourceName: String(ref.sourceName || 'Source Reference'),
          location: String(ref.location || 'Text citation'),
        }))
      : [],
  };
}

// -------------------------------------------------------------------------
// VIDEO VALIDATOR
// -------------------------------------------------------------------------
export function validateVideo(raw: unknown): VideoContent {
  const data = raw as any;
  if (!data || typeof data !== 'object') {
    throw new Error('Video output must be an object.');
  }

  if (!Array.isArray(data.scenes) || data.scenes.length === 0) {
    throw new Error('Video storyboard must contain at least one scene.');
  }

  const scenes = data.scenes.map((sc: any, idx: number) => ({
    id: String(sc.id || `scene_${idx + 1}`),
    order: Number(sc.order) || idx + 1,
    durationSeconds: Number(sc.durationSeconds) || 15,
    narration: String(sc.narration || ''),
    visualDescription: String(sc.visualDescription || 'Visual illustration'),
    textOverlay: String(sc.textOverlay || ''),
    transition: ['fade', 'slide', 'zoom', 'cut'].includes(sc.transition) ? sc.transition : 'fade',
    sourceReferences: Array.isArray(sc.sourceReferences)
      ? sc.sourceReferences.map((ref: any) => ({
          sourceName: String(ref.sourceName || 'Source Reference'),
          location: String(ref.location || 'Text citation'),
        }))
      : [],
  }));

  return {
    id: String(data.id || `video_${Date.now()}`),
    title: String(data.title || 'Instructional Video Plan'),
    targetDurationMinutes: Number(data.targetDurationMinutes) || 3,
    scenes,
    voiceStyle: String(data.voiceStyle || 'Engaging teacher narrator'),
    aspectRatio: data.aspectRatio === '9:16' ? '9:16' : '16:9',
    statusDescription: String(data.statusDescription || 'Storyboard scenes generated.'),
  };
}

// -------------------------------------------------------------------------
// TOPIC EXPLANATION VALIDATOR
// -------------------------------------------------------------------------
export function validateTopicExplanation(raw: unknown): TopicExplanationContent {
  const data = raw as any;
  if (!data || typeof data !== 'object') {
    throw new Error('Topic explanation must be an object.');
  }

  return {
    id: String(data.id || `exp_${Date.now()}`),
    topic: String(data.topic || 'Concept Explanation'),
    targetAudience: String(data.targetAudience || 'Students'),
    coreConcept: String(data.coreConcept || ''),
    breakdown: Array.isArray(data.breakdown)
      ? data.breakdown.map((b: any) => ({
          subtopic: String(b.subtopic || 'Key Aspect'),
          explanation: String(b.explanation || ''),
          realWorldAnalogy: String(b.realWorldAnalogy || ''),
          sourceReferences: Array.isArray(b.sourceReferences)
            ? b.sourceReferences.map((ref: any) => ({
                sourceName: String(ref.sourceName || 'Source Document'),
                location: String(ref.location || 'Text location'),
              }))
            : [],
        }))
      : [],
    commonMisconceptions: Array.isArray(data.commonMisconceptions)
      ? data.commonMisconceptions.map((m: any) => ({
          misconception: String(m.misconception || ''),
          correction: String(m.correction || ''),
        }))
      : [],
    summaryTakeaway: String(data.summaryTakeaway || ''),
    additionalExplanation: typeof data.additionalExplanation === 'string' ? data.additionalExplanation : undefined,
  };
}
