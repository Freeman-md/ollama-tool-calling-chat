import { useLayoutEffect, useRef, useState } from "react";
import type {
  ActivityLabel,
  ChatMessage,
  ChatSuccessResponse,
} from "@/modules/chat/types";
import { requestChat } from "@/app/_lib/request";

export type DisplayMessage = ChatMessage & {
  id: number;
  isPending?: boolean;
  activity?: ActivityLabel[];
  products?: ChatSuccessResponse["products"];
  productView?: ChatSuccessResponse["productView"];
  recommendedProductIds?: ChatSuccessResponse["recommendedProductIds"];
  cart?: ChatSuccessResponse["cart"];
};

export function useChat() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const nextMessageId = useRef(0);
  const shouldFollow = useRef(false);
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
    if (!content || isPending) return;

    const userMessage: DisplayMessage = {
      id: nextMessageId.current++,
      role: "user",
      content,
    };
    const replyId = nextMessageId.current++;
    const conversation: ChatMessage[] = [
      ...messages.map(({ role, content: messageContent }) => ({
        role,
        content: messageContent,
      })),
      { role: userMessage.role, content: userMessage.content },
    ];
    shouldFollow.current = true;
    setMessages((current) => [
      ...current,
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

      const distanceFromBottom =
        document.documentElement.scrollHeight -
        window.innerHeight -
        window.scrollY;
      shouldFollow.current = distanceFromBottom <= 120;
      setMessages((current) =>
        current.map((message) => {
          if (message.id !== replyId) return message;
          return {
            ...message,
            isPending: false,
            content: result.content,
            products: result.products,
            productView: result.productView,
            recommendedProductIds: result.recommendedProductIds,
            cart: result.cart,
          };
        }),
      );
    } catch (caught) {
      setMessages((current) => current.filter(({ id }) => id !== replyId));
      setError(
        caught instanceof Error
          ? caught.message
          : "Couldn’t get a reply from local Ollama. Check that Ollama is running, then try again.",
      );
    }
  }

  return { messages, draft, setDraft, isPending, error, sendMessage };
}
