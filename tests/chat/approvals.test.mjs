import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import ollama from "ollama";
import { PATCH, POST } from "@/app/api/chat/route";
import { cartService } from "@/modules/cart/service";
import { getProductById } from "@/modules/catalog/service";
import { approvalService } from "@/modules/chat/approvals";
import { dispatchToolCalls } from "@/modules/chat/tools-dispatch";

const chatUrl = "https://shop.example/api/chat";
const productId = "cedar-dusk";
const emptyCart = { items: [], totalPence: 0, currency: "GBP" };

function cedarDuskCart(quantity) {
  return {
    items: [{ productId, name: "Cedar Dusk", quantity }],
    totalPence: quantity * 4000,
    currency: "GBP",
  };
}

function basketReceipt(proposalId, decision, quantity) {
  const isApproval = decision === "approve";
  return {
    kind: "basket_change",
    proposalId,
    status: isApproval ? "approved" : "cancelled",
    buttonLabel: isApproval ? "Approve" : "Cancel",
    outcome: isApproval
      ? `Basket updated. Cedar Dusk quantity was set to ${quantity}.`
      : `Basket change cancelled. Cedar Dusk quantity stayed at ${quantity}.`,
    cart: quantity === 0 ? emptyCart : cedarDuskCart(quantity),
  };
}

function call(name, arguments_) {
  return { function: { name, arguments: arguments_ } };
}

function request(method, sessionId, body, origin = new URL(chatUrl).origin) {
  const headers = new Headers({
    "Content-Type": "application/json",
    Origin: origin,
  });
  if (sessionId !== undefined) {
    headers.set("Cookie", `guest_session=${sessionId}`);
  }
  return new NextRequest(chatUrl, {
    method,
    headers,
    body: JSON.stringify(body),
  });
}

function decide(sessionId, proposalId, decision) {
  return PATCH(request("PATCH", sessionId, { proposalId, decision }));
}

function mockModel(t) {
  return t.mock.method(ollama, "chat", async () => {
    throw new Error("Unexpected model request.");
  });
}

async function readEvents(response) {
  return (await response.text()).trim().split("\n").map(JSON.parse);
}

function sendTurn(sessionId, messages) {
  return POST(request("POST", sessionId, { messages }));
}

async function sendToolCalls(model, sessionId, ...toolCalls) {
  model.mock.mockImplementationOnce(async () => ({
    message: { role: "assistant", content: "", tool_calls: toolCalls },
  }));
  return readEvents(
    await sendTurn(sessionId, [{ role: "user", content: "Change my basket." }]),
  );
}

async function propose(model, sessionId, name, quantity) {
  const events = await sendToolCalls(
    model,
    sessionId,
    call(name, { productId, quantity }),
  );
  const event = events.at(-1);
  assert.equal(event.type, "complete");
  assert.equal(event.data.approvals.length, 1);
  return event.data.approvals[0];
}

test("reviews an add without writing and returns one saved result for concurrent and later approvals", async (t) => {
  let now = Date.now();
  t.mock.method(Date, "now", () => now);
  const model = mockModel(t);
  const sessionId = cartService.resolveGuestSession(undefined);
  const proposal = await propose(model, sessionId, "add_to_cart", 2);
  assert.deepEqual(proposal.preview, {
    kind: "basket_change",
    productName: "Cedar Dusk",
    previousQuantity: 0,
    quantity: 2,
    totalPence: 8000,
    currency: "GBP",
  });
  assert.ok(proposal.expiresAt > now);
  assert.deepEqual(cartService.getCart(sessionId), emptyCart);

  const approval = { proposalId: proposal.id, decision: "approve" };
  const postResponse = await POST(request("POST", sessionId, approval));
  assert.equal(postResponse.status, 400);
  assert.deepEqual(cartService.getCart(sessionId), emptyCart);

  const replies = await Promise.all([
    decide(sessionId, proposal.id, "approve"),
    decide(sessionId, proposal.id, "approve"),
  ]);
  const outcome = basketReceipt(proposal.id, "approve", 2);
  for (const reply of replies) {
    assert.equal(reply.status, 200);
    assert.deepEqual(await reply.json(), outcome);
  }
  assert.deepEqual(cartService.getCart(sessionId), outcome.cart);

  cartService.setCartQuantity(sessionId, { productId, quantity: 4 });
  now = proposal.expiresAt;
  const retry = await decide(sessionId, proposal.id, "approve");
  assert.equal(retry.status, 200);
  assert.deepEqual(await retry.json(), outcome);
  assert.deepEqual(cartService.getCart(sessionId), cedarDuskCart(4));
  assert.equal(model.mock.callCount(), 1);
});

