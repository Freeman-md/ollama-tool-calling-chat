import type { Tool } from "ollama";
import { z } from "zod";
import { searchPerfumes } from "@/modules/catalog/service";
import { ToolDispatchError } from "../errors";

export const name = "search_perfumes";
export const description =
  "Search the fictional perfume catalog by scent family or price in GBP. Provide at least one filter.";

const moneySchema = z
  .union([z.number(), z.string().regex(/^\d+(?:\.\d{1,2})?$/)])
  .transform(Number)
  .pipe(
    z
      .number()
      .nonnegative()
      .max(Number.MAX_SAFE_INTEGER / 100)
      .multipleOf(0.01),
  );

export const searchPerfumesSchema = z
  .object({
    scentFamily: z.string().trim().toLowerCase().min(1).optional(),
    maxPriceGbp: moneySchema
      .optional()
      .describe("Maximum price in GBP, inclusive: use for '£40 or less'."),
    underPriceGbp: moneySchema
      .optional()
      .describe(
        "Strict upper price in GBP: use for 'under £40', excluding £40.",
      ),
    overPriceGbp: moneySchema
      .refine((amount) => Math.round(amount * 100) < Number.MAX_SAFE_INTEGER)
      .optional()
      .describe(
        "Strict lower price in GBP: use for 'above £40' or 'over £40', excluding £40.",
      ),
  })
  .refine(
    (filters) =>
      filters.scentFamily !== undefined ||
      filters.maxPriceGbp !== undefined ||
      filters.underPriceGbp !== undefined ||
      filters.overPriceGbp !== undefined,
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

  const { scentFamily, maxPriceGbp, underPriceGbp, overPriceGbp } = result.data;
  const maxPricePence =
    maxPriceGbp === undefined ? undefined : Math.round(maxPriceGbp * 100);
  const underPricePence =
    underPriceGbp === undefined
      ? undefined
      : Math.round(underPriceGbp * 100) - 1;
  const minPricePence =
    overPriceGbp === undefined ? undefined : Math.round(overPriceGbp * 100) + 1;
  let upperBound = maxPricePence;
  if (
    underPricePence !== undefined &&
    (upperBound === undefined || underPricePence < upperBound)
  ) {
    upperBound = underPricePence;
  }
  return () => {
    try {
      return JSON.stringify(
        catalog.searchPerfumes({
          scentFamily,
          ...(minPricePence === undefined ? {} : { minPricePence }),
          maxPricePence: upperBound,
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
