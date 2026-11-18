import {
  ChatErrorResponseSchema,
  ChatRequestSchema,
  ChatStreamEventSchema,
} from "@/modules/chat/contract";
import type {
  ChatErrorResponse,
  ChatRequest,
  ChatStreamEvent,
} from "@/modules/chat/types";
import { ChatAgentError } from "@/modules/chat/errors";
import { runChat } from "@/modules/chat/agent";

function errorResponse(message: string, status: number) {
  const body: ChatErrorResponse = ChatErrorResponseSchema.parse({
    error: message,
  });
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

  const chatRequest: ChatRequest = parsedRequest.data;
  const encoder = new TextEncoder();
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      function send(event: ChatStreamEvent) {
        if (!cancelled) {
          const safeEvent = ChatStreamEventSchema.parse(event);
          controller.enqueue(encoder.encode(`${JSON.stringify(safeEvent)}\n`));
        }
      }

      void (async () => {
        try {
          const result = await runChat(chatRequest.messages, (label) => {
            send({ type: "activity", label });
          });
          send({ type: "complete", data: result });
        } catch (error) {
          const message =
            error instanceof ChatAgentError
              ? error.message
              : "Unable to reach local Ollama or generate a reply.";
          send({ type: "error", error: message });
        } finally {
          if (!cancelled) {
            controller.close();
          }
        }
      })();
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
