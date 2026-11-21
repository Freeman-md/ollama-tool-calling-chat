"use client";

import { ChatComposer } from "@/app/_components/ChatComposer";
import { ChatMessage } from "@/app/_components/ChatMessage";
import { useChat } from "@/app/_hooks/use-chat";

export default function Home() {
  const {
    messages,
    draft,
    setDraft,
    isPending,
    isDeciding,
    error,
    sendMessage,
    decideApproval,
    retryApprovalReply,
  } = useChat();
  const transcriptClass = `transcript ${messages.length ? "has-messages" : ""}`;
  const isEmpty = messages.length === 0;
  const isBusy = isDeciding || isPending;

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

      <section className={transcriptClass} aria-live="polite">
        {isEmpty && (
          <div className="empty-state">
            <h1>Send a message</h1>
            <p>Start a conversation. Your thoughts can go anywhere.</p>
          </div>
        )}
        {!isEmpty && (
          <div className="message-list">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isBusy={isBusy}
                onApprovalDecision={decideApproval}
                onRetryApprovalReply={retryApprovalReply}
              />
            ))}
          </div>
        )}
      </section>

      <ChatComposer
        draft={draft}
        isPending={isPending}
        isDeciding={isDeciding}
        error={error}
        onDraftChange={setDraft}
        onSend={sendMessage}
      />
    </main>
  );
}
