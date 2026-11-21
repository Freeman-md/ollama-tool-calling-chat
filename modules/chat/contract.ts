import { z } from "zod";
import { BasketChangeSchema, CartSnapshotSchema } from "@/modules/cart/types";
import { ProductSchema } from "@/modules/catalog/types";

export const ChatMessageSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("user"),
    content: z.string(),
    approvalProposalId: z.uuid().optional(),
  }),
  z.object({ role: z.literal("assistant"), content: z.string() }),
]);

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
});

export const ApprovalReplyRequestSchema = z.strictObject({
  replyToApproval: z.uuid(),
});

export const ProductViewSchema = z.enum(["compact", "detailed"]);

export const ApprovalProposalSchema = z.object({
  id: z.uuid(),
  expiresAt: z.number().int().positive(),
  buttons: z.object({ approve: z.string().min(1), cancel: z.string().min(1) }),
  preview: z.discriminatedUnion("kind", [
    BasketChangeSchema.extend({ kind: z.literal("basket_change") }),
    z.object({
      kind: z.literal("read"),
      title: z.string(),
      description: z.string(),
    }),
  ]),
});

export const ApprovalRequestSchema = z.strictObject({
  proposalId: z.uuid(),
  decision: z.enum(["approve", "cancel"]),
});

export const ApprovalResultSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("basket_change"),
    outcome: z.string(),
    cart: CartSnapshotSchema,
  }),
  z.object({ kind: z.literal("read"), outcome: z.string() }),
]);

export const ApprovalResponseSchema = ApprovalResultSchema.and(
  z.object({
    proposalId: z.uuid(),
    buttonLabel: z.string().min(1),
    status: z.enum(["approved", "cancelled"]),
  }),
);

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
