import type { Tool } from "ollama";
import { z } from "zod";
import { CartQuantitySchema } from "@/modules/cart/types";
import { ToolDispatchError } from "@/modules/chat/errors";
import type { ApprovalRequiredToolRegistration } from "@/modules/chat/types";
import { prepareCartChange } from "./prepare-change";

export const name = "set_cart_quantity";
const schema = z.strictObject({
  productId: z
    .string()
    .trim()
    .min(1)
    .describe(
      "Exact catalog product ID. Search by product name if the ID is unknown.",
    ),
  quantity: CartQuantitySchema.describe(
    "New quantity. Use zero to remove the product.",
  ),
});

const definition: Tool = {
  type: "function",
  function: {
    name,
    description:
      "Propose setting the exact basket quantity for a product. Use zero to propose removing it. The shopper must approve.",
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
    prepare(arguments_) {
      const parsed = schema.safeParse(arguments_);
      if (!parsed.success) {
        throw new ToolDispatchError(
          "Provide a product ID and a whole-number quantity of zero or more.",
          400,
        );
      }

      return prepareCartChange(guestSessionId, parsed.data, "set");
    },
  };
}
