import { z } from "zod";
import { ProductSchema } from "@/modules/catalog/types";

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
});

export const ChatSuccessResponseSchema = z.object({
  content: z.string(),
  toolNames: z.array(z.string()).optional(),
  toolName: z.string().optional(),
  products: z.array(ProductSchema).optional(),
  recommendedProductIds: z.array(z.string()).optional(),
});

export const ChatErrorResponseSchema = z.object({
  error: z.string(),
});