test("cancels a quantity change and approves a separate removal", async (t) => {
  const model = mockModel(t);
  const sessionId = cartService.resolveGuestSession(undefined);
  cartService.addToCart(sessionId, { productId, quantity: 2 });

  const quantityChange = await propose(
    model,
    sessionId,
    "set_cart_quantity",
    4,
  );
  assert.deepEqual(quantityChange.preview, {
    kind: "basket_change",
    productName: "Cedar Dusk",
    previousQuantity: 2,
    quantity: 4,
    totalPence: 16000,
    currency: "GBP",
  });
  assert.deepEqual(cartService.getCart(sessionId), cedarDuskCart(2));

  const cancel = await decide(sessionId, quantityChange.id, "cancel");
  assert.equal(cancel.status, 200);
  assert.deepEqual(
    await cancel.json(),
    basketReceipt(quantityChange.id, "cancel", 2),
  );
  assert.equal(
    (await decide(sessionId, quantityChange.id, "approve")).status,
    409,
  );
  assert.deepEqual(cartService.getCart(sessionId), cedarDuskCart(2));

  const remove = await propose(model, sessionId, "set_cart_quantity", 0);
  assert.equal(remove.preview.previousQuantity, 2);
  assert.equal(remove.preview.quantity, 0);
  assert.equal(remove.preview.totalPence, 0);
  const approved = await decide(sessionId, remove.id, "approve");
  assert.equal(approved.status, 200);
  assert.deepEqual(
    await approved.json(),
    basketReceipt(remove.id, "approve", 0),
  );
  assert.deepEqual(cartService.getCart(sessionId), emptyCart);
  assert.equal(model.mock.callCount(), 2);
});

test("rejects a stale proposal even when later basket edits restore the reviewed quantities", async (t) => {
  const model = mockModel(t);
  const sessionId = cartService.resolveGuestSession(undefined);
  const proposal = await propose(model, sessionId, "add_to_cart", 1);
  cartService.addToCart(sessionId, { productId, quantity: 1 });
  cartService.setCartQuantity(sessionId, { productId, quantity: 0 });

  const result = await decide(sessionId, proposal.id, "approve");
  assert.equal(result.status, 409);
  assert.deepEqual(await result.json(), {
    error: "This change is out of date. Ask for it again.",
  });
  assert.deepEqual(cartService.getCart(sessionId), emptyCart);
});

test("checks the reviewed total again at approval", async (t) => {
  const model = mockModel(t);
  const sessionId = cartService.resolveGuestSession(undefined);
  const proposal = await propose(model, sessionId, "add_to_cart", 1);
  const product = getProductById(productId);
  const originalPrice = product.pricePence;
  t.after(() => {
    product.pricePence = originalPrice;
  });
  product.pricePence += 500;

  const result = await decide(sessionId, proposal.id, "approve");
  assert.equal(result.status, 409);
  assert.deepEqual(await result.json(), {
    error: "The catalog changed. Ask for this change again.",
  });
  assert.deepEqual(cartService.getCart(sessionId), emptyCart);
});

test("rejects expired proposals at the expiry time", async (t) => {
  let now = Date.now();
  t.mock.method(Date, "now", () => now);
  const sessionId = cartService.resolveGuestSession(undefined);
  const proposal = await propose(mockModel(t), sessionId, "add_to_cart", 1);
  now = proposal.expiresAt;

  const result = await decide(sessionId, proposal.id, "approve");
  assert.equal(result.status, 410);
  assert.deepEqual(await result.json(), {
    error: "This change expired. Ask for it again.",
  });
  assert.deepEqual(cartService.getCart(sessionId), emptyCart);
});

