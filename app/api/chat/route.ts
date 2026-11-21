import { type NextRequest, NextResponse } from "next/server";
import { cartService } from "@/modules/cart/service";
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

const guestSessionCookie = "guest_session";

function errorResponse(message: string, status: number) {
  const body: ChatErrorResponse = ChatErrorResponseSchema.parse({
    error: message,
  });
  return Response.json(body, { status });
}

export async function POST(request: NextRequest) {
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
  const cookieSessionId = request.cookies.get(guestSessionCookie)?.value;
  const guestSessionId = cartService.resolveGuestSession(cookieSessionId);
  const encoder = new TextEncoder();
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      function send(event: ChatStreamEvent) {
        if (!cancelled) {
          const safeEvent = ChatStreamEventSchema.parse(event);
          controller.enqueue(encoder.encode(`${JSON.stringify(safeEvent)}\n`));
        }
      }

      try {
        const result = await runChat(chatRequest.messages, {
          guestSessionId,
          onActivity(label) {
            send({ type: "activity", label });
          },
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
    },
    cancel() {
      cancelled = true;
    },
  });

  const response = new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
  if (guestSessionId !== cookieSessionId) {
    response.cookies.set(guestSessionCookie, guestSessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/api/chat",
      secure: request.nextUrl.protocol === "https:",
    });
  }
  return response;
}
