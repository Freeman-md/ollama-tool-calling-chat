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

function CheckoutDetails({
  preview,
  outcome,
}: {
  preview: Extract<DisplayApproval["preview"], { kind: "checkout" }>;
  outcome?: string;
}) {
  const pounds = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: preview.currency,
  });
  const total = pounds.format(preview.totalPence / 100);
  const items = preview.items.map(({ unitPricePence, ...item }) => ({
    ...item,
    unitPrice: pounds.format(unitPricePence / 100),
  }));

  return (
    <>
      <h2>Order review</h2>
      {outcome && (
        <p className="basket-notice" role="status">
          {outcome}
        </p>
      )}
      <ul className="basket-items">
        {items.map(({ productId, name, quantity, unitPrice }) => (
          <li className="basket-row" key={productId}>
            <span>{name}</span>
            <span className="basket-quantity">
              Quantity {quantity} · {unitPrice} each
            </span>
          </li>
        ))}
      </ul>
      <p className="basket-row basket-total">
        <span>Total</span>
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
  if (receipt?.kind === "read") {
    return (
      <section className="basket-summary" aria-label="Approval receipt">
        <p role="status">{receipt.outcome}</p>
      </section>
    );
  }

  let label: string;
  let details: React.ReactNode;
  if (preview.kind === "basket_change") {
    label = "Basket change";
    details = <BasketChangeDetails preview={preview} />;
  } else if (preview.kind === "checkout") {
    label = "Checkout";
    details = <CheckoutDetails preview={preview} outcome={receipt?.outcome} />;
  } else {
    label = "Read approval";
    details = (
      <>
        <h2>{preview.title}</h2>
        <p className="basket-change">{preview.description}</p>
      </>
    );
  }

  return (
    <section className="basket-summary" aria-label={label}>
      {details}
      {!receipt && (
        <ApprovalControls
          proposalId={approval.id}
          labels={approval.buttons}
          expiresAt={approval.expiresAt}
          closed={approval.closed === true}
          disabled={disabled}
          onDecision={onDecision}
        />
      )}
    </section>
  );
}
