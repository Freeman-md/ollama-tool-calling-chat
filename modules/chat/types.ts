import { z } from "zod";
import type { Tool } from "ollama";
import type { Product } from "@/modules/catalog/types";
import type {
  ChatErrorResponseSchema,
  ChatMessageSchema,
  ChatRequestSchema,
  ChatSuccessResponseSchema,
} from "./contract";

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatSuccessResponse = z.infer<typeof ChatSuccessResponseSchema>;
export type ChatErrorResponse = z.infer<typeof ChatErrorResponseSchema>;

export type ToolResult = {
  content: string;
  products: Product[];
  eligibleProducts?: Product[];
  productView?: ChatSuccessResponse["productView"];
};
export type ToolRegistration = {
  definition: Tool;
  prepare(arguments_: unknown): () => ToolResult;
};
