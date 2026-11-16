"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = { id: number; role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const transcriptEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;

    const id = Date.now();
    setMessages((current) => [
      ...current,
      { id, role: "user", content },
      {
        id: id + 1,
        role: "assistant",
        content: "This is a temporary stub reply. Your chat is working.",
      },
    ]);
    setDraft("");
  }

  return (
    <main className="chat-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Chat home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>Chat</span>
        </a>
        <button className="profile-button" aria-label="Profile">
          <span>Y</span>
        </button>
      </header>

      <section className={`transcript ${messages.length ? "has-messages" : ""}`} aria-live="polite">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h1>Send a message</h1>
            <p>Start a conversation. Your thoughts can go anywhere.</p>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((message) => (
              <article className={`message ${message.role}`} key={message.id}>
                {message.role === "assistant" && (
                  <span className="assistant-mark" aria-hidden="true">✳</span>
                )}
                <p>{message.content}</p>
              </article>
            ))}
            <div ref={transcriptEnd} />
          </div>
        )}
      </section>

      <div className="composer-dock">
        <form className="composer" onSubmit={sendMessage}>
          <textarea
            aria-label="Message"
            placeholder="Send a message"
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <div className="composer-footer">
            <span className="composer-hint">↵ to send · shift + ↵ for a new line</span>
            <button
              className="send-button"
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send message"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 15V5m0 0L6 9m4-4 4 4" />
              </svg>
            </button>
          </div>
        </form>
        <p className="disclaimer">AI can make mistakes. Check important information.</p>
      </div>
    </main>
  );
}
