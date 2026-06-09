import { useState } from "react";
import { useSearch } from "../hooks/useSearch.js";
import { SearchForm } from "../components/SearchForm.js";
import { Results } from "../components/Results.js";

export default function HomePage(): React.JSX.Element {
  const { answer, sources, status, isLoading, hasMemory, runSearch, clearSession, createGitHubIssue } =
    useSearch();
  const [lastQuery, setLastQuery] = useState('');

  async function handleSearch(query: string): Promise<void> {
    setLastQuery(query);
    await runSearch(query);
  }

  return (
    <>
      <div className="bg-shape bg-shape-a" />
      <div className="bg-shape bg-shape-b" />

      <main className="app-shell">
        <header className="hero">
          <h1>SupportPilot AI</h1>
          <p className="subtitle">
            Hybrid support assistant powered by knowledge-base retrieval and
            agentic LLM routing.
          </p>
        </header>

        <SearchForm onSubmit={handleSearch} isLoading={isLoading} />
        <Results
          answer={answer}
          query={lastQuery}
          sources={sources}
          status={status}
          hasMemory={hasMemory}
          onClear={clearSession}
          onCreateIssue={createGitHubIssue}
        />
      </main>
    </>
  );
}
