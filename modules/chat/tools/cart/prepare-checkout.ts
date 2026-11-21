import type { Tool } from "ollama";
import { z } from "zod";
import { cartService } from "@/modules/cart/service";
import { ToolDispatchError } from "@/modules/chat/errors";
import type { ApprovalRequiredToolRegistration } from "@/modules/chat/types";

export const name = "prepare_checkout";
const schema = z.strictObject({});

const definition: Tool = {
  type: "function",
  function: {
    name,
    description:
      "Review the shopper's current basket for checkout. The shopper must choose Place order on the review to place an order.",
    parameters: z.toJSONSchema(schema, {
      io: "input",
    }) as Tool["function"]["parameters"],
  },
};

export function forGuestSession(
  guestSessionId: string,
): ApprovalRequiredToolRegistration {
  return {
    definition,
    effect: "write",
    approval: "required",
    prepare(arguments_) {
      if (!schema.safeParse(arguments_).success) {
        throw new ToolDispatchError("Request checkout without arguments.", 400);
      }

      return {
        review() {
          const review = cartService.reviewCheckout(guestSessionId);
          if ("error" in review) {
            throw new ToolDispatchError(review.error, 400);
          }

          return {
            preview: { kind: "checkout", ...review.preview },
            buttons: { approve: "Place order", cancel: "Cancel" },
            execute() {
              const result = cartService.placeOrder(guestSessionId, review);
              if ("error" in result) {
                throw new ToolDispatchError(result.error, 409);
              }
              return {
                kind: "order_placed",
                orderReference: result.orderReference,
                outcome: `Order ${result.orderReference} was placed. Your basket is empty.`,
              };
            },
            cancelledReceipt: () => ({
              kind: "checkout_cancelled",
              outcome: "Checkout cancelled. Your basket is unchanged.",
            }),
          };
        },
      };
    },
  };
}
