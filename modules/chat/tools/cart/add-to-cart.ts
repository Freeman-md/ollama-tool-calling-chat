import type { Tool } from "ollama";
import { z } from "zod";
import { PositiveCartQuantitySchema } from "@/modules/cart/types";
import { ToolDispatchError } from "@/modules/chat/errors";
import type { ApprovalRequiredToolRegistration } from "@/modules/chat/types";
import { prepareCartChange } from "./prepare-change";

export const name = "add_to_cart";
const schema = z.strictObject({
  productId: z
    .string()
    .trim()
    .min(1)
    .describe(
      "Exact catalog product ID. Search by product name if the ID is unknown.",
    ),
  quantity: PositiveCartQuantitySchema.describe("Number of units to add."),
});

const definition: Tool = {
  type: "function",
  function: {
    name,
    description:
      "Propose adding units of an in-stock product to the shopper's basket for approval.",
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
          "Provide a product ID and a positive whole-number quantity.",
          400,
        );
      }

      return prepareCartChange(guestSessionId, parsed.data, "add");
    },
  };
}
