import { google } from './config.js';

export const SIMILARITY_MATCH_COUNT = 3 as const;
export const ANSWERING_MODEL = 'gemini-2.0-flash' as const;
export const EMBEDDING_MODEL_NAME = 'text-embedding-004' as const;
export const CLASSIFICATION_MODEL = 'gemini-2.0-flash' as const;
export const aiModel = google(ANSWERING_MODEL);
export const KNOWLEDGE_BASE_DESCRIPTION =
  'Acme Learning Hub, an online learning and developer community platform' as const;
