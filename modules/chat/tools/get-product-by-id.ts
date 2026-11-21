import type { Tool } from "ollama";
import { z } from "zod";
import { getProductById } from "@/modules/catalog/service";
import type { ToolRegistration, ToolResult } from "../types";
import { ToolDispatchError } from "../errors";

export const name = "get_product_by_id";
export const description =
  "Get product details and availability by catalog ID. Search by name first if the ID is unknown.";

export const schema = z.object({
  id: z.string().trim().min(1).describe("Exact catalog product ID."),
  view: z
    .enum(["compact", "detailed"])
    .optional()
    .describe(
      "Use detailed when the shopper asks for more product information; use compact for availability alone. Defaults to compact.",
    ),
});

export const definition: Tool = {
  type: "function",
  function: {
    name,
    description,
    parameters: z.toJSONSchema(schema, {
      io: "input",
    }) as Tool["function"]["parameters"],
  },
};

export function prepare(arguments_: unknown): () => ToolResult {
  const result = schema.safeParse(arguments_);
  if (!result.success)
    throw new ToolDispatchError("Provide a valid product ID.", 400);
  return () => {
    try {
      const product = getProductById(result.data.id);
      return {
        content: JSON.stringify(product),
        products: product ? [product] : [],
        productView: result.data.view ?? "compact",
      };
    } catch {
      throw new ToolDispatchError(
        "Couldn’t check the product catalog. Try again.",
        502,
      );
    }
  };
}

export const tool = {
  definition,
  effect: "read",
  prepare,
} satisfies ToolRegistration;
