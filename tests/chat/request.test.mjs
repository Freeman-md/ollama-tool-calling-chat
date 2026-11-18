import assert from "node:assert/strict";
import test from "node:test";
import { requestChat } from "@/app/_lib/request";

const messages = [{ role: "user", content: "Hello" }];

test("sends validated history and returns the validated chat response", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () =>
    Response.json({
      content: "Hello",
      toolNames: ["list_products"],
      products: [],
      recommendedProductIds: [],
    }),
  );
  assert.deepEqual(await requestChat(messages), {
    content: "Hello",
    toolNames: ["list_products"],
    products: [],
    recommendedProductIds: [],
  });
  assert.equal(fetch.mock.calls[0].arguments[0], "/api/chat");
  assert.deepEqual(JSON.parse(fetch.mock.calls[0].arguments[1].body), {
    messages,
  });
});

test("surfaces a server error and reports an invalid response", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ error: "Catalog unavailable." }, { status: 502 }),
  );
  await assert.rejects(requestChat(messages), {
    message: "Catalog unavailable.",
  });
  fetch.mock.mockImplementation(async () =>
    Response.json({ unexpected: true }),
  );
  await assert.rejects(requestChat(messages), {
    message:
      "Couldn’t get a reply from local Ollama. Check that Ollama is running, then try again.",
  });
});
