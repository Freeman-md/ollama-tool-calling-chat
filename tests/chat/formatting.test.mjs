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
