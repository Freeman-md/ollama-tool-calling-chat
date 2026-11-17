import assert from "node:assert/strict";
import test from "node:test";
import ollama from "ollama";
import { ChatAgentError } from "@/modules/chat/errors";
import { runChat } from "@/modules/chat/agent";
import { MAX_TOOL_ROUNDS } from "@/lib/config";
import { conversions } from "@/modules/chat/tools/celsius-to-fahrenheit";

const celsiusCall = (celsius) => ({
  function: {
    name: "celsius_to_fahrenheit",
    arguments: { celsius },
  },
});

const assistantToolMessage = (...toolCalls) => ({
  role: "assistant",
  content: "",
  tool_calls: toolCalls,
});

test("appends all results from a tool-call batch before the next Ollama call", async (t) => {
  const requests = [];
  const responses = [
    { message: assistantToolMessage(celsiusCall(0), celsiusCall(20)) },
    { message: { role: "assistant", content: "Both conversions are done." } },
  ];
  t.mock.method(ollama, "chat", async (request) => {
    requests.push(request);
    return responses.shift();
  });

  const result = await runChat([
    { role: "user", content: "Convert 0°C and 20°C." },
  ]);

  assert.deepEqual(result, {
    content: "Both conversions are done.",
    toolNames: ["celsius_to_fahrenheit", "celsius_to_fahrenheit"],
    toolName: "celsius_to_fahrenheit",
  });
  assert.deepEqual(requests[1].messages.slice(-3), [
    assistantToolMessage(celsiusCall(0), celsiusCall(20)),
    { role: "tool", tool_name: "celsius_to_fahrenheit", content: "32" },
    { role: "tool", tool_name: "celsius_to_fahrenheit", content: "68" },
  ]);
});

test("handles a second tool round and preserves execution order", async (t) => {
  const requests = [];
  const responses = [
    { message: assistantToolMessage(celsiusCall(20)) },
    { message: assistantToolMessage(celsiusCall(0)) },
    {
      message: { role: "assistant", content: "20°C is 68°F and 0°C is 32°F." },
    },
  ];
  t.mock.method(ollama, "chat", async (request) => {
    requests.push(request);
    return responses.shift();
  });

  const result = await runChat([
    { role: "user", content: "Convert both temperatures." },
  ]);

  assert.deepEqual(result.toolNames, [
    "celsius_to_fahrenheit",
    "celsius_to_fahrenheit",
  ]);
  assert.equal(result.toolName, "celsius_to_fahrenheit");
  assert.equal(result.content, "20°C is 68°F and 0°C is 32°F.");
  assert.equal(requests.length, 3);
  assert.deepEqual(requests[2].messages.slice(-2), [
    assistantToolMessage(celsiusCall(0)),
    { role: "tool", tool_name: "celsius_to_fahrenheit", content: "32" },
  ]);
});

test("returns a clear error when Ollama requests a fourth tool round", async (t) => {
  const chatSpy = t.mock.method(ollama, "chat", async () => ({
    message: assistantToolMessage(celsiusCall(20)),
  }));
  const conversionSpy = t.mock.method(
    conversions,
    "celsiusToFahrenheit",
    (celsius) => (celsius * 9) / 5 + 32,
  );

  await assert.rejects(
    runChat([{ role: "user", content: "Keep converting." }]),
    (error) =>
      error instanceof ChatAgentError &&
      error.status === 502 &&
      error.message ===
        `Ollama requested more than ${MAX_TOOL_ROUNDS} tool rounds.`,
  );

  assert.equal(chatSpy.mock.callCount(), MAX_TOOL_ROUNDS + 1);
  assert.equal(conversionSpy.mock.callCount(), MAX_TOOL_ROUNDS);
});
