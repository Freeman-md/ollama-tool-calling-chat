import type { Tool } from "ollama";
import { z } from "zod";
import { cartService } from "@/modules/cart/service";
import { CartQuantitySchema } from "@/modules/cart/types";
import { ToolDispatchError } from "@/modules/chat/errors";
import type { ToolRegistration } from "@/modules/chat/types";

export const name = "set_cart_quantity";
const schema = z.strictObject({
  productId: z.string().trim().min(1).describe("Exact catalog product ID."),
  quantity: CartQuantitySchema.describe(
    "New quantity. Use zero to remove the product.",
  ),
});

const definition: Tool = {
  type: "function",
  function: {
    name,
    description:
      "Set the exact quantity of an in-stock product in the current shopper's basket.",
    parameters: z.toJSONSchema(schema, {
      io: "input",
    }) as Tool["function"]["parameters"],
  },
};

export function forGuestSession(guestSessionId: string): ToolRegistration {
  return {
    definition,
    prepare(arguments_) {
      const parsed = schema.safeParse(arguments_);
      if (!parsed.success) {
        throw new ToolDispatchError(
          "Provide a product ID and a whole-number quantity of zero or more.",
          400,
        );
      }

      return () => {
        const result = cartService.setCartQuantity(guestSessionId, parsed.data);
        if ("error" in result) {
          throw new ToolDispatchError(result.error, 400);
        }
        return { content: JSON.stringify(result.cart), cart: result.cart };
      };
    },
  };
}
