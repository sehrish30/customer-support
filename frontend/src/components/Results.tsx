import type { AppSource, SearchStatus } from '../types.js';
import { SourceItem } from './SourceItem.js';

interface ResultsProps {
  answer: string;
  sources: AppSource[] | null;
  status: SearchStatus;
}

export function Results({ answer, sources, status }: ResultsProps): React.JSX.Element {
  const hasAnswer = answer && answer.trim();
  const hasSources = Array.isArray(sources) && sources.length > 0;

  return (
    <section className="card results" aria-live="polite">
      <div className="results-head">
        <h2>Answer</h2>
        <span className="pill" data-tone={status.tone}>
          {status.label}
        </span>
      </div>

      <p className={`answer${hasAnswer ? '' : ' muted'}`}>
        {hasAnswer ? answer : 'Your response will appear here.'}
      </p>

      <h3>Sources</h3>
      <ul className="sources-list">
        {hasSources ? (
          sources.map((source, i) => <SourceItem key={i} source={source} />)
        ) : (
          <li className="muted">No sources yet.</li>
        )}
      </ul>
    </section>
  );
}
