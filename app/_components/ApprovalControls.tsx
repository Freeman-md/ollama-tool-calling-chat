import { useRef, useState } from "react";
import { ApprovalRequestError } from "@/app/_lib/request";
import type { ApprovalProposal, ApprovalRequest } from "@/modules/chat/types";

type ApprovalControlsProps = {
  proposalId: string;
  labels: ApprovalProposal["buttons"];
  expiresAt: number;
  closed: boolean;
  disabled: boolean;
  onDecision: (approval: ApprovalRequest) => Promise<void>;
};

export function ApprovalControls({
  proposalId,
  labels,
  expiresAt,
  closed,
  disabled,
  onDecision,
}: ApprovalControlsProps) {
  const requestInFlight = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; closed: boolean }>();
  const isClosed = closed || error?.closed === true;
  const areButtonsDisabled = disabled || isClosed || isSubmitting;
  const expiry = new Date(expiresAt);
  const expiryTime = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  }).format(expiry);

  async function submitDecision(decision: ApprovalRequest["decision"]) {
    if (areButtonsDisabled || requestInFlight.current) {
      return;
    }
    requestInFlight.current = true;
    setIsSubmitting(true);
    setError(undefined);

    try {
      await onDecision({ proposalId, decision });
    } catch (caught) {
      setError({
        message:
          caught instanceof Error
            ? caught.message
            : "Couldn’t confirm your decision. Try again.",
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
    <>
      <div className="basket-approval-controls" aria-busy={isSubmitting}>
        {isClosed ? (
          <span className="basket-expiry" role="status">
            Proposal closed
          </span>
        ) : (
          <span className="basket-expiry">
            Expires at <time dateTime={expiry.toISOString()}>{expiryTime}</time>
          </span>
        )}
        <div className="basket-approval-buttons">
          <button
            type="button"
            disabled={areButtonsDisabled}
            onClick={handleCancel}
          >
            {labels.cancel}
          </button>
          <button
            className="basket-approve"
            type="button"
            disabled={areButtonsDisabled}
            onClick={handleApprove}
          >
            {labels.approve}
          </button>
        </div>
      </div>
      {error && !closed && (
        <p className="basket-decision-error" role="alert">
          {error.message}
        </p>
      )}
    </>
  );
}
