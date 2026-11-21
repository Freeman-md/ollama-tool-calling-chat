import { useLayoutEffect, useRef, useState } from "react";
import type {
  ActivityLabel,
  ApprovalProposal,
  ApprovalRequest,
  ApprovalResponse,
  ChatMessage,
  ChatSuccessResponse,
} from "@/modules/chat/types";
import { requestApproval, requestChat } from "@/app/_lib/request";

export type DisplayApproval = ApprovalProposal & {
  resolution?: ApprovalResponse;
};

export type DisplayMessage = ChatMessage & {
  id: number;
  isPending?: boolean;
  activity?: ActivityLabel[];
  products?: ChatSuccessResponse["products"];
  productView?: ChatSuccessResponse["productView"];
  recommendedProductIds?: ChatSuccessResponse["recommendedProductIds"];
  cart?: ChatSuccessResponse["cart"];
  approvals?: DisplayApproval[];
};

function toChatMessage({
  role,
  content,
  products = [],
  approvals = [],
}: DisplayMessage): ChatMessage {
  const context = [content];
  if (products.length > 0) {
    const shownProducts = products.map(({ name, id }) => `${name} (ID: ${id})`);
    context.push(`Catalog products shown: ${shownProducts.join(", ")}.`);
  }

  const decisions = approvals.flatMap(({ resolution, preview }) => {
    if (!resolution) {
      return [];
    }
    if (resolution.status === "approved") {
      return [
        `The shopper approved the basket change. ${preview.productName} quantity was set to ${preview.quantity}.`,
      ];
    }
    return [
      `The shopper cancelled the basket change for ${preview.productName}.`,
    ];
  });
  return { role, content: [...context, ...decisions].join("\n") };
}

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
      ...messages.map(toChatMessage),
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
            approvals: result.approvals,
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

  async function decideApproval(messageId: number, approval: ApprovalRequest) {
    const resolution = await requestApproval(approval);
    setMessages((current) =>
      current.map((message) => {
        if (message.id !== messageId) {
          return message;
        }
        return {
          ...message,
          approvals: message.approvals?.map((proposal) =>
            proposal.id === approval.proposalId
              ? { ...proposal, resolution }
              : proposal,
          ),
        };
      }),
    );
  }

  return {
    messages,
    draft,
    setDraft,
    isPending,
    error,
    sendMessage,
    decideApproval,
  };
}
