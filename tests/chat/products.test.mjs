import assert from "node:assert/strict";
import test from "node:test";
import ollama from "ollama";
import { runChat } from "@/modules/chat/agent";
import { dispatchToolCalls, ollamaTools } from "@/modules/chat/tools-dispatch";
import { tool as listTool } from "@/modules/chat/tools/list-products";
import { tool as searchTool } from "@/modules/chat/tools/search-products";

const call = (name, arguments_) => ({
  function: { name, arguments: arguments_ },
});

test("advertises the three product tools", () => {
  assert.deepEqual(
    ollamaTools.map((tool) => tool.function.name),
    ["list_products", "search_products", "get_product_by_id"],
  );
});

test("lists, searches and fetches catalog products with their details", () => {
  const listed = dispatchToolCalls([call("list_products", {})]);
  assert.deepEqual(
    listed.products.map((p) => p.id),
    ["cedar-dusk", "emberwood", "rose-veil"],
  );
  const searched = dispatchToolCalls([
    call("search_products", { name: "cedar" }),
  ]);
  assert.deepEqual(
    searched.products.map((p) => p.id),
    ["cedar-dusk"],
  );
  const detail = dispatchToolCalls([
    call("get_product_by_id", { id: "cedar-dusk" }),
  ]);
  assert.equal(detail.products[0].availability, "in_stock");
  assert.equal(
    JSON.parse(detail.toolResults[0].content).details.bottleSizeMl,
    50,
  );
  const unknown = dispatchToolCalls([
    call("get_product_by_id", { id: "missing" }),
  ]);
  assert.deepEqual(unknown.products, []);
  assert.equal(unknown.toolResults[0].content, "null");
});

test("product search translates strict and inclusive price limits", () => {
  for (const [filters, expected] of [
    [{ scentFamily: "woody", maxPriceGbp: 40 }, ["cedar-dusk"]],
    [{ scentFamily: "woody", maxPriceGbp: "40" }, ["cedar-dusk"]],
    [{ scentFamily: "woody", maxPriceGbp: "£40" }, ["cedar-dusk"]],
    [{ scentFamily: "woody", underPriceGbp: 40 }, []],
    [{ scentFamily: "woody", underPriceGbp: "£40" }, []],
    [{ scentFamily: "woody", overPriceGbp: 40 }, ["emberwood"]],
    [
      {
        scentFamily: "woody",
        maxPriceGbp: 55,
        underPriceGbp: 55,
        overPriceGbp: 40,
      },
      [],
    ],
    [{ scentFamily: "woody", underPriceGbp: 0 }, []],
  ]) {
    assert.deepEqual(
      dispatchToolCalls([call("search_products", filters)]).products.map(
        (p) => p.id,
      ),
      expected,
    );
  }
});

test("a later empty product result clears earlier results in the same batch", () => {
  const result = dispatchToolCalls([
    call("list_products", {}),
    call("get_product_by_id", { id: "missing" }),
  ]);
  assert.deepEqual(result.products, []);
  assert.equal(result.toolResults.length, 2);
});

test("later empty products clear previous cards across rounds", async (t) => {
  const responses = [
    {
      message: {
        role: "assistant",
        content: "",
        tool_calls: [call("list_products", {})],
      },
    },
    {
      message: {
        role: "assistant",
        content: "",
        tool_calls: [call("get_product_by_id", { id: "missing" })],
      },
    },
    { message: { role: "assistant", content: "Not found." } },
  ];
  t.mock.method(ollama, "chat", async () => responses.shift());
  const result = await runChat([{ role: "user", content: "Find a product." }]);
  assert.deepEqual(result.products, []);
  assert.equal(result.content, "Not found.");
});

test("validates a batch before executing any product tool", (t) => {
  const execute = t.mock.fn(() => ({ content: "[]", products: [] }));
  const registry = {
    list_products: { definition: listTool.definition, prepare: () => execute },
    search_products: searchTool,
  };
  assert.throws(
    () =>
      dispatchToolCalls([call("search_products", { maxPriceGbp: "£1.001" })]),
    { status: 400 },
  );
  assert.throws(
    () => dispatchToolCalls([call("search_products", { maxPriceGbp: "£-1" })]),
    { status: 400 },
  );
  assert.throws(
    () =>
      dispatchToolCalls(
        [call("list_products", {}), call("search_products", {})],
        registry,
      ),
    { status: 400 },
  );
  assert.equal(execute.mock.callCount(), 0);
  assert.throws(
    () => dispatchToolCalls([call("get_product_by_id", { id: "" })]),
    { status: 400 },
  );
});
