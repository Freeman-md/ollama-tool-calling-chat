import {
  ChatErrorResponseSchema,
  ChatRequestSchema,
  ChatSuccessResponseSchema,
} from "@/modules/chat/contract";
import type { ChatErrorResponse, ChatRequest, ChatSuccessResponse } from "@/modules/chat/types";
import { ChatAgentError } from "@/modules/chat/errors";
import { runChat } from "@/modules/chat/agent";

function errorResponse(message: string, status: number) {
  const body: ChatErrorResponse = ChatErrorResponseSchema.parse({ error: message });
  return Response.json(body, { status });
}

function successResponse(result: ChatSuccessResponse) {
  const body: ChatSuccessResponse = ChatSuccessResponseSchema.parse(result);
  return Response.json(body);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  const parsedRequest = ChatRequestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return errorResponse("Messages must be a non-empty chat history.", 400);
  }

  const chatRequest: ChatRequest = parsedRequest.data;

  try {
    const result = await runChat(chatRequest.messages);
    return successResponse(result);
  } catch (error) {
    if (error instanceof ChatAgentError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse("Unable to reach local Ollama or generate a reply.", 502);
  }
}
