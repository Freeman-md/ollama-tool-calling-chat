import type { Message, Tool, ToolCall } from "ollama";
import { z } from "zod";

export const CELSIUS_TOOL_NAME = "celsius_to_fahrenheit";

export const celsiusConversionSchema = z.object({ celsius: z.number() });

export const conversions = {
  celsiusToFahrenheit(celsius: number) {
    return (celsius * 9) / 5 + 32;
  },
};

const celsiusTool: Tool = {
  type: "function",
  function: {
    name: CELSIUS_TOOL_NAME,
    description: "Convert a temperature in degrees Celsius to degrees Fahrenheit.",
    parameters: z.toJSONSchema(celsiusConversionSchema, {
      io: "input",
    }) as Tool["function"]["parameters"],
  },
};

export const ollamaTools: Tool[] = [celsiusTool];

export class ToolDispatchError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ToolDispatchError";
    this.status = status;
  }
}

type ValidatedCelsiusCall = {
  name: typeof CELSIUS_TOOL_NAME;
  celsius: number;
};

function validateToolCall(toolCall: ToolCall): ValidatedCelsiusCall {
  if (toolCall.function.name !== CELSIUS_TOOL_NAME) {
    throw new ToolDispatchError("Ollama requested an unsupported tool.", 502);
  }

  const result = celsiusConversionSchema.safeParse(toolCall.function.arguments);
  if (!result.success) {
    throw new ToolDispatchError(
      "The conversion tool requires a numeric celsius argument.",
      400,
    );
  }

  return { name: CELSIUS_TOOL_NAME, celsius: result.data.celsius };
}

export function dispatchToolCalls(toolCalls: ToolCall[]): {
  toolNames: string[];
  toolResults: Message[];
} {
  const validatedCalls = toolCalls.map(validateToolCall);
  const toolResults: Message[] = validatedCalls.map(({ name, celsius }) => ({
    role: "tool",
    tool_name: name,
    content: String(conversions.celsiusToFahrenheit(celsius)),
  }));

  return {
    toolNames: validatedCalls.map(({ name }) => name),
    toolResults,
  };
}
