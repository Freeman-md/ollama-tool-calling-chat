import { z } from "zod";
import { CartSnapshotSchema } from "@/modules/cart/types";

export const CheckoutReviewSchema = CartSnapshotSchema.extend({
  items: z
    .array(
      CartSnapshotSchema.shape.items.element.extend({
        unitPricePence: CartSnapshotSchema.shape.totalPence,
      }),
    )
    .min(1),
});

export type CheckoutReview = z.infer<typeof CheckoutReviewSchema>;
export type Order = CheckoutReview & { reference: string };
