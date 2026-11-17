import assert from "node:assert/strict";
import test from "node:test";
import ollama from "ollama";
import { POST } from "@/app/api/chat/route";
import { dispatchToolCalls } from "@/modules/chat/tools-dispatch";
import { catalog } from "@/modules/chat/tools/search-perfumes";

const searchCall = (arguments_) => ({
  function: { name: "search_perfumes", arguments: arguments_ },
});

test("rejects missing or invalid filters before looking up the catalog", (t) => {
  const lookup = t.mock.method(catalog, "searchPerfumes");
  for (const filters of [
    {},
    { scentFamily: "  " },
    { maxPriceGbp: -1 },
    { maxPriceGbp: 1.001 },
    { maxPriceGbp: "£40" },
    { maxPriceGbp: "1.001" },
    { underPriceGbp: -1 },
    { overPriceGbp: 1.001 },
    { overPriceGbp: Number.MAX_SAFE_INTEGER / 100 },
  ]) {
    assert.throws(() => dispatchToolCalls([searchCall(filters)]), {
      status: 400,
      message: "Provide a valid scent family or maximum price in GBP.",
    });
  }
  assert.equal(lookup.mock.callCount(), 0);
});

test("converts inclusive and strict budget bounds to pence", (t) => {
  const lookup = t.mock.method(catalog, "searchPerfumes");
  const cases = [
    {
      filters: { underPriceGbp: 40 },
      expectedBounds: { maxPricePence: 3999 },
      names: [],
    },
    {
      filters: { maxPriceGbp: 40 },
      expectedBounds: { maxPricePence: 4000 },
      names: ["Cedar Dusk"],
    },
    {
      filters: { overPriceGbp: 40 },
      expectedBounds: { minPricePence: 4001, maxPricePence: undefined },
      names: ["Emberwood"],
    },
    {
      filters: { maxPriceGbp: 55, underPriceGbp: 55, overPriceGbp: 40 },
      expectedBounds: { minPricePence: 4001, maxPricePence: 5499 },
      names: [],
    },
    {
      filters: { underPriceGbp: 0 },
      expectedBounds: { maxPricePence: -1 },
      names: [],
    },
  ];

  for (const { filters, expectedBounds, names } of cases) {
    const result = dispatchToolCalls([
      searchCall({ scentFamily: "woody", ...filters }),
    ]);
    assert.deepEqual(lookup.mock.calls.at(-1).arguments[0], {
      scentFamily: "woody",
      ...expectedBounds,
    });
    assert.deepEqual(
      JSON.parse(result.toolResults[0].content).map((perfume) => perfume.name),
      names,
    );
  }
});

test("normalizes scent and converts pounds to pence before searching", (t) => {
  const lookup = t.mock.method(catalog, "searchPerfumes");
  const result = dispatchToolCalls([
    searchCall({ scentFamily: "  WOODY  ", maxPriceGbp: "40" }),
  ]);
  assert.deepEqual(lookup.mock.calls[0].arguments[0], {
    scentFamily: "woody",
    maxPricePence: 4000,
  });
  assert.deepEqual(
    JSON.parse(result.toolResults[0].content).map((perfume) => perfume.name),
    ["Cedar Dusk"],
  );

  const noMatches = dispatchToolCalls([
    searchCall({ scentFamily: "woody", maxPriceGbp: 39.99 }),
  ]);
  assert.equal(lookup.mock.calls[1].arguments[0].maxPricePence, 3999);
  assert.equal(noMatches.toolResults[0].content, "[]");
});

test("returns the catalog error through the chat route when lookup throws", async (t) => {
  const chat = t.mock.method(ollama, "chat", async () => ({
    message: {
      role: "assistant",
      content: "",
      tool_calls: [searchCall({ maxPriceGbp: 40 })],
    },
  }));
  t.mock.method(catalog, "searchPerfumes", () => {
    throw new Error("lookup failed");
  });

  const response = await POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "Find a perfume." }],
      }),
    }),
  );

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {
    error: "Couldn’t check the perfume catalog. Try again.",
  });
  assert.equal(chat.mock.callCount(), 1);
});
