import {
  cartService,
  type CartOperation,
  type CartReview,
} from "@/modules/cart/service";
import { ToolDispatchError } from "@/modules/chat/errors";
import type { PreparedWrite, ToolResult } from "@/modules/chat/types";

export function prepareCartChange(
  sessionId: string,
  item: { productId: string; quantity: number },
  operation: CartOperation,
): PreparedWrite {
  const update =
    operation === "add" ? cartService.addToCart : cartService.setCartQuantity;

  function execute(review?: CartReview): ToolResult {
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
      return {
        preview: { kind: "basket_change", ...review.preview },
        isCurrent: () => cartService.getRevision(sessionId) === review.revision,
        execute: () => execute(review),
      };
    },
  };
}
