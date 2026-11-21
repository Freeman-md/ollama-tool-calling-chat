import Markdown from "react-markdown";
import type { DisplayMessage } from "@/app/_lib/chat-transcript";
import type { ApprovalRequest } from "@/modules/chat/types";
import { AssistantActivity } from "./AssistantActivity";
import { ApprovalCard } from "./ApprovalCard";
import { BasketSummary } from "./BasketSummary";
import { ProductCard } from "./ProductCard";

type ChatMessageProps = {
  message: DisplayMessage;
  isBusy: boolean;
  onApprovalDecision: (
    messageId: number,
    approval: ApprovalRequest,
  ) => Promise<void>;
  onRetryApprovalReply: (replyId: number) => Promise<void>;
};

export function ChatMessage({
  message,
  isBusy,
  onApprovalDecision,
  onRetryApprovalReply,
}: ChatMessageProps) {
  const products = message.products ?? [];
  const recommendedProductIds = message.recommendedProductIds ?? [];
  const hasProducts = products.length > 0;
  const isPending = message.isPending === true;
  const hasBasketUpdate = message.approvals?.some(
    ({ receipt }) =>
      receipt?.kind === "basket_change" || receipt?.kind === "order_placed",
  );
  const basket = hasBasketUpdate ? undefined : message.cart;
  const messageClass = `message ${message.role}`;

  function handleApprovalDecision(approval: ApprovalRequest) {
    return onApprovalDecision(message.id, approval);
  }

  function handleRetryApprovalReply() {
    void onRetryApprovalReply(message.id);
  }

  if (message.role === "user") {
    return (
      <article className={messageClass}>
        <p>{message.content}</p>
      </article>
    );
  }

  return (
    <article className={messageClass}>
      <span className="assistant-mark" aria-hidden="true">
        ✳
      </span>
      <div className="assistant-body">
        <AssistantActivity isPending={isPending} steps={message.activity} />
        {!isPending && (
          <div className="assistant-reply">
            {message.replyError ? (
              <>
                <p className="approval-reply-error" role="alert">
                  {message.replyError}
                </p>
                <button
                  type="button"
                  className="approval-reply-retry"
                  disabled={isBusy}
                  onClick={handleRetryApprovalReply}
                >
                  Retry reply
                </button>
              </>
            ) : (
              <div className="assistant-content">
                <Markdown skipHtml>{message.content}</Markdown>
              </div>
            )}
          </div>
        )}
        {!isPending && basket && <BasketSummary cart={basket} />}
        {message.approvals?.map((approval) => (
          <ApprovalCard
            key={approval.id}
            approval={approval}
            disabled={isBusy}
            onDecision={handleApprovalDecision}
          />
        ))}
        {hasProducts && (
          <section className="catalog-matches" aria-label="Products">
            <h2>Products</h2>
            <div
              className="catalog-grid"
              role="region"
              aria-label="Product cards"
              tabIndex={0}
            >
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  view={message.productView ?? "compact"}
                  index={index}
                  recommendedProductIds={recommendedProductIds}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
