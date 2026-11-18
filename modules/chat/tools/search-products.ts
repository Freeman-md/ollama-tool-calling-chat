import type { Tool } from "ollama";
import { z } from "zod";
import { searchProducts } from "@/modules/catalog/service";
import { ToolDispatchError } from "../errors";
import {
  moneySchema,
  poundsValueSchema,
  toCatalogFilters,
} from "./search-perfumes";

const productMoneySchema = z.union([
  moneySchema,
  z
    .string()
    .regex(/^£\d+(?:\.\d{1,2})?$/)
    .transform((value) => Number(value.slice(1)))
    .pipe(poundsValueSchema),
]);

export const name = "search_products";
export const description =
  "Search products by name, category, scent family or price. Provide at least one filter; use names to find product IDs.";
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
      .describe("Product category, such as perfume."),
    scentFamily: z.string().trim().toLowerCase().min(1).optional(),
    maxPriceGbp: productMoneySchema
      .optional()
      .describe("Inclusive maximum price in GBP, such as £40 or less."),
    underPriceGbp: productMoneySchema
      .optional()
      .describe("Strict upper price in GBP, such as under £40."),
    overPriceGbp: productMoneySchema
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

export function prepare(arguments_: unknown) {
  const result = schema.safeParse(arguments_);
  if (!result.success)
    throw new ToolDispatchError("Provide valid product search filters.", 400);
  const filters = {
    ...toCatalogFilters(result.data),
    name: result.data.name,
    category: result.data.category,
  };
  return () => {
    try {
      const products = searchProducts(filters);
      return { content: JSON.stringify(products), products };
    } catch {
      throw new ToolDispatchError(
        "Couldn’t check the product catalog. Try again.",
        502,
      );
    }
  };
}
