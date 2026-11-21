import { useLayoutEffect, useRef, useState } from "react";
import type { ApprovalRequest, ChatMessage } from "@/modules/chat/types";
import { requestApproval, requestChat } from "@/app/_lib/request";
import {
  closePendingProposals,
  completeReply,
  recordApprovalReceipt,
  toChatMessage,
  type DisplayMessage,
} from "@/app/_lib/chat-transcript";

function isNearBottom() {
  return (
    document.documentElement.scrollHeight -
      window.innerHeight -
      window.scrollY <=
    120
  );
}

export function useChat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeciding, setIsDeciding] = useState(false);
  const nextMessageId = useRef(0);
  const shouldFollow = useRef(false);
  const requestInFlight = useRef(false);
  const isPending = messages.at(-1)?.isPending === true;

  useLayoutEffect(() => {
    if (!shouldFollow.current) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: reducedMotion ? "instant" : "smooth",
    });
    shouldFollow.current = false;
  }, [messages]);

  async function sendMessage() {
    const content = draft.trim();
    if (!content || requestInFlight.current) {
      return;
    }
    requestInFlight.current = true;

    const userMessage: DisplayMessage = {
      id: nextMessageId.current++,
      role: "user",
      content,
    };
    const replyId = nextMessageId.current++;
    const conversation: ChatMessage[] = [
      ...messages.map(toChatMessage),
      { role: userMessage.role, content: userMessage.content },
    ];
    shouldFollow.current = true;
    setMessages((current) => [
      ...closePendingProposals(current),
      userMessage,
      { id: replyId, role: "assistant", content: "", isPending: true },
    ]);
    setDraft("");
    setError(null);

    try {
      const result = await requestChat(conversation, (label) => {
        setMessages((current) =>
          current.map((message) => {
            if (message.id !== replyId) return message;
            return {
              ...message,
              activity: [...(message.activity ?? []), label],
            };
          }),
        );
      });

      shouldFollow.current = isNearBottom();
      setMessages((current) => completeReply(current, replyId, result));
    } catch (caught) {
      setMessages((current) => current.filter(({ id }) => id !== replyId));
      setError(
        caught instanceof Error
          ? caught.message
          : "Couldn’t get a reply from local Ollama. Check that Ollama is running, then try again.",
      );
    } finally {
      requestInFlight.current = false;
    }
  }

  async function decideApproval(messageId: number, approval: ApprovalRequest) {
    if (requestInFlight.current) {
      throw new Error("Wait for the current chat request to finish.");
    }
    requestInFlight.current = true;
    setIsDeciding(true);

    try {
      const receipt = await requestApproval(approval);
      const shopperMessageId = nextMessageId.current++;
      shouldFollow.current = isNearBottom();
      setMessages((current) =>
        recordApprovalReceipt(current, messageId, shopperMessageId, receipt),
      );
    } finally {
      requestInFlight.current = false;
      setIsDeciding(false);
    }
  }

  return {
    messages,
    draft,
    setDraft,
    isPending,
    isDeciding,
    error,
    sendMessage,
    decideApproval,
  };
}
