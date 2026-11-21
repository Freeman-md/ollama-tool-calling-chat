import ollama, { type Message } from "ollama";
import type { ActivityLabel, ChatMessage, ChatSuccessResponse } from "./types";
import type { Product } from "@/modules/catalog/types";
import { CHAT_MODEL, MAX_TOOL_ROUNDS } from "@/lib/config";
import { ChatAgentError, ToolDispatchError } from "./errors";
import { dispatchToolCalls, getToolRegistry } from "./tools-dispatch";
import * as recommendations from "./tools/reply-with-recommendations";

const assistantInstructions: Message = {
  role: "system",
  content:
    "Be a concise, natural conversational assistant. Answer only what the user asked; do not volunteer code, examples, tool descriptions, or extra suggestions. For greetings and small talk, reply briefly without calling tools. Use list_products to browse, search_products to search the catalog, and get_product_by_id for details or availability. If you need an ID, search by product name first. When the shopper asks for more information, call get_product_by_id with view detailed; for availability alone use compact. Lead with a concise answer and let product cards carry routine details. If mentioning an option above the budget or out of stock, clearly state that trade-off. After searching for a recommendation and finding matches, call reply_with_recommendations alone with your final reply and the IDs you recommend from those results. Use only catalog facts for product recommendations, prices, notes, details and availability. Catalog pricePence is an integer in pence: divide by 100 to get pounds (4000 pence is £40). Do not confuse price with bottle size or other product details. Do not infer or invent scent characteristics or note roles that are not in the catalog. Use get_cart whenever the shopper asks about their basket, even if you checked it earlier in the conversation. Treat its items, quantities and totalPence as authoritative, and let the basket summary show the details. The basket is read-only; never claim to change it or offer checkout. If no matches, ask whether the shopper would change their budget or scent preference.",
};

function buildResponse({
  content,
  products,
  productView,
  recommendedProductIds,
  cart,
  toolNames = [],
}: Omit<ChatSuccessResponse, "toolName">): ChatSuccessResponse {
  const response: ChatSuccessResponse = { content };

  if (products !== undefined) {
    response.products = products;
    response.productView = productView;
  }

  if (recommendedProductIds !== undefined) {
    response.recommendedProductIds = recommendedProductIds;
  }

  if (cart !== undefined) {
    response.cart = cart;
  }

  if (toolNames.length > 0) {
    response.toolNames = toolNames;
    response.toolName = toolNames[0];
  }

  return response;
}

export async function runChat(
  messages: ChatMessage[],
  {
    guestSessionId,
    onActivity,
  }: {
    guestSessionId?: string;
    onActivity?: (label: ActivityLabel) => void;
  } = {},
): Promise<ChatSuccessResponse> {
  const registry = getToolRegistry(guestSessionId);
  const ollamaTools = Object.values(registry).map((tool) => tool.definition);
  const conversation: Message[] = [assistantInstructions, ...messages];
  const executedToolNames: string[] = [];
  let toolRounds = 0;
  let cart: ChatSuccessResponse["cart"];
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
      return buildResponse({
        content: response.message.content,
        products,
        productView,
        cart,
        toolNames: executedToolNames,
      });
    }

    const recommendationCall = toolCalls.find(
      (toolCall) => toolCall.function.name === recommendations.name,
    );
    if (recommendationCall) {
      const recommendation = recommendations.parseRecommendation({
        arguments_: recommendationCall.function.arguments,
        toolCallCount: toolCalls.length,
        eligibleProducts,
        products,
      });
      return buildResponse({
        ...recommendation,
        products,
        productView,
        cart,
        toolNames: [...executedToolNames, recommendations.name],
      });
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
        cart: latestCart,
      } = dispatchToolCalls(toolCalls, registry, onActivity);
      if (latestProducts !== undefined) {
        products = latestProducts;
        productView = latestProductView;
      }

      if (latestEligibleProducts !== undefined) {
        eligibleProducts = latestEligibleProducts;
      }

      if (latestCart !== undefined) {
        cart = latestCart;
      }

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
