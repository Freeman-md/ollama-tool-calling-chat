import {
  ChatErrorResponseSchema,
  ChatRequestSchema,
  ChatSuccessResponseSchema,
  type ChatErrorResponse,
} from "../../../modules/chat/contract.ts";
import { ChatAgentError, runChat } from "../../../modules/chat/agent.ts";

function errorResponse(message: string, status: number) {
  const body: ChatErrorResponse = ChatErrorResponseSchema.parse({ error: message });
  return Response.json(body, { status });
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

  try {
    const result = await runChat(parsedRequest.data.messages);
    return Response.json(ChatSuccessResponseSchema.parse(result));
  } catch (error) {
    if (error instanceof ChatAgentError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse("Unable to reach local Ollama or generate a reply.", 502);
  }
}
