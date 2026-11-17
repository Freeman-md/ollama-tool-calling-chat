import type { Message, Tool, ToolCall } from "ollama";
import type { Perfume } from "@/modules/catalog/types";
import { ToolDispatchError } from "./errors";
import * as celsiusToFahrenheit from "./tools/celsius-to-fahrenheit";
import * as searchPerfumes from "./tools/search-perfumes";

type ToolRegistration = {
  definition: Tool;
  prepare(
    arguments_: unknown,
  ): () => string | { content: string; perfumeMatches?: Perfume[] };
};

export type ToolRegistry = Readonly<Record<string, ToolRegistration>>;

const toolRegistry = {
  [celsiusToFahrenheit.name]: celsiusToFahrenheit,
  [searchPerfumes.name]: searchPerfumes,
} satisfies ToolRegistry;

export const ollamaTools = Object.values(toolRegistry).map(
  (tool) => tool.definition,
);

export function dispatchToolCalls(
  toolCalls: ToolCall[],
  registry: ToolRegistry = toolRegistry,
): {
  toolNames: string[];
  toolResults: Message[];
  perfumeMatches?: Perfume[];
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
  const toolResults: Message[] = preparedCalls.map(({ name, execute }) => {
    const result = execute();
    if (typeof result === "string") {
      return { role: "tool", tool_name: name, content: result };
    }
    if (result.perfumeMatches !== undefined)
      perfumeMatches = result.perfumeMatches;
    return { role: "tool", tool_name: name, content: result.content };
  });

  return {
    toolNames: preparedCalls.map(({ name }) => name),
    toolResults,
    ...(perfumeMatches === undefined ? {} : { perfumeMatches }),
  };
}
