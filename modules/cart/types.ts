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

export const BasketChangeSchema = z.object({
  productName: z.string(),
  previousQuantity: CartQuantitySchema,
  quantity: CartQuantitySchema,
  totalPence: CartSnapshotSchema.shape.totalPence,
  currency: CartSnapshotSchema.shape.currency,
});

export type BasketChange = z.infer<typeof BasketChangeSchema>;
