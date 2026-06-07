import { generateText, streamText } from "ai";
import {
  KNOWLEDGE_BASE_DESCRIPTION,
  ANSWERING_MODEL,
  KB_SUFFICIENCY_THRESHOLD,
} from "./constants.js";
import { getAnswerPrompt } from "./prompts.js";
import { groq } from "./config.js";
import { searchKnowledgeBase } from "./tools/knowledgeBaseTool.js";
import { searchWeb } from "./tools/webSearchTool.js";
import { withRateLimit } from "./rateLimiter.js";
import type {
  AgentResponse,
  AppSource,
  KnowledgeBaseSource,
  StreamHandlers,
} from "./types.js";

function buildPrompt(question: string, context: string): string {
  return context.trim()
    ? `Context:\n${context}\n\nQuestion: ${question}`
    : question;
}

// Explicit user intent — always force web search regardless of other signals
const EXPLICIT_WEB_INTENT = [
  /\b(search online|search the web|search web|web search|google it|look it up online)\b/i,
  /\b(find online|search internet|browse the web|look online)\b/i,
];

const WEB_SIGNALS = [
  /\b(latest|current|recent|newest|new|upcoming)\b/i,
  /\b(version|release|update|changelog|patch)\b/i,
  /\b(today|this week|this month|this year|right now|as of)\b/i,
  /\b(20(2[3-9]|[3-9]\d))\b/, // years 2023+
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

async function retrieve(
  question: string,
): Promise<{ sources: AppSource[]; toolsUsed: string[] }> {
  const sources: AppSource[] = [];
  const toolsUsed: string[] = [];
  const route = classifyQuery(question);
  console.log(`[Agent] Route decision: ${route}`);

  if (route === "web") {
    const webSources = await searchWeb(question);
    sources.push(...webSources);
    if (webSources.length > 0) toolsUsed.push("web_search");
    return { sources, toolsUsed };
  }

  if (route === "mixed") {
    const [kbDocs, webSources] = await Promise.all([
      searchKnowledgeBase(question),
      searchWeb(question),
    ]);
    const kbSources: KnowledgeBaseSource[] = kbDocs.map((doc) => ({
      type: "knowledgeBase" as const,
      content: doc.content,
      metadata: doc.metadata,
      similarity: doc.similarity,
    }));
    sources.push(...kbSources, ...webSources);
    if (kbSources.length > 0) toolsUsed.push("knowledgeBaseSearch");
    if (webSources.length > 0) toolsUsed.push("web_search");
    return { sources, toolsUsed };
  }

  // kb or kb-then-web: run KB search
  const kbDocs = await searchKnowledgeBase(question);
  const kbSources: KnowledgeBaseSource[] = kbDocs.map((doc) => ({
    type: "knowledgeBase" as const,
    content: doc.content,
    metadata: doc.metadata,
    similarity: doc.similarity,
  }));
  sources.push(...kbSources);
  if (kbSources.length > 0) toolsUsed.push("knowledgeBaseSearch");

  if (route === "kb") return { sources, toolsUsed };

  // kb-then-web: fall back to web if KB score is insufficient
  const bestKBScore = kbSources[0]?.similarity ?? 0;
  if (bestKBScore < KB_SUFFICIENCY_THRESHOLD) {
    console.log(
      `[Agent] KB score ${bestKBScore.toFixed(2)} < threshold — running web search.`,
    );
    const webSources = await searchWeb(question);
    sources.push(...webSources);
    if (webSources.length > 0) toolsUsed.push("web_search");
  } else {
    console.log(
      `[Agent] KB score ${bestKBScore.toFixed(2)} sufficient — skipping web search.`,
    );
  }

  return { sources, toolsUsed };
}

function buildContext(sources: AppSource[]): string {
  return sources
    .map((s, i) => {
      if (s.type === "knowledgeBase") {
        return `[Source ${i + 1} - Knowledge Base]\n${s.content}`;
      }
      return `[Source ${i + 1} - Web: ${s.title ?? s.url}]\n${s.snippet ?? ""}`;
    })
    .join("\n\n");
}

export async function webSearchRetrievalAgent(
  question: string,
): Promise<AgentResponse> {
  console.log(`[Agent] Question: ${question}`);
  try {
    const { sources, toolsUsed } = await retrieve(question);
    const context = buildContext(sources);

    const { text } = await withRateLimit(() =>
      generateText({
        model: groq(ANSWERING_MODEL),
        system: getAnswerPrompt(KNOWLEDGE_BASE_DESCRIPTION),
        prompt: buildPrompt(question, context),
      }),
    );

    return {
      answer: text || "I couldn't generate a response.",
      sources: sources.length > 0 ? sources : null,
      toolUsed: toolsUsed[0] ?? null,
      toolsUsed,
    };
  } catch (err) {
    console.error("[Agent] Error:", err);
    return {
      answer:
        "I encountered an error while processing your request. Please try again later.",
      sources: null,
      toolUsed: null,
      toolsUsed: [],
    };
  }
}

export async function streamWebSearchRetrievalAgent(
  question: string,
  handlers: StreamHandlers = {},
): Promise<AgentResponse> {
  console.log(`[Agent] Streaming question: ${question}`);
  const { onTextDelta } = handlers;

  const { sources, toolsUsed } = await retrieve(question);
  const context = buildContext(sources);

  const result = await withRateLimit(() =>
    streamText({
      model: groq(ANSWERING_MODEL),
      system: getAnswerPrompt(KNOWLEDGE_BASE_DESCRIPTION),
      prompt: buildPrompt(question, context),
      onChunk: async ({ chunk }) => {
        if (chunk.type === "text-delta") {
          await onTextDelta?.(chunk.text);
        }
      },
    }),
  );

  await result.consumeStream();
  const text = await result.text;

  return {
    answer: text || "I couldn't generate a response.",
    sources: sources.length > 0 ? sources : null,
    toolUsed: toolsUsed[0] ?? null,
    toolsUsed,
  };
}
