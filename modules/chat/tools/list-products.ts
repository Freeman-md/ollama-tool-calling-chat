import type { Tool } from "ollama";
import { z } from "zod";
import { listProducts } from "@/modules/catalog/service";
import type { ToolRegistration, ToolResult } from "../types";
import { ToolDispatchError } from "../errors";

export const name = "list_products";
export const description =
  "Browse products in the fictional catalog. Returns up to three products by default.";

export const schema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Maximum number of products to list."),
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
    throw new ToolDispatchError("Provide a valid positive product limit.", 400);
  return () => {
    try {
      const products = listProducts(result.data);
      return { content: JSON.stringify(products), products };
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