test("rejects cross-session, cross-origin and modified approval requests", async (t) => {
  const owner = cartService.resolveGuestSession(undefined);
  const other = cartService.resolveGuestSession(undefined);
  const model = mockModel(t);
  const proposal = await propose(model, owner, "add_to_cart", 1);
  const approval = { proposalId: proposal.id, decision: "approve" };

  assert.equal((await decide(other, proposal.id, "approve")).status, 404);
  assert.equal((await decide(other, proposal.id, "cancel")).status, 404);
  assert.equal((await decide(undefined, proposal.id, "approve")).status, 404);
  assert.equal(
    (await PATCH(request("PATCH", owner, approval, "https://other.example")))
      .status,
    403,
  );
  assert.equal(
    (await PATCH(request("PATCH", owner, { ...approval, quantity: 17 })))
      .status,
    400,
  );
  assert.deepEqual(cartService.getCart(owner), emptyCart);
  assert.deepEqual(cartService.getCart(other), emptyCart);

  assert.equal((await decide(owner, proposal.id, "approve")).status, 200);
  assert.equal((await decide(other, proposal.id, "approve")).status, 404);
  assert.deepEqual(cartService.getCart(owner), cedarDuskCart(1));
  assert.deepEqual(cartService.getCart(other), emptyCart);
  assert.equal(model.mock.callCount(), 1);
});

test("checks approval origins against the request host on loopback", async (t) => {
  const sessionId = cartService.resolveGuestSession(undefined);
  const proposal = await propose(mockModel(t), sessionId, "add_to_cart", 1);
  const host = "127.0.0.1:3000";
  const origin = `http://${host}`;

  function approveFrom(requestOrigin) {
    return PATCH(
      new NextRequest(`${origin}/api/chat`, {
        method: "PATCH",
        headers: {
          Host: host,
          Origin: requestOrigin,
          Cookie: `guest_session=${sessionId}`,
        },
        body: JSON.stringify({ proposalId: proposal.id, decision: "approve" }),
      }),
    );
  }

  assert.equal((await approveFrom("http://localhost:3000")).status, 403);
  assert.deepEqual(cartService.getCart(sessionId), emptyCart);
  const response = await approveFrom(origin);
  assert.equal(response.status, 200);
  assert.deepEqual(
    await response.json(),
    basketReceipt(proposal.id, "approve", 1),
  );
});

test("validates the full batch before reading or saving proposals", async (t) => {
  const model = mockModel(t);
  const sessionId = cartService.resolveGuestSession(undefined);
  const save = t.mock.method(approvalService, "propose");
  const getCart = t.mock.method(cartService, "getCart");

  for (const [arguments_, error] of [
    [
      { productId, quantity: -1 },
      "Provide a product ID and a whole-number quantity of zero or more.",
    ],
    [{ productId: "rose-veil", quantity: 1 }, "Rose Veil is out of stock."],
  ]) {
    const events = await sendToolCalls(
      model,
      sessionId,
      call("get_cart", {}),
      call("add_to_cart", { productId, quantity: 1 }),
      call("set_cart_quantity", arguments_),
    );
    assert.deepEqual(events, [{ type: "error", error }]);
  }

  assert.equal(save.mock.callCount(), 0);
  assert.equal(getCart.mock.callCount(), 0);
  assert.deepEqual(cartService.getCart(sessionId), emptyCart);
});

test("keeps a gated write pending while reads and explicit server opt-outs run", (t) => {
  const read = t.mock.fn(() => ({ content: "Read result." }));
  const write = t.mock.fn(() => ({ content: "Write result." }));
  const skip = t.mock.fn(() => ({ content: "Opted-out result." }));
  const action = { isCurrent: () => true, execute: write };
  const registry = {
    read: { effect: "read", prepare: () => read },
    write: {
      effect: "write",
      prepare: () => ({ execute: write, review: () => action }),
    },
    skip: { effect: "write", approval: "skip", prepare: () => skip },
  };
  const result = dispatchToolCalls(
    [call("read", {}), call("write", {}), call("skip", {})],
    registry,
  );

  assert.deepEqual(result.toolNames, ["read", "skip"]);
  assert.deepEqual(result.approvalActions, [action]);
  assert.equal(read.mock.callCount(), 1);
  assert.equal(skip.mock.callCount(), 1);
  assert.equal(write.mock.callCount(), 0);
});

