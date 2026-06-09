export interface ArticleMetadata {
  category: string;
  topic: string;
}

export interface RetrievedDocument {
  content: string;
  metadata: ArticleMetadata;
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
  metadata: ArticleMetadata;
  similarity: number;
}


export interface GitHubSource {
  type: 'github';
  number: number;
  title: string;
  url: string;
  state: 'open' | 'closed';
  body: string;
}

export type AppSource = WebSource | KnowledgeBaseSource | GitHubSource;

export interface AgentResponse {
  answer: string;
  sources: AppSource[] | null;
  toolUsed: string | null;
  toolsUsed: string[];
  sessionId?: string | undefined;
  hasMemory?: boolean | undefined;
}

export interface AgentOptions {
  sessionId?: string | undefined;
}

export interface StreamHandlers {
  onTextDelta?: (delta: string) => Promise<void> | void;
}

export interface StreamEvent {
  type: 'start' | 'text-delta' | 'done' | 'error';
  delta?: string | undefined;
  answer?: string | undefined;
  sources?: AppSource[] | null | undefined;
  toolUsed?: string | null | undefined;
  toolsUsed?: string[] | undefined;
  error?: string | undefined;
  sessionId?: string | undefined;
  hasMemory?: boolean | undefined;
}
