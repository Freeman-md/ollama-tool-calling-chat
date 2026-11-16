import ollama, { type Tool } from "ollama";
import { z } from "zod";

type ChatMessage = { role: "user" | "assistant"; content: string };

export const celsiusConversionSchema = z.object({ celsius: z.number() });

export const conversions = {
  celsiusToFahrenheit(celsius: number) {
    return (celsius * 9) / 5 + 32;
  },
};

const assistantInstructions = {
  role: "system",
  content:
    "Be a concise, natural conversational assistant. Answer only what the user asked; do not volunteer code, examples, tool descriptions, or extra suggestions. For greetings and small talk, reply briefly and naturally. Use available tools only when needed to answer the user's actual request.",
};

const celsiusTool: Tool = {
  type: "function",
  function: {
    name: "celsius_to_fahrenheit",
    description: "Convert a temperature in degrees Celsius to degrees Fahrenheit.",
    parameters: z.toJSONSchema(celsiusConversionSchema, {
      io: "input",
    }) as Tool["function"]["parameters"],
  },
};

function isChatMessage(value: unknown): value is ChatMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "role" in value &&
    (value.role === "user" || value.role === "assistant") &&
    "content" in value &&
    typeof value.content === "string"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("messages" in body) ||
    !Array.isArray(body.messages) ||
    body.messages.length === 0 ||
    !body.messages.every(isChatMessage)
  ) {
    return Response.json({ error: "Messages must be a non-empty chat history." }, { status: 400 });
  }

  try {
    const response = await ollama.chat({
      model: "llama3.1:latest",
      messages: [assistantInstructions, ...body.messages],
      tools: [celsiusTool],
      stream: false,
    });

    const toolCall = response.message.tool_calls?.[0];
    if (!toolCall) {
      return Response.json({ content: response.message.content });
    }

    if (toolCall.function.name !== "celsius_to_fahrenheit") {
      return Response.json({ error: "Ollama requested an unsupported tool." }, { status: 502 });
    }

    const result = celsiusConversionSchema.safeParse(toolCall.function.arguments);
    if (!result.success) {
      return Response.json(
        { error: "The conversion tool requires a numeric celsius argument." },
        { status: 400 },
      );
    }

    const fahrenheit = conversions.celsiusToFahrenheit(result.data.celsius);
    const finalResponse = await ollama.chat({
      model: "llama3.1:latest",
      messages: [
        assistantInstructions,
        ...body.messages,
        response.message,
        { role: "tool", tool_name: "celsius_to_fahrenheit", content: String(fahrenheit) },
      ],
      stream: false,
    });

    return Response.json({
      content: finalResponse.message.content,
      toolName: "celsius_to_fahrenheit",
    });
  } catch {
    return Response.json(
      { error: "Unable to reach local Ollama or generate a reply." },
      { status: 502 },
    );
  }
}
