import type { Message, Tool, ToolCall } from "ollama";
import { ToolDispatchError } from "./errors";
import * as celsiusToFahrenheit from "./tools/celsius-to-fahrenheit";

type ToolRegistration = {
  definition: Tool;
  prepare(arguments_: unknown): () => string;
};

export type ToolRegistry = Readonly<Record<string, ToolRegistration>>;

const toolRegistry = {
  [celsiusToFahrenheit.name]: celsiusToFahrenheit,
} satisfies ToolRegistry;

export const ollamaTools = Object.values(toolRegistry).map((tool) => tool.definition);

export function dispatchToolCalls(
  toolCalls: ToolCall[],
  registry: ToolRegistry = toolRegistry,
): {
  toolNames: string[];
  toolResults: Message[];
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

  const toolResults: Message[] = preparedCalls.map(({ name, execute }) => ({
    role: "tool",
    tool_name: name,
    content: execute(),
  }));

  return {
    toolNames: preparedCalls.map(({ name }) => name),
    toolResults,
  };
}
