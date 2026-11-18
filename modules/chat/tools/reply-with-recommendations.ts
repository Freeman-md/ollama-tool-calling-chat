import type { Tool } from "ollama";
import { z } from "zod";
import type { Product } from "@/modules/catalog/types";
import { ChatAgentError } from "../errors";

export const name = "reply_with_recommendations";
export const description =
  "Finish the reply and highlight recommended product IDs from the latest search results. Call this tool alone after searching.";

export const schema = z.object({
  content: z.string().trim().min(1).describe("The final reply to the shopper."),
  recommendedProductIds: z
    .array(z.string().trim().min(1))
    .describe("IDs of recommended products from the latest search results."),
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

export function parseRecommendation({
  arguments_,
  toolCallCount,
  eligibleProducts,
  products,
}: {
  arguments_: unknown;
  toolCallCount: number;
  eligibleProducts: Product[] | undefined;
  products: Product[] | undefined;
}): { content: string; recommendedProductIds: string[] } {
  if (toolCallCount !== 1) {
    throw new ChatAgentError(
      "The recommendation reply must be called on its own.",
      502,
    );
  }
  if (!eligibleProducts?.length) {
    throw new ChatAgentError(
      "Recommendations require eligible search results.",
      502,
    );
  }

  const result = schema.safeParse(arguments_);
  if (!result.success) {
    throw new ChatAgentError(
      "Ollama returned an invalid recommendation reply.",
      502,
    );
  }

  const eligibleIds = new Set(eligibleProducts.map((product) => product.id));
  const displayedIds = new Set((products ?? []).map((product) => product.id));
  const recommendedProductIds = [
    ...new Set(result.data.recommendedProductIds),
  ].filter((id) => eligibleIds.has(id) && displayedIds.has(id));

  return { content: result.data.content, recommendedProductIds };
}
