import type { Tool } from "ollama";
import { z } from "zod";
import { searchPerfumes } from "@/modules/catalog/service";
import { ToolDispatchError } from "../errors";

type CatalogFilters = Parameters<typeof searchPerfumes>[0];

export const name = "search_perfumes";
export const description =
  "Search the fictional perfume catalog by scent family or price in GBP. Provide at least one filter.";

export const poundsValueSchema = z
  .number()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER / 100)
  .multipleOf(0.01);

export const moneySchema = z
  .union([z.number(), z.string().regex(/^\d+(?:\.\d{1,2})?$/)])
  .transform(Number)
  .pipe(poundsValueSchema);

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

function poundsToPence(pounds: number): number {
  return Math.round(pounds * 100);
}

export function toCatalogFilters({
  scentFamily,
  maxPriceGbp,
  underPriceGbp,
  overPriceGbp,
}: z.output<typeof searchPerfumesSchema>): CatalogFilters {
  const filters: CatalogFilters = {
    scentFamily,
    maxPricePence: undefined,
  };

  if (maxPriceGbp !== undefined) {
    filters.maxPricePence = poundsToPence(maxPriceGbp);
  }

  if (underPriceGbp !== undefined) {
    // The catalog uses inclusive pence bounds, so exclude the specified price.
    const underPricePence = poundsToPence(underPriceGbp) - 1;
    const isStricterLimit =
      filters.maxPricePence === undefined ||
      underPricePence < filters.maxPricePence;
    if (isStricterLimit) {
      filters.maxPricePence = underPricePence;
    }
  }

  if (overPriceGbp !== undefined) {
    filters.minPricePence = poundsToPence(overPriceGbp) + 1;
  }

  return filters;
}

export function prepare(arguments_: unknown) {
  const result = searchPerfumesSchema.safeParse(arguments_);
  if (!result.success) {
    throw new ToolDispatchError(
      "Provide a valid scent family or maximum price in GBP.",
      400,
    );
  }

  const filters = toCatalogFilters(result.data);

  return () => {
    try {
      const matches = catalog.searchPerfumes(filters);
      const catalogDetails = matches.map(
        ({ id, name, pricePence, scentFamily, notes }) => ({
          id,
          name,
          pricePence,
          scentFamily,
          notes,
        }),
      );
      return {
        content: JSON.stringify(catalogDetails),
        perfumeMatches: matches,
      };
    } catch {
      throw new ToolDispatchError(
        "Couldn’t check the perfume catalog. Try again.",
        502,
      );
    }
  };
}
