export interface WebSource {
  type: 'web';
  title: string | undefined;
  url: string;
  snippet?: string;
}

export interface ArticleMetadata {
  category: string;
  topic: string;
}

export interface KnowledgeBaseSource {
  type: 'knowledgeBase';
  content: string;
  metadata: ArticleMetadata;
  similarity: number;
}

export interface Article {
  id: string;
  content: string;
  metadata: ArticleMetadata;
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

export type StatusTone = 'idle' | 'loading' | 'success' | 'error';

export interface SearchStatus {
  label: string;
  tone: StatusTone;
}

export interface ChatTurn {
  id: string;
  query: string;
  imageBase64?: string;
  answer: string;
  sources: AppSource[] | null;
  isStreaming: boolean;
  issueState: 'idle' | 'loading' | 'done';
  createdIssue: { url: string; number: number } | null;
}

export interface StreamEvent {
  type: 'start' | 'text-delta' | 'done' | 'error';
  delta?: string;
  answer?: string;
  sources?: AppSource[] | null;
  toolUsed?: string | null;
  toolsUsed?: string[];
  error?: string;
  sessionId?: string;
  hasMemory?: boolean;
  hasSummary?: boolean;
}
