/**
 * AI Task Service
 * Core orchestrator for the 8 educational AI generation tasks
 * Supports task execution, cancellation, validation, history logging, and cost control.
 */

import {
  AITaskRequest,
  AITaskRecord,
  AITaskType,
  MindMapContent,
  PresentationContent,
  NotesContent,
  QuizContent,
  AudioContent,
  VideoContent,
  TopicExplanationContent,
} from '../../types/ai';
import { defaultGeminiProvider, GeminiProvider } from './geminiProvider';
import { buildGroundedContextPrompt } from './aiContextBuilder';
import {
  extractJsonFromText,
  validateMindMap,
  validatePresentation,
  validateNotes,
  validateQuiz,
  validateAudio,
  validateVideo,
  validateTopicExplanation,
} from './aiOutputValidators';

export interface GenerationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  modelUsed?: string;
  latencyMs?: number;
}

class AITaskService {
  private activeControllers = new Map<string, AbortController>();
  private taskHistory: AITaskRecord[] = [];
  private provider: GeminiProvider = defaultGeminiProvider;

  constructor() {
    this.loadHistory();
  }

  private loadHistory() {
    try {
      const raw = localStorage.getItem('ai_teaching_studio_task_history');
      if (raw) {
        this.taskHistory = JSON.parse(raw);
      }
    } catch {
      this.taskHistory = [];
    }
  }

  private saveHistory() {
    try {
      localStorage.setItem(
        'ai_teaching_studio_task_history',
        JSON.stringify(this.taskHistory.slice(-50)) // keep last 50
      );
    } catch {
      // ignore
    }
  }

  public getHistory(projectId?: string): AITaskRecord[] {
    if (!projectId) return [...this.taskHistory];
    return this.taskHistory.filter((t) => t.projectId === projectId);
  }

  public cancelTask(taskId: string): boolean {
    const controller = this.activeControllers.get(taskId);
    if (controller) {
      controller.abort();
      this.activeControllers.delete(taskId);

      // Update record in history
      const rec = this.taskHistory.find((t) => t.taskId === taskId);
      if (rec) {
        rec.status = 'cancelled';
        this.saveHistory();
      }
      return true;
    }
    return false;
  }

  public async isConfigured(): Promise<{ configured: boolean; reason?: string }> {
    return this.provider.isConfigured();
  }

  /**
   * Execute an AI Task
   */
  public async executeTask<T = unknown>(request: AITaskRequest): Promise<GenerationResult<T>> {
    // 1. Check configuration
    const configCheck = await this.isConfigured();
    if (!configCheck.configured) {
      return {
        success: false,
        error: configCheck.reason || 'Gemini AI is not configured yet. Please set GEMINI_API_KEY in environment or Settings.',
      };
    }

    // 2. Validate sources presence
    if (!request.selectedSources || request.selectedSources.length === 0) {
      return {
        success: false,
        error: 'Please select at least 1 source to ground AI generation.',
      };
    }

    // 3. Register AbortController
    const controller = new AbortController();
    this.activeControllers.set(request.taskId, controller);

    // 4. Log Task Record
    const record: AITaskRecord = {
      taskId: request.taskId,
      projectId: request.projectId,
      taskType: request.taskType,
      selectedSourceIds: request.selectedSources.map((s) => s.sourceId),
      teacherInstruction: request.teacherInstructions,
      language: request.outputLanguage,
      model: this.provider.defaultModel,
      status: 'processing',
      createdTime: Date.now(),
    };
    this.taskHistory.unshift(record);
    this.saveHistory();

    try {
      // 5. Build Grounded Context Prompt
      const { systemInstruction, prompt } = buildGroundedContextPrompt(request);

      // 6. Query Gemini Provider
      const response = await this.provider.generate({
        prompt,
        systemInstruction,
        responseMimeType: 'application/json',
        abortSignal: controller.signal,
      });

      // 7. Parse & Validate Output based on Task Type
      const rawJson = extractJsonFromText(response.text);
      let validatedData: any;

      switch (request.taskType) {
        case 'mind_map':
          validatedData = validateMindMap(rawJson);
          break;
        case 'slides':
        case 'presentation_designer':
          validatedData = validatePresentation(rawJson);
          break;
        case 'notes':
          validatedData = validateNotes(rawJson);
          break;
        case 'quiz':
          validatedData = validateQuiz(rawJson);
          break;
        case 'audio':
          validatedData = validateAudio(rawJson);
          break;
        case 'video':
          validatedData = validateVideo(rawJson);
          break;
        case 'topic_explanation':
          validatedData = validateTopicExplanation(rawJson);
          break;
        default:
          validatedData = rawJson;
      }

      // Mark success in history
      record.status = 'completed';
      record.completedTime = Date.now();
      this.saveHistory();

      return {
        success: true,
        data: validatedData as T,
        modelUsed: response.modelUsed,
        latencyMs: response.latencyMs,
      };
    } catch (err: any) {
      const isCancelled = controller.signal.aborted || err.message?.includes('cancelled');
      record.status = isCancelled ? 'cancelled' : 'failed';
      record.errorInformation = err.message || 'Generation error';
      this.saveHistory();

      return {
        success: false,
        error: isCancelled ? 'Task was cancelled by teacher.' : err.message || 'Generation failed.',
      };
    } finally {
      this.activeControllers.delete(request.taskId);
    }
  }

  /**
   * Mind Map Node Sub-action (Section 15: Explain More, Simplify, Example, Question, Quiz)
   */
  public async executeNodeAction(params: {
    action: 'explain_more' | 'simplify' | 'example' | 'question' | 'quiz';
    nodeTitle: string;
    nodeContext: string;
    sourceReferences: string;
    language: string;
    targetGrade?: string;
  }): Promise<string> {
    const { action, nodeTitle, nodeContext, sourceReferences, language, targetGrade = 'Class 10' } = params;

    let instruction = '';
    switch (action) {
      case 'explain_more':
        instruction = `Provide a deeper, high-clarity pedagogical explanation of "${nodeTitle}" for ${targetGrade} students in ${language}. Keep it source-grounded with clear bullet points.`;
        break;
      case 'simplify':
        instruction = `Explain "${nodeTitle}" in ultra-simple, accessible terms for younger or struggling students in ${language}. Use intuitive language and zero unnecessary jargon.`;
        break;
      case 'example':
        instruction = `Provide 2 concrete, highly relatable real-world examples or classroom analogies illustrating "${nodeTitle}" in ${language}.`;
        break;
      case 'question':
        instruction = `Formulate 3 high-impact classroom discussion or critical thinking questions based on "${nodeTitle}" in ${language}.`;
        break;
      case 'quiz':
        instruction = `Create a single quick check-for-understanding multiple-choice question with 4 options and the correct answer indicated for "${nodeTitle}" in ${language}.`;
        break;
    }

    const prompt = `TOPIC NODE: "${nodeTitle}"
NODE CONTEXT:
${nodeContext}

SOURCE REFERENCES:
${sourceReferences}

TASK:
${instruction}

Provide your response in clean, formatted Markdown.`;

    const res = await this.provider.generate({
      prompt,
      systemInstruction: 'You are an expert pedagogical assistant. Ground your response strictly in the topic and sources provided.',
      responseMimeType: 'text/plain',
    });

    return res.text;
  }
}

export const aiTaskService = new AITaskService();