test("an opt-in read requires a decision and uses its configured labels in the receipt", async (t) => {
  const sessionId = cartService.resolveGuestSession(undefined);
  const model = mockModel(t);
  const read = t.mock.fn(() => ({
    kind: "read",
    outcome: "The collection contains three fragrances.",
  }));
  const action = {
    preview: {
      kind: "read",
      title: "View collection",
      description: "Share the collection details in chat.",
    },
    buttons: { approve: "Show collection", cancel: "Skip this read" },
    isCurrent: () => true,
    execute: read,
    cancelledReceipt: () => ({
      kind: "read",
      outcome: "The collection details stayed hidden.",
    }),
  };
  const registry = {
    read: {
      effect: "read",
      approval: "required",
      prepare: () => ({
        execute: () => ({ content: read().outcome }),
        review: () => action,
      }),
    },
  };
  const turn = approvalService.beginTurn(sessionId);
  const { toolResults, approvalActions } = dispatchToolCalls(
    [call("read", {})],
    registry,
  );
  const [proposal, cancelledProposal] = approvalService.propose(turn, [
    ...approvalActions,
    ...approvalActions,
  ]);
  assert.deepEqual(toolResults, []);
  assert.deepEqual(proposal.buttons, action.buttons);
  assert.deepEqual(proposal.preview, action.preview);
  assert.equal(read.mock.callCount(), 0);

  const cancelled = await decide(sessionId, cancelledProposal.id, "cancel");
  assert.equal(cancelled.status, 200);
  assert.deepEqual(await cancelled.json(), {
    kind: "read",
    proposalId: cancelledProposal.id,
    status: "cancelled",
    buttonLabel: "Skip this read",
    outcome: "The collection details stayed hidden.",
  });
  assert.equal(read.mock.callCount(), 0);

  const approved = await decide(sessionId, proposal.id, "approve");
  assert.equal(approved.status, 200);
  assert.deepEqual(await approved.json(), {
    kind: "read",
    proposalId: proposal.id,
    status: "approved",
    buttonLabel: "Show collection",
    outcome: "The collection contains three fragrances.",
  });
  assert.equal(read.mock.callCount(), 1);
  assert.equal(model.mock.callCount(), 0);
});

test("accepting a new message closes pending proposals even when Qwen fails", async (t) => {
  const model = mockModel(t);
  const owner = cartService.resolveGuestSession(undefined);
  const other = cartService.resolveGuestSession(undefined);
  const proposal = await propose(model, owner, "add_to_cart", 1);
  const otherProposal = await propose(model, other, "add_to_cart", 2);
  const invalidTurn = await sendTurn(owner, []);
  assert.equal(invalidTurn.status, 400);

  const message = { role: "user", content: "Approve" };
  let seenMessage;
  let decisionStatusAtModelStart;
  model.mock.mockImplementationOnce(async ({ messages }) => {
    seenMessage = messages.at(-1);
    decisionStatusAtModelStart = (await decide(owner, proposal.id, "approve"))
      .status;
    throw new Error("Model unavailable.");
  });
  const events = await readEvents(await sendTurn(owner, [message]));
  assert.deepEqual(seenMessage, message);
  assert.equal(decisionStatusAtModelStart, 409);
  assert.deepEqual(events, [
    {
      type: "error",
      error: "Unable to reach local Ollama or generate a reply.",
    },
  ]);
  const rejected = await decide(owner, proposal.id, "cancel");
  assert.equal(rejected.status, 409);
  assert.deepEqual(await rejected.json(), {
    error: "A newer chat message closed this proposal.",
  });
  assert.deepEqual(cartService.getCart(owner), emptyCart);
  assert.equal((await decide(other, otherProposal.id, "approve")).status, 200);
  assert.deepEqual(cartService.getCart(other), cedarDuskCart(2));
});

