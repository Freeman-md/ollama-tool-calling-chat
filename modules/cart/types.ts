import { z } from "zod";

export const CartQuantitySchema = z.number().int().nonnegative();
export const PositiveCartQuantitySchema = z.number().int().positive();

export const CartSnapshotSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      quantity: PositiveCartQuantitySchema,
    }),
  ),
  totalPence: z.number().int().nonnegative(),
  currency: z.literal("GBP"),
});

export type CartSnapshot = z.infer<typeof CartSnapshotSchema>;
