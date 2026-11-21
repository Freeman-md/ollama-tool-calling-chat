import { z } from "zod";
import type { Tool } from "ollama";
import type { CartSnapshot } from "@/modules/cart/types";
import type { Product } from "@/modules/catalog/types";
import type {
  ApprovalProposalSchema,
  ApprovalRequestSchema,
  ApprovalResponseSchema,
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
export type ApprovalProposal = z.infer<typeof ApprovalProposalSchema>;
export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;
export type ApprovalResponse = z.infer<typeof ApprovalResponseSchema>;

export type ToolResult = {
  content: string;
  products?: Product[];
  eligibleProducts?: Product[];
  productView?: ChatSuccessResponse["productView"];
  cart?: CartSnapshot;
};
export type ApprovalAction = {
  preview: ApprovalProposal["preview"];
  isCurrent(): boolean;
  execute(): ToolResult;
};

export type PreparedWrite = {
  execute(): ToolResult;
  review(): ApprovalAction;
};

type DirectToolRegistration = {
  definition: Tool;
  prepare(arguments_: unknown): () => ToolResult;
} & (
  { effect: "read"; approval?: never } | { effect: "write"; approval: "skip" }
);

export type ApprovalRequiredToolRegistration = {
  definition: Tool;
  effect: "write";
  approval?: "required";
  prepare(arguments_: unknown): PreparedWrite;
};

export type ToolRegistration =
  DirectToolRegistration | ApprovalRequiredToolRegistration;
