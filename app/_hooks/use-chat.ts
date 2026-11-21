import { useLayoutEffect, useRef, useState } from "react";
import type { ApprovalRequest, ChatMessage } from "@/modules/chat/types";
import {
  requestApproval,
  requestApprovalReply,
  requestChat,
} from "@/app/_lib/request";
import {
  closePendingProposals,
  completeReply,
  recordApprovalReceipt,
  setApprovalReplyState,
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
  const isPending = messages.some((message) => message.isPending);

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
      ...messages.filter((message) => !message.replyError).map(toChatMessage),
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
    const proposal = messages
      .find(({ id }) => id === messageId)
      ?.approvals?.find(({ id }) => id === approval.proposalId);
    if (!proposal || proposal.closed || proposal.receipt) {
      return;
    }
    requestInFlight.current = true;
    setIsDeciding(true);

    try {
      const receipt = await requestApproval(approval);
      const shopperMessageId = nextMessageId.current++;
      const replyId = nextMessageId.current++;
      shouldFollow.current = isNearBottom();
      setMessages((current) =>
        recordApprovalReceipt(
          current,
          messageId,
          shopperMessageId,
          replyId,
          receipt,
        ),
      );
      await finishApprovalReply(replyId, receipt.proposalId);
    } finally {
      requestInFlight.current = false;
      setIsDeciding(false);
    }
  }

  async function finishApprovalReply(replyId: number, proposalId: string) {
    try {
      const result = await requestApprovalReply(proposalId);
      shouldFollow.current = isNearBottom();
      setMessages((current) => completeReply(current, replyId, result));
    } catch (caught) {
      const replyError =
        caught instanceof Error
          ? caught.message
          : "Couldn’t get a reply to this decision.";
      setMessages((current) =>
        setApprovalReplyState(current, replyId, {
          isPending: false,
          replyError,
        }),
      );
    }
  }

  async function retryApprovalReply(replyId: number) {
    const reply = messages.find(({ id }) => id === replyId);
    if (
      requestInFlight.current ||
      !reply?.replyError ||
      !reply.approvalReplyFor
    ) {
      return;
    }
    requestInFlight.current = true;
    setMessages((current) =>
      setApprovalReplyState(current, replyId, { isPending: true }),
    );
    try {
      await finishApprovalReply(replyId, reply.approvalReplyFor);
    } finally {
      requestInFlight.current = false;
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
    retryApprovalReply,
  };
}
