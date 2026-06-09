import { useState } from 'react';
import type { ChatTurn } from '../types.js';
import { SourceItem } from './SourceItem.js';

interface ChatMessageProps {
  turn: ChatTurn;
  onCreateIssue: (title: string, body: string) => Promise<{ url: string; number: number } | null>;
  onUpdateIssue: (id: string, state: ChatTurn['issueState'], issue: ChatTurn['createdIssue']) => void;
}

export function ChatMessage({ turn, onCreateIssue, onUpdateIssue }: ChatMessageProps): React.JSX.Element {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const hasSources = Array.isArray(turn.sources) && turn.sources.length > 0;

  async function handleReportBug(): Promise<void> {
    if (turn.issueState !== 'idle') return;
    onUpdateIssue(turn.id, 'loading', null);
    const title = turn.query.slice(0, 72);
    const body = `**Customer query:**\n> ${turn.query}\n\n**AI response:**\n${turn.answer.slice(0, 500)}\n\n*Reported via SupportPilot AI.*`;
    const issue = await onCreateIssue(title, body);
    onUpdateIssue(turn.id, 'done', issue);
  }

  return (
    <div className="chat-turn">
      {/* User bubble — right */}
      <div className="chat-row chat-row--user">
        <div className="chat-bubble chat-bubble--user">{turn.query}</div>
      </div>

      {/* AI bubble — left */}
      <div className="chat-row chat-row--ai">
        <div className="chat-avatar">AI</div>
        <div className="chat-bubble chat-bubble--ai">
          <p className="chat-answer">
            {turn.answer || (turn.isStreaming ? <span className="chat-typing">●●●</span> : '')}
          </p>

          {!turn.isStreaming && turn.answer && (
            <div className="chat-actions">
              {turn.issueState === 'idle' && (
                <button type="button" className="btn-report-bug" onClick={handleReportBug}>
                  Report bug on GitHub
                </button>
              )}
              {turn.issueState === 'loading' && <span className="muted">Filing issue…</span>}
              {turn.issueState === 'done' && turn.createdIssue && (
                <a className="issue-created-link" href={turn.createdIssue.url} target="_blank" rel="noopener noreferrer">
                  Issue #{turn.createdIssue.number} created ↗
                </a>
              )}
              {turn.issueState === 'done' && !turn.createdIssue && (
                <span className="muted">GitHub not configured.</span>
              )}
            </div>
          )}

          {hasSources && (
            <div className="chat-sources">
              <button
                type="button"
                className="btn-sources-toggle"
                onClick={() => setSourcesOpen(o => !o)}
              >
                {sourcesOpen ? 'Hide sources' : `Show ${turn.sources!.length} source${turn.sources!.length !== 1 ? 's' : ''}`}
              </button>
              {sourcesOpen && (
                <ul className="sources-list">
                  {turn.sources!.map((source, i) => <SourceItem key={i} source={source} />)}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
