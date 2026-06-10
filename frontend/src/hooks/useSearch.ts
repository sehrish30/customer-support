import { useState, useCallback, useRef } from 'react';
import type { ChatTurn, StreamEvent } from '../types.js';

export interface UseSearchReturn {
  turns: ChatTurn[];
  isLoading: boolean;
  hasMemory: boolean;
  sessionId: string;
  hasSummary: boolean;
  runSearch: (query: string, imageBase64?: string) => Promise<void>;
  clearSession: () => void;
  createGitHubIssue: (title: string, body: string) => Promise<{ url: string; number: number } | null>;
  updateTurnIssue: (id: string, state: ChatTurn['issueState'], issue: ChatTurn['createdIssue']) => void;
  reportToAgent: (query: string, answer: string, customerEmail: string, imageBase64?: string) => Promise<boolean>;
}

function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useSearch(): UseSearchReturn {
  const sessionIdRef = useRef<string>(generateId());
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMemory, setHasMemory] = useState(false);
  const [hasSummary, setHasSummary] = useState(false);

  const clearSession = useCallback(() => {
    void fetch(`/api/session/${sessionIdRef.current}`, { method: 'DELETE' }).catch(() => undefined);
    sessionIdRef.current = generateId();
    setTurns([]);
    setHasMemory(false);
    setHasSummary(false);
  }, []);

  const updateTurnIssue = useCallback((
    id: string,
    state: ChatTurn['issueState'],
    issue: ChatTurn['createdIssue'],
  ) => {
    setTurns(prev => prev.map(t => t.id === id ? { ...t, issueState: state, createdIssue: issue } : t));
  }, []);

  const runSearch = useCallback(async (query: string, imageBase64?: string): Promise<void> => {
    const id = generateId();
    setTurns(prev => [...prev, {
      id, query, answer: '', sources: null, isStreaming: true, issueState: 'idle', createdIssue: null,
      ...(imageBase64 !== undefined ? { imageBase64 } : {}),
    }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/search/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, sessionId: sessionIdRef.current, imageBase64 }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? 'Request failed');
      }

      await consumeStream(response, {
        onTextDelta: (delta) => {
          setTurns(prev => prev.map(t => t.id === id ? { ...t, answer: t.answer + delta } : t));
        },
        onDone: (event) => {
          setTurns(prev => prev.map(t => t.id === id ? {
            ...t,
            answer: event.answer || t.answer.trim() || 'No answer generated.',
            sources: event.sources ?? null,
            isStreaming: false,
          } : t));
          setHasMemory(event.hasMemory ?? false);
          setHasSummary(event.hasSummary ?? false);
        },
        onError: (event) => {
          throw new Error(event.error ?? 'Streaming request failed');
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setTurns(prev => prev.map(t => t.id === id ? {
        ...t, answer: `Error: ${message}`, isStreaming: false,
      } : t));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createGitHubIssue = useCallback(async (
    title: string,
    body: string,
  ): Promise<{ url: string; number: number } | null> => {
    try {
      const response = await fetch('/api/github/create-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });
      if (!response.ok) return null;
      return await response.json() as { url: string; number: number };
    } catch {
      return null;
    }
  }, []);

  const reportToAgent = useCallback(async (query: string, answer: string, customerEmail: string, imageBase64?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/email/report-to-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, answer, customerEmail, imageBase64 }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  return { turns, isLoading, hasMemory, hasSummary, sessionId: sessionIdRef.current, runSearch, clearSession, createGitHubIssue, updateTurnIssue, reportToAgent };
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
  if (trailing) applyEvent(JSON.parse(trailing) as StreamEvent, callbacks);
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