test("a model reply from a superseded turn cannot save an actionable proposal", async (t) => {
  const model = mockModel(t);
  const sessionId = cartService.resolveGuestSession(undefined);
  const started = Promise.withResolvers();
  const response = Promise.withResolvers();
  model.mock.mockImplementationOnce(() => {
    started.resolve();
    return response.promise;
  });
  const older = readEvents(
    await sendTurn(sessionId, [{ role: "user", content: "Add one." }]),
  );
  await started.promise;
  const newer = await propose(model, sessionId, "add_to_cart", 2);

  response.resolve({
    message: {
      role: "assistant",
      content: "",
      tool_calls: [call("add_to_cart", { productId, quantity: 1 })],
    },
  });
  assert.deepEqual(await older, [
    { type: "error", error: "A newer chat message closed this proposal." },
  ]);
  assert.equal((await decide(sessionId, newer.id, "approve")).status, 200);
  assert.deepEqual(cartService.getCart(sessionId), cedarDuskCart(2));
});

test("both decisions record exact labels and send server receipts to Qwen on the next chat turn", async (t) => {
  const model = mockModel(t);

  for (const decision of ["approve", "cancel"]) {
    const sessionId = cartService.resolveGuestSession(undefined);
    const proposal = await propose(model, sessionId, "add_to_cart", 2);
    const callsBeforeDecision = model.mock.callCount();
    const response = await decide(sessionId, proposal.id, decision);
    assert.equal(response.status, 200);
    const receipt = await response.json();
    const quantity = decision === "approve" ? 2 : 0;
    assert.deepEqual(receipt, basketReceipt(proposal.id, decision, quantity));
    assert.equal(receipt.buttonLabel, proposal.buttons[decision]);
    assert.equal(model.mock.callCount(), callsBeforeDecision);

    const shopper = {
      role: "user",
      content: receipt.buttonLabel,
      approvalProposalId: proposal.id,
    };
    const question = { role: "user", content: "What happened?" };
    model.mock.mockImplementationOnce(async () => ({
      message: { role: "assistant", content: "Got it." },
    }));
    const events = await readEvents(
      await sendTurn(sessionId, [shopper, question]),
    );
    assert.equal(events.at(-1).type, "complete");
    assert.deepEqual(model.mock.calls.at(-1).arguments[0].messages.slice(-2), [
      {
        role: "user",
        content: `${receipt.buttonLabel}\n\nServer-confirmed outcome: ${receipt.outcome}`,
      },
      question,
    ]);

    const retry = await decide(sessionId, proposal.id, decision);
    assert.equal(retry.status, 200);
    assert.deepEqual(await retry.json(), receipt);
    assert.equal(model.mock.callCount(), callsBeforeDecision + 1);
    assert.deepEqual(cartService.getCart(sessionId), receipt.cart);
  }
});

test("ignores receipt references from another guest, a pending proposal, or an unmatched label", async (t) => {
  const model = mockModel(t);
  const owner = cartService.resolveGuestSession(undefined);
  const other = cartService.resolveGuestSession(undefined);
  const completed = await propose(model, owner, "add_to_cart", 1);
  await decide(owner, completed.id, "approve");
  const pending = await propose(model, owner, "add_to_cart", 1);

  for (const [sessionId, proposalId, label] of [
    [other, completed.id, "Approve"],
    [owner, pending.id, "Approve"],
    [owner, completed.id, "Cancel"],
  ]) {
    model.mock.mockImplementationOnce(async () => ({
      message: { role: "assistant", content: "Got it." },
    }));
    await readEvents(
      await sendTurn(sessionId, [
        { role: "user", content: label, approvalProposalId: proposalId },
      ]),
    );
    assert.deepEqual(model.mock.calls.at(-1).arguments[0].messages.at(-1), {
      role: "user",
      content: label,
    });
  }
});
