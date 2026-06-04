export interface RetrievedDocument {
  content: string;
  metadata: Record<string, string | number | boolean | null>;
  similarity: number;
}

export type KnowledgeBaseToolOutput =
  | { retrievedDocuments: RetrievedDocument[] }
  | { info: string }
  | { error: string };

export interface WebSource {
  type: 'web';
  title: string | undefined;
  url: string;
  snippet?: string;
}

export interface KnowledgeBaseSource {
  type: 'knowledgeBase';
  content: string;
  metadata: Record<string, string | number | boolean | null>;
  similarity: number;
}

export type AppSource = WebSource | KnowledgeBaseSource;

export interface AgentResponse {
  answer: string;
  sources: AppSource[] | null;
  toolUsed: string | null;
  toolsUsed: string[];
}

export interface StreamHandlers {
  onTextDelta?: (delta: string) => Promise<void> | void;
}

export interface StreamEvent {
  type: 'start' | 'text-delta' | 'done' | 'error';
  delta?: string;
  answer?: string;
  sources?: AppSource[] | null;
  toolUsed?: string | null;
  toolsUsed?: string[];
  error?: string;
}
