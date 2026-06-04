import { tool, embed } from 'ai';
import { z } from 'zod';
import { google, supabase } from '../config.js';
import { SIMILARITY_MATCH_COUNT, EMBEDDING_MODEL_NAME } from '../constants.js';
import type { KnowledgeBaseToolOutput, RetrievedDocument } from '../types.js';

export const knowledgeBaseTool = tool({
  description: `Retrieve specific information from the internal support knowledge base to answer user questions.`,
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        'The specific query or question to search for in the internal support knowledge base.',
      ),
  }),
  execute: async ({ query }): Promise<KnowledgeBaseToolOutput> => {
    console.log(`[Tool:KB] Received query: ${query}`);
    try {
      const { embedding } = await embed({
        model: google.embeddingModel(EMBEDDING_MODEL_NAME),
        value: query,
      });
      console.log('[Tool:KB] Generated query embedding.');

      const { data: documents, error: matchError } = await supabase.rpc('match_documents', {
        query_embedding: embedding,
        match_count: SIMILARITY_MATCH_COUNT,
      });

      if (matchError) {
        console.error('[Tool:KB] Error matching documents:', matchError);
        return { error: `Database query failed: ${matchError.message}` };
      }

      if (!documents || documents.length === 0) {
        console.log('[Tool:KB] No relevant documents found.');
        return { info: 'No relevant information found in the knowledge base for that query.' };
      }

      console.log(`[Tool:KB] Retrieved ${documents.length} document chunks.`);
      return { retrievedDocuments: documents as RetrievedDocument[] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Tool:KB] Error during execution:', err);
      return { error: `Failed to execute knowledge base retrieval: ${message}` };
    }
  },
});
