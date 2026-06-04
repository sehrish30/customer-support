import { tool } from 'ai';
import { z } from 'zod';
import { embed } from 'ai';
import {google, supabase} from "../config.js"
import {
  SIMILARITY_MATCH_COUNT,
  EMBEDDING_MODEL_NAME,
} from '../constants.js';


export const knowledgeBaseTool = tool({
  description: `Retrieve specific information from the internal support knowledge base to answer user questions.`,
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'The specific query or question to search for in the internal support knowledge base.'
      ),
  }),
  execute: async ({ query }) => {
    console.log(`[Tool:KB] Received query: ${query}`);
    try {
      // 1. Embed the query
      const { embedding } = await embed({
        model: google.textEmbeddingModel(EMBEDDING_MODEL_NAME),
        value: query,
      });
      console.log('[Tool:KB] Generated query embedding.');

      // 2. Query Supabase
      const { data: documents, error: matchError } = await supabase.rpc(
        'match_documents',
        {
          query_embedding: embedding,
          match_count: SIMILARITY_MATCH_COUNT,
        }
      );

      if (matchError) {
        console.error('[Tool:KB] Error matching documents:', matchError);
        // Return an error message that the LLM can understand
        return { error: `Database query failed: ${matchError.message}` };
      }

      if (!documents || documents.length === 0) {
        console.log('[Tool:KB] No relevant documents found.');
        return {
          info: 'No relevant information found in the knowledge base for that query.',
        };
      }

      console.log(`[Tool:KB] Retrieved ${documents.length} document chunks.`);
      // Return the retrieved documents structured for the LLM and potentially the frontend
      // We include content, metadata, and similarity
      return { retrievedDocuments: documents };
    } catch (error) {
      console.error('[Tool:KB] Error during execution:', error);
      return {
        error: `Failed to execute knowledge base retrieval: ${error.message}`,
      };
    }
  },
});
