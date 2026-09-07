/**
 * Gemini Provider Implementation
 * Calls the secure server-side `/api/gemini/generate` proxy
 * Supports timeout, retries with exponential backoff, and friendly error translation.
 */

import { AIProvider, AIProviderRequest, AIProviderResponse, ModelConfig } from './aiProviderInterface';

const DEFAULT_CONFIG: ModelConfig = {
  providerName: 'Google Gemini',
  modelName: 'gemini-2.5-flash',
  timeoutMs: 50000,
  maxRetries: 2,
  temperature: 0.2, // Low temperature for high grounding accuracy
};

const LOCAL_KEY_STORAGE = 'ai_teaching_studio_custom_gemini_key';

export function getCustomClientApiKey(): string {
  try {
    return localStorage.getItem(LOCAL_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setCustomClientApiKey(key: string): void {
  try {
    if (!key.trim()) {
      localStorage.removeItem(LOCAL_KEY_STORAGE);
    } else {
      localStorage.setItem(LOCAL_KEY_STORAGE, key.trim());
    }
  } catch {
    // Ignore storage issues
  }
}

export class GeminiProvider implements AIProvider {
  readonly name = 'GeminiProvider';
  readonly defaultModel = 'gemini-2.5-flash';

  private config: ModelConfig;

  constructor(customConfig?: Partial<ModelConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
  }

  async isConfigured(): Promise<{ configured: boolean; reason?: string }> {
    try {
      const customKey = getCustomClientApiKey();
      const headers: Record<string, string> = {};
      if (customKey) {
        headers['x-gemini-api-key'] = customKey;
      }

      const res = await fetch('/api/gemini/status', {
        headers,
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        return {
          configured: false,
          reason: 'The AI server route could not be reached.',
        };
      }

      const data = await res.json();
      return {
        configured: Boolean(data.configured),
        reason: data.configured
          ? undefined
          : 'Gemini AI is not configured yet. Please configure GEMINI_API_KEY.',
      };
    } catch {
      // If server route isn't responding yet, check if customKey is provided
      const customKey = getCustomClientApiKey();
      if (customKey) {
        return { configured: true };
      }
      return {
        configured: false,
        reason: 'Unable to verify Gemini connection. Dev server is starting up.',
      };
    }
  }

  async generate(request: AIProviderRequest): Promise<AIProviderResponse> {
    const model = request.modelConfig?.modelName || this.config.modelName;
    const timeoutMs = request.modelConfig?.timeoutMs || this.config.timeoutMs;
    const maxRetries = request.modelConfig?.maxRetries ?? this.config.maxRetries;
    const temperature = request.modelConfig?.temperature ?? this.config.temperature;

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= maxRetries) {
      attempt++;
      const startTime = Date.now();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        // Forward caller abort if provided
        if (request.abortSignal) {
          request.abortSignal.addEventListener('abort', () => controller.abort(), { once: true });
        }

        const customKey = getCustomClientApiKey();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (customKey) {
          headers['x-gemini-api-key'] = customKey;
        }

        const res = await fetch('/api/gemini/generate', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            prompt: request.prompt,
            systemInstruction: request.systemInstruction,
            model,
            responseMimeType: request.responseMimeType || 'application/json',
            temperature,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error || `Server responded with status ${res.status}`;
          const errCode = errData.code || 'HTTP_' + res.status;

          if (res.status === 429 && attempt <= maxRetries) {
            // Rate limit, backoff and retry
            const waitTime = Math.pow(2, attempt) * 1500;
            await new Promise((r) => setTimeout(r, waitTime));
            continue;
          }

          if (res.status === 503 || errCode === 'NOT_CONFIGURED') {
            throw new Error('Gemini AI is not configured yet. Please configure GEMINI_API_KEY in the environment or Settings.');
          }

          throw new Error(errMsg);
        }

        const data = await res.json();
        const latencyMs = Date.now() - startTime;

        if (!data.success || typeof data.text !== 'string') {
          throw new Error(data.error || 'Invalid response from AI server.');
        }

        return {
          text: data.text,
          modelUsed: data.modelUsed || model,
          latencyMs,
          rawPayload: data,
        };
      } catch (err: any) {
        lastError = err;
        if (request.abortSignal?.aborted || err.name === 'AbortError') {
          throw new Error('AI generation task was cancelled.');
        }

        // Retry for transient network errors if attempts remaining
        if (attempt <= maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
          continue;
        }
      }
    }

    throw lastError || new Error('Failed to generate AI response after retries.');
  }
}

export const defaultGeminiProvider = new GeminiProvider();
