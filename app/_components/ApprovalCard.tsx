import type { DisplayApproval } from "@/app/_lib/chat-transcript";
import type { ApprovalRequest } from "@/modules/chat/types";
import { ApprovalControls } from "./ApprovalControls";
import { BasketSummary } from "./BasketSummary";

type ApprovalCardProps = {
  approval: DisplayApproval;
  disabled: boolean;
  onDecision: (approval: ApprovalRequest) => Promise<void>;
};

function BasketChangeDetails({
  preview,
}: {
  preview: Extract<DisplayApproval["preview"], { kind: "basket_change" }>;
}) {
  const total = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: preview.currency,
  }).format(preview.totalPence / 100);

  return (
    <>
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
    </>
  );
}

export function ApprovalCard({
  approval,
  disabled,
  onDecision,
}: ApprovalCardProps) {
  const { preview, receipt } = approval;
  if (receipt?.kind === "basket_change") {
    return <BasketSummary cart={receipt.cart} notice={receipt.outcome} />;
  }
  if (receipt) {
    return (
      <section className="basket-summary" aria-label="Approval receipt">
        <p role="status">{receipt.outcome}</p>
      </section>
    );
  }

  const label =
    preview.kind === "basket_change" ? "Basket change" : "Read approval";
  return (
    <section className="basket-summary" aria-label={label}>
      {preview.kind === "basket_change" ? (
        <BasketChangeDetails preview={preview} />
      ) : (
        <>
          <h2>{preview.title}</h2>
          <p className="basket-change">{preview.description}</p>
        </>
      )}
      <ApprovalControls
        proposalId={approval.id}
        labels={approval.buttons}
        expiresAt={approval.expiresAt}
        closed={approval.closed === true}
        disabled={disabled}
        onDecision={onDecision}
      />
    </section>
  );
}
