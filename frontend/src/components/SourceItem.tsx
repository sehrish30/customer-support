import type { AppSource } from '../types.js';

interface SourceItemProps {
  source: AppSource;
}

export function SourceItem({ source }: SourceItemProps): React.JSX.Element {
  if (source.type === 'web') {
    return (
      <li className="source-item">
        <p className="source-type">Web</p>
        <p className="source-title">{source.title ?? 'Web Source'}</p>
        <p className="source-content">{source.snippet ?? 'No snippet provided.'}</p>
        <a href={source.url} target="_blank" rel="noopener noreferrer">
          Open Source ↗
        </a>
      </li>
    );
  }

  const articleUrl = `/article/${encodeURIComponent(source.metadata.topic)}`;

  return (
    <li className="source-item">
      <p className="source-type">Knowledge Base</p>
      <p className="source-content">{source.content || 'No content available.'}</p>
      <p className="source-meta">{`Similarity: ${(source.similarity * 100).toFixed(1)}%`}</p>
      <a href={articleUrl} target="_blank" rel="noopener noreferrer">
        View Article ↗
      </a>
    </li>
  );
}
