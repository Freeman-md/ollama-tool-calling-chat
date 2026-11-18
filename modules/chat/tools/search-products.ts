import type { Tool } from "ollama";
import { z } from "zod";
import { searchProducts } from "@/modules/catalog/service";
import { AvailabilitySchema } from "@/modules/catalog/types";
import type { ToolRegistration, ToolResult } from "../types";
import { ToolDispatchError } from "../errors";

export const name = "search_products";
export const description =
  "Search products by name, category, availability, scent family or price. Provide at least one filter; use names to find product IDs.";

export const gbpAmountSchema = z
  .union([z.number(), z.string().regex(/^£?\d+(?:\.\d{1,2})?$/)])
  .transform((value) =>
    typeof value === "string" ? Number(value.replace(/^£/, "")) : value,
  )
  .pipe(
    z
      .number()
      .nonnegative()
      .max(Number.MAX_SAFE_INTEGER / 100)
      .multipleOf(0.01),
  );

export const schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe("Product name or part of its name."),
    category: z
      .string()
      .trim()
      .toLowerCase()
      .min(1)
      .optional()
      .describe("Product category: perfume, watch or jewellery."),
    availability: AvailabilitySchema.optional().describe(
      "Availability: in_stock or out_of_stock.",
    ),
    scentFamily: z.string().trim().toLowerCase().min(1).optional(),
    maxPriceGbp: gbpAmountSchema
      .optional()
      .describe("Inclusive maximum price in GBP, such as £40 or less."),
    underPriceGbp: gbpAmountSchema
      .optional()
      .describe("Strict upper price in GBP, such as under £40."),
    overPriceGbp: gbpAmountSchema
      .refine((amount) => Math.round(amount * 100) < Number.MAX_SAFE_INTEGER)
      .optional()
      .describe("Strict lower price in GBP, such as above £40."),
  })
  .refine((filters) =>
    Object.values(filters).some((value) => value !== undefined),
  );

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

function toCatalogFilters({
  scentFamily,
  maxPriceGbp,
  underPriceGbp,
  overPriceGbp,
}: z.output<typeof schema>): Parameters<typeof searchProducts>[0] {
  const filters: Parameters<typeof searchProducts>[0] = { scentFamily };
  if (maxPriceGbp !== undefined)
    filters.maxPricePence = Math.round(maxPriceGbp * 100);
  if (underPriceGbp !== undefined) {
    const strictMaximum = Math.round(underPriceGbp * 100) - 1;
    if (
      filters.maxPricePence === undefined ||
      strictMaximum < filters.maxPricePence
    )
      filters.maxPricePence = strictMaximum;
  }
  if (overPriceGbp !== undefined)
    filters.minPricePence = Math.round(overPriceGbp * 100) + 1;
  return filters;
}

export function prepare(arguments_: unknown): () => ToolResult {
  const result = schema.safeParse(arguments_);
  if (!result.success)
    throw new ToolDispatchError("Provide valid product search filters.", 400);
  const filters = {
    ...toCatalogFilters(result.data),
    name: result.data.name,
    category: result.data.category,
    availability: result.data.availability,
  };
  return () => {
    try {
      const products = searchProducts(filters);
      return {
        content: JSON.stringify(products),
        products,
        eligibleProducts: products,
      };
    } catch {
      throw new ToolDispatchError(
        "Couldn’t check the product catalog. Try again.",
        502,
      );
    }
  };
}

export const tool = { definition, prepare } satisfies ToolRegistration;
