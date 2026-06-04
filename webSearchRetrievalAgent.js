import { generateText, stepCountIs, streamText } from 'ai';
import {
  KNOWLEDGE_BASE_DESCRIPTION,
  ANSWERING_MODEL,
} from './constants.js';
import {
  getRetrievalWebSearchPrompt
} from './prompts.js';
import {openai} from "./config.js"
import { knowledgeBaseTool } from './tools/knowledgeBaseTool.js';

const TOOL_CALLING_MODEL = ANSWERING_MODEL; 
const MAX_TOOL_STEPS = 3; // Allow LLM to call tool then generate response

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
  let sources = null;
  let toolUsed = null;

  if (rawSources && rawSources.length > 0) {
    console.log('[ToolBased] Web search sources found.');
    sources = rawSources.map((source) => ({
      type: 'web',
      title: source.title,
      url: source.url,
      snippet: source.snippet,
    }));
    toolUsed = 'web_search_preview';
  }

  const kbToolCall = steps?.find((step) =>
    step.toolCalls?.some((toolCall) => toolCall.toolName === 'knowledgeBaseSearch')
  );

  if (kbToolCall) {
    console.log('[ToolBased] Knowledge base tool call detected in steps.');
    toolUsed = 'knowledgeBaseSearch';

    const kbToolResultStep = steps?.find((step) =>
      step.toolResults?.some(
        (toolResult) => toolResult.toolCallId === kbToolCall.toolCalls[0].toolCallId
      )
    );
    const kbResultData = kbToolResultStep?.toolResults[0]?.output;

    if (kbResultData?.retrievedDocuments) {
      console.log('[ToolBased] Extracted KB documents from tool result.');
      sources = kbResultData.retrievedDocuments.map((doc) => ({
        type: 'knowledgeBase',
        content: doc.content,
        metadata: doc.metadata,
        similarity: doc.similarity,
      }));
    } else if (kbResultData?.info) {
      console.log("[ToolBased] KB tool returned 'info':", kbResultData.info);
    } else if (kbResultData?.error) {
      console.warn('[ToolBased] KB tool returned an error:', kbResultData.error);
    }
  }

  if (!answer.trim() && toolUsed) {
    answer = `I used the ${
      toolUsed === 'web_search_preview' ? 'web search' : 'knowledge base'
    } tool but didn't generate a final summary. You can check the retrieved sources.`;
  }

  return {
    answer: answer || "I couldn't generate a response.",
    sources,
    toolUsed,
  };
}

export async function webSearchRetrievalAgent(question) {
  console.log(`[ToolBased] Received question: ${question}`);

  try {
    const result = await generateText(getAgentConfig(question));

    console.log('[ToolBased] generateText finished.');
    return extractAgentResponse(result);
  } catch (error) {
    console.error('[ToolBased] Error in RAG process:', error);
    const errorAnswer =
      'I encountered an error while processing your request using tool calling. Please try again later.';
    return { answer: errorAnswer, sources: null, toolUsed: null };
  }
}

export async function streamWebSearchRetrievalAgent(question, handlers = {}) {
  console.log(`[ToolBased] Streaming question: ${question}`);

  const { onTextDelta } = handlers;
  const result = streamText({
    ...getAgentConfig(question),
    onChunk: async ({ chunk }) => {
      if (chunk.type === 'text-delta') {
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
