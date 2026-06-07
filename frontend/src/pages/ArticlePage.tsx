import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Article } from '../types.js';

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; article: Article };

function topicToTitle(topic: string): string {
  return topic
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function ArticlePage(): React.JSX.Element {
  const { topic } = useParams<{ topic: string }>();
  const [state, setState] = useState<PageState>({ status: 'loading' });

  useEffect(() => {
    if (!topic) {
      setState({ status: 'error', message: 'No article topic provided.' });
      return;
    }

    let cancelled = false;

    fetch(`/api/article/${encodeURIComponent(topic)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<Article>;
      })
      .then((article) => {
        if (!cancelled) setState({ status: 'ready', article });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load article.';
          setState({ status: 'error', message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [topic]);

  return (
    <>
      <div className="bg-shape bg-shape-a" />
      <div className="bg-shape bg-shape-b" />

      <main className="app-shell">
        <nav className="article-nav">
          <Link to="/">← Back to Search</Link>
        </nav>

        {state.status === 'loading' && (
          <div className="card">
            <p className="muted">Loading article…</p>
          </div>
        )}

        {state.status === 'error' && (
          <div className="card">
            <p className="answer muted">{state.message}</p>
          </div>
        )}

        {state.status === 'ready' && (
          <article className="card article-card">
            <header className="article-header">
              <span className="pill article-category" data-tone="success">
                {state.article.metadata.category}
              </span>
              <h1>{topicToTitle(state.article.metadata.topic)}</h1>
            </header>
            <div className="article-body">
              <p>{state.article.content}</p>
            </div>
          </article>
        )}
      </main>
    </>
  );
}
