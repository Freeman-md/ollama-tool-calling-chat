import type { Message, ToolCall } from "ollama";
import type { Product } from "@/modules/catalog/types";
import type {
  ActivityLabel,
  ApprovalAction,
  ChatSuccessResponse,
  ToolRegistration,
  ToolResult,
} from "./types";
import { ToolDispatchError } from "./errors";
import * as listProducts from "./tools/list-products";
import * as searchProducts from "./tools/search-products";
import * as getProductById from "./tools/get-product-by-id";
import * as getCart from "./tools/cart/get-cart";
import * as addToCart from "./tools/cart/add-to-cart";
import * as setCartQuantity from "./tools/cart/set-cart-quantity";
import * as prepareCheckout from "./tools/cart/prepare-checkout";

export type ToolRegistry = Readonly<Record<string, ToolRegistration>>;

const productTools = {
  [listProducts.name]: listProducts.tool,
  [searchProducts.name]: searchProducts.tool,
  [getProductById.name]: getProductById.tool,
} satisfies ToolRegistry;

export function getToolRegistry(guestSessionId?: string): ToolRegistry {
  if (guestSessionId === undefined) {
    return productTools;
  }

  return {
    ...productTools,
    [getCart.name]: getCart.forGuestSession(guestSessionId),
    [addToCart.name]: addToCart.forGuestSession(guestSessionId),
    [setCartQuantity.name]: setCartQuantity.forGuestSession(guestSessionId),
    [prepareCheckout.name]: prepareCheckout.forGuestSession(guestSessionId),
  };
}

const activityLabels: Record<string, ActivityLabel> = {
  [listProducts.name]: "Browsing the catalog…",
  [searchProducts.name]: "Searching products…",
  [getProductById.name]: "Checking product details…",
  [getCart.name]: "Checking your basket…",
};

type PreparedCall = { name: string } & (
  { execute(): ToolResult } | { review(): ApprovalAction }
);

export function dispatchToolCalls(
  toolCalls: ToolCall[],
  registry: ToolRegistry = productTools,
  onActivity?: (label: ActivityLabel) => void,
): {
  toolNames: string[];
  toolResults: Message[];
  approvalActions: ApprovalAction[];
  products?: Product[];
  eligibleProducts?: Product[];
  productView?: ChatSuccessResponse["productView"];
  cart?: ChatSuccessResponse["cart"];
} {
  const preparedCalls = toolCalls.map<PreparedCall>((toolCall) => {
    const { name, arguments: arguments_ } = toolCall.function;
    if (!Object.hasOwn(registry, name)) {
      throw new ToolDispatchError("Ollama requested an unsupported tool.", 502);
    }

    const registration = registry[name];
    if (
      registration.approval === "skip" ||
      (registration.effect === "read" && registration.approval !== "required")
    ) {
      return { name, execute: registration.prepare(arguments_) };
    }
    const prepared = registration.prepare(arguments_);
    return { name, review: () => prepared.review() };
  });

  const approvalActions = preparedCalls.flatMap((call) =>
    "review" in call ? [call.review()] : [],
  );
  let products: Product[] | undefined;
  let eligibleProducts: Product[] | undefined;
  let productView: ChatSuccessResponse["productView"];
  let cart: ChatSuccessResponse["cart"];
  const toolNames: string[] = [];
  const toolResults: Message[] = [];
  for (const call of preparedCalls) {
    if (!("execute" in call)) {
      continue;
    }

    const { name } = call;
    const label = activityLabels[name];
    if (label) {
      onActivity?.(label);
    }
    const result = call.execute();
    if (result.products !== undefined) {
      products = result.products;
      productView = result.productView ?? "compact";
    }
    if (result.eligibleProducts !== undefined)
      eligibleProducts = result.eligibleProducts;
    if (result.cart !== undefined) {
      cart = result.cart;
    }
    toolNames.push(name);
    toolResults.push({
      role: "tool",
      tool_name: name,
      content: result.content,
    });
  }

  return {
    toolNames,
    toolResults,
    approvalActions,
    ...(products === undefined ? {} : { products, productView }),
    ...(eligibleProducts === undefined ? {} : { eligibleProducts }),
    ...(cart === undefined ? {} : { cart }),
  };
}
