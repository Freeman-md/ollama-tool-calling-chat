import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatMessage } from "@/app/_components/ChatMessage";

const content = "**Bold**\n\n- First\n- Second\n\n<script>unsafe</script>";

test("formats assistant Markdown while skipping raw HTML", () => {
  const html = renderToStaticMarkup(
    createElement(ChatMessage, {
      message: { id: 1, role: "assistant", content },
    }),
  );
  assert.match(html, /<strong>Bold<\/strong>/);
  assert.match(html, /<ul>[\s\S]*<li>First<\/li>[\s\S]*<li>Second<\/li>/);
  assert.doesNotMatch(html, /<script>|unsafe/);
});

test("keeps shopper messages as escaped plain text", () => {
  const html = renderToStaticMarkup(
    createElement(ChatMessage, { message: { id: 1, role: "user", content } }),
  );
  assert.match(html, /\*\*Bold\*\*/);
  assert.match(html, /&lt;script&gt;unsafe&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<strong>|<ul>/);
});

test("shows completed activity above the reply in a collapsed disclosure", () => {
  const html = renderToStaticMarkup(
    createElement(ChatMessage, {
      message: {
        id: 1,
        role: "assistant",
        content: "Found it.",
        activity: ["Searching products…", "Checking product details…"],
      },
    }),
  );
  assert.match(
    html,
    /<button[^>]*aria-expanded="false">Completed <span class="activity-caret"[^>]*><\/span><\/button>[\s\S]*<ol[^>]*hidden=""[\s\S]*Found it\./,
  );
  assert.match(html, /Searching products…[\s\S]*Checking product details…/);
  const plain = renderToStaticMarkup(
    createElement(ChatMessage, {
      message: { id: 2, role: "assistant", content: "Hello." },
    }),
  );
  assert.doesNotMatch(plain, /activity-toggle/);
});

test("shows the latest activity in the assistant row while the reply is pending", () => {
  const message = { id: 1, role: "assistant", content: "", isPending: true };
  const thinking = renderToStaticMarkup(
    createElement(ChatMessage, { message }),
  );
  assert.match(thinking, /role="status"[\s\S]*Thinking…/);

  const working = renderToStaticMarkup(
    createElement(ChatMessage, {
      message: {
        ...message,
        activity: ["Searching products…", "Checking product details…"],
      },
    }),
  );
  assert.match(working, /role="status"[\s\S]*Checking product details…/);
  assert.doesNotMatch(
    working,
    /Searching products…|activity-toggle|assistant-reply/,
  );
});

test("shows the approved basket in place of an earlier read in the same reply", () => {
  const html = renderToStaticMarkup(
    createElement(ChatMessage, {
      message: {
        id: 1,
        role: "assistant",
        content: "I’ve prepared your basket change.",
        cart: { items: [], totalPence: 0, currency: "GBP" },
        approvals: [
          {
            id: "proposal",
            expiresAt: Date.now(),
            preview: {
              kind: "basket_change",
              productName: "Cedar Dusk",
              previousQuantity: 0,
              quantity: 2,
              totalPence: 8000,
              currency: "GBP",
            },
            resolution: {
              status: "approved",
              cart: {
                items: [
                  { productId: "cedar-dusk", name: "Cedar Dusk", quantity: 2 },
                ],
                totalPence: 8000,
                currency: "GBP",
              },
            },
          },
        ],
      },
    }),
  );
  assert.equal(html.match(/aria-label="Basket"/g)?.length, 1);
  assert.match(
    html,
    /Basket updated\.[\s\S]*Cedar Dusk[\s\S]*Quantity 2[\s\S]*£80\.00/,
  );
});
