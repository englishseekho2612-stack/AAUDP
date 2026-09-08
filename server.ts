import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { classroomRouter } from './server/classroomRouter.js';
import { youtubeRouter } from './server/youtubeRouter.js';
import { studentPortalRouter } from './server/studentPortalRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Mount Part 05 Live Classroom, YouTube Live, & Part 10 Student Portal Routers
app.use('/api/classroom', classroomRouter);
app.use('/api/youtube', youtubeRouter);
app.use(['/auth/youtube', '/auth/youtube/'], youtubeRouter);
app.use('/api/student', studentPortalRouter);

// 1. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 2. Gemini AI Status Check
app.get('/api/gemini/status', (req: Request, res: Response) => {
  const serverKeyConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
  const clientKeyHeader = req.headers['x-gemini-api-key'];
  const hasKey = serverKeyConfigured || Boolean(clientKeyHeader && String(clientKeyHeader).trim() !== '');

  res.json({
    configured: hasKey,
    hasServerKey: serverKeyConfigured,
    defaultModel: 'gemini-2.5-flash',
    supportedTasks: [
      'mind_map',
      'slides',
      'notes',
      'audio',
      'video',
      'quiz',
      'presentation_designer',
      'topic_explanation',
    ],
  });
});

// 3. Gemini Content Generation Route
app.post('/api/gemini/generate', async (req: Request, res: Response) => {
  try {
    const headerKey = req.headers['x-gemini-api-key'];
    const apiKey = (process.env.GEMINI_API_KEY || (typeof headerKey === 'string' ? headerKey : '')).trim();

    if (!apiKey) {
      return res.status(503).json({
        success: false,
        error: 'Gemini AI is not configured yet. Please configure GEMINI_API_KEY in your environment or in Studio Settings.',
        code: 'NOT_CONFIGURED',
      });
    }

    const {
      prompt,
      systemInstruction,
      model = 'gemini-2.5-flash',
      responseMimeType,
      temperature,
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'A prompt string is required for generation.',
        code: 'INVALID_REQUEST',
      });
    }

    // Initialize the official Gemini SDK
    const ai = new GoogleGenAI({ apiKey });

    const config: Record<string, unknown> = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (responseMimeType) {
      config.responseMimeType = responseMimeType;
    }
    if (typeof temperature === 'number') {
      config.temperature = temperature;
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config,
    });

    const outputText = response.text || '';

    return res.json({
      success: true,
      text: outputText,
      modelUsed: model,
    });
  } catch (error: any) {
    console.error('Gemini generation error in server route:', error?.message || error);

    const errorMessage = error?.message || 'Failed to generate content with Gemini AI.';
    const isRateLimit = errorMessage.includes('429') || errorMessage.toLowerCase().includes('quota');
    const isAuthError = errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('403') || errorMessage.includes('UNAUTHENTICATED');

    return res.status(isRateLimit ? 429 : isAuthError ? 401 : 500).json({
      success: false,
      error: errorMessage,
      code: isRateLimit ? 'RATE_LIMITED' : isAuthError ? 'AUTH_ERROR' : 'GENERATION_FAILED',
    });
  }
});

// Vite Middleware & SPA serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Teaching Studio server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
