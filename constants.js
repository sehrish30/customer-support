import {google} from "./config.js"

export const SIMILARITY_MATCH_COUNT = 3
export const ANSWERING_MODEL = "gemini-2.0-flash"
export const EMBEDDING_MODEL_NAME = 'text-embedding-004';
export const CLASSIFICATION_MODEL = 'gemini-2.0-flash';
export const aiModel = google(ANSWERING_MODEL)
export const KNOWLEDGE_BASE_DESCRIPTION =
  'Acme Learning Hub, an online learning and developer community platform';