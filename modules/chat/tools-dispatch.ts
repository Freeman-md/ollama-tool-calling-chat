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

export type ToolRegistry = Readonly<Record<string, ToolRegistration>>;

const toolRegistry = {
  [listProducts.name]: listProducts.tool,
  [searchProducts.name]: searchProducts.tool,
  [getProductById.name]: getProductById.tool,
} satisfies ToolRegistry;

export const ollamaTools = Object.values(toolRegistry).map(
  (tool) => tool.definition,
);

const activityLabels: Record<string, ActivityLabel> = {
  [listProducts.name]: "Browsing the catalog…",
  [searchProducts.name]: "Searching products…",
  [getProductById.name]: "Checking product details…",
};

export function dispatchToolCalls(
  toolCalls: ToolCall[],
  registry: ToolRegistry = toolRegistry,
  onActivity?: (label: ActivityLabel) => void,
): {
  toolNames: string[];
  toolResults: Message[];
  products?: Product[];
  eligibleProducts?: Product[];
  productView?: ChatSuccessResponse["productView"];
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
  const toolResults: Message[] = preparedCalls.map(({ name, execute }) => {
    const label = activityLabels[name];
    if (label) {
      onActivity?.(label);
    }
    const result = execute();
    products = result.products;
    productView = result.productView ?? "compact";
    if (result.eligibleProducts !== undefined)
      eligibleProducts = result.eligibleProducts;
    return { role: "tool", tool_name: name, content: result.content };
  });

  return {
    toolNames: preparedCalls.map(({ name }) => name),
    toolResults,
    ...(products === undefined ? {} : { products, productView }),
    ...(eligibleProducts === undefined ? {} : { eligibleProducts }),
  };
}
