import { groq } from './config.js';

export const SIMILARITY_MATCH_COUNT = 3 as const;
export const ANSWERING_MODEL = 'llama-3.3-70b-versatile' as const;
export const EMBEDDING_MODEL_NAME = 'gemini-embedding-001' as const;
export const EMBEDDING_DIMENSIONS = 1536 as const;
export const CLASSIFICATION_MODEL = 'llama-3.3-70b-versatile' as const;
export const aiModel = groq(ANSWERING_MODEL);
export const KNOWLEDGE_BASE_DESCRIPTION =
  'Acme Learning Hub, an online learning and developer community platform' as const;
export const WEB_SEARCH_MAX_RESULTS = 3 as const;
// If the best KB similarity score is below this, also run web search
export const KB_SUFFICIENCY_THRESHOLD = 0.45 as const;
