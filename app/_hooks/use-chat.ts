import { useLayoutEffect, useRef, useState } from "react";
import type { ChatMessage, ChatSuccessResponse } from "@/modules/chat/types";
import { requestChat } from "@/app/_lib/request";

export type DisplayMessage = ChatMessage & {
  id: number;
  toolNames?: string[];
  products?: ChatSuccessResponse["products"];
  recommendedProductIds?: ChatSuccessResponse["recommendedProductIds"];
};

export function useChat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shouldFollow = useRef(false);

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
  }, [messages, isPending]);

  async function sendMessage() {
    const content = draft.trim();
    if (!content || isPending) return;

    const userMessage = { id: Date.now(), role: "user" as const, content };
    const conversation: ChatMessage[] = [
      ...messages.map(({ role, content: messageContent }) => ({
        role,
        content: messageContent,
      })),
      { role: userMessage.role, content: userMessage.content },
    ];
    shouldFollow.current = true;
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setError(null);
    setIsPending(true);

    try {
      const result = await requestChat(conversation);
      let toolNames = result.toolNames;
      if (!toolNames?.length && result.toolName) toolNames = [result.toolName];

      const distanceFromBottom =
        document.documentElement.scrollHeight -
        window.innerHeight -
        window.scrollY;
      shouldFollow.current = distanceFromBottom <= 120;
      setMessages((current) => [
        ...current,
        {
          id: Date.now(),
          role: "assistant",
          content: result.content,
          toolNames,
          products: result.products,
          recommendedProductIds: result.recommendedProductIds,
        },
      ]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Couldn’t get a reply from local Ollama. Check that Ollama is running, then try again.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return { messages, draft, setDraft, isPending, error, sendMessage };
}
