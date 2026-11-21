import { z } from "zod";
import type { Tool } from "ollama";
import type { CartSnapshot } from "@/modules/cart/types";
import type { Product } from "@/modules/catalog/types";
import type {
  ApprovalProposalSchema,
  ApprovalReplyRequestSchema,
  ApprovalRequestSchema,
  ApprovalResponseSchema,
  ApprovalResultSchema,
  ChatErrorResponseSchema,
  ChatMessageSchema,
  ChatRequestSchema,
  ChatSuccessResponseSchema,
  ActivityLabelSchema,
  ChatStreamEventSchema,
} from "./contract";

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ApprovalReplyRequest = z.infer<typeof ApprovalReplyRequestSchema>;
export type ChatSuccessResponse = z.infer<typeof ChatSuccessResponseSchema>;
export type ChatErrorResponse = z.infer<typeof ChatErrorResponseSchema>;
export type ActivityLabel = z.infer<typeof ActivityLabelSchema>;
export type ChatStreamEvent = z.infer<typeof ChatStreamEventSchema>;
export type ApprovalProposal = z.infer<typeof ApprovalProposalSchema>;
export type ApprovalRequest = z.infer<typeof ApprovalRequestSchema>;
export type ApprovalReceipt = z.infer<typeof ApprovalResponseSchema>;
export type ApprovalResult = z.infer<typeof ApprovalResultSchema>;

export type ToolResult = {
  content: string;
  products?: Product[];
  eligibleProducts?: Product[];
  productView?: ChatSuccessResponse["productView"];
  cart?: CartSnapshot;
};
export type ApprovalAction = {
  preview: ApprovalProposal["preview"];
  buttons: ApprovalProposal["buttons"];
  isCurrent(): boolean;
  execute(): ApprovalResult;
  cancelledReceipt(): ApprovalResult;
};

export type PreparedApproval = {
  execute(): ToolResult;
  review(): ApprovalAction;
};

type DirectToolRegistration = {
  definition: Tool;
  prepare(arguments_: unknown): () => ToolResult;
} & (
  { effect: "read"; approval?: "skip" } | { effect: "write"; approval: "skip" }
);

export type ApprovalRequiredToolRegistration = {
  definition: Tool;
  prepare(arguments_: unknown): PreparedApproval;
} & (
  | { effect: "read"; approval: "required" }
  | { effect: "write"; approval?: "required" }
);

export type ToolRegistration =
  DirectToolRegistration | ApprovalRequiredToolRegistration;
