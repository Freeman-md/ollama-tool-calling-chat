import type { Message, ToolCall } from "ollama";
import type { Product } from "@/modules/catalog/types";
import type {
  ActivityLabel,
  ChatSuccessResponse,
  ToolRegistration,
} from "./types";
import { ToolDispatchError } from "./errors";
import * as listProducts from "./tools/list-products";
import * as searchProducts from "./tools/search-products";
import * as getProductById from "./tools/get-product-by-id";
import * as getCart from "./tools/cart/get-cart";

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
  };
}

const activityLabels: Record<string, ActivityLabel> = {
  [listProducts.name]: "Browsing the catalog…",
  [searchProducts.name]: "Searching products…",
  [getProductById.name]: "Checking product details…",
  [getCart.name]: "Checking your basket…",
};

export function dispatchToolCalls(
  toolCalls: ToolCall[],
  registry: ToolRegistry = productTools,
  onActivity?: (label: ActivityLabel) => void,
): {
  toolNames: string[];
  toolResults: Message[];
  products?: Product[];
  eligibleProducts?: Product[];
  productView?: ChatSuccessResponse["productView"];
  cart?: ChatSuccessResponse["cart"];
} {
  const preparedCalls = toolCalls.map((toolCall) => {
    const name = toolCall.function.name;
    const registration = registry[name];
    if (!registration) {
      throw new ToolDispatchError("Ollama requested an unsupported tool.", 502);
    }

    return {
      name,
      execute: registration.prepare(toolCall.function.arguments),
    };
  });

  let products: Product[] | undefined;
  let eligibleProducts: Product[] | undefined;
  let productView: ChatSuccessResponse["productView"];
  let cart: ChatSuccessResponse["cart"];
  const toolResults: Message[] = preparedCalls.map(({ name, execute }) => {
    const label = activityLabels[name];
    if (label) {
      onActivity?.(label);
    }
    const result = execute();
    if (result.products !== undefined) {
      products = result.products;
      productView = result.productView ?? "compact";
    }
    if (result.eligibleProducts !== undefined)
      eligibleProducts = result.eligibleProducts;
    if (result.cart !== undefined) {
      cart = result.cart;
    }
    return { role: "tool", tool_name: name, content: result.content };
  });

  return {
    toolNames: preparedCalls.map(({ name }) => name),
    toolResults,
    ...(products === undefined ? {} : { products, productView }),
    ...(eligibleProducts === undefined ? {} : { eligibleProducts }),
    ...(cart === undefined ? {} : { cart }),
  };
}
