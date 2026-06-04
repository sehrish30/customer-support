import { useSearch } from './hooks/useSearch';
import { SearchForm } from './components/SearchForm';
import { Results } from './components/Results';

export default function App() {
  const { answer, sources, status, isLoading, runSearch } = useSearch();

  return (
    <>
      <div className="bg-shape bg-shape-a" />
      <div className="bg-shape bg-shape-b" />

      <main className="app-shell">
        <header className="hero">
          <p className="eyebrow">Portfolio Demo</p>
          <h1>SupportPilot AI</h1>
          <p className="subtitle">
            Hybrid support assistant powered by knowledge-base retrieval and agentic LLM routing.
          </p>
        </header>

        <SearchForm onSubmit={runSearch} isLoading={isLoading} />
        <Results answer={answer} sources={sources} status={status} />
      </main>
    </>
  );
}
