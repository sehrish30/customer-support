import { useState } from 'react';
import type { AppSource, SearchStatus } from '../types.js';
import { SourceItem } from './SourceItem.js';

interface ResultsProps {
  answer: string;
  query: string;
  sources: AppSource[] | null;
  status: SearchStatus;
  hasMemory: boolean;
  onClear: () => void;
  onCreateIssue: (title: string, body: string) => Promise<{ url: string; number: number } | null>;
}

export function Results({
  answer,
  query,
  sources,
  status,
  hasMemory,
  onClear,
  onCreateIssue,
}: ResultsProps): React.JSX.Element {
  const hasAnswer = answer && answer.trim();
  const hasSources = Array.isArray(sources) && sources.length > 0;
  const hasContent = Boolean(hasAnswer) || hasSources;
  const [issueState, setIssueState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [createdIssue, setCreatedIssue] = useState<{ url: string; number: number } | null>(null);

  function handleClear(): void {
    setIssueState('idle');
    setCreatedIssue(null);
    onClear();
  }

  async function handleReportBug(): Promise<void> {
    if (!hasAnswer || issueState !== 'idle') return;
    setIssueState('loading');
    const title = query.slice(0, 72);
    const body = `**Customer query:**\n> ${query}\n\n**AI response:**\n${answer.slice(0, 500)}\n\n*Reported via SupportPilot AI.*`;
    const issue = await onCreateIssue(title, body);
    setCreatedIssue(issue);
    setIssueState('done');
  }

  return (
    <section className="card results" aria-live="polite">
      <div className="results-head">
        <div className="results-head-left">
          <h2>AI Insight</h2>
          {hasMemory && (
            <span className="pill pill--memory" title="This response is informed by your conversation history">
              Memory active
            </span>
          )}
        </div>
        <div className="results-head-right">
          {hasContent && (
            <button type="button" className="btn-clear" onClick={handleClear}>
              Clear
            </button>
          )}
          <span className="pill" data-tone={status.tone}>
            {status.label}
          </span>
        </div>
      </div>

      <p className={`answer${hasAnswer ? '' : ' muted'}`}>
        {hasAnswer ? answer : 'Your response will appear here.'}
      </p>

      {hasAnswer && status.tone === 'success' && (
        <div className="report-bug-row">
          {issueState === 'idle' && (
            <button type="button" className="btn-report-bug" onClick={handleReportBug}>
              Report bug on GitHub
            </button>
          )}
          {issueState === 'loading' && (
            <span className="muted">Filing issue...</span>
          )}
          {issueState === 'done' && createdIssue && (
            <a
              className="issue-created-link"
              href={createdIssue.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Issue #{createdIssue.number} created ↗
            </a>
          )}
          {issueState === 'done' && !createdIssue && (
            <span className="muted">GitHub not configured — add env vars to enable.</span>
          )}
        </div>
      )}

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
