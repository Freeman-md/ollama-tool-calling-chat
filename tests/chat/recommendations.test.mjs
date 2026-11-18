import assert from "node:assert/strict";
import test from "node:test";
import ollama from "ollama";
import { products as catalogProducts } from "@/modules/catalog/data";
import { runChat } from "@/modules/chat/agent";
import { ChatAgentError } from "@/modules/chat/errors";

const call = (name, arguments_) => ({
  function: { name, arguments: arguments_ },
});
const toolMessage = (...toolCalls) => ({
  role: "assistant",
  content: "",
  tool_calls: toolCalls,
});
const search = call("search_products", { scentFamily: "woody" });

function spyCatalogMethod(t, method) {
  const original = Array.prototype[method];
  const spy = t.mock.fn((...args) => original.apply(catalogProducts, args));
  Object.defineProperty(catalogProducts, method, {
    configurable: true,
    value: spy,
  });
  t.after(() => {
    delete catalogProducts[method];
  });
  return spy;
}

test("terminal reply deduplicates multiple eligible IDs and ends without another request or lookup", async (t) => {
  const filter = spyCatalogMethod(t, "filter");
  const find = spyCatalogMethod(t, "find");
  const slice = spyCatalogMethod(t, "slice");
  const requests = [];
  const responses = [
    { message: toolMessage(search) },
    {
      message: toolMessage(
        call("reply_with_recommendations", {
          content: "These fit.",
          recommendedProductIds: [
            "emberwood",
            "cedar-dusk",
            "emberwood",
            "rose-veil",
            "unknown",
          ],
        }),
      ),
    },
  ];
  const chat = t.mock.method(ollama, "chat", async (request) => {
    requests.push(request.tools.map((tool) => tool.function.name));
    return responses.shift();
  });

  const result = await runChat([
    { role: "user", content: "Recommend a woody perfume." },
  ]);
  assert.deepEqual(result.recommendedProductIds, ["emberwood", "cedar-dusk"]);
  assert.deepEqual(
    result.products.map((product) => product.id),
    ["cedar-dusk", "emberwood"],
  );
  assert.equal(result.content, "These fit.");
  assert.deepEqual(result.toolNames, [
    "search_products",
    "reply_with_recommendations",
  ]);
  assert.equal(chat.mock.callCount(), 2);
  assert.equal(requests[0].includes("reply_with_recommendations"), false);
  assert.equal(requests[1].includes("reply_with_recommendations"), true);
  assert.equal(filter.mock.callCount(), 1);
  assert.equal(find.mock.callCount(), 0);
  assert.equal(slice.mock.callCount(), 0);
});

test("a broader list cannot make a product outside the latest search eligible", async (t) => {
  const responses = [
    { message: toolMessage(search) },
    { message: toolMessage(call("list_products", { limit: 7 })) },
    {
      message: toolMessage(
        call("reply_with_recommendations", {
          content: "My pick.",
          recommendedProductIds: ["rose-veil", "harbour-classic", "cedar-dusk"],
        }),
      ),
    },
  ];
  t.mock.method(ollama, "chat", async () => responses.shift());
  const result = await runChat([
    { role: "user", content: "Recommend a woody perfume." },
  ]);
  assert.deepEqual(
    result.products.map((product) => product.id),
    [
      "cedar-dusk",
      "emberwood",
      "rose-veil",
      "harbour-classic",
      "slate-automatic",
      "sun-disc-necklace",
      "silver-link-bracelet",
    ],
  );
  assert.deepEqual(result.recommendedProductIds, ["cedar-dusk"]);
});

test("selection must also be present in the current cards", async (t) => {
  const responses = [
    { message: toolMessage(search) },
    { message: toolMessage(call("get_product_by_id", { id: "rose-veil" })) },
    {
      message: toolMessage(
        call("reply_with_recommendations", {
          content: "No eligible selection.",
          recommendedProductIds: ["cedar-dusk", "rose-veil"],
        }),
      ),
    },
  ];
  t.mock.method(ollama, "chat", async () => responses.shift());
  const result = await runChat([{ role: "user", content: "Find a perfume." }]);
  assert.deepEqual(
    result.products.map((product) => product.id),
    ["rose-veil"],
  );
  assert.deepEqual(result.recommendedProductIds, []);
});

