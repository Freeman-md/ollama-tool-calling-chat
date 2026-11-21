import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";

type ChatComposerProps = {
  draft: string;
  isPending: boolean;
  isDeciding: boolean;
  error: string | null;
  onDraftChange: (draft: string) => void;
  onSend: () => void;
};

export function ChatComposer({
  draft,
  isPending,
  isDeciding,
  error,
  onDraftChange,
  onSend,
}: ChatComposerProps) {
  const placeholder = isPending ? "Waiting for a reply…" : "Send a message";
  const isSendDisabled = !draft.trim() || isPending || isDeciding;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSend();
  }

  function handleDraftChange(event: ChangeEvent<HTMLTextAreaElement>) {
    onDraftChange(event.currentTarget.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <div className="composer-dock">
      <form className="composer" onSubmit={handleSubmit}>
        <textarea
          aria-label="Message"
          placeholder={placeholder}
          rows={1}
          value={draft}
          disabled={isPending}
          onChange={handleDraftChange}
          onKeyDown={handleKeyDown}
        />
        <div className="composer-footer">
          <span className="composer-hint">
            ↵ to send · shift + ↵ for a new line
          </span>
          <button
            className="send-button"
            type="submit"
            disabled={isSendDisabled}
            aria-label="Send message"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 15V5m0 0L6 9m4-4 4 4" />
            </svg>
          </button>
        </div>
      </form>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <p className="disclaimer">
        AI can make mistakes. Check important information.
      </p>
    </div>
  );
}
