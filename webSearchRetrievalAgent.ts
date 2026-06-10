import { generateText, streamText } from "ai";
import {
  KNOWLEDGE_BASE_DESCRIPTION,
  ANSWERING_MODEL,
  VISION_MODEL,
  KB_SUFFICIENCY_THRESHOLD,
} from "./constants.js";
import { getAnswerPrompt } from "./prompts.js";
import { FEW_SHOT_EXAMPLES } from "./fewShotExamples.js";
import { groq } from "./config.js";
import { searchKnowledgeBase } from "./tools/knowledgeBaseTool.js";
import { searchWeb } from "./tools/webSearchTool.js";
import {
  searchGitHubIssues,
  isGitHubConfigured,
} from "./tools/githubMcpTool.js";
import {
  getHistory,
  getSummary,
  addTurn,
  formatHistoryAsContext,
} from "./tools/memoryTool.js";
import { withRateLimit } from "./rateLimiter.js";
import type {
  AgentResponse,
  AgentOptions,
  AppSource,
  KnowledgeBaseSource,
  GitHubSource,
  StreamHandlers,
  RetrievedDocument,
} from "./types.js";

function toKbSources(kbDocs: RetrievedDocument[]): KnowledgeBaseSource[] {
  return kbDocs.map((doc) => ({
    type: "knowledgeBase" as const,
    content: doc.content,
    metadata: doc.metadata,
    similarity: doc.similarity,
  }));
}

function recordToolsUsed(
  toolsUsed: string[],
  {
    kbSources = [],
    webSources = [],
    githubSources = [],
  }: {
    kbSources?: AppSource[];
    webSources?: AppSource[];
    githubSources?: AppSource[];
  },
): void {
  if (kbSources.length > 0) toolsUsed.push("knowledgeBaseSearch");
  if (webSources.length > 0) toolsUsed.push("web_search");
  if (githubSources.length > 0) toolsUsed.push("github_issues");
}

function buildPrompt(
  question: string,
  context: string,
  history: string,
): string {
  const parts: string[] = [];
  if (history) parts.push(history);
  if (context.trim()) parts.push(`Context:\n${context}`);
  parts.push(`Question: ${question}`);
  return parts.join("\n\n");
}

const EXPLICIT_WEB_INTENT = [
  /\b(search online|search the web|search web|web search|google it|look it up online)\b/i,
  /\b(find online|search internet|browse the web|look online)\b/i,
];

const WEB_SIGNALS = [
  /\b(latest|current|recent|newest|new|upcoming)\b/i,
  /\b(version|release|update|changelog|patch)\b/i,
  /\b(today|this week|this month|this year|right now|as of)\b/i,
  /\b(20(2[3-9]|[3-9]\d))\b/,
  /\b(news|trend|announcement|launched|just released)\b/i,
  /\b(who is|what is [a-z]+ js|what is [a-z]+ framework|what is [a-z]+ library)\b/i,
];

const KB_SIGNALS = [
  /\b(acme|pricing|plan|subscription|cancel|cancellation)\b/i,
  /\b(password|reset|account|login|sign[- ]in|sign[- ]up)\b/i,
  /\b(course|certificate|download|offline|mobile app)\b/i,
  /\b(billing|invoice|payment|refund|upgrade|downgrade)\b/i,
  /\b(pro plan|team plan|free plan|community plan)\b/i,
];

type RouteDecision = "kb" | "web" | "mixed" | "kb-then-web";

function classifyQuery(question: string): RouteDecision {
  if (EXPLICIT_WEB_INTENT.some((r) => r.test(question))) return "web";
  const hasKB = KB_SIGNALS.some((r) => r.test(question));
  const hasWeb = WEB_SIGNALS.some((r) => r.test(question));
  if (hasKB && hasWeb) return "mixed";
  if (hasKB) return "kb";
  if (hasWeb) return "web";
  return "kb-then-web";
}

async function classifyGitHubQuery(question: string): Promise<string | null> {
  if (!isGitHubConfigured()) return null;
  try {
    const { text } = await generateText({
      model: groq(ANSWERING_MODEL),
      prompt: `Does this user message describe a bug, error, or something not working?
If yes, reply with a short 2-4 word GitHub search query (just keywords, no punctuation).
If no, reply with just the word "no".

Message: "${question}"`,
    });
    const reply = text.trim().toLowerCase();
    return reply === "no" ? null : text.trim();
  } catch {
    return null;
  }
}

