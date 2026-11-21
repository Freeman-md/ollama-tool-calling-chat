import type {
  ActivityLabel,
  ApprovalProposal,
  ApprovalReceipt,
  ChatMessage,
  ChatSuccessResponse,
} from "@/modules/chat/types";

export type DisplayApproval = ApprovalProposal & {
  closed?: true;
  receipt?: ApprovalReceipt;
};

export type DisplayMessage = ChatMessage & {
  id: number;
  isPending?: boolean;
  approvalReplyFor?: string;
  replyError?: string;
  activity?: ActivityLabel[];
  products?: ChatSuccessResponse["products"];
  productView?: ChatSuccessResponse["productView"];
  recommendedProductIds?: ChatSuccessResponse["recommendedProductIds"];
  cart?: ChatSuccessResponse["cart"];
  approvals?: DisplayApproval[];
};

export function toChatMessage(message: DisplayMessage): ChatMessage {
  if (message.role === "user") {
    const { role, content, approvalProposalId } = message;
    return { role, content, approvalProposalId };
  }

  const { role, content, products = [] } = message;
  if (products.length === 0) {
    return { role, content };
  }
  const shownProducts = products.map(({ name, id }) => `${name} (ID: ${id})`);
  return {
    role,
    content: `${content}\nCatalog products shown: ${shownProducts.join(", ")}.`,
  };
}

export function closePendingProposals(
  messages: DisplayMessage[],
): DisplayMessage[] {
  return messages.map((message) => {
    if (!message.approvals) {
      return message;
    }
    return {
      ...message,
      approvals: message.approvals.map((proposal) =>
        proposal.receipt || proposal.closed
          ? proposal
          : { ...proposal, closed: true },
      ),
    };
  });
}

export function completeReply(
  messages: DisplayMessage[],
  replyId: number,
  result: ChatSuccessResponse,
): DisplayMessage[] {
  const hasNewerTurn = messages.some(
    (message) =>
      message.id > replyId &&
      message.role === "user" &&
      message.approvalProposalId === undefined,
  );
  const approvals = hasNewerTurn
    ? result.approvals?.map((proposal) => ({
        ...proposal,
        closed: true as const,
      }))
    : result.approvals;

  return messages.map((message) => {
    if (message.id !== replyId || !message.isPending) {
      return message;
    }
    return {
      ...message,
      isPending: false,
      content: result.content,
      products: result.products,
      productView: result.productView,
      recommendedProductIds: result.recommendedProductIds,
      cart: result.cart,
      approvals,
    };
  });
}

export function recordApprovalReceipt(
  messages: DisplayMessage[],
  proposalMessageId: number,
  shopperMessageId: number,
  replyId: number,
  receipt: ApprovalReceipt,
): DisplayMessage[] {
  const proposal = messages
    .find(({ id }) => id === proposalMessageId)
    ?.approvals?.find(({ id }) => id === receipt.proposalId);
  if (!proposal || proposal.receipt) {
    return messages;
  }

  const updated = messages.map((message) => {
    if (message.id !== proposalMessageId) {
      return message;
    }
    return {
      ...message,
      approvals: message.approvals?.map((approval) =>
        approval.id === receipt.proposalId
          ? { ...approval, receipt }
          : approval,
      ),
    };
  });
  return [
    ...updated,
    {
      id: shopperMessageId,
      role: "user",
      content: receipt.buttonLabel,
      approvalProposalId: receipt.proposalId,
    },
    {
      id: replyId,
      role: "assistant",
      content: "",
      isPending: true,
      approvalReplyFor: receipt.proposalId,
    },
  ];
}

export function setApprovalReplyState(
  messages: DisplayMessage[],
  replyId: number,
  { isPending, replyError }: { isPending: boolean; replyError?: string },
): DisplayMessage[] {
  return messages.map((message) => {
    if (message.id !== replyId || !message.approvalReplyFor) {
      return message;
    }
    return { ...message, isPending, replyError };
  });
}
