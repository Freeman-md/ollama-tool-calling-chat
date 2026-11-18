import { z } from "zod";

export const AvailabilitySchema = z.enum(["in_stock", "out_of_stock"]);

const sharedFields = {
  id: z.string(),
  name: z.string(),
  description: z.string(),
  pricePence: z.number().int().nonnegative(),
  image: z.object({ src: z.string(), alt: z.string() }),
  availability: AvailabilitySchema,
};

export const ProductSchema = z.discriminatedUnion("category", [
  z.object({
    ...sharedFields,
    category: z.literal("perfume"),
    details: z.object({
      scentFamily: z.string(),
      notes: z.array(z.string()),
      bottleSizeMl: z.number().positive(),
    }),
  }),
  z.object({
    ...sharedFields,
    category: z.literal("watch"),
    details: z.object({
      movement: z.string(),
      caseDiameterMm: z.number().positive(),
      strapMaterial: z.string(),
    }),
  }),
  z.object({
    ...sharedFields,
    category: z.literal("jewellery"),
    details: z.object({
      pieceType: z.string(),
      material: z.string(),
      lengthCm: z.number().positive(),
    }),
  }),
]);

export type Product = z.infer<typeof ProductSchema>;
