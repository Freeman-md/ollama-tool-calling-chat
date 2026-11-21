import ollama, { type Message } from "ollama";
import type {
  ActivityLabel,
  ApprovalReceipt,
  ChatMessage,
  ChatSuccessResponse,
} from "./types";
import type { Product } from "@/modules/catalog/types";
import { CHAT_MODEL, MAX_TOOL_ROUNDS } from "@/lib/config";
import { approvalService, type ApprovalTurn } from "./approvals";
import { ChatAgentError, ToolDispatchError } from "./errors";
import { dispatchToolCalls, getToolRegistry } from "./tools-dispatch";
import * as recommendations from "./tools/reply-with-recommendations";

const assistantInstructions: Message = {
  role: "system",
  content:
    "Be a concise, natural conversational assistant. Answer only what the user asked; do not volunteer code, examples, tool descriptions, or extra suggestions. For greetings and small talk, reply briefly without calling tools. Use list_products to browse, search_products to search the catalog, and get_product_by_id for details or availability. If you need an ID, search by product name first. When the shopper asks for more information, call get_product_by_id with view detailed; for availability alone use compact. Lead with a concise answer and let product cards carry routine details. If mentioning an option above the budget or out of stock, clearly state that trade-off. After searching for a recommendation and finding matches, call reply_with_recommendations alone with your final reply and the IDs you recommend from those results. Use only catalog facts for product recommendations, prices, notes, details and availability. Catalog pricePence is an integer in pence: divide by 100 to get pounds (4000 pence is £40). Do not confuse price with bottle size or other product details. Do not infer or invent scent characteristics or note roles that are not in the catalog. Use get_cart whenever the shopper asks about their basket, even if you checked it earlier in the conversation. Use add_to_cart to propose adding units. Use set_cart_quantity to propose an exact quantity, using zero to remove the item. For a requested basket change, use the exact catalog product ID. If the ID is unknown, use search_products by product name first. The shopper approves changes with the controls shown by the app. Ordinary chat text does not approve a proposal. Server-confirmed outcomes in the chat history record completed decisions. Never claim that a pending proposal was applied. Let the basket summary show the details. Do not offer checkout. If no matches, ask whether the shopper would change their budget or scent preference.",
};

function approvalMessage(receipt: ApprovalReceipt): Message {
  return {
    role: "user",
    content: `${receipt.buttonLabel}\n\nServer-confirmed outcome: ${receipt.outcome}`,
  };
}

function toModelMessage(message: ChatMessage, sessionId?: string): Message {
  const { role, content } = message;
  if (role === "user" && sessionId && message.approvalProposalId) {
    const receipt = approvalService.getReceipt(
      sessionId,
      message.approvalProposalId,
    );
    if (receipt?.buttonLabel === content) {
      return approvalMessage(receipt);
    }
  }
  return { role, content };
}

export async function runApprovalReply(
  receipt: ApprovalReceipt,
): Promise<ChatSuccessResponse> {
  const response = await ollama.chat({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "A shopper just used a decision button. Acknowledge the server-confirmed outcome in one short sentence using only the facts provided. Preserve the decision and any item name or quantity stated in the outcome.",
      },
      approvalMessage(receipt),
    ],
    stream: false,
    think: false,
    options: { num_predict: 96, temperature: 0.2 },
  });

  const content = response.message.content.trim();
  if (!content || response.message.tool_calls?.length) {
    throw new ChatAgentError(
      "Qwen couldn’t write a reply to this decision.",
      502,
    );
  }
  return { content };
}

function buildResponse({
  content,
  products,
  productView,
  recommendedProductIds,
  cart,
  approvals,
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

  if (approvals !== undefined) {
    response.approvals = approvals;
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
    turn,
    onActivity,
  }: {
    turn?: ApprovalTurn;
    onActivity?: (label: ActivityLabel) => void;
  } = {},
): Promise<ChatSuccessResponse> {
  const guestSessionId = turn?.sessionId;
  const registry = getToolRegistry(guestSessionId);
  const ollamaTools = Object.values(registry).map((tool) => tool.definition);
  const conversation: Message[] = [
    assistantInstructions,
    ...messages.map((message) => toModelMessage(message, guestSessionId)),
  ];
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
        approvalActions,
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

      executedToolNames.push(...toolNames);
      if (approvalActions.length > 0) {
        if (!turn) {
          throw new ChatAgentError("Proposals require a guest session.", 400);
        }
        let content = "Review the request below.";
        if (
          approvalActions.every(
            ({ preview }) => preview.kind === "basket_change",
          )
        ) {
          content =
            approvalActions.length === 1
              ? "I’ve prepared your basket change."
              : "I’ve prepared your basket changes.";
        }
        return buildResponse({
          content,
          products,
          productView,
          cart,
          approvals: approvalService.propose(turn, approvalActions),
          toolNames: executedToolNames,
        });
      }

      conversation.push(response.message, ...toolResults);
      toolRounds += 1;
    } catch (error) {
      if (error instanceof ToolDispatchError) {
        throw new ChatAgentError(error.message, error.status);
      }
      throw error;
    }
  }
}
