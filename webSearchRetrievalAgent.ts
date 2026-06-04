import { generateText, streamText, stepCountIs } from 'ai';
import type { StepResult, ToolSet } from 'ai';
import type { LanguageModelV3Source } from '@ai-sdk/provider';
import { KNOWLEDGE_BASE_DESCRIPTION, ANSWERING_MODEL } from './constants.js';
import { getRetrievalWebSearchPrompt } from './prompts.js';
import { groq } from './config.js';
import { knowledgeBaseTool } from './tools/knowledgeBaseTool.js';
import { withRateLimit } from './rateLimiter.js';
import type {
  AgentResponse,
  AppSource,
  KnowledgeBaseSource,
  KnowledgeBaseToolOutput,
  StreamHandlers,
  WebSource,
} from './types.js';

const TOOL_CALLING_MODEL = ANSWERING_MODEL;
const MAX_TOOL_STEPS = 2;
const PROVIDER_SOURCE_TOOL_NAME = 'web_search_preview';

type KBTools = { knowledgeBaseSearch: typeof knowledgeBaseTool };

interface KBToolRegistryEntry {
  label: string;
  extractSources: (output: KnowledgeBaseToolOutput | undefined) => KnowledgeBaseSource[];
}

const TOOL_REGISTRY: Record<keyof KBTools, KBToolRegistryEntry> = {
  knowledgeBaseSearch: {
    label: 'knowledge base',
    extractSources: (output) => {
      if (!output) return [];

      if ('retrievedDocuments' in output) {
        console.log('[ToolBased] Extracted KB documents from tool result.');
        return output.retrievedDocuments.map((doc) => ({
          type: 'knowledgeBase' as const,
          content: doc.content,
          metadata: doc.metadata,
          similarity: doc.similarity,
        }));
      }

      if ('info' in output) {
        console.log('[ToolBased] KB tool returned info:', output.info);
      } else if ('error' in output) {
        console.warn('[ToolBased] KB tool returned an error:', output.error);
      }

      return [];
    },
  },
};

function getAgentConfig(question: string) {
  return {
    model: groq(TOOL_CALLING_MODEL),
    system: getRetrievalWebSearchPrompt(KNOWLEDGE_BASE_DESCRIPTION),
    prompt: question,
    tools: { knowledgeBaseSearch: knowledgeBaseTool } satisfies KBTools & ToolSet,
    stopWhen: stepCountIs(MAX_TOOL_STEPS),
  };
}

interface AgentRawResult {
  text: string;
  sources: readonly LanguageModelV3Source[];
  steps: readonly StepResult<KBTools>[];
}

function extractAgentResponse({ text, sources: rawSources, steps }: AgentRawResult): AgentResponse {
  let answer = text;
  const collectedSources: AppSource[] = [];
  const toolsUsedSet = new Set<string>();

  if (rawSources.length > 0) {
    console.log('[ToolBased] Web search sources found.');
    const webSources: WebSource[] = rawSources
      .filter((s): s is Extract<LanguageModelV3Source, { sourceType: 'url' }> => s.sourceType === 'url')
      .map((s) => ({ type: 'web' as const, title: s.title, url: s.url }));
    collectedSources.push(...webSources);
    toolsUsedSet.add(PROVIDER_SOURCE_TOOL_NAME);
  }

  const toolResultByCallId = new Map<string, StepResult<KBTools>['toolResults'][number]>();
  for (const step of steps) {
    for (const toolResult of step.toolResults) {
      toolResultByCallId.set(toolResult.toolCallId, toolResult);
    }
  }

  for (const step of steps) {
    for (const toolCall of step.toolCalls) {
      const { toolName } = toolCall;
      toolsUsedSet.add(toolName);

      if (!(toolName in TOOL_REGISTRY)) {
        console.log(`[ToolBased] No registry entry configured for tool: ${toolName}`);
        continue;
      }

      const registryEntry = TOOL_REGISTRY[toolName as keyof KBTools];
      const toolResult = toolResultByCallId.get(toolCall.toolCallId);

      const output =
        toolResult && !toolResult.dynamic
          ? (toolResult.output as KnowledgeBaseToolOutput)
          : undefined;

      const extractedSources = registryEntry.extractSources(output);
      if (extractedSources.length > 0) {
        collectedSources.push(...extractedSources);
      }
    }
  }

  const toolsUsed = Array.from(toolsUsedSet);
  const toolUsed = toolsUsed[0] ?? null;
  const sources = collectedSources.length > 0 ? collectedSources : null;
  const toolLabel =
    toolUsed !== null
      ? (TOOL_REGISTRY[toolUsed as keyof KBTools]?.label ??
        (toolUsed === PROVIDER_SOURCE_TOOL_NAME ? 'web search' : toolUsed))
      : null;

  if (!answer.trim() && toolUsed !== null && toolLabel !== null) {
    answer = `I used the ${toolLabel} tool but didn't generate a final summary. You can check the retrieved sources.`;
  }

  return {
    answer: answer || "I couldn't generate a response.",
    sources,
    toolUsed,
    toolsUsed,
  };
}

export async function webSearchRetrievalAgent(question: string): Promise<AgentResponse> {
  console.log(`[ToolBased] Received question: ${question}`);

  try {
    const result = await withRateLimit(() => generateText(getAgentConfig(question)));
    console.log('[ToolBased] generateText finished.');
    return extractAgentResponse(result);
  } catch (err) {
    console.error('[ToolBased] Error in RAG process:', err);
    return {
      answer:
        'I encountered an error while processing your request using tool calling. Please try again later.',
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
  console.log(`[ToolBased] Streaming question: ${question}`);

  const { onTextDelta } = handlers;

  const result = await withRateLimit(() =>
    streamText({
      ...getAgentConfig(question),
      onChunk: async ({ chunk }) => {
        if (chunk.type === 'text-delta') {
          await onTextDelta?.(chunk.text);
        }
      },
    }),
  );

  await result.consumeStream();

  const [text, sources, steps] = await Promise.all([result.text, result.sources, result.steps]);

  return extractAgentResponse({ text, sources, steps });
}
