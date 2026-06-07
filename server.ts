import express, { type Request, type Response } from 'express';
import { streamWebSearchRetrievalAgent, webSearchRetrievalAgent } from './webSearchRetrievalAgent.js';
import type { StreamEvent } from './types.js';
import { supabase } from './config.js';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'supportpilot-api' });
});

app.post('/api/search', async (req: Request, res: Response) => {
  const body = req.body as { query?: string } | undefined;
  const query = body?.query;

  if (!query || typeof query !== 'string' || !query.trim()) {
    res.status(400).json({ error: 'A non-empty query string is required.' });
    return;
  }

  try {
    const result = await webSearchRetrievalAgent(query.trim());
    res.json(result);
  } catch (err) {
    console.error('[API] /api/search failed:', err);
    res.status(500).json({ error: 'Failed to process search request.' });
  }
});

app.post('/api/search/stream', async (req: Request, res: Response) => {
  const body = req.body as { query?: string } | undefined;
  const query = body?.query;

  if (!query || typeof query !== 'string' || !query.trim()) {
    res.status(400).json({ error: 'A non-empty query string is required.' });
    return;
  }

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  const writeEvent = (event: StreamEvent): void => {
    res.write(`${JSON.stringify(event)}\n`);
  };

  writeEvent({ type: 'start' });

  try {
    const result = await streamWebSearchRetrievalAgent(query.trim(), {
      onTextDelta: async (delta) => {
        writeEvent({ type: 'text-delta', delta });
      },
    });

    writeEvent({ type: 'done', ...result });
    res.end();
  } catch (err) {
    console.error('[API] /api/search/stream failed:', err);
    writeEvent({ type: 'error', error: 'Failed to process streaming search request.' });
    res.end();
  }
});

app.get('/api/article/:topic', async (req: Request<{ topic: string }>, res: Response) => {
  const topic = req.params.topic;

  if (!topic || !topic.trim()) {
    res.status(400).json({ error: 'A topic slug is required.' });
    return;
  }

  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id, content, metadata')
      .eq('metadata->>topic', topic)
      .limit(1)
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error('[API] /api/article failed:', err);
    res.status(500).json({ error: 'Failed to fetch article.' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`SupportPilot running at http://localhost:${PORT}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nError: Port ${PORT} is already in use.\nRun: kill $(lsof -ti:${PORT})\n`);
    process.exit(1);
  }
  throw err;
});
