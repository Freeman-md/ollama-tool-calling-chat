import assert from "node:assert/strict";
import test from "node:test";
import ollama from "ollama";
import { ChatAgentError } from "@/modules/chat/errors";
import { runChat } from "@/modules/chat/agent";
import { MAX_TOOL_ROUNDS } from "@/lib/config";

const call = (name, arguments_) => ({
  function: { name, arguments: arguments_ },
});
const assistantToolMessage = (...toolCalls) => ({
  role: "assistant",
  content: "",
  tool_calls: toolCalls,
});

test("returns a plain reply without tool or product fields", async (t) => {
  t.mock.method(ollama, "chat", async () => ({
    message: { role: "assistant", content: "Hello." },
  }));

  assert.deepEqual(await runChat([{ role: "user", content: "Hello." }]), {
    content: "Hello.",
  });
});

test("appends all tool results in batch order and keeps the latest products", async (t) => {
  const requests = [];
  const calls = [
    call("list_products", { limit: 1 }),
    call("get_product_by_id", { id: "rose-veil" }),
  ];
  const responses = [
    { message: assistantToolMessage(...calls) },
    { message: { role: "assistant", content: "Here are the products." } },
  ];
  t.mock.method(ollama, "chat", async (request) => {
    requests.push({ ...request, messages: [...request.messages] });
    return responses.shift();
  });

  const result = await runChat([{ role: "user", content: "Show products." }]);
  assert.deepEqual(result.toolNames, ["list_products", "get_product_by_id"]);
  assert.equal(result.toolName, "list_products");
  assert.deepEqual(
    result.products.map((product) => product.id),
    ["rose-veil"],
  );
  const history = requests[1].messages.slice(-3);
  assert.deepEqual(history[0], assistantToolMessage(...calls));
  assert.equal(history[1].tool_name, "list_products");
  assert.equal(JSON.parse(history[1].content)[0].id, "cedar-dusk");
  assert.equal(history[2].tool_name, "get_product_by_id");
  assert.equal(JSON.parse(history[2].content).id, "rose-veil");
});

test("handles multiple tool rounds and preserves execution order", async (t) => {
  const responses = [
    {
      message: assistantToolMessage(call("search_products", { name: "cedar" })),
    },
    {
      message: assistantToolMessage(
        call("get_product_by_id", { id: "cedar-dusk" }),
      ),
    },
    { message: { role: "assistant", content: "Cedar Dusk is in stock." } },
  ];
  t.mock.method(ollama, "chat", async () => responses.shift());
  const result = await runChat([{ role: "user", content: "Find Cedar Dusk." }]);
  assert.deepEqual(result.toolNames, ["search_products", "get_product_by_id"]);
  assert.equal(result.products[0].id, "cedar-dusk");
});

test("carries the requested detail view with the latest product result", async (t) => {
  const responses = [
    {
      message: assistantToolMessage(
        call("get_product_by_id", { id: "cedar-dusk", view: "detailed" }),
      ),
    },
    { message: { role: "assistant", content: "Here are the details." } },
  ];
  const chat = t.mock.method(ollama, "chat", async () => responses.shift());
  const detailed = await runChat([
    { role: "user", content: "Tell me more about Cedar Dusk." },
  ]);
  assert.equal(detailed.productView, "detailed");
  assert.equal(detailed.products[0].id, "cedar-dusk");

  const nextResponses = [
    {
      message: assistantToolMessage(
        call("get_product_by_id", { id: "cedar-dusk", view: "detailed" }),
        call("search_products", { name: "rose" }),
      ),
    },
    { message: { role: "assistant", content: "Here is Rose Veil." } },
  ];
  chat.mock.mockImplementation(async () => nextResponses.shift());
  const compact = await runChat([{ role: "user", content: "Find Rose Veil." }]);
  assert.equal(compact.productView, "compact");
  assert.equal(compact.products[0].id, "rose-veil");
});

test("returns a clear error when Ollama requests a fourth tool round", async (t) => {
  const chatSpy = t.mock.method(ollama, "chat", async () => ({
    message: assistantToolMessage(call("list_products", {})),
  }));
  await assert.rejects(
    runChat([{ role: "user", content: "Keep searching." }]),
    (error) =>
      error instanceof ChatAgentError &&
      error.status === 502 &&
      error.message ===
        `Ollama requested more than ${MAX_TOOL_ROUNDS} tool rounds.`,
  );
  assert.equal(chatSpy.mock.callCount(), MAX_TOOL_ROUNDS + 1);
});
