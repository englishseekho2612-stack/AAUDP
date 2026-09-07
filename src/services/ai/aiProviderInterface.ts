/**
 * AI Provider Interface
 * Model & Provider Abstraction Layer (Section 4 & Section 2)
 * Ensures Gemini provider is modular, replaceable, and isolated from UI.
 */

export interface ModelConfig {
  providerName: string;
  modelName: string;
  timeoutMs: number;
  maxRetries: number;
  temperature?: number;
}

export interface AIProviderRequest {
  prompt: string;
  systemInstruction?: string;
  responseMimeType?: string;
  responseSchema?: unknown;
  modelConfig?: Partial<ModelConfig>;
  abortSignal?: AbortSignal;
}

export interface AIProviderResponse {
  text: string;
  modelUsed: string;
  latencyMs: number;
  rawPayload?: unknown;
}

export interface AIErrorDetails {
  code: string;
  message: string;
  isRetryable: boolean;
  userFacingMessage: string;
}

export interface AIProvider {
  readonly name: string;
  readonly defaultModel: string;
  isConfigured(): Promise<{ configured: boolean; reason?: string }>;
  generate(request: AIProviderRequest): Promise<AIProviderResponse>;
}
