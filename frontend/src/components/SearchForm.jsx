import { useRef } from 'react';

export function SearchForm({ onSubmit, isLoading }) {
  const textareaRef = useRef(null);

  function handleSubmit(e) {
    e.preventDefault();
    const query = textareaRef.current?.value.trim();
    if (!query) return;
    onSubmit(query);
  }

  return (
    <section className="card" aria-label="Search panel">
      <form className="search-form" onSubmit={handleSubmit}>
        <label htmlFor="query">Ask a support question</label>
        <textarea
          id="query"
          name="query"
          ref={textareaRef}
          rows={4}
          placeholder="Example: How can I change my billing plan and when does the update take effect?"
          required
        />
        <button type="submit" disabled={isLoading}>
          Run Search
        </button>
      </form>
    </section>
  );
}
