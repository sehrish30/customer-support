import { useRef, useState } from "react";

interface SearchFormProps {
  onSubmit: (query: string, imageBase64?: string) => void;
  isLoading: boolean;
}

export function SearchForm({
  onSubmit,
  isLoading,
}: SearchFormProps): React.JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function autoResize(): void {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  function resetHeight(): void {
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function clearImage(): void {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) {
      alert("Image must be under 1 MB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): void {
    e.preventDefault();
    const query = textareaRef.current?.value.trim();
    if (!query) return;
    onSubmit(query, imagePreview ?? undefined);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      resetHeight();
    }
    clearImage();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const query = textareaRef.current?.value.trim();
      if (!query || isLoading) return;
      onSubmit(query, imagePreview ?? undefined);
      if (textareaRef.current) {
        textareaRef.current.value = "";
        resetHeight();
      }
      clearImage();
    }
  }

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      {imagePreview && (
        <div className="chat-input-preview">
          <img
            src={imagePreview}
            className="chat-input-preview-img"
            alt="attachment preview"
          />
          <button
            type="button"
            className="chat-input-preview-remove"
            onClick={clearImage}
            aria-label="Remove image"
          >
            ×
          </button>
        </div>
      )}
      <div className="chat-input-row">
        <textarea
          ref={textareaRef}
          className="chat-input-textarea"
          placeholder="Ask a support question…"
          rows={1}
          onKeyDown={handleKeyDown}
          onInput={autoResize}
          disabled={isLoading}
        />
        <button
          type="button"
          className="chat-attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || !!imagePreview}
          aria-label="Attach image"
          title="Attach image"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
        <button type="submit" className="chat-send-btn" disabled={isLoading}>
          {isLoading ? "…" : "↑"}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />
    </form>
  );
}
