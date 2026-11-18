import assert from "node:assert/strict";
import test from "node:test";
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
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Is Cedar Dusk available?" }],
      }),
    }),
  );
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.products[0].availability, "in_stock");
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
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Recommend a woody perfume." }],
      }),
    }),
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.content, "I recommend Cedar Dusk.");
  assert.deepEqual(
    body.products.map((product) => product.id),
    ["cedar-dusk", "emberwood"],
  );
  assert.deepEqual(body.recommendedProductIds, ["cedar-dusk"]);
  assert.equal(chat.mock.callCount(), 2);
});
