import express from 'express';
import {
  streamWebSearchRetrievalAgent,
  webSearchRetrievalAgent,
} from './webSearchRetrievalAgent.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'supportpilot-api' });
});

app.post('/api/search', async (req, res) => {
  const { query } = req.body ?? {};

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'A non-empty query string is required.' });
  }

  try {
    const result = await webSearchRetrievalAgent(query.trim());
    return res.json(result);
  } catch (error) {
    console.error('[API] /api/search failed:', error);
    return res.status(500).json({
      error: 'Failed to process search request.',
    });
  }
});

app.post('/api/search/stream', async (req, res) => {
  const { query } = req.body ?? {};

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'A non-empty query string is required.' });
  }

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const writeEvent = (event) => {
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
    return res.end();
  } catch (error) {
    console.error('[API] /api/search/stream failed:', error);
    writeEvent({
      type: 'error',
      error: 'Failed to process streaming search request.',
    });
    return res.end();
  }
});

app.listen(PORT, () => {
  console.log(`SupportPilot running at http://localhost:${PORT}`);
});
