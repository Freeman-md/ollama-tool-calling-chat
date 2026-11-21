import {
  ApprovalRequestSchema,
  ApprovalResponseSchema,
  ChatErrorResponseSchema,
  ChatRequestSchema,
  ChatStreamEventSchema,
} from "@/modules/chat/contract";
import type {
  ActivityLabel,
  ApprovalRequest,
  ApprovalResponse,
  ChatMessage,
  ChatSuccessResponse,
} from "@/modules/chat/types";

const unavailableMessage =
  "Couldn’t get a reply from local Ollama. Check that Ollama is running, then try again.";

const approvalUnavailable = "Couldn’t confirm your basket decision. Try again.";

export class ApprovalRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApprovalRequestError";
  }
}

export async function requestApproval(
  approval: ApprovalRequest,
): Promise<ApprovalResponse> {
  const requestBody = ApprovalRequestSchema.parse(approval);
  let response: Response;
  try {
    response = await fetch("/api/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
  } catch {
    throw new Error(approvalUnavailable);
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = ChatErrorResponseSchema.safeParse(body);
    throw new ApprovalRequestError(
      error.success ? error.data.error : approvalUnavailable,
      response.status,
    );
  }

  const result = ApprovalResponseSchema.safeParse(body);
  if (!result.success) {
    throw new Error(approvalUnavailable);
  }
  return result.data;
}

export async function requestChat(
  messages: ChatMessage[],
  onActivity?: (label: ActivityLabel) => void,
): Promise<ChatSuccessResponse> {
  const requestBody = ChatRequestSchema.parse({ messages });
  let response: Response;

  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
  } catch {
    throw new Error(unavailableMessage);
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const error = ChatErrorResponseSchema.safeParse(body);
    throw new Error(error.success ? error.data.error : unavailableMessage);
  }

  if (!response.body) {
    throw new Error(unavailableMessage);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { value, done } = await reader.read().catch(() => {
        throw new Error(unavailableMessage);
      });
      if (done) {
        throw new Error(unavailableMessage);
      }
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf("\n");
      while (newline !== -1) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        let parsed: unknown;
        try {
          parsed = JSON.parse(line);
        } catch {
          throw new Error(unavailableMessage);
        }
        const event = ChatStreamEventSchema.safeParse(parsed);
        if (!event.success) {
          throw new Error(unavailableMessage);
        }
        if (event.data.type === "activity") {
          onActivity?.(event.data.label);
        } else if (event.data.type === "error") {
          throw new Error(event.data.error);
        } else {
          return event.data.data;
        }
        newline = buffer.indexOf("\n");
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
}