async function retrieve(
  question: string,
): Promise<{ sources: AppSource[]; toolsUsed: string[] }> {
  const sources: AppSource[] = [];
  const toolsUsed: string[] = [];
  const route = classifyQuery(question);
  console.log(`[Agent] Route decision: ${route}`);

  const githubSearchQuery = await classifyGitHubQuery(question);
  const githubPromise = githubSearchQuery
    ? searchGitHubIssues(githubSearchQuery)
    : Promise.resolve([] as GitHubSource[]);

  if (route === "web") {
    const [webSources, githubSources] = await Promise.all([
      searchWeb(question),
      githubPromise,
    ]);
    sources.push(...webSources, ...githubSources);
    recordToolsUsed(toolsUsed, { webSources, githubSources });
    return { sources, toolsUsed };
  }

  if (route === "mixed") {
    const [kbDocs, webSources, githubSources] = await Promise.all([
      searchKnowledgeBase(question),
      searchWeb(question),
      githubPromise,
    ]);
    const kbSources = toKbSources(kbDocs);
    sources.push(...kbSources, ...webSources, ...githubSources);
    recordToolsUsed(toolsUsed, { kbSources, webSources, githubSources });
    return { sources, toolsUsed };
  }

  const [kbDocs, githubSources] = await Promise.all([
    searchKnowledgeBase(question),
    githubPromise,
  ]);
  const kbSources = toKbSources(kbDocs);
  recordToolsUsed(toolsUsed, { kbSources, githubSources });

  if (route === "kb") {
    sources.push(...kbSources, ...githubSources);
    return { sources, toolsUsed };
  }

  // kb-then-web
  const bestKBScore = kbSources[0]?.similarity ?? 0;
  if (bestKBScore < KB_SUFFICIENCY_THRESHOLD) {
    console.log(
      `[Agent] KB score ${bestKBScore.toFixed(2)} < threshold — running web search.`,
    );
    const webSources = await searchWeb(question);
    sources.push(...kbSources, ...webSources, ...githubSources);
    recordToolsUsed(toolsUsed, { webSources });
  } else {
    console.log(
      `[Agent] KB score ${bestKBScore.toFixed(2)} sufficient — skipping web search.`,
    );
    sources.push(...kbSources, ...githubSources);
  }

  return { sources, toolsUsed };
}

function buildContext(sources: AppSource[]): string {
  return sources
    .map((s, i) => {
      if (s.type === "knowledgeBase") {
        return `[Source ${i + 1} - Knowledge Base]\n${s.content}`;
      }
      if (s.type === "github") {
        return `[Source ${i + 1} - GitHub Issue #${s.number} (${s.state})]\nTitle: ${s.title}\n${s.body}`;
      }
      return `[Source ${i + 1} - Web: ${s.title ?? s.url}]\n${s.snippet ?? ""}`;
    })
    .join("\n\n");
}

export async function webSearchRetrievalAgent(
  question: string,
  options: AgentOptions = {},
): Promise<AgentResponse> {
  const { sessionId, imageBase64 } = options;
  console.log(
    `[Agent] Question: ${question}${sessionId ? ` (session: ${sessionId})` : ""}`,
  );

  const history = sessionId ? getHistory(sessionId) : [];
  const summary = sessionId ? getSummary(sessionId) : '';
  const historyContext = formatHistoryAsContext(history, summary);

  try {
    const { sources, toolsUsed } = await retrieve(question);
    const context = buildContext(sources);
    const promptText = buildPrompt(question, context, historyContext);

    const userContent = imageBase64
      ? [{ type: 'text' as const, text: promptText }, { type: 'image' as const, image: imageBase64 }]
      : promptText;

    const { text } = await withRateLimit(() =>
      generateText({
        model: groq(imageBase64 ? VISION_MODEL : ANSWERING_MODEL),
        system: getAnswerPrompt(KNOWLEDGE_BASE_DESCRIPTION),
        messages: [
          ...FEW_SHOT_EXAMPLES,
          { role: 'user' as const, content: userContent },
        ],
      }),
    );

    const answer = text || "I couldn't generate a response.";

    if (sessionId) {
      await addTurn(sessionId, "user", question);
      await addTurn(sessionId, "assistant", answer);
    }

    return {
      answer,
      sources: sources.length > 0 ? sources : null,
      toolUsed: toolsUsed[0] ?? null,
      toolsUsed,
      sessionId,
      hasMemory: history.length > 0,
      hasSummary: sessionId ? !!getSummary(sessionId) : false,
    };
  } catch (err) {
    console.error("[Agent] Error:", err);
    return {
      answer:
        "I encountered an error while processing your request. Please try again later.",
      sources: null,
      toolUsed: null,
      toolsUsed: [],
      sessionId,
      hasMemory: false,
    };
  }
}

export async function streamWebSearchRetrievalAgent(
  question: string,
  handlers: StreamHandlers = {},
  options: AgentOptions = {},
): Promise<AgentResponse> {
  const { sessionId, imageBase64 } = options;
  console.log(
    `[Agent] Streaming question: ${question}${sessionId ? ` (session: ${sessionId})` : ""}`,
  );
  const { onTextDelta } = handlers;

  const history = sessionId ? getHistory(sessionId) : [];
  const summary = sessionId ? getSummary(sessionId) : '';
  const historyContext = formatHistoryAsContext(history, summary);

  const { sources, toolsUsed } = await retrieve(question);
  const context = buildContext(sources);
  const promptText = buildPrompt(question, context, historyContext);

  const userContent = imageBase64
    ? [{ type: 'text' as const, text: promptText }, { type: 'image' as const, image: imageBase64 }]
    : promptText;

  const result = await withRateLimit(() =>
    streamText({
      model: groq(imageBase64 ? VISION_MODEL : ANSWERING_MODEL),
      system: getAnswerPrompt(KNOWLEDGE_BASE_DESCRIPTION),
      messages: [
        ...FEW_SHOT_EXAMPLES,
        { role: 'user' as const, content: userContent },
      ],
      onChunk: async ({ chunk }) => {
        if (chunk.type === "text-delta") {
          await onTextDelta?.(chunk.text);
        }
      },
    }),
  );

  await result.consumeStream();
  const text = await result.text;
  const answer = text || "I couldn't generate a response.";

  if (sessionId) {
    await addTurn(sessionId, "user", question);
    await addTurn(sessionId, "assistant", answer);
  }

  return {
    answer,
    sources: sources.length > 0 ? sources : null,
    toolUsed: toolsUsed[0] ?? null,
    toolsUsed,
    sessionId,
    hasMemory: history.length > 0,
    hasSummary: sessionId ? !!getSummary(sessionId) : false,
  };
}
