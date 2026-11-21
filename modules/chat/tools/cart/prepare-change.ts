import {
  cartService,
  type CartOperation,
  type CartReview,
} from "@/modules/cart/service";
import type { CartSnapshot } from "@/modules/cart/types";
import { ToolDispatchError } from "@/modules/chat/errors";
import type { PreparedApproval, ToolResult } from "@/modules/chat/types";

export function prepareCartChange(
  sessionId: string,
  item: { productId: string; quantity: number },
  operation: CartOperation,
): PreparedApproval {
  const update =
    operation === "add" ? cartService.addToCart : cartService.setCartQuantity;

  function execute(review?: CartReview): ToolResult & { cart: CartSnapshot } {
    const result = update(sessionId, item, review);
    if ("error" in result) {
      throw new ToolDispatchError(result.error, result.conflict ? 409 : 400);
    }
    return { content: JSON.stringify(result.cart), cart: result.cart };
  }

  return {
    execute,
    review() {
      const review = cartService.reviewChange(sessionId, item, operation);
      if ("error" in review) {
        throw new ToolDispatchError(review.error, 400);
      }
      const { productName, quantity, previousQuantity } = review.preview;
      return {
        preview: { kind: "basket_change", ...review.preview },
        buttons: { approve: "Approve", cancel: "Cancel" },
        isCurrent: () => cartService.getRevision(sessionId) === review.revision,
        execute: () => ({
          kind: "basket_change",
          cart: execute(review).cart,
          outcome: `Basket updated. ${productName} quantity was set to ${quantity}.`,
        }),
        cancelledReceipt: () => ({
          kind: "basket_change",
          cart: cartService.getCart(sessionId),
          outcome: `Basket change cancelled. ${productName} quantity stayed at ${previousQuantity}.`,
        }),
      };
    },
  };
}
