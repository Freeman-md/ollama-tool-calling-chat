import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import {
  requestApproval,
  requestApprovalReply,
  requestChat,
} from "@/app/_lib/request";

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
  const approvals = [
    {
      id: randomUUID(),
      expiresAt: Date.now() + 300000,
      buttons: { approve: "Approve", cancel: "Cancel" },
      preview: {
        kind: "basket_change",
        productName: "Cedar Dusk",
        previousQuantity: 0,
        quantity: 2,
        totalPence: 8000,
        currency: "GBP",
      },
    },
  ];
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
        approvals,
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
    approvals,
  });
  assert.deepEqual(steps, ["Searching products…", "Checking your basket…"]);
  assert.equal(fetch.mock.calls[0].arguments[0], "/api/chat");
  assert.deepEqual(JSON.parse(fetch.mock.calls[0].arguments[1].body), {
    messages,
  });
});

test("sends only the proposal and decision and decodes the directly returned basket", async (t) => {
  const approval = { proposalId: randomUUID(), decision: "approve" };
  const result = {
    kind: "basket_change",
    proposalId: approval.proposalId,
    status: "approved",
    buttonLabel: "Approve",
    outcome: "Basket updated. Cedar Dusk quantity was set to 2.",
    cart: {
      items: [{ productId: "cedar-dusk", name: "Cedar Dusk", quantity: 2 }],
      totalPence: 8000,
      currency: "GBP",
    },
  };
  const fetch = t.mock.method(globalThis, "fetch", async () =>
    Response.json(result),
  );
  assert.deepEqual(await requestApproval(approval), result);
  const [url, options] = fetch.mock.calls[0].arguments;
  assert.equal(url, "/api/chat");
  assert.equal(options.method, "PATCH");
  assert.deepEqual(JSON.parse(options.body), approval);

  fetch.mock.mockImplementation(async () =>
    Response.json({ ...result, proposalId: randomUUID() }),
  );
  await assert.rejects(requestApproval(approval), {
    message: "Couldn’t confirm your decision. Try again.",
  });

  fetch.mock.mockImplementation(async () =>
    Response.json(
      { error: "This change expired. Ask for it again." },
      { status: 410 },
    ),
  );
  await assert.rejects(requestApproval(approval), {
    status: 410,
    message: "This change expired. Ask for it again.",
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

test("requests and retries just the approval reply through the chat stream", async (t) => {
  const proposalId = randomUUID();
  const encoder = new TextEncoder();
  const fetch = t.mock.method(globalThis, "fetch", async () =>
    streamResponse([
      encoder.encode('{"type":"error","error":"Ollama is unavailable."}\n'),
    ]),
  );
  await assert.rejects(requestApprovalReply(proposalId), {
    message: "Ollama is unavailable.",
  });

  fetch.mock.mockImplementation(async () =>
    streamResponse([
      encoder.encode(
        '{"type":"complete","data":{"content":"The change was cancelled."}}\n',
      ),
    ]),
  );
  assert.deepEqual(await requestApprovalReply(proposalId), {
    content: "The change was cancelled.",
  });
  assert.equal(fetch.mock.callCount(), 2);
  for (const {
    arguments: [url, options],
  } of fetch.mock.calls) {
    assert.equal(url, "/api/chat");
    assert.equal(options.method, "POST");
    assert.deepEqual(JSON.parse(options.body), { replyToApproval: proposalId });
  }
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
