import { useState, useCallback } from 'react';

export function useSearch() {
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState(null);
  const [status, setStatus] = useState({ label: 'Idle', tone: 'idle' });
  const [isLoading, setIsLoading] = useState(false);

  const runSearch = useCallback(async (query) => {
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
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed');
      }

      await consumeStream(response, {
        onTextDelta: (delta) => setAnswer((prev) => prev + delta),
        onDone: (event) => {
          setAnswer((prev) => prev.trim() || event.answer || 'No answer generated.');
          setSources(event.sources ?? null);
          setStatus({ label: 'Complete', tone: 'success' });
        },
        onError: (event) => {
          throw new Error(event.error || 'Streaming request failed');
        },
      });
    } catch (error) {
      setAnswer(`Error: ${error.message}`);
      setSources(null);
      setStatus({ label: 'Failed', tone: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { answer, sources, status, isLoading, runSearch };
}

async function consumeStream(response, { onTextDelta, onDone, onError }) {
  const reader = response.body.getReader();
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
      applyEvent(JSON.parse(line), { onTextDelta, onDone, onError });
    }
  }

  const trailing = buffer.trim();
  if (trailing) {
    applyEvent(JSON.parse(trailing), { onTextDelta, onDone, onError });
  }
}

function applyEvent(event, { onTextDelta, onDone, onError }) {
  if (event.type === 'text-delta') return onTextDelta(event.delta);
  if (event.type === 'done') return onDone(event);
  if (event.type === 'error') return onError(event);
}
