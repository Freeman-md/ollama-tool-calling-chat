import ollama, { type Message } from "ollama";
import type { ChatMessage, ChatSuccessResponse } from "./types";
import { CHAT_MODEL, MAX_TOOL_ROUNDS } from "@/lib/config";
import { ChatAgentError, ToolDispatchError } from "./errors";
import { dispatchToolCalls, ollamaTools } from "./tools-dispatch";

const assistantInstructions: Message = {
  role: "system",
  content:
    "Be a concise, natural conversational assistant. Answer only what the user asked; do not volunteer code, examples, tool descriptions, or extra suggestions. For greetings and small talk, reply briefly and naturally. Use available tools only when needed to answer the user's actual request.",
};

export async function runChat(
  messages: ChatMessage[],
): Promise<ChatSuccessResponse> {
  const conversation: Message[] = [assistantInstructions, ...messages];
  const executedToolNames: string[] = [];
  let toolRounds = 0;

  while (true) {
    const response = await ollama.chat({
      model: CHAT_MODEL,
      messages: conversation,
      tools: ollamaTools,
      stream: false,
    });

    const toolCalls = response.message.tool_calls ?? [];
    if (toolCalls.length === 0) {
      return {
        content: response.message.content,
        ...(executedToolNames.length > 0
          ? { toolNames: executedToolNames, toolName: executedToolNames[0] }
          : {}),
      };
    }

    if (toolRounds >= MAX_TOOL_ROUNDS) {
      throw new ChatAgentError(
        `Ollama requested more than ${MAX_TOOL_ROUNDS} tool rounds.`,
        502,
      );
    }

    try {
      const { toolNames, toolResults } = dispatchToolCalls(toolCalls);
      conversation.push(response.message, ...toolResults);
      executedToolNames.push(...toolNames);
      toolRounds += 1;
    } catch (error) {
      if (error instanceof ToolDispatchError) {
        throw new ChatAgentError(error.message, error.status);
      }
      throw error;
    }
  }
}
