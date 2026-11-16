import ollama from "ollama";

type ChatMessage = { role: "user" | "assistant"; content: string };

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
      model: "mistral:latest",
      messages: body.messages,
      stream: false,
    });
    return Response.json({ content: response.message.content });
  } catch {
    return Response.json(
      { error: "Unable to reach local Ollama or generate a reply." },
      { status: 502 },
    );
  }
}
