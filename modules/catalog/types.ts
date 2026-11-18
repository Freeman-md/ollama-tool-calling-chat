import { z } from "zod";

export const ProductSchema = z.discriminatedUnion("category", [
  z.object({
    id: z.string(),
    name: z.string(),
    category: z.literal("perfume"),
    description: z.string(),
    pricePence: z.number().int().nonnegative(),
    image: z.object({ src: z.string(), alt: z.string() }),
    availability: z.enum(["in_stock", "out_of_stock"]),
    details: z.object({
      scentFamily: z.string(),
      notes: z.array(z.string()),
      bottleSizeMl: z.number().positive(),
    }),
  }),
]);

export type Product = z.infer<typeof ProductSchema>;
