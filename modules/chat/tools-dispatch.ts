import type { Message, Tool, ToolCall } from "ollama";
import type { Perfume, Product } from "@/modules/catalog/types";
import { ToolDispatchError } from "./errors";
import * as celsiusToFahrenheit from "./tools/celsius-to-fahrenheit";
import * as searchPerfumes from "./tools/search-perfumes";
import * as listProducts from "./tools/list-products";
import * as searchProducts from "./tools/search-products";
import * as getProductById from "./tools/get-product-by-id";

type ToolRegistration = {
  definition: Tool;
  prepare(
    arguments_: unknown,
  ): () =>
    | string
    | { content: string; perfumeMatches?: Perfume[]; products?: Product[] };
};

export type ToolRegistry = Readonly<Record<string, ToolRegistration>>;

const toolRegistry = {
  [celsiusToFahrenheit.name]: celsiusToFahrenheit,
  [searchPerfumes.name]: searchPerfumes,
  [listProducts.name]: listProducts,
  [searchProducts.name]: searchProducts,
  [getProductById.name]: getProductById,
} satisfies ToolRegistry;

// Keep the legacy tool dispatchable, but advertise the richer product search.
export const ollamaTools = Object.values(toolRegistry)
  .filter((tool) => tool !== searchPerfumes)
  .map((tool) => tool.definition);

export function dispatchToolCalls(
  toolCalls: ToolCall[],
  registry: ToolRegistry = toolRegistry,
): {
  toolNames: string[];
  toolResults: Message[];
  perfumeMatches?: Perfume[];
  products?: Product[];
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

  let perfumeMatches: Perfume[] | undefined;
  let products: Product[] | undefined;
  const toolResults: Message[] = preparedCalls.map(({ name, execute }) => {
    const result = execute();
    if (typeof result === "string") {
      return { role: "tool", tool_name: name, content: result };
    }
    if (result.products !== undefined || result.perfumeMatches !== undefined) {
      products = result.products;
      perfumeMatches = result.perfumeMatches;
    }
    return { role: "tool", tool_name: name, content: result.content };
  });

  return {
    toolNames: preparedCalls.map(({ name }) => name),
    toolResults,
    ...(perfumeMatches === undefined ? {} : { perfumeMatches }),
    ...(products === undefined ? {} : { products }),
  };
}