test("allows an explicitly empty recommendation selection", async (t) => {
  const responses = [
    { message: toolMessage(search) },
    {
      message: toolMessage(
        call("reply_with_recommendations", {
          content: "Here are the matches.",
          recommendedProductIds: [],
        }),
      ),
    },
  ];
  t.mock.method(ollama, "chat", async () => responses.shift());
  const result = await runChat([{ role: "user", content: "Find a perfume." }]);
  assert.equal(result.products.length, 2);
  assert.deepEqual(result.recommendedProductIds, []);
});

test("listing products alone does not enable the terminal tool", async (t) => {
  const requests = [];
  const responses = [
    { message: toolMessage(call("list_products", {})) },
    {
      message: toolMessage(
        call("reply_with_recommendations", {
          content: "Pick.",
          recommendedProductIds: ["cedar-dusk"],
        }),
      ),
    },
  ];
  t.mock.method(ollama, "chat", async (request) => {
    requests.push(request.tools.map((tool) => tool.function.name));
    return responses.shift();
  });
  await assert.rejects(
    runChat([{ role: "user", content: "Show products." }]),
    (error) =>
      error instanceof ChatAgentError &&
      error.status === 502 &&
      /eligible search/.test(error.message),
  );
  assert.equal(requests[1].includes("reply_with_recommendations"), false);
});

test("rejects terminal calls without eligible search results or with other calls", async (t) => {
  const filter = spyCatalogMethod(t, "filter");
  const terminal = call("reply_with_recommendations", {
    content: "Pick.",
    recommendedProductIds: ["cedar-dusk"],
  });
  const chat = t.mock.method(ollama, "chat", async () => ({
    message: toolMessage(search, terminal),
  }));
  await assert.rejects(
    runChat([{ role: "user", content: "Recommend a perfume." }]),
    (error) =>
      error instanceof ChatAgentError &&
      error.status === 502 &&
      /on its own/.test(error.message),
  );
  assert.equal(filter.mock.callCount(), 0);

  chat.mock.mockImplementation(async () => ({
    message: toolMessage(terminal),
  }));
  await assert.rejects(
    runChat([{ role: "user", content: "Recommend a perfume." }]),
    (error) =>
      error instanceof ChatAgentError &&
      error.status === 502 &&
      /eligible search/.test(error.message),
  );
});

test("rejects malformed terminal arguments after a search", async (t) => {
  const responses = [
    { message: toolMessage(search) },
    {
      message: toolMessage(
        call("reply_with_recommendations", {
          content: "",
          recommendedProductIds: "cedar-dusk",
        }),
      ),
    },
  ];
  t.mock.method(ollama, "chat", async () => responses.shift());
  await assert.rejects(
    runChat([{ role: "user", content: "Recommend a perfume." }]),
    (error) =>
      error instanceof ChatAgentError &&
      error.status === 502 &&
      /invalid recommendation/.test(error.message),
  );
});

test("empty search results withdraw recommendation eligibility", async (t) => {
  const requests = [];
  const responses = [
    { message: toolMessage(search) },
    { message: toolMessage(call("search_products", { name: "missing" })) },
    { message: { role: "assistant", content: "No matches." } },
  ];
  t.mock.method(ollama, "chat", async (request) => {
    requests.push(request.tools.map((tool) => tool.function.name));
    return responses.shift();
  });
  const result = await runChat([{ role: "user", content: "Find a perfume." }]);
  assert.equal(requests[1].includes("reply_with_recommendations"), true);
  assert.equal(requests[2].includes("reply_with_recommendations"), false);
  assert.deepEqual(result.products, []);
});

test("accepts the terminal reply after the final allowed search round", async (t) => {
  const responses = [
    { message: toolMessage(search) },
    { message: toolMessage(search) },
    { message: toolMessage(search) },
    {
      message: toolMessage(
        call("reply_with_recommendations", {
          content: "Cedar Dusk.",
          recommendedProductIds: ["cedar-dusk"],
        }),
      ),
    },
  ];
  const chat = t.mock.method(ollama, "chat", async () => responses.shift());
  const result = await runChat([
    { role: "user", content: "Recommend a perfume." },
  ]);
  assert.deepEqual(result.recommendedProductIds, ["cedar-dusk"]);
  assert.equal(chat.mock.callCount(), 4);
});
