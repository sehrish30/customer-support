export interface Turn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Session {
  turns: Turn[];
  lastActiveAt: number;
}

const MAX_TURNS = 10;
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

const store = new Map<string, Session>();

// Prune idle sessions every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, session] of store.entries()) {
    if (session.lastActiveAt < cutoff) store.delete(id);
  }
}, 10 * 60 * 1000).unref();

export function getHistory(sessionId: string): Turn[] {
  return store.get(sessionId)?.turns ?? [];
}

export function addTurn(sessionId: string, role: 'user' | 'assistant', content: string): void {
  const now = Date.now();
  if (!store.has(sessionId)) {
    store.set(sessionId, { turns: [], lastActiveAt: now });
  }
  const session = store.get(sessionId)!;
  session.turns.push({ role, content, timestamp: now });
  session.lastActiveAt = now;
  if (session.turns.length > MAX_TURNS) {
    session.turns.splice(0, session.turns.length - MAX_TURNS);
  }
}

export function formatHistoryAsContext(turns: Turn[]): string {
  if (turns.length === 0) return '';
  return (
    '[Conversation history]\n' +
    turns.map(t => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.content}`).join('\n') +
    '\n'
  );
}

export function clearSession(sessionId: string): void {
  store.delete(sessionId);
}

export function sessionExists(sessionId: string): boolean {
  return store.has(sessionId);
}
