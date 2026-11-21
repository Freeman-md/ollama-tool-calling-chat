import type { Tool } from "ollama";
import { z } from "zod";
import { cartService } from "@/modules/cart/service";
import { ToolDispatchError } from "@/modules/chat/errors";
import type { ToolRegistration } from "@/modules/chat/types";

export const name = "get_cart";
const schema = z.strictObject({});

const definition: Tool = {
  type: "function",
  function: {
    name,
    description:
      "Read the current shopper's basket, including its items, quantities and total in GBP pence. Call this whenever the shopper asks about their basket.",
    parameters: z.toJSONSchema(schema, {
      io: "input",
    }) as Tool["function"]["parameters"],
  },
};

export function forGuestSession(guestSessionId: string): ToolRegistration {
  return {
    definition,
    prepare(arguments_) {
      if (!schema.safeParse(arguments_).success) {
        throw new ToolDispatchError(
          "Request the current basket without arguments.",
          400,
        );
      }

      return () => {
        const cart = cartService.getCart(guestSessionId);
        return { content: JSON.stringify(cart), cart };
      };
    },
  };
}
