import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import ollama from "ollama";
import { POST } from "@/app/api/chat/route";

test("returns validated product records including availability and details", async (t) => {
  const responses = [
    {
      message: {
        role: "assistant",
        content: "",
        tool_calls: [
          {
            function: {
              name: "get_product_by_id",
              arguments: { id: "cedar-dusk" },
            },
          },
        ],
      },
    },
    { message: { role: "assistant", content: "In stock." } },
  ];
  t.mock.method(ollama, "chat", async () => responses.shift());
  const response = await POST(
    new NextRequest("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Is Cedar Dusk available?" }],
      }),
    }),
  );
  const events = (await response.text()).trim().split("\n").map(JSON.parse);
  const body = events.at(-1).data;
  assert.equal(response.status, 200);
  assert.equal(body.products[0].availability, "in_stock");
  assert.equal(body.productView, "compact");
  assert.equal(body.products[0].details.bottleSizeMl, 50);
  assert.equal(body.products[0].image.src, "/catalog/perfumes/cedar-dusk.webp");
});

test("returns recommended product IDs with the searched products", async (t) => {
  const responses = [
    {
      message: {
        role: "assistant",
        content: "",
        tool_calls: [
          {
            function: {
              name: "search_products",
              arguments: { scentFamily: "woody" },
            },
          },
        ],
      },
    },
    {
      message: {
        role: "assistant",
        content: "",
        tool_calls: [
          {
            function: {
              name: "reply_with_recommendations",
              arguments: {
                content: "I recommend Cedar Dusk.",
                recommendedProductIds: ["cedar-dusk"],
              },
            },
          },
        ],
      },
    },
  ];
  const chat = t.mock.method(ollama, "chat", async () => responses.shift());
  const response = await POST(
    new NextRequest("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Recommend a woody perfume." }],
      }),
    }),
  );
  const events = (await response.text()).trim().split("\n").map(JSON.parse);
  const body = events.at(-1).data;

  assert.equal(response.status, 200);
  assert.equal(body.content, "I recommend Cedar Dusk.");
  assert.deepEqual(
    body.products.map((product) => product.id),
    ["cedar-dusk", "emberwood"],
  );
  assert.deepEqual(body.recommendedProductIds, ["cedar-dusk"]);
  assert.equal("cart" in body, false);
  assert.equal(chat.mock.callCount(), 2);
});

test("streams activity before the final response is ready", async (t) => {
  let finish;
  const pending = new Promise((resolve) => {
    finish = resolve;
  });
  const calls = [
    {
      message: {
        role: "assistant",
        content: "",
        tool_calls: [
          {
            function: {
              name: "search_products",
              arguments: { scentFamily: "woody" },
            },
          },
        ],
      },
    },
  ];
  t.mock.method(ollama, "chat", async () =>
    calls.length ? calls.shift() : pending,
  );
  const response = await POST(
    new NextRequest("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Find woody perfume." }],
      }),
    }),
  );
  const reader = response.body.getReader();
  const first = await reader.read();
  assert.deepEqual(JSON.parse(new TextDecoder().decode(first.value)), {
    type: "activity",
    label: "Searching products…",
  });
  finish({ message: { role: "assistant", content: "Here are the matches." } });
  const next = await reader.read();
  const event = JSON.parse(new TextDecoder().decode(next.value));
  assert.equal(event.type, "complete");
  assert.deepEqual(
    event.data.products.map((product) => product.id),
    ["cedar-dusk", "emberwood"],
  );
  assert.equal("toolNames" in event.data, false);
  assert.equal("toolName" in event.data, false);
  await reader.cancel();
});

test("streams an error after emitted activity", async (t) => {
  let count = 0;
  t.mock.method(ollama, "chat", async () => {
    count += 1;
    if (count === 1)
      return {
        message: {
          role: "assistant",
          content: "",
          tool_calls: [{ function: { name: "list_products", arguments: {} } }],
        },
      };
    throw new Error("internal model failure");
  });
  const response = await POST(
    new NextRequest("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Browse." }],
      }),
    }),
  );
  const events = (await response.text()).trim().split("\n").map(JSON.parse);
  assert.deepEqual(events, [
    { type: "activity", label: "Browsing the catalog…" },
    {
      type: "error",
      error: "Unable to reach local Ollama or generate a reply.",
    },
  ]);
});

test("returns JSON validation errors before starting the stream", async () => {
  const invalidJson = await POST(
    new NextRequest("http://localhost/api/chat", { method: "POST", body: "{" }),
  );
  assert.equal(invalidJson.status, 400);
  assert.equal(invalidJson.headers.has("Set-Cookie"), false);
  assert.deepEqual(await invalidJson.json(), {
    error: "Request body must be valid JSON.",
  });
  const invalidHistory = await POST(
    new NextRequest("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: [] }),
    }),
  );
  assert.equal(invalidHistory.status, 400);
  assert.deepEqual(await invalidHistory.json(), {
    error: "Messages must be a non-empty chat history.",
  });
});
