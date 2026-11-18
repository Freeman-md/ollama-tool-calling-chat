import ollama, { type Message } from "ollama";
import type { ChatMessage, ChatSuccessResponse } from "./types";
import type { Product } from "@/modules/catalog/types";
import { CHAT_MODEL, MAX_TOOL_ROUNDS } from "@/lib/config";
import { ChatAgentError, ToolDispatchError } from "./errors";
import { dispatchToolCalls, ollamaTools } from "./tools-dispatch";
import * as recommendations from "./tools/reply-with-recommendations";

const assistantInstructions: Message = {
  role: "system",
  content:
    "Be a concise, natural conversational assistant. Answer only what the user asked; do not volunteer code, examples, tool descriptions, or extra suggestions. For greetings and small talk, reply briefly without calling tools. Use list_products to browse, search_products to search the catalog, and get_product_by_id for details or availability. If you need an ID, search by product name first. When the shopper asks for more information, call get_product_by_id with view detailed; for availability alone use compact. Lead with a concise answer and let product cards carry routine details. If mentioning an option above the budget or out of stock, clearly state that trade-off. After searching for a recommendation and finding matches, call reply_with_recommendations alone with your final reply and the IDs you recommend from those results. Use only catalog facts for product recommendations, prices, notes, details and availability. Catalog pricePence is an integer in pence: divide by 100 to get pounds (4000 pence is £40). Do not confuse price with bottle size or other product details. Do not infer or invent scent characteristics or note roles that are not in the catalog. This app has no basket or purchasing functionality; do not offer or imply it. If no matches, ask whether the shopper would change their budget or scent preference.",
};

export async function runChat(
  messages: ChatMessage[],
): Promise<ChatSuccessResponse> {
  const conversation: Message[] = [assistantInstructions, ...messages];
  const executedToolNames: string[] = [];
  let toolRounds = 0;
  let products: Product[] | undefined;
  let eligibleProducts: Product[] | undefined;
  let productView: ChatSuccessResponse["productView"];

  while (true) {
    const response = await ollama.chat({
      model: CHAT_MODEL,
      messages: conversation,
      tools: eligibleProducts?.length
        ? [...ollamaTools, recommendations.definition]
        : ollamaTools,
      stream: false,
    });

    const toolCalls = response.message.tool_calls ?? [];
    if (toolCalls.length === 0) {
      return {
        content: response.message.content,
        ...(products === undefined ? {} : { products, productView }),
        ...(executedToolNames.length > 0
          ? { toolNames: executedToolNames, toolName: executedToolNames[0] }
          : {}),
      };
    }

    const recommendationCall = toolCalls.find(
      (toolCall) => toolCall.function.name === recommendations.name,
    );
    if (recommendationCall) {
      if (toolCalls.length !== 1)
        throw new ChatAgentError(
          "The recommendation reply must be called on its own.",
          502,
        );
      if (!eligibleProducts?.length)
        throw new ChatAgentError(
          "Recommendations require eligible search results.",
          502,
        );

      const result = recommendations.schema.safeParse(
        recommendationCall.function.arguments,
      );
      if (!result.success)
        throw new ChatAgentError(
          "Ollama returned an invalid recommendation reply.",
          502,
        );

      const eligibleIds = new Set(
        eligibleProducts.map((product) => product.id),
      );
      const displayedIds = new Set(
        (products ?? []).map((product) => product.id),
      );
      const recommendedProductIds = [
        ...new Set(result.data.recommendedProductIds),
      ].filter((id) => eligibleIds.has(id) && displayedIds.has(id));
      const toolNames = [...executedToolNames, recommendations.name];
      return {
        content: result.data.content,
        ...(products === undefined ? {} : { products, productView }),
        recommendedProductIds,
        toolNames,
        toolName: toolNames[0],
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
        eligibleProducts: latestEligibleProducts,
        productView: latestProductView,
      } = dispatchToolCalls(toolCalls);
      if (latestProducts !== undefined) {
        products = latestProducts;
        productView = latestProductView;
      }
      if (latestEligibleProducts !== undefined)
        eligibleProducts = latestEligibleProducts;
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
