import { useState } from 'react';
import type { ChatTurn } from '../types.js';
import { SourceItem } from './SourceItem.js';

interface PriorIssue {
  url: string;
  number: number;
  query: string;
}

interface ChatMessageProps {
  turn: ChatTurn;
  priorIssues: PriorIssue[];
  onCreateIssue: (title: string, body: string) => Promise<{ url: string; number: number } | null>;
  onUpdateIssue: (id: string, state: ChatTurn['issueState'], issue: ChatTurn['createdIssue']) => void;
  onReportToAgent: (query: string, answer: string, customerEmail: string) => Promise<boolean>;
}

export function ChatMessage({ turn, priorIssues, onCreateIssue, onUpdateIssue, onReportToAgent }: ChatMessageProps): React.JSX.Element {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [forceCreate, setForceCreate] = useState(false);
  const [emailState, setEmailState] = useState<'idle' | 'form' | 'loading' | 'sent' | 'error'>('idle');
  const [customerEmail, setCustomerEmail] = useState('');
  const hasSources = Array.isArray(turn.sources) && turn.sources.length > 0;

  const githubSources = turn.sources?.filter(s => s.type === 'github') ?? [];
  const hasRelatedIssues = githubSources.length > 0;
  const hasPriorIssue = priorIssues.length > 0;

  async function handleSubmitEmail(e: { preventDefault: () => void }): Promise<void> {
    e.preventDefault();
    if (!customerEmail.trim()) return;
    setEmailState('loading');
    const ok = await onReportToAgent(turn.query, turn.answer, customerEmail.trim());
    setEmailState(ok ? 'sent' : 'error');
  }

  async function handleReportBug(): Promise<void> {
    if (turn.issueState !== 'idle') return;
    onUpdateIssue(turn.id, 'loading', null);
    const title = turn.query.slice(0, 72);
    const body = `**Customer query:**\n> ${turn.query}\n\n**AI response:**\n${turn.answer.slice(0, 500)}\n\n*Reported via SupportPilot AI.*`;
    const issue = await onCreateIssue(title, body);
    onUpdateIssue(turn.id, 'done', issue);
  }

  function renderIssueActions(): React.JSX.Element | null {
    if (turn.issueState === 'loading') return <span className="muted">Filing issue…</span>;
    if (turn.issueState === 'done' && turn.createdIssue) {
      return (
        <a className="issue-created-link" href={turn.createdIssue.url} target="_blank" rel="noopener noreferrer">
          Issue #{turn.createdIssue.number} created ↗
        </a>
      );
    }
    if (turn.issueState === 'done' && !turn.createdIssue) {
      return <span className="muted">GitHub not configured.</span>;
    }

    // Layer 1: existing GitHub issues already found in sources
    if (hasRelatedIssues) {
      return (
        <div className="issue-guard">
          <span className="issue-guard-label">Related issue{githubSources.length > 1 ? 's' : ''} found:</span>
          {githubSources.map((s, i) => (
            <a key={i} className="issue-created-link" href={s.url} target="_blank" rel="noopener noreferrer">
              #{s.number} — {s.title} ↗
            </a>
          ))}
        </div>
      );
    }

    // Layer 2: a prior turn in this session already filed an issue
    if (hasPriorIssue && !forceCreate) {
      const prior = priorIssues[0]!;
      return (
        <div className="issue-guard">
          <span className="issue-guard-label">
            Issue{' '}
            <a className="issue-created-link" href={prior.url} target="_blank" rel="noopener noreferrer">
              #{prior.number}
            </a>
            {' '}already filed this session
          </span>
          <button type="button" className="btn-file-anyway" onClick={() => setForceCreate(true)}>
            File separately anyway
          </button>
        </div>
      );
    }

    // Default: show report bug button
    return (
      <button type="button" className="btn-report-bug" onClick={handleReportBug}>
        Report bug on GitHub
      </button>
    );
  }

  return (
    <div className="chat-turn">
      <div className="chat-row chat-row--user">
        <div className="chat-bubble chat-bubble--user">
          {turn.imageBase64 && (
            <img src={turn.imageBase64} className="chat-bubble-image" alt="attached" />
          )}
          {turn.query}
        </div>
      </div>

      <div className="chat-row chat-row--ai">
        <div className="chat-avatar">AI</div>
        <div className="chat-bubble chat-bubble--ai">
          <p className="chat-answer">
            {turn.answer || (turn.isStreaming ? <span className="chat-typing">●●●</span> : '')}
          </p>

          {!turn.isStreaming && turn.answer && (
            <div className="chat-actions">
              {renderIssueActions()}
              <div className="email-action">
                {emailState === 'idle' && (
                  <button type="button" className="btn-report-agent" onClick={() => setEmailState('form')}>
                    Talk to agent
                  </button>
                )}
                {emailState === 'form' && (
                  <form className="agent-email-form" onSubmit={handleSubmitEmail}>
                    <p className="agent-email-label">Enter your email and an agent will follow up with you:</p>
                    <div className="agent-email-row">
                      <input
                        type="email"
                        className="agent-email-input"
                        placeholder="your@email.com"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        required
                        autoFocus
                      />
                      <button type="submit" className="btn-report-agent">Send</button>
                      <button type="button" className="btn-cancel-email" onClick={() => setEmailState('idle')}>Cancel</button>
                    </div>
                  </form>
                )}
                {emailState === 'loading' && <span className="muted">Sending…</span>}
                {emailState === 'sent' && <span className="email-sent">Agent notified — expect a reply at {customerEmail} ✓</span>}
                {emailState === 'error' && <span className="email-error">Failed to send — check email config</span>}
              </div>
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
