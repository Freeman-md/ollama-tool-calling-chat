import type { Tool } from "ollama";
import { z } from "zod";
import { searchPerfumes } from "@/modules/catalog/service";
import { ToolDispatchError } from "../errors";

export const name = "search_perfumes";
export const description =
  "Search the fictional perfume catalog when the user asks for a fragrance and provides a scent family, maximum price in GBP, or both. Do not call without at least one of these filters.";

export const searchPerfumesSchema = z
  .object({
    scentFamily: z.string().trim().toLowerCase().min(1).optional(),
    maxPriceGbp: z
      .union([z.number(), z.string().regex(/^\d+(?:\.\d{1,2})?$/)])
      .transform(Number)
      .pipe(
        z
          .number()
          .nonnegative()
          .max(Number.MAX_SAFE_INTEGER / 100)
          .multipleOf(0.01),
      )
      .optional(),
  })
  .refine(
    (filters) =>
      filters.scentFamily !== undefined || filters.maxPriceGbp !== undefined,
  );

export const definition: Tool = {
  type: "function",
  function: {
    name,
    description,
    parameters: z.toJSONSchema(searchPerfumesSchema, {
      io: "input",
    }) as Tool["function"]["parameters"],
  },
};

export const catalog = { searchPerfumes };

export function prepare(arguments_: unknown): () => string {
  const result = searchPerfumesSchema.safeParse(arguments_);
  if (!result.success) {
    throw new ToolDispatchError(
      "Provide a valid scent family or maximum price in GBP.",
      400,
    );
  }

  const { scentFamily, maxPriceGbp } = result.data;
  return () => {
    try {
      return JSON.stringify(
        catalog.searchPerfumes({
          scentFamily,
          maxPricePence:
            maxPriceGbp === undefined
              ? undefined
              : Math.round(maxPriceGbp * 100),
        }),
      );
    } catch {
      throw new ToolDispatchError(
        "Couldn’t check the perfume catalog. Try again.",
        502,
      );
    }
  };
}
