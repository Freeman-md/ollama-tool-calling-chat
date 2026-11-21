import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { NextRequest } from "next/server";
import ollama from "ollama";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatMessage } from "@/app/_components/ChatMessage";
import { POST } from "@/app/api/chat/route";
import { cartService, createCartService } from "@/modules/cart/service";
import { runChat } from "@/modules/chat/agent";
import {
  dispatchToolCalls,
  getToolRegistry,
} from "@/modules/chat/tools-dispatch";

const basketQuestion = { role: "user", content: "What’s in my basket?" };
const assistantReply = { role: "assistant", content: "Here’s your basket." };
const emptyCart = { items: [], totalPence: 0, currency: "GBP" };

const call = (name, arguments_) => ({
  function: { name, arguments: arguments_ },
});

function requestBasket(messages, sessionId) {
  return POST(
    new NextRequest("https://shop.example/api/chat", {
      method: "POST",
      headers:
        sessionId === undefined ? {} : { Cookie: `guest_session=${sessionId}` },
      body: JSON.stringify({ messages }),
    }),
  );
}

async function readEvents(response) {
  return (await response.text()).trim().split("\n").map(JSON.parse);
}

test("streams the server basket for the same guest across turns and isolates a second session", async (t) => {
  const sessions = new Map();
  const fixtureService = createCartService(sessions);
  t.mock.method(
    cartService,
    "resolveGuestSession",
    fixtureService.resolveGuestSession,
  );
  t.mock.method(cartService, "getCart", fixtureService.getCart);
  const modelSnapshots = [];
  const chat = t.mock.method(ollama, "chat", async ({ messages }) => {
    const lastMessage = messages.at(-1);
    if (lastMessage.role === "tool") {
      modelSnapshots.push(JSON.parse(lastMessage.content));
      return { message: assistantReply };
    }
    return {
      message: { ...assistantReply, tool_calls: [call("get_cart", {})] },
    };
  });

  const first = await requestBasket([basketQuestion]);
  assert.equal(first.status, 200);
  assert.equal(first.headers.has("Set-Cookie"), true);
  const cookie = first.cookies.get("guest_session");
  assert.ok(cookie);
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.secure, true);
  assert.equal(cookie.path, "/api/chat");
  assert.equal(cookie.sameSite, "lax");
  const firstEvents = await readEvents(first);
  assert.deepEqual(firstEvents, [
    { type: "activity", label: "Checking your basket…" },
    {
      type: "complete",
      data: { content: assistantReply.content, cart: emptyCart },
    },
  ]);
  const tools = chat.mock.calls[0].arguments[0].tools;
  assert.deepEqual(
    tools.map((tool) => tool.function.name),
    [
      "list_products",
      "search_products",
      "get_product_by_id",
      "get_cart",
      "add_to_cart",
      "set_cart_quantity",
    ],
  );

  sessions.set(cookie.value, {
    revision: 1,
    items: [
      { productId: "cedar-dusk", quantity: 2 },
      { productId: "harbour-classic", quantity: 3 },
    ],
  });
  const populatedCart = {
    items: [
      { productId: "cedar-dusk", name: "Cedar Dusk", quantity: 2 },
      { productId: "harbour-classic", name: "Harbour Classic", quantity: 3 },
    ],
    totalPence: 34700,
    currency: "GBP",
  };

  const next = await requestBasket(
    [basketQuestion, assistantReply, basketQuestion],
    cookie.value,
  );
  assert.equal(next.headers.has("Set-Cookie"), false);
  const nextReply = (await readEvents(next)).at(-1).data;
  assert.deepEqual(nextReply.cart, populatedCart);
  const repeated = await requestBasket([basketQuestion], cookie.value);
  assert.deepEqual(
    (await readEvents(repeated)).at(-1).data.cart,
    populatedCart,
  );

  const unissuedSessionId = randomUUID();
  const other = await requestBasket([basketQuestion], unissuedSessionId);
  const otherCookie = other.cookies.get("guest_session");
  assert.ok(otherCookie);
  assert.ok(
    otherCookie.value !== cookie.value &&
      otherCookie.value !== unissuedSessionId,
  );
  assert.deepEqual((await readEvents(other)).at(-1).data.cart, emptyCart);
  assert.deepEqual(modelSnapshots, [
    emptyCart,
    populatedCart,
    populatedCart,
    emptyCart,
  ]);

  const html = renderToStaticMarkup(
    createElement(ChatMessage, {
      message: { ...assistantReply, ...nextReply, id: 1 },
    }),
  );
  assert.match(
    html,
    /assistant-reply[\s\S]*Here’s your basket\.[\s\S]*aria-label="Basket"/,
  );
  assert.match(html, /Cedar Dusk<\/span><span[^>]*>Quantity 2/);
  assert.match(html, /Harbour Classic<\/span><span[^>]*>Quantity 3/);
  assert.match(html, /Total<\/span><strong>£347\.00<\/strong>/);
});

test("shows the empty basket only on a reply with a basket snapshot", () => {
  const plainMessage = { ...assistantReply, id: 1 };
  const empty = renderToStaticMarkup(
    createElement(ChatMessage, {
      message: { ...plainMessage, cart: emptyCart },
    }),
  );
  assert.match(empty, /No items in your basket\./);
  assert.match(empty, /£0\.00/);
  assert.doesNotMatch(
    renderToStaticMarkup(createElement(ChatMessage, { message: plainMessage })),
    /aria-label="Basket"/,
  );
});

test("rejects model-supplied basket arguments before executing the batch", (t) => {
  const guestSessionId = cartService.resolveGuestSession(undefined);
  const onActivity = t.mock.fn();
  assert.throws(
    () =>
      dispatchToolCalls(
        [
          call("list_products", {}),
          call("get_cart", { sessionId: "other", quantity: 2 }),
        ],
        getToolRegistry(guestSessionId),
        onActivity,
      ),
    { message: "Request the current basket without arguments.", status: 400 },
  );
  assert.equal(onActivity.mock.callCount(), 0);
});

test("preserves both the basket and product cards in a recommendation reply", async (t) => {
  const guestSessionId = cartService.resolveGuestSession(undefined);
  const responses = [
    {
      message: {
        ...assistantReply,
        tool_calls: [
          call("search_products", { name: "cedar" }),
          call("get_cart", {}),
        ],
      },
    },
    {
      message: {
        ...assistantReply,
        tool_calls: [
          call("reply_with_recommendations", {
            content: "I recommend Cedar Dusk.",
            recommendedProductIds: ["cedar-dusk"],
          }),
        ],
      },
    },
  ];
  t.mock.method(ollama, "chat", async () => responses.shift());

  const result = await runChat(
    [
      {
        role: "user",
        content: "Recommend a woody fragrance and show my basket.",
      },
    ],
    { guestSessionId },
  );
  assert.deepEqual(result.cart, emptyCart);
  assert.deepEqual(
    result.products.map((product) => product.id),
    ["cedar-dusk"],
  );
  assert.deepEqual(result.recommendedProductIds, ["cedar-dusk"]);
});
