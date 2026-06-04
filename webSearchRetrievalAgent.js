import { generateText, stepCountIs, streamText } from "ai";
import { KNOWLEDGE_BASE_DESCRIPTION, ANSWERING_MODEL } from "./constants.js";
import { getRetrievalWebSearchPrompt } from "./prompts.js";
import { openai } from "./config.js";
import { knowledgeBaseTool } from "./tools/knowledgeBaseTool.js";

const TOOL_CALLING_MODEL = ANSWERING_MODEL;
const MAX_TOOL_STEPS = 3; // Allow LLM to call tool then generate response

const PROVIDER_SOURCE_TOOL_NAME = "web_search_preview";

const TOOL_REGISTRY = {
  knowledgeBaseSearch: {
    label: "knowledge base",
    extractSources: (output) => {
      if (output?.retrievedDocuments) {
        console.log("[ToolBased] Extracted KB documents from tool result.");
        return output.retrievedDocuments.map((doc) => ({
          type: "knowledgeBase",
          content: doc.content,
          metadata: doc.metadata,
          similarity: doc.similarity,
        }));
      }

      if (output?.info) {
        console.log("[ToolBased] KB tool returned 'info':", output.info);
      } else if (output?.error) {
        console.warn("[ToolBased] KB tool returned an error:", output.error);
      }

      return [];
    },
  },
};

function getAgentConfig(question) {
  return {
    model: openai(TOOL_CALLING_MODEL),
    system: getRetrievalWebSearchPrompt(KNOWLEDGE_BASE_DESCRIPTION),
    prompt: question,
    tools: {
      knowledgeBaseSearch: knowledgeBaseTool,
    },
    stopWhen: stepCountIs(MAX_TOOL_STEPS),
  };
}

function extractAgentResponse({ text, sources: rawSources, steps }) {
  let answer = text;
  const collectedSources = [];
  const toolsUsedSet = new Set();

  if (rawSources && rawSources.length > 0) {
    console.log("[ToolBased] Web search sources found.");
    collectedSources.push(
      ...rawSources.map((source) => ({
        type: "web",
        title: source.title,
        url: source.url,
        snippet: source.snippet,
      })),
    );
    toolsUsedSet.add(PROVIDER_SOURCE_TOOL_NAME);
  }

  const toolResultByCallId = new Map();
  for (const step of steps || []) {
    for (const toolResult of step.toolResults || []) {
      toolResultByCallId.set(toolResult.toolCallId, toolResult);
    }
  }

  for (const step of steps || []) {
    for (const toolCall of step.toolCalls || []) {
      const toolName = toolCall.toolName;
      toolsUsedSet.add(toolName);

      const registryEntry = TOOL_REGISTRY[toolName];
      if (!registryEntry) {
        console.log(
          `[ToolBased] No registry entry configured for tool: ${toolName}`,
        );
        continue;
      }

      const toolResult = toolResultByCallId.get(toolCall.toolCallId);
      const extractedSources = registryEntry.extractSources(toolResult?.output);
      if (extractedSources.length > 0) {
        collectedSources.push(...extractedSources);
      }
    }
  }

  const toolsUsed = Array.from(toolsUsedSet);
  const toolUsed = toolsUsed[0] || null;
  const sources = collectedSources.length > 0 ? collectedSources : null;
  const toolLabel =
    TOOL_REGISTRY[toolUsed]?.label ||
    (toolUsed === PROVIDER_SOURCE_TOOL_NAME ? "web search" : toolUsed);

  if (!answer.trim() && toolUsed) {
    answer = `I used the ${toolLabel} tool but didn't generate a final summary. You can check the retrieved sources.`;
  }

  return {
    answer: answer || "I couldn't generate a response.",
    sources,
    toolUsed,
    toolsUsed,
  };
}

export async function webSearchRetrievalAgent(question) {
  console.log(`[ToolBased] Received question: ${question}`);

  try {
    const result = await generateText(getAgentConfig(question));

    console.log("[ToolBased] generateText finished.");
    return extractAgentResponse(result);
  } catch (error) {
    console.error("[ToolBased] Error in RAG process:", error);
    const errorAnswer =
      "I encountered an error while processing your request using tool calling. Please try again later.";
    return {
      answer: errorAnswer,
      sources: null,
      toolUsed: null,
      toolsUsed: [],
    };
  }
}

export async function streamWebSearchRetrievalAgent(question, handlers = {}) {
  console.log(`[ToolBased] Streaming question: ${question}`);

  const { onTextDelta } = handlers;
  const result = streamText({
    ...getAgentConfig(question),
    onChunk: async ({ chunk }) => {
      if (chunk.type === "text-delta") {
        await onTextDelta?.(chunk.textDelta);
      }
    },
  });

  await result.consumeStream();

  const [text, sources, steps] = await Promise.all([
    result.text,
    result.sources,
    result.steps,
  ]);

  return extractAgentResponse({ text, sources, steps });
}
