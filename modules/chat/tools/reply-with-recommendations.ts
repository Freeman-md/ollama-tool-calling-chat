import type { Tool } from "ollama";
import { z } from "zod";

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
