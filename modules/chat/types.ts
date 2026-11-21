import { z } from "zod";
import type { Tool } from "ollama";
import type { CartSnapshot } from "@/modules/cart/types";
import type { Product } from "@/modules/catalog/types";
import type {
  ChatErrorResponseSchema,
  ChatMessageSchema,
  ChatRequestSchema,
  ChatSuccessResponseSchema,
  ActivityLabelSchema,
  ChatStreamEventSchema,
} from "./contract";

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatSuccessResponse = z.infer<typeof ChatSuccessResponseSchema>;
export type ChatErrorResponse = z.infer<typeof ChatErrorResponseSchema>;
export type ActivityLabel = z.infer<typeof ActivityLabelSchema>;
export type ChatStreamEvent = z.infer<typeof ChatStreamEventSchema>;

export type ToolResult = {
  content: string;
  products?: Product[];
  eligibleProducts?: Product[];
  productView?: ChatSuccessResponse["productView"];
  cart?: CartSnapshot;
};
export type ToolRegistration = {
  definition: Tool;
  prepare(arguments_: unknown): () => ToolResult;
};
