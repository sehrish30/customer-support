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
  const pct = source.similarity * 100;
  const tone = pct >= 70 ? 'high' : pct >= 45 ? 'mid' : 'low';

  return (
    <li className="source-item">
      <p className="source-type">Knowledge Base</p>
      <p className="source-content">{source.content || 'No content available.'}</p>
      <div className="similarity-row">
        <span className="similarity-label">Similarity</span>
        <div className="similarity-bar-track">
          <div className="similarity-bar-fill" data-tone={tone} style={{ width: `${pct.toFixed(1)}%` }} />
        </div>
        <span className="similarity-pct" data-tone={tone}>{pct.toFixed(1)}%</span>
      </div>
      <a href={articleUrl} target="_blank" rel="noopener noreferrer">
        View Article ↗
      </a>
    </li>
  );
}
