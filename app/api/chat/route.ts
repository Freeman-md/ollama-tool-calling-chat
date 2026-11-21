import { type NextRequest, NextResponse } from "next/server";
import { cartService } from "@/modules/cart/service";
import { approvalService } from "@/modules/chat/approvals";
import {
  ApprovalReplyRequestSchema,
  ApprovalRequestSchema,
  ApprovalResponseSchema,
  ChatErrorResponseSchema,
  ChatRequestSchema,
  ChatStreamEventSchema,
} from "@/modules/chat/contract";
import type {
  ActivityLabel,
  ChatErrorResponse,
  ChatStreamEvent,
  ChatSuccessResponse,
} from "@/modules/chat/types";
import { ChatAgentError, ToolDispatchError } from "@/modules/chat/errors";
import { runApprovalReply, runChat } from "@/modules/chat/agent";

const guestSessionCookie = "guest_session";

function errorResponse(message: string, status: number) {
  const body: ChatErrorResponse = ChatErrorResponseSchema.parse({
    error: message,
  });
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PATCH(request: NextRequest) {
  const origin = request.headers.get("origin");
  // Next normalizes loopback URLs to localhost. Use the browser's request host.
  const host = request.headers.get("host") ?? request.nextUrl.host;
  const requestOrigin = `${request.nextUrl.protocol}//${host}`;
  if (origin !== null && origin !== requestOrigin) {
    return errorResponse(
      "Use this chat page to approve or cancel the change.",
      403,
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const approval = ApprovalRequestSchema.safeParse(body);
  if (!approval.success) {
    return errorResponse("Provide a valid proposal and decision.", 400);
  }

  const guestSessionId = request.cookies.get(guestSessionCookie)?.value;
  if (guestSessionId === undefined) {
    return errorResponse("This change could not be found.", 404);
  }

  try {
    const receipt = approvalService.decide(guestSessionId, approval.data);
    const result = ApprovalResponseSchema.parse(receipt);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ToolDispatchError) {
      return errorResponse(error.message, error.status);
    }
    throw error;
  }
}

function streamReply(
  generateReply: (
    onActivity: (label: ActivityLabel) => void,
  ) => Promise<ChatSuccessResponse>,
) {
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
        const result = await generateReply((label) =>
          send({ type: "activity", label }),
        );
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

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  const cookieSessionId = request.cookies.get(guestSessionCookie)?.value;
  if (body && typeof body === "object" && "replyToApproval" in body) {
    const followUp = ApprovalReplyRequestSchema.safeParse(body);
    if (!followUp.success) {
      return errorResponse("Provide a valid decision reference.", 400);
    }
    const receipt =
      cookieSessionId === undefined
        ? undefined
        : approvalService.getReceipt(
            cookieSessionId,
            followUp.data.replyToApproval,
          );
    if (!receipt) {
      return errorResponse("This decision could not be found.", 404);
    }
    return streamReply(() => runApprovalReply(receipt));
  }

  const chatRequest = ChatRequestSchema.safeParse(body);
  if (!chatRequest.success) {
    return errorResponse("Messages must be a non-empty chat history.", 400);
  }

  const guestSessionId = cartService.resolveGuestSession(cookieSessionId);
  const turn = approvalService.beginTurn(guestSessionId);
  const response = streamReply((onActivity) =>
    runChat(chatRequest.data.messages, { turn, onActivity }),
  );
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
