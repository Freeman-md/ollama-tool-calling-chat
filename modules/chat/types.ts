import { z } from "zod";
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
