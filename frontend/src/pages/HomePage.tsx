import { useEffect, useRef } from 'react';
import { useSearch } from '../hooks/useSearch.js';
import { SearchForm } from '../components/SearchForm.js';
import { ChatMessage } from '../components/ChatMessage.js';

export default function HomePage(): React.JSX.Element {
  const { turns, isLoading, hasMemory, hasSummary, runSearch, clearSession, createGitHubIssue, updateTurnIssue, reportToAgent } = useSearch();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns.length]);

  return (
    <>
      <div className="bg-shape bg-shape-a" />
      <div className="bg-shape bg-shape-b" />

      <div className="chat-shell">
        <header className="chat-header">
          <div className="chat-header-top">
            <h1 className="chat-title">SupportPilot AI</h1>
            {turns.length > 0 && (
              <button type="button" className="btn-new-chat" onClick={clearSession} title="New chat">
                <svg className="btn-new-chat-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                </svg>
                <span className="btn-new-chat-label">New chat</span>
              </button>
            )}
          </div>
          {(hasMemory || hasSummary) && (
            <div className="chat-header-pills">
              {hasMemory && (
                <span className="pill pill--memory" title="Conversation history is active">Memory active</span>
              )}
              {hasSummary && (
                <span className="pill pill--summary" title="Older messages have been summarised to save context">Context summarised</span>
              )}
            </div>
          )}
        </header>

        <main className="chat-messages">
          {turns.length === 0 && (
            <div className="chat-empty">
              <p className="chat-empty-title">How can I help you today?</p>
              <p className="muted">Ask anything about your account, billing, or technical issues.</p>
            </div>
          )}
          {turns.map(turn => {
            const priorIssues = turns
              .filter(t => t.id !== turn.id && t.createdIssue !== null)
              .map(t => ({ ...t.createdIssue!, query: t.query }));
            return (
              <ChatMessage
                key={turn.id}
                turn={turn}
                priorIssues={priorIssues}
                onCreateIssue={createGitHubIssue}
                onUpdateIssue={updateTurnIssue}
                onReportToAgent={reportToAgent}
              />
            );
          })}
          {isLoading && turns[turns.length - 1]?.isStreaming === false && (
            <div className="chat-row chat-row--ai">
              <div className="chat-avatar">AI</div>
              <div className="chat-bubble chat-bubble--ai">
                <span className="chat-typing">●●●</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </main>

        <footer className="chat-input-bar">
          <SearchForm onSubmit={(q, img) => void runSearch(q, img)} isLoading={isLoading} />
        </footer>
      </div>
    </>
  );
}
