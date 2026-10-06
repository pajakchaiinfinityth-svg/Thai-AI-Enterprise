import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality, ThinkingLevel, GenerateVideosOperation } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAi() {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 2000,
  factor: number = 2
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isTransientError =
      error?.status === 503 ||
      error?.code === 503 ||
      error?.status === 429 ||
      error?.code === 429 ||
      error?.status === 'RESOURCE_EXHAUSTED' ||
      error?.message?.includes('high demand') ||
      error?.message?.includes('quota') ||
      error?.message?.includes('RESOURCE_EXHAUSTED') ||
      error?.message?.includes('UNAVAILABLE');

    if (retries > 0 && isTransientError) {
      const currentDelay = error?.status === 429 ? delay * 2 : delay;
      console.warn(
        `API Busy or Quota Exceeded (${error?.status || error?.code}). Retrying... attempts left: ${retries}. Waiting ${currentDelay}ms.`
      );
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      return retryWithBackoff(fn, retries - 1, currentDelay * factor, factor);
    }
    throw error;
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // Unary content generation
  app.post('/api/gemini/generate', async (req, res) => {
    try {
      const { model, contents, config } = req.body;
      const ai = getAi();
      const response = await retryWithBackoff(() =>
        ai.models.generateContent({
          model,
          contents,
          config,
        })
      );

      let inlineData: { data: string; mimeType: string } | null = null;
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          inlineData = {
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'application/octet-stream',
          };
          break;
        }
      }

      res.json({
        text: response.text || '',
        inlineData,
      });
    } catch (error: any) {
      console.error('Error in /api/gemini/generate:', error);
      res.status(error?.status || 500).json({
        error: {
          code: error?.status || error?.code || 500,
          message: error?.message || 'Internal Server Error',
          status: error?.status || 'ERROR',
        },
      });
    }
  });

  // Streaming content generation (SSE)
  app.post('/api/gemini/stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const { model, contents, config } = req.body;
      const ai = getAi();
      const responseStream = await retryWithBackoff(() =>
        ai.models.generateContentStream({
          model,
          contents,
          config,
        })
      );

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error('Error in /api/gemini/stream:', error);
      res.write(
        `data: ${JSON.stringify({
          error: {
            code: error?.status || error?.code || 500,
            message: error?.message || 'Stream error',
          },
        })}\n\n`
      );
      res.end();
    }
  });

  // Video Generation - Step 1: Start
  app.post('/api/generate-video', async (req, res) => {
    try {
      const { prompt, base64Image, mimeType, aspectRatio } = req.body;
      const ai = getAi();
      const operation = await retryWithBackoff(() =>
        ai.models.generateVideos({
          model: 'veo-3.1-lite-generate-preview',
          prompt,
          image: {
            imageBytes: base64Image,
            mimeType,
          },
          config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio || '16:9',
          },
        })
      );
      res.json({ operationName: operation.name });
    } catch (error: any) {
      console.error('Error in /api/generate-video:', error);
      res.status(error?.status || 500).json({
        error: {
          code: error?.status || error?.code || 500,
          message: error?.message || 'Failed to start video generation',
        },
      });
    }
  });

  // Video Generation - Step 2: Poll Status
  app.post('/api/video-status', async (req, res) => {
    try {
      const { operationName } = req.body;
      const ai = getAi();
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await retryWithBackoff(() =>
        ai.operations.getVideosOperation({ operation: op })
      );
      res.json({ done: updated.done });
    } catch (error: any) {
      console.error('Error in /api/video-status:', error);
      res.status(error?.status || 500).json({
        error: {
          code: error?.status || error?.code || 500,
          message: error?.message || 'Failed to poll video status',
        },
      });
    }
  });

  // Video Generation - Step 3: Download Video
  app.post('/api/video-download', async (req, res) => {
    try {
      const { operationName } = req.body;
      const ai = getAi();
      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await ai.operations.getVideosOperation({ operation: op });
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
        res.status(404).json({ error: { message: 'Video URI not found' } });
        return;
      }
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': apiKey },
      });
      res.setHeader('Content-Type', 'video/mp4');
      if (videoRes.body) {
        const reader = videoRes.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }
      res.end();
    } catch (error: any) {
      console.error('Error in /api/video-download:', error);
      res.status(500).json({
        error: { message: error?.message || 'Failed to download video' },
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
