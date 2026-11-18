import {
  ChatErrorResponseSchema,
  ChatRequestSchema,
  ChatSuccessResponseSchema,
} from "@/modules/chat/contract";
import type { ChatMessage, ChatSuccessResponse } from "@/modules/chat/types";

const unavailableMessage =
  "Couldn’t get a reply from local Ollama. Check that Ollama is running, then try again.";

export async function requestChat(
  messages: ChatMessage[],
): Promise<ChatSuccessResponse> {
  const requestBody = ChatRequestSchema.parse({ messages });
  let response: Response;
  let responseBody: unknown;

  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    responseBody = await response.json();
  } catch {
    throw new Error(unavailableMessage);
  }

  if (!response.ok) {
    const error = ChatErrorResponseSchema.safeParse(responseBody);
    throw new Error(error.success ? error.data.error : unavailableMessage);
  }

  const result = ChatSuccessResponseSchema.safeParse(responseBody);
  if (!result.success) throw new Error(unavailableMessage);
  return result.data;
}
