import { useRef, useState } from "react";
import type { DisplayApproval } from "@/app/_hooks/use-chat";
import { ApprovalRequestError } from "@/app/_lib/request";
import type { ApprovalRequest } from "@/modules/chat/types";
import { BasketSummary } from "./BasketSummary";

type BasketApprovalProps = {
  approval: DisplayApproval;
  onDecision: (approval: ApprovalRequest) => Promise<void>;
};

export function BasketApproval({ approval, onDecision }: BasketApprovalProps) {
  const requestInFlight = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; closed: boolean }>();

  if (approval.resolution) {
    const notice =
      approval.resolution.status === "approved"
        ? "Basket updated."
        : "Basket change cancelled.";
    return <BasketSummary cart={approval.resolution.cart} notice={notice} />;
  }

  const { id, preview } = approval;
  const total = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: preview.currency,
  }).format(preview.totalPence / 100);
  const expiresAt = new Date(approval.expiresAt);
  const expiryTime = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  }).format(expiresAt);

  async function submitDecision(decision: ApprovalRequest["decision"]) {
    if (requestInFlight.current) {
      return;
    }
    requestInFlight.current = true;
    setIsSubmitting(true);
    setError(undefined);

    try {
      await onDecision({ proposalId: id, decision });
    } catch (caught) {
      setError({
        message:
          caught instanceof Error
            ? caught.message
            : "Couldn’t confirm your basket decision. Try again.",
        closed:
          caught instanceof ApprovalRequestError &&
          caught.status >= 400 &&
          caught.status < 500,
      });
    } finally {
      requestInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  function handleApprove() {
    void submitDecision("approve");
  }

  function handleCancel() {
    void submitDecision("cancel");
  }

  return (
    <section
      className="basket-summary"
      aria-label="Basket change"
      aria-busy={isSubmitting}
    >
      <h2>Review basket change</h2>
      <p className="basket-row basket-change">
        <span>{preview.productName}</span>
        <span className="basket-quantity">
          Quantity {preview.previousQuantity} to {preview.quantity}
        </span>
      </p>
      <p className="basket-row basket-total">
        <span>New total</span>
        <strong>{total}</strong>
      </p>
      {!error?.closed && (
        <div className="basket-approval-controls">
          <span className="basket-expiry">
            Expires at{" "}
            <time dateTime={expiresAt.toISOString()}>{expiryTime}</time>
          </span>
          <div className="basket-approval-buttons">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="basket-approve"
              type="button"
              disabled={isSubmitting}
              onClick={handleApprove}
            >
              Approve
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className="basket-decision-error" role="alert">
          {error.message}
        </p>
      )}
    </section>
  );
}
