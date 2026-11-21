import { z } from "zod";

export const CartSnapshotSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      quantity: z.number().int().positive(),
    }),
  ),
  totalPence: z.number().int().nonnegative(),
  currency: z.literal("GBP"),
});

export type CartSnapshot = z.infer<typeof CartSnapshotSchema>;
