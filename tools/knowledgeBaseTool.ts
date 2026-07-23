import { embed } from 'ai';
import { google, supabase } from '../config.js';
import { SIMILARITY_MATCH_COUNT, EMBEDDING_MODEL_NAME, EMBEDDING_DIMENSIONS } from '../constants.js';
import { traceable } from 'langsmith/traceable';
import type { RetrievedDocument } from '../types.js';

async function _searchKnowledgeBase(query: string): Promise<RetrievedDocument[]> {
  console.log(`[KB] Query: ${query}`);
  try {
    const { embedding } = await embed({
      model: google.embeddingModel(EMBEDDING_MODEL_NAME),
      value: query,
      providerOptions: { google: { outputDimensionality: EMBEDDING_DIMENSIONS } },
    });
    console.log('[KB] Generated query embedding.');

    const { data: documents, error: matchError } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_count: SIMILARITY_MATCH_COUNT,
    });

    if (matchError) {
      console.error('[KB] Error matching documents:', matchError);
      return [];
    }

    if (!documents || documents.length === 0) {
      console.log('[KB] No relevant documents found.');
      return [];
    }

    console.log(`[KB] Retrieved ${documents.length} document chunks.`);
    return documents as RetrievedDocument[];
  } catch (err) {
    console.error('[KB] Error during execution:', err);
    return [];
  }
}

export const searchKnowledgeBase = traceable(
  _searchKnowledgeBase,
  { name: "searchKnowledgeBase", run_type: "retriever" },
);
