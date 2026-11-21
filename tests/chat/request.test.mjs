import assert from "node:assert/strict";
import test from "node:test";
import { requestChat } from "@/app/_lib/request";

const messages = [{ role: "user", content: "Hello" }];
const unavailable =
  "Couldn’t get a reply from local Ollama. Check that Ollama is running, then try again.";

function streamResponse(chunks) {
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
    }),
  );
}

test("reads split UTF-8 lines and returns the validated final response", async (t) => {
  const cart = { items: [], totalPence: 0, currency: "GBP" };
  const text = [
    { type: "activity", label: "Searching products…" },
    { type: "activity", label: "Checking your basket…" },
    {
      type: "complete",
      data: {
        content: "Hello",
        products: [],
        recommendedProductIds: [],
        productView: "detailed",
        cart,
      },
    },
  ]
    .map((event) => JSON.stringify(event) + "\n")
    .join("");
  const bytes = new TextEncoder().encode(text);
  const ellipsis = bytes.indexOf(0xe2);
  const fetch = t.mock.method(globalThis, "fetch", async () =>
    streamResponse([
      bytes.slice(0, 8),
      bytes.slice(8, ellipsis + 1),
      bytes.slice(ellipsis + 1, ellipsis + 2),
      bytes.slice(ellipsis + 2),
    ]),
  );
  const steps = [];
  assert.deepEqual(await requestChat(messages, (label) => steps.push(label)), {
    content: "Hello",
    products: [],
    recommendedProductIds: [],
    productView: "detailed",
    cart,
  });
  assert.deepEqual(steps, ["Searching products…", "Checking your basket…"]);
  assert.equal(fetch.mock.calls[0].arguments[0], "/api/chat");
  assert.deepEqual(JSON.parse(fetch.mock.calls[0].arguments[1].body), {
    messages,
  });
});

test("surfaces pre-stream and midstream errors after progress", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ error: "Catalog unavailable." }, { status: 502 }),
  );
  await assert.rejects(requestChat(messages), {
    message: "Catalog unavailable.",
  });
  const text =
    '{"type":"activity","label":"Searching products…"}\n{"type":"error","error":"Search failed."}\n';
  fetch.mock.mockImplementation(async () =>
    streamResponse([new TextEncoder().encode(text)]),
  );
  const steps = [];
  await assert.rejects(
    requestChat(messages, (label) => steps.push(label)),
    { message: "Search failed." },
  );
  assert.deepEqual(steps, ["Searching products…"]);
});

test("rejects invalid events and connections that end before completion", async (t) => {
  const encoder = new TextEncoder();
  const fetch = t.mock.method(globalThis, "fetch", async () =>
    streamResponse([encoder.encode('{"unexpected":true}\n')]),
  );
  await assert.rejects(requestChat(messages), { message: unavailable });
  fetch.mock.mockImplementation(async () =>
    streamResponse([
      encoder.encode('{"type":"activity","label":"Searching products…"}\n'),
    ]),
  );
  await assert.rejects(requestChat(messages), { message: unavailable });
  fetch.mock.mockImplementation(async () =>
    streamResponse([encoder.encode('{"type":"complete"')]),
  );
  await assert.rejects(requestChat(messages), { message: unavailable });
});
