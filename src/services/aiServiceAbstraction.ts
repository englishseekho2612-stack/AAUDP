/**
 * Future AI Architecture Contract (Section 19)
 * 
 * Conceptual Layers:
 * UI -> Application/Feature Layer -> Service/Repository Layer -> AI Provider (Gemini) -> Local Storage
 * 
 * In Part 01, this defines the strict interface contract and capability checks.
 * Part 03 will provide the full Gemini integration using @google/genai SDK.
 * No fake generation or simulated AI output is performed here.
 */

import {
  AIOutputType,
  LearningSource,
  ProjectAIOutput,
  SupportedLanguage,
} from '../types/project';

export interface GenerateOutputRequest {
  projectId: string;
  outputType: AIOutputType;
  sources: LearningSource[];
  targetLanguage: SupportedLanguage;
  teacherInstructions?: string;
  options?: {
    detailLevel?: 'concise' | 'standard' | 'comprehensive';
    tone?: 'academic' | 'conversational' | 'exam_oriented';
  };
}

export interface IAIService {
  isConfigured(): Promise<boolean>;
  getAvailableCapabilities(): AIOutputType[];
  generateOutput<T = unknown>(request: GenerateOutputRequest): Promise<ProjectAIOutput<T>>;
  cancelGeneration(outputId: string): Promise<void>;
}

class FutureAIServicePlaceholder implements IAIService {
  async isConfigured(): Promise<boolean> {
    // In Part 01, checks configuration readiness without mocking results
    return false;
  }

  getAvailableCapabilities(): AIOutputType[] {
    return ['mind_map', 'slides', 'notes', 'audio', 'video', 'quiz'];
  }

  async generateOutput<T = unknown>(_request: GenerateOutputRequest): Promise<ProjectAIOutput<T>> {
    throw new Error(
      'AI Generation Engine is scheduled for Part 03 (Gemini AI Integration). Engine not active in Part 01.'
    );
  }

  async cancelGeneration(_outputId: string): Promise<void> {
    // No-op for placeholder
  }
}

export const aiService: IAIService = new FutureAIServicePlaceholder();
