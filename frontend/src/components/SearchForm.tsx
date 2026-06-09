import { useRef } from 'react';

interface SearchFormProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
}

export function SearchForm({ onSubmit, isLoading }: SearchFormProps): React.JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const query = textareaRef.current?.value.trim();
    if (!query) return;
    onSubmit(query);
    if (textareaRef.current) textareaRef.current.value = '';
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const query = textareaRef.current?.value.trim();
      if (!query || isLoading) return;
      onSubmit(query);
      if (textareaRef.current) textareaRef.current.value = '';
    }
  }

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        className="chat-input-textarea"
        placeholder="Ask a support question…"
        rows={1}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
      />
      <button type="submit" className="chat-send-btn" disabled={isLoading}>
        {isLoading ? '…' : '↑'}
      </button>
    </form>
  );
}
