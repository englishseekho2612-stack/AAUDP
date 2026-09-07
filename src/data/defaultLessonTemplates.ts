import { LessonTemplate } from '../types/curriculum';

export const DEFAULT_LESSON_TEMPLATES: LessonTemplate[] = [
  {
    id: 'tpl_standard_lesson',
    name: 'Standard Lesson',
    description: 'Balanced pedagogical flow with conceptual theory, interactive practice, and evaluation.',
    sections: [
      { title: 'Introduction & Hook', description: 'Real-world problem or contextual question to activate prior knowledge', estimatedMinutes: 5, recommendedContentType: 'notes' },
      { title: 'Learning Objectives', description: 'Clearly stated goals and outcome expectations for students', estimatedMinutes: 3, recommendedContentType: 'notes' },
      { title: 'Core Concept & Mind Map', description: 'Direct instruction breaking down key principles and relationships', estimatedMinutes: 15, recommendedContentType: 'mind_map' },
      { title: 'Visual Explanation & Slides', description: 'Diagrammatic breakdown and guided illustrations', estimatedMinutes: 12, recommendedContentType: 'slides' },
      { title: 'Worked Example', description: 'Step-by-step problem demonstration by the teacher', estimatedMinutes: 8, recommendedContentType: 'slides' },
      { title: 'Interactive Practice & Q&A', description: 'Student response check and live comprehension questions', estimatedMinutes: 7, recommendedContentType: 'quiz' },
      { title: 'Quick Summary & Key Takeaways', description: 'Recap of core formulas, definitions, and concepts', estimatedMinutes: 5, recommendedContentType: 'notes' },
      { title: 'Homework & Assignment', description: 'Practice worksheet and extension questions for independent study', estimatedMinutes: 5, recommendedContentType: 'activity' },
    ],
  },
  {
    id: 'tpl_quick_revision',
    name: 'Quick Revision',
    description: 'High-density refresher session focused on rapid recall, mind maps, and high-yield questions.',
    sections: [
      { title: 'Mind Map Bird’s Eye View', description: 'Rapid hierarchical recap of chapter topics and connections', estimatedMinutes: 8, recommendedContentType: 'mind_map' },
      { title: 'Key Formulae & Definitions', description: 'Flash overview of non-negotiable exam points', estimatedMinutes: 7, recommendedContentType: 'slides' },
      { title: 'Rapid-Fire Practice Quiz', description: 'Short timed conceptual questions with instant feedback', estimatedMinutes: 15, recommendedContentType: 'quiz' },
      { title: 'Common Mistakes & Pitfalls', description: 'Analysis of frequent student traps in previous exams', estimatedMinutes: 10, recommendedContentType: 'notes' },
    ],
  },
  {
    id: 'tpl_exam_prep',
    name: 'Exam Preparation',
    description: 'Rigorous exam-focused session highlighting past question patterns, marking schemes, and time management.',
    sections: [
      { title: 'Topic Weightage & Blueprint', description: 'Marks distribution and common question types in board exams', estimatedMinutes: 5, recommendedContentType: 'notes' },
      { title: 'High-Frequency Exam Questions', description: 'Walkthrough of past 5 years question patterns and rubrics', estimatedMinutes: 20, recommendedContentType: 'slides' },
      { title: 'Mock Exam Timed Section', description: 'Independent student attempt under simulated exam conditions', estimatedMinutes: 20, recommendedContentType: 'quiz' },
      { title: 'Answer Key & Model Answers', description: 'Step-by-step scoring guidance and presentation tips', estimatedMinutes: 15, recommendedContentType: 'notes' },
    ],
  },
  {
    id: 'tpl_concept_deep_dive',
    name: 'Concept Deep Dive',
    description: 'Thorough analytical exploration of a complex topic with analogies, demonstrations, and case studies.',
    sections: [
      { title: 'The Big Question', description: 'A challenging puzzle or paradox that requires deeper theory', estimatedMinutes: 5, recommendedContentType: 'notes' },
      { title: 'Theoretical Foundation', description: 'Rigorous derivation or historical context of the principle', estimatedMinutes: 20, recommendedContentType: 'slides' },
      { title: 'Structural Mind Map', description: 'Detailed sub-categorization and multi-level hierarchy', estimatedMinutes: 15, recommendedContentType: 'mind_map' },
      { title: 'Application & Case Study', description: 'Contemporary real-world case or industrial application', estimatedMinutes: 15, recommendedContentType: 'slides' },
      { title: 'Conceptual Mastery Check', description: 'Application-level questions testing deep comprehension', estimatedMinutes: 10, recommendedContentType: 'quiz' },
    ],
  },
  {
    id: 'tpl_interactive_lesson',
    name: 'Interactive Lesson',
    description: 'Student-centered active learning session with frequent polls, breakout discussions, and live feedback.',
    sections: [
      { title: 'Warm-up Live Poll', description: 'Instant classroom pulse check on foundational knowledge', estimatedMinutes: 5, recommendedContentType: 'quiz' },
      { title: 'Mini-Lecture (Chunk 1)', description: 'Bite-sized presentation of first concept slice', estimatedMinutes: 10, recommendedContentType: 'slides' },
      { title: 'Peer Discussion / Think-Pair-Share', description: 'Prompt for student classroom chat and interaction', estimatedMinutes: 10, recommendedContentType: 'activity' },
      { title: 'Mini-Lecture (Chunk 2)', description: 'Second concept slice building on discussion', estimatedMinutes: 10, recommendedContentType: 'slides' },
      { title: 'Exit Ticket Quiz', description: 'Quick 3-question diagnostic before leaving class', estimatedMinutes: 10, recommendedContentType: 'quiz' },
    ],
  },
  {
    id: 'tpl_activity_based',
    name: 'Activity-Based Lesson',
    description: 'Hands-on exploration, laboratory experiment, or digital simulation with observation logs.',
    sections: [
      { title: 'Activity Hypothesis & Setup', description: 'Stating the objective, materials, and safety guidelines', estimatedMinutes: 8, recommendedContentType: 'notes' },
      { title: 'Guided Demonstration', description: 'Teacher or video demonstration of the phenomenon', estimatedMinutes: 12, recommendedContentType: 'video' },
      { title: 'Student Execution & Observations', description: 'Data recording, measurement, and logging', estimatedMinutes: 25, recommendedContentType: 'activity' },
      { title: 'Conclusion & Debrief', description: 'Connecting observed findings back to core theory', estimatedMinutes: 15, recommendedContentType: 'mind_map' },
    ],
  },
];
