import { useState, useCallback } from 'react';
import type { AppSource, SearchStatus, StreamEvent } from '../types.js';

export interface UseSearchReturn {
  answer: string;
  sources: AppSource[] | null;
  status: SearchStatus;
  isLoading: boolean;
  runSearch: (query: string) => Promise<void>;
  clearSession: () => void;
}

export function useSearch(): UseSearchReturn {
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<AppSource[] | null>(null);
  const [status, setStatus] = useState<SearchStatus>({ label: 'Idle', tone: 'idle' });
  const [isLoading, setIsLoading] = useState(false);

  const clearSession = useCallback(() => {
    setAnswer('');
    setSources(null);
    setStatus({ label: 'Idle', tone: 'idle' });
  }, []);

  const runSearch = useCallback(async (query: string): Promise<void> => {
    setIsLoading(true);
    setStatus({ label: 'Streaming', tone: 'loading' });
    setAnswer('');
    setSources(null);

    try {
      const response = await fetch('/api/search/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? 'Request failed');
      }

      await consumeStream(response, {
        onTextDelta: (delta) => setAnswer((prev) => prev + delta),
        onDone: (event) => {
          setAnswer((prev) => prev.trim() || event.answer || 'No answer generated.');
          setSources(event.sources ?? null);
          setStatus({ label: 'Complete', tone: 'success' });
        },
        onError: (event) => {
          throw new Error(event.error ?? 'Streaming request failed');
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setAnswer(`Error: ${message}`);
      setSources(null);
      setStatus({ label: 'Failed', tone: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { answer, sources, status, isLoading, runSearch, clearSession };
}

interface StreamCallbacks {
  onTextDelta: (delta: string) => void;
  onDone: (event: StreamEvent & { type: 'done' }) => void;
  onError: (event: StreamEvent & { type: 'error' }) => void;
}

async function consumeStream(response: Response, callbacks: StreamCallbacks): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body is not readable');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      applyEvent(JSON.parse(line) as StreamEvent, callbacks);
    }
  }

  const trailing = buffer.trim();
  if (trailing) {
    applyEvent(JSON.parse(trailing) as StreamEvent, callbacks);
  }
}

function applyEvent(event: StreamEvent, callbacks: StreamCallbacks): void {
  if (event.type === 'text-delta' && event.delta !== undefined) {
    callbacks.onTextDelta(event.delta);
  } else if (event.type === 'done') {
    callbacks.onDone(event as StreamEvent & { type: 'done' });
  } else if (event.type === 'error') {
    callbacks.onError(event as StreamEvent & { type: 'error' });
  }
}
