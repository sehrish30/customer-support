import { useEffect, useRef } from 'react';
import { useSearch } from '../hooks/useSearch.js';
import { SearchForm } from '../components/SearchForm.js';
import { ChatMessage } from '../components/ChatMessage.js';

export default function HomePage(): React.JSX.Element {
  const { turns, isLoading, hasMemory, runSearch, clearSession, createGitHubIssue, updateTurnIssue, reportToAgent } = useSearch();
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
          <div className="chat-header-left">
            <h1 className="chat-title">SupportPilot AI</h1>
            {hasMemory && (
              <span className="pill pill--memory" title="Conversation history is active">Memory active</span>
            )}
          </div>
          {turns.length > 0 && (
            <button type="button" className="btn-new-chat" onClick={clearSession}>
              New chat
            </button>
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
          <SearchForm onSubmit={runSearch} isLoading={isLoading} />
        </footer>
      </div>
    </>
  );
}
