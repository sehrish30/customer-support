export function SourceItem({ source }) {
  if (source.type === 'web') {
    return (
      <li className="source-item">
        <p className="source-type">Web</p>
        <p className="source-title">{source.title || 'Web Source'}</p>
        <p className="source-content">{source.snippet || 'No snippet provided.'}</p>
        <a href={source.url || '#'} target="_blank" rel="noopener noreferrer">
          Open Source
        </a>
      </li>
    );
  }

  return (
    <li className="source-item">
      <p className="source-type">Knowledge Base</p>
      <p className="source-content">{source.content || 'No content available.'}</p>
      <p className="source-meta">
        {typeof source.similarity === 'number'
          ? `Similarity: ${source.similarity.toFixed(4)}`
          : 'Similarity score unavailable'}
      </p>
    </li>
  );
}
