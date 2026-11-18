import ollama, { type Message } from "ollama";
import type { ChatMessage, ChatSuccessResponse } from "./types";
import type { Product } from "@/modules/catalog/types";
import { CHAT_MODEL, MAX_TOOL_ROUNDS } from "@/lib/config";
import { ChatAgentError, ToolDispatchError } from "./errors";
import { dispatchToolCalls, ollamaTools } from "./tools-dispatch";

const assistantInstructions: Message = {
  role: "system",
  content:
    "Be a concise, natural conversational assistant. Answer only what the user asked; do not volunteer code, examples, tool descriptions, or extra suggestions. For greetings and small talk, reply briefly without calling tools. Use list_products to browse, search_products to search the catalog, and get_product_by_id for details or availability. If you need an ID, search by product name first. Use only catalog facts for product recommendations, prices, notes, details and availability. Do not infer or invent scent characteristics or note roles that are not in the catalog. This app has no basket or purchasing functionality; do not offer or imply it. If no matches, ask whether the shopper would change their budget or scent preference.",
};

export async function runChat(
  messages: ChatMessage[],
): Promise<ChatSuccessResponse> {
  const conversation: Message[] = [assistantInstructions, ...messages];
  const executedToolNames: string[] = [];
  let toolRounds = 0;
  let products: Product[] | undefined;

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
        ...(products === undefined ? {} : { products }),
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
      const {
        toolNames,
        toolResults,
        products: latestProducts,
      } = dispatchToolCalls(toolCalls);
      if (latestProducts !== undefined) products = latestProducts;
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
