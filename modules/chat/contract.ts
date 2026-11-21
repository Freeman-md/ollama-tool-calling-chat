import { z } from "zod";
import { BasketChangeSchema, CartSnapshotSchema } from "@/modules/cart/types";
import { ProductSchema } from "@/modules/catalog/types";

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
});

export const ProductViewSchema = z.enum(["compact", "detailed"]);

export const ApprovalProposalSchema = z.object({
  id: z.uuid(),
  expiresAt: z.number().int().positive(),
  preview: BasketChangeSchema.extend({ kind: z.literal("basket_change") }),
});

export const ApprovalRequestSchema = z.strictObject({
  proposalId: z.uuid(),
  decision: z.enum(["approve", "cancel"]),
});

export const ApprovalResponseSchema = z.object({
  status: z.enum(["approved", "cancelled"]),
  cart: CartSnapshotSchema,
});

export const ChatSuccessResponseSchema = z.object({
  content: z.string(),
  toolNames: z.array(z.string()).optional(),
  toolName: z.string().optional(),
  products: z.array(ProductSchema).optional(),
  productView: ProductViewSchema.optional(),
  recommendedProductIds: z.array(z.string()).optional(),
  cart: CartSnapshotSchema.optional(),
  approvals: z.array(ApprovalProposalSchema).optional(),
});

export const ChatErrorResponseSchema = z.object({
  error: z.string(),
});

export const ActivityLabelSchema = z.enum([
  "Browsing the catalog…",
  "Searching products…",
  "Checking product details…",
  "Checking your basket…",
]);

export const ChatStreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("activity"), label: ActivityLabelSchema }),
  z.object({
    type: z.literal("complete"),
    data: ChatSuccessResponseSchema.omit({ toolNames: true, toolName: true }),
  }),
  z.object({ type: z.literal("error"), error: z.string() }),
]);
