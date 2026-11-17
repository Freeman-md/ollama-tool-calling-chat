import assert from "node:assert/strict";
import test from "node:test";
import ollama from "ollama";
import { POST } from "@/app/api/chat/route";
import { conversions } from "@/modules/chat/tools/celsius-to-fahrenheit";

test("rejects a tool call without celsius before conversion or follow-up", async (t) => {
  const chatSpy = t.mock.method(ollama, "chat", async () => ({
    message: {
      role: "assistant",
      content: "",
      tool_calls: [
        {
          function: {
            name: "celsius_to_fahrenheit",
            arguments: {},
          },
        },
      ],
    },
  }));
  const conversionSpy = t.mock.method(conversions, "celsiusToFahrenheit");

  const response = await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Convert this." }],
      }),
    }),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "The conversion tool requires a numeric celsius argument.",
  });
  assert.equal(conversionSpy.mock.callCount(), 0);
  assert.equal(chatSpy.mock.callCount(), 1);
});
