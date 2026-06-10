import { generateText } from 'ai';
import { groq } from '../config.js';
import { ANSWERING_MODEL } from '../constants.js';

export interface Turn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface Session {
  turns: Turn[];
  summary: string;
  lastActiveAt: number;
}

const MAX_TURNS = 10;
const KEEP_RECENT = 4;
const SESSION_TTL_MS = 30 * 60 * 1000;

const store = new Map<string, Session>();

setInterval(() => {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, session] of store.entries()) {
    if (session.lastActiveAt < cutoff) store.delete(id);
  }
}, 10 * 60 * 1000).unref();

async function compactSession(session: Session): Promise<void> {
  const toSummarize = session.turns.slice(0, session.turns.length - KEEP_RECENT);
  const recent = session.turns.slice(session.turns.length - KEEP_RECENT);

  const priorSummaryBlock = session.summary
    ? `Prior summary:\n${session.summary}\n\n`
    : '';

  const conversation = toSummarize
    .map(t => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.content}`)
    .join('\n');

  try {
    const { text } = await generateText({
      model: groq(ANSWERING_MODEL),
      system: `You are an expert at summarizing support chat conversations.
Preserve key facts: what the user's issue is, what was tried, any decisions made, and unresolved problems.
Output only the summary — no preamble, no labels.`,
      prompt: `${priorSummaryBlock}Conversation to summarize:\n${conversation}`,
    });

    session.summary = text.trim();
  } catch {
    // If summarization fails, fall back to dropping oldest turns without a summary
  }

  session.turns = recent;
}

export function getHistory(sessionId: string): Turn[] {
  return store.get(sessionId)?.turns ?? [];
}

export function getSummary(sessionId: string): string {
  return store.get(sessionId)?.summary ?? '';
}

export async function addTurn(sessionId: string, role: 'user' | 'assistant', content: string): Promise<void> {
  const now = Date.now();
  if (!store.has(sessionId)) {
    store.set(sessionId, { turns: [], summary: '', lastActiveAt: now });
  }
  const session = store.get(sessionId)!;
  session.turns.push({ role, content, timestamp: now });
  session.lastActiveAt = now;

  if (session.turns.length >= MAX_TURNS) {
    await compactSession(session);
  }
}

export function formatHistoryAsContext(turns: Turn[], summary?: string): string {
  const parts: string[] = [];

  if (summary) {
    parts.push(`[Conversation summary]\n${summary}`);
  }

  if (turns.length > 0) {
    const recent = turns
      .map(t => `${t.role === 'user' ? 'User' : 'Assistant'}: ${t.content}`)
      .join('\n');
    parts.push(`[Recent conversation]\n${recent}`);
  }

  return parts.join('\n\n');
}

export function clearSession(sessionId: string): void {
  store.delete(sessionId);
}

export function sessionExists(sessionId: string): boolean {
  return store.has(sessionId);
}
