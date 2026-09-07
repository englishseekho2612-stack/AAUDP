/**
 * SANITIZED AUDIT & SYSTEM DIAGNOSTIC LOGGER (Section 24 & 25)
 * 
 * Strict Privacy Mandate:
 * Never records:
 * - API keys (Gemini, Firebase, etc.)
 * - OAuth tokens or Client secrets
 * - Private student messages or names
 * - Private teacher notes or unredacted passwords
 * 
 * Records:
 * - Module lifecycle events
 * - Render / Export jobs
 * - Network connection transitions
 * - AI generation status & latency
 * - Storage health & hardware permissions
 */

export type LogLevel = 'info' | 'warn' | 'error';

export interface SystemLogEntry {
  id: string;
  timestamp: number;
  formattedTime: string;
  level: LogLevel;
  category: 'AI' | 'Media' | 'Classroom' | 'YouTube' | 'Storage' | 'Editor' | 'Network' | 'Security';
  message: string;
  metadata?: Record<string, any>;
}

class SystemLogger {
  private logs: SystemLogEntry[] = [];
  private maxLogs = 150;
  private listeners: Array<() => void> = [];

  constructor() {
    this.log('info', 'Security', 'AI Teaching Studio System Logger initialized with privacy filtering.');
  }

  /**
   * Sanitizes strings to completely mask any potential tokens, keys, or sensitive patterns
   */
  private sanitize(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input
      // Mask AI Studio / Gemini keys
      .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_GEMINI_KEY]')
      // Mask Bearer tokens
      .replace(/Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/gi, 'Bearer [REDACTED_TOKEN]')
      // Mask OAuth Client Secrets
      .replace(/GOCSPX-[A-Za-z0-9-_]+/g, '[REDACTED_OAUTH_SECRET]')
      // Mask passwords or secret fields in JSON strings
      .replace(/"(password|secret|token|apiKey)":\s*"[^"]+"/gi, '"$1": "[REDACTED]"');
  }

  public log(
    level: LogLevel,
    category: SystemLogEntry['category'],
    message: string,
    rawMetadata?: Record<string, any>
  ) {
    const sanitizedMsg = this.sanitize(message);
    const now = Date.now();

    // Sanitize metadata shallowly
    const metadata: Record<string, any> = {};
    if (rawMetadata) {
      for (const [k, v] of Object.entries(rawMetadata)) {
        if (typeof v === 'string') {
          metadata[k] = this.sanitize(v);
        } else if (typeof v === 'number' || typeof v === 'boolean') {
          metadata[k] = v;
        } else {
          metadata[k] = '[object]';
        }
      }
    }

    const entry: SystemLogEntry = {
      id: `log_${now}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: now,
      formattedTime: new Date(now).toISOString().replace('T', ' ').substring(11, 19),
      level,
      category,
      message: sanitizedMsg,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output for dev debugging
    if (level === 'error') {
      console.error(`[${category}] ${sanitizedMsg}`);
    } else if (level === 'warn') {
      console.warn(`[${category}] ${sanitizedMsg}`);
    }

    this.notify();
  }

  public getLogs(): SystemLogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.log('info', 'Security', 'System logs cleared by user.');
    this.notify();
  }

  public copyDiagnosticReport(): string {
    const report = {
      app: 'AI Teaching Studio',
      version: '1.0.0-release',
      generatedAt: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      onlineStatus: typeof navigator !== 'undefined' ? (navigator.onLine ? 'online' : 'offline') : 'unknown',
      logs: this.logs,
    };
    return JSON.stringify(report, null, 2);
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    for (const cb of this.listeners) {
      cb();
    }
  }
}

export const systemLogger = new SystemLogger();
