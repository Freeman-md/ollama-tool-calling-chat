"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ChatErrorResponseSchema,
  ChatRequestSchema,
  ChatSuccessResponseSchema,
} from "@/modules/chat/contract";
import type { ChatMessage, ChatRequest } from "@/modules/chat/types";

type Message = ChatMessage & { id: number; toolNames?: string[] };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || isPending) return;

    const id = Date.now();
    const userMessage = { id, role: "user" as const, content };
    const conversation: ChatMessage[] = [
      ...messages.map(({ role, content: messageContent }) => ({
        role,
        content: messageContent,
      })),
      { role: userMessage.role, content: userMessage.content },
    ];
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setError(null);
    setIsPending(true);

    try {
      const requestBody: ChatRequest = ChatRequestSchema.parse({
        messages: conversation,
      });
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const responseBody: unknown = await response.json();

      if (!response.ok) {
        const error = ChatErrorResponseSchema.safeParse(responseBody);
        if (error.success) {
          setError(error.data.error);
          return;
        }
        throw new Error("The reply could not be generated.");
      }

      const result = ChatSuccessResponseSchema.safeParse(responseBody);
      if (!result.success) {
        throw new Error("The reply could not be generated.");
      }

      const toolNames = result.data.toolNames?.length
        ? result.data.toolNames
        : result.data.toolName
          ? [result.data.toolName]
          : undefined;

      setMessages((current) => [
        ...current,
        {
          id: Date.now(),
          role: "assistant",
          content: result.data.content,
          toolNames,
        },
      ]);
    } catch {
      setError(
        "Couldn’t get a reply from local Ollama. Check that Ollama is running, then try again.",
      );
    } finally {
      setIsPending(false);
    }
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

      <section
        className={`transcript ${messages.length ? "has-messages" : ""}`}
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="empty-state">
            <h1>Send a message</h1>
            <p>Start a conversation. Your thoughts can go anywhere.</p>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((message) => (
              <article className={`message ${message.role}`} key={message.id}>
                {message.role === "assistant" ? (
                  <>
                    <span className="assistant-mark" aria-hidden="true">
                      ✳
                    </span>
                    <div className="assistant-body">
                      {message.toolNames && message.toolNames.length > 0 && (
                        <span className="tool-used-label">
                          Used {message.toolNames.join(", ")}
                        </span>
                      )}
                      <p>{message.content}</p>
                    </div>
                  </>
                ) : (
                  <p>{message.content}</p>
                )}
              </article>
            ))}
            {isPending && (
              <article
                className="message assistant pending-message"
                role="status"
              >
                <span className="assistant-mark" aria-hidden="true">
                  ✳
                </span>
                <div className="assistant-body">
                  <p>Thinking…</p>
                </div>
              </article>
            )}
            <div ref={transcriptEnd} />
          </div>
        )}
      </section>

      <div className="composer-dock">
        <form className="composer" onSubmit={sendMessage}>
          <textarea
            aria-label="Message"
            placeholder={isPending ? "Waiting for a reply…" : "Send a message"}
            rows={1}
            value={draft}
            disabled={isPending}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <div className="composer-footer">
            <span className="composer-hint">
              ↵ to send · shift + ↵ for a new line
            </span>
            <button
              className="send-button"
              type="submit"
              disabled={!draft.trim() || isPending}
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
    </main>
  );
}
