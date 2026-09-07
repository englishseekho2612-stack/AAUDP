/**
 * AI Context Builder
 * Constructs a strict, grounded context package for Gemini API calls.
 * Enforces Source Priority (Primary vs. Supporting), citations, and anti-hallucination constraints.
 */

import { AITaskRequest } from '../../types/ai';

export interface GroundedPromptPackage {
  systemInstruction: string;
  prompt: string;
}

export function buildGroundedContextPrompt(request: AITaskRequest): GroundedPromptPackage {
  const {
    projectName,
    taskType,
    teacherInstructions,
    outputLanguage,
    targetAudience = 'Students',
    classGrade,
    selectedSources,
    options,
  } = request;

  // Language display mapping
  const languageNames: Record<string, string> = {
    en: 'English',
    hi: 'Hindi (हिन्दी)',
    hinglish: 'Hinglish (Natural conversational blend of Hindi and English written in Latin/Devanagari script)',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    other: 'the teacher specified language',
  };

  const targetLangStr = languageNames[outputLanguage] || outputLanguage;

  // Group sources by priority
  const primarySources = selectedSources.filter((s) => s.priority === 'primary');
  const supportingSources = selectedSources.filter((s) => s.priority === 'supporting');

  // Format source segments into readable reference blocks
  const formatSourceBlock = (s: typeof selectedSources[0]) => {
    const header = `--- SOURCE: "${s.title}" (${s.type.toUpperCase()}) [Priority: ${s.priority.toUpperCase()}] ---`;
    const segmentsText = s.segments
      .map((seg) => `[Location: ${seg.location || 'Unknown'}]\n${seg.text.trim()}`)
      .join('\n\n');
    return `${header}\n${segmentsText}`;
  };

  const formattedPrimary = primarySources.map(formatSourceBlock).join('\n\n');
  const formattedSupporting = supportingSources.map(formatSourceBlock).join('\n\n');

  // System instruction enforcing strict grounding and citation
  const systemInstruction = `You are the AI Teaching Engine for "ARPIT ACADEMY UDAIPURA" (Led by Arpit Sir · "Learn • Teach • Understand").
Your role is to help educators create high-quality, pedagogically sound, and strictly grounded teaching materials.

CORE PEDAGOGICAL & GROUNDING PRINCIPLES:
1. STRICT SOURCE GROUNDING:
   - Primary reference is the primary source material. Supporting sources provide secondary elaboration.
   - Do NOT hallucinate or invent facts, dates, scientific assertions, or quotes not present in the sources.
   - If a requested topic or detail is missing from the provided sources, explicitly state:
     In Hindi: "इस जानकारी का स्पष्ट आधार दिए गए source में नहीं मिला।"
     In English: "No clear basis found in the provided sources."
   - If general pedagogical background knowledge is necessary to connect concepts, mark it explicitly as "Additional Explanation". Never pass external information off as if it came from the source.

2. ACCURATE CITATIONS:
   - Every node, slide, note section, and question MUST retain accurate source references from the supplied segment locations (e.g. "Page 4", "Slide 7", "02:15", "Section 1").
   - NEVER invent a false citation or fictitious page/timestamp.

3. LANGUAGE SPECIFICATION:
   - Generate all output content in ${targetLangStr}.
   - If Hinglish is requested, use natural everyday teacher language that Indian students easily understand (e.g. "Young seagull bahut dara hua tha aur apne wings par trust nahi kar pa raha tha").
   - The original source language does not restrict the output language; translate and adapt faithfully.

4. STRUCTURED OUTPUT:
   - You MUST output ONLY valid, parsable JSON matching the exact requested schema.
   - Do not wrap in conversational chit-chat. Return only the JSON object.`;

  // Task-specific prompt directives
  let taskGuidance = '';

  switch (taskType) {
    case 'mind_map':
      taskGuidance = `Generate an interactive hierarchical MIND MAP & VISUAL KNOWLEDGE TREE for "${projectName}".
Schema:
{
  "id": "mindmap_${Date.now()}",
  "title": "${projectName}",
  "summary": "High-level summary of the concept map",
  "displayMode": "tree",
  "rootNode": {
    "id": "root_1",
    "parentId": null,
    "title": "Central Concept Title",
    "nodeType": "ROOT",
    "shortDescription": "One sentence summary",
    "detailedExplanation": "Complete pedagogical explanation grounded in the sources.",
    "importance": "critical",
    "tags": ["Overview", "Core"],
    "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
    "examples": ["Real-world or textual example 1", "Example 2"],
    "questions": ["Discussion question 1", "Self-test question 2"],
    "sourceReferences": [
      { "sourceName": "Source title", "location": "Page / section location", "snippet": "Relevant text" }
    ],
    "children": [
      {
        "id": "node_1",
        "parentId": "root_1",
        "title": "Subtopic 1",
        "nodeType": "CONCEPT",
        "shortDescription": "Short summary",
        "detailedExplanation": "Detailed grounded explanation",
        "importance": "high",
        "tags": ["Concept"],
        "keyPoints": ["..."],
        "examples": ["..."],
        "questions": ["..."],
        "sourceReferences": [{ "sourceName": "...", "location": "..." }],
        "children": [
          {
            "id": "node_1_1",
            "parentId": "node_1",
            "title": "Definition or Process",
            "nodeType": "DEFINITION",
            "shortDescription": "...",
            "detailedExplanation": "...",
            "importance": "medium",
            "tags": ["Def"],
            "keyPoints": ["..."],
            "examples": ["..."],
            "questions": ["..."],
            "sourceReferences": [{ "sourceName": "...", "location": "..." }],
            "children": []
          }
        ]
      }
    ]
  }
}
Valid nodeType values are: "ROOT", "CONCEPT", "SUBTOPIC", "DEFINITION", "EXAMPLE", "PROCESS", "COMPARISON", "IMPORTANT POINT", "QUESTION", "FORMULA", "SUMMARY".
Create between 3 to 6 major branches with 2 to 4 sub-branches each, deeply grounded in the sources.`;
      break;

    case 'slides':
    case 'presentation_designer':
      const slideCount = options?.slideCount || (taskType === 'presentation_designer' ? 8 : 6);
      taskGuidance = `Generate an educational presentation slide deck containing ${slideCount} structured slides.
Schema:
{
  "id": "pres_${Date.now()}",
  "title": "${projectName}",
  "description": "Presentation overview for ${classGrade || 'Students'}",
  "targetAudience": "${targetAudience}",
  "estimatedDurationMinutes": ${options?.lessonDurationMinutes || 30},
  "slides": [
    {
      "id": "slide_1",
      "order": 1,
      "title": "Slide Title",
      "subtitle": "Subtitle or context",
      "content": "Core narrative content of the slide",
      "bullets": ["Key bullet point 1", "Key bullet point 2", "Key bullet point 3"],
      "speakerNotes": "Exact speaking script for the teacher to say aloud in class.",
      "visualSuggestions": "Description of suggested diagram, visual illustration, or whiteboard layout.",
      "layout": "standard", // standard | split | title_only | quote | summary
      "sourceReferences": [
        { "sourceName": "...", "location": "..." }
      ]
    }
  ]
}
Structure the slides in a solid teaching flow:
Slide 1: Hook / Introduction
Slide 2: Core Concept Overview
Slide 3-5: Deep Dives & Examples
Slide 6: Common Misconceptions or Comparison
Slide 7: Check for Understanding / Interactive Question
Slide 8: Summary & Key Takeaways`;
      break;

    case 'notes':
      taskGuidance = `Generate comprehensive study notes for "${projectName}".
Format: ${options?.notesFormat || 'comprehensive'}.
Schema:
{
  "id": "notes_${Date.now()}",
  "title": "${projectName} — Study Notes",
  "subject": "${projectName}",
  "grade": "${classGrade || 'Class 10'}",
  "format": "${options?.notesFormat || 'comprehensive'}",
  "sections": [
    {
      "id": "sec_1",
      "heading": "Executive Summary",
      "type": "summary",
      "content": "Concise overview of the chapter or topic.",
      "sourceReferences": [{ "sourceName": "...", "location": "..." }]
    },
    {
      "id": "sec_2",
      "heading": "Core Analysis & Detailed Notes",
      "type": "detailed",
      "content": "Comprehensive breakdown with subsections and explanations.",
      "bullets": ["Bullet 1", "Bullet 2", "Bullet 3"],
      "sourceReferences": [{ "sourceName": "...", "location": "..." }]
    },
    {
      "id": "sec_3",
      "heading": "Important Terms & Glossary",
      "type": "important_terms",
      "content": "Key vocabulary and definitions from the text.",
      "terms": [
        { "term": "Term Name", "definition": "Clear explanation", "example": "Contextual usage" }
      ],
      "sourceReferences": [{ "sourceName": "...", "location": "..." }]
    },
    {
      "id": "sec_4",
      "heading": "Exam-Oriented Questions & Answers",
      "type": "qa",
      "content": "High-probability exam questions with ideal model answers.",
      "qaList": [
        {
          "question": "Expected exam question?",
          "answer": "Detailed model answer grounded in the source.",
          "examTip": "Key mark-scoring keyword or point to include."
        }
      ],
      "sourceReferences": [{ "sourceName": "...", "location": "..." }]
    }
  ]
}`;
      break;

    case 'quiz':
      const qCount = options?.quizCount || 5;
      const qDiff = options?.quizDifficulty || 'medium';
      const qType = options?.quizType || 'mcq';
      taskGuidance = `Generate a ${qCount}-question assessment quiz of difficulty "${qDiff}" and type "${qType}".
Schema:
{
  "id": "quiz_${Date.now()}",
  "title": "${projectName} — Quiz & Assessment",
  "totalQuestions": ${qCount},
  "difficulty": "${qDiff}",
  "questions": [
    {
      "id": "q_1",
      "type": "mcq", // "mcq" | "true_false" | "short_answer"
      "question": "Clear, unambiguous question grounded in the source text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A", // Must match exactly one of the options for MCQ!
      "explanation": "Why this answer is correct according to the source material.",
      "difficulty": "medium",
      "sourceReference": {
        "sourceName": "...",
        "location": "..."
      }
    }
  ]
}
Requirements:
- For MCQ: exactly 4 plausible options, only ONE indisputably correct answer.
- Meaningful distractors that test true comprehension, not cheap tricks.
- Grounded explanation with exact location citation.`;
      break;

    case 'audio':
      taskGuidance = `Generate a spoken educational audio script for "${projectName}".
Audio Type: ${options?.audioType || 'explanation'} (explanation | podcast | revision | summary | storytelling).
Schema:
{
  "id": "audio_${Date.now()}",
  "title": "${projectName} — Audio Lesson",
  "audioType": "${options?.audioType || 'explanation'}",
  "language": "${outputLanguage}",
  "voiceStyle": "Warm, engaging, clear teaching voice",
  "durationEstimateSeconds": 180,
  "script": "Full verbatim script to be spoken aloud.",
  "segments": [
    {
      "speaker": "Teacher",
      "text": "Opening hook and welcome to students.",
      "timestamp": "00:00",
      "tone": "enthusiastic"
    },
    {
      "speaker": "Teacher",
      "text": "Core concept explanation with simple metaphor.",
      "timestamp": "01:00",
      "tone": "informative"
    },
    {
      "speaker": "Teacher",
      "text": "Quick recap and thought question.",
      "timestamp": "02:30",
      "tone": "encouraging"
    }
  ],
  "sourceReferences": [
    { "sourceName": "...", "location": "..." }
  ]
}`;
      break;

    case 'video':
      taskGuidance = `Generate an instructional video storyboard for "${projectName}".
Schema:
{
  "id": "video_${Date.now()}",
  "title": "${projectName} — Instructional Video Plan",
  "targetDurationMinutes": 3,
  "voiceStyle": "Energetic, clear instructional narration",
  "aspectRatio": "16:9",
  "statusDescription": "Storyboard ready for visual recording and teaching studio integration.",
  "scenes": [
    {
      "id": "scene_1",
      "order": 1,
      "durationSeconds": 15,
      "narration": "What the voiceover or teacher says in this scene.",
      "visualDescription": "What should appear on screen (e.g. animated bird perched on a cliff ledge).",
      "textOverlay": "Key title or takeaway keyword shown on screen",
      "transition": "fade",
      "sourceReferences": [
        { "sourceName": "...", "location": "..." }
      ]
    }
  ]
}
Generate between 4 to 8 sequential scenes covering the lesson from hook to conclusion.`;
      break;

    case 'topic_explanation':
      taskGuidance = `Generate a deep, crystal-clear pedagogical explanation for "${projectName}".
Schema:
{
  "id": "exp_${Date.now()}",
  "topic": "${projectName}",
  "targetAudience": "${targetAudience}",
  "coreConcept": "Single paragraph defining the core essence of the topic.",
  "breakdown": [
    {
      "subtopic": "Sub-concept title",
      "explanation": "Detailed step-by-step breakdown grounded in sources.",
      "realWorldAnalogy": "A relatable real-world comparison or metaphor that makes this instantly click for students.",
      "sourceReferences": [{ "sourceName": "...", "location": "..." }]
    }
  ],
  "commonMisconceptions": [
    {
      "misconception": "Common error or false assumption students make",
      "correction": "Why it is incorrect and what the correct understanding is."
    }
  ],
  "summaryTakeaway": "Key takeaway that students should remember forever.",
  "additionalExplanation": "Any additional background context marked clearly as supplementary."
}`;
      break;
  }

  // Combine full user prompt
  const prompt = `PROJECT NAME: ${projectName}
TARGET GRADE / AUDIENCE: ${classGrade || 'Class 10'} — ${targetAudience}
DESIRED OUTPUT LANGUAGE: ${targetLangStr}
TEACHER'S CUSTOM INSTRUCTIONS:
${teacherInstructions ? `"${teacherInstructions}"` : 'Deliver a clear, engaging, and high-impact lesson based on the sources.'}

=== PRIMARY SOURCES (Highest Priority Basis) ===
${formattedPrimary || '(No primary sources specified. Use supporting sources with care.)'}

=== SUPPORTING SOURCES (Secondary Context) ===
${formattedSupporting || '(No secondary sources)'}

TASK TO GENERATE:
${taskGuidance}

Remember: Return ONLY valid JSON. Ground all claims in the provided source text.`;

  return { systemInstruction, prompt };
}
