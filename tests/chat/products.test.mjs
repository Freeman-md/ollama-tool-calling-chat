import assert from "node:assert/strict";
import test from "node:test";
import ollama from "ollama";
import { runChat } from "@/modules/chat/agent";
import { dispatchToolCalls, ollamaTools } from "@/modules/chat/tools-dispatch";

const call = (name, arguments_) => ({
  function: { name, arguments: arguments_ },
});

test("advertises product tools while retaining legacy dispatch", () => {
  assert.deepEqual(
    ollamaTools.map((tool) => tool.function.name),
    [
      "celsius_to_fahrenheit",
      "list_products",
      "search_products",
      "get_product_by_id",
    ],
  );
  assert.equal(
    dispatchToolCalls([call("search_perfumes", { scentFamily: "woody" })])
      .perfumeMatches.length,
    2,
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
    [{ scentFamily: "woody", maxPriceGbp: "£40" }, ["cedar-dusk"]],
    [{ scentFamily: "woody", underPriceGbp: 40 }, []],
    [{ scentFamily: "woody", underPriceGbp: "£40" }, []],
    [{ scentFamily: "woody", overPriceGbp: 40 }, ["emberwood"]],
  ]) {
    assert.deepEqual(
      dispatchToolCalls([call("search_products", filters)]).products.map(
        (p) => p.id,
      ),
      expected,
    );
  }
});

test("text-only tools retain the latest products", () => {
  const result = dispatchToolCalls([
    call("search_products", { name: "cedar" }),
    call("celsius_to_fahrenheit", { celsius: 20 }),
  ]);
  assert.deepEqual(
    result.products.map((product) => product.id),
    ["cedar-dusk"],
  );
});

test("empty product results replace legacy perfume matches", () => {
  const result = dispatchToolCalls([
    call("search_perfumes", { scentFamily: "woody" }),
    call("get_product_by_id", { id: "missing" }),
  ]);
  assert.deepEqual(result.products, []);
  assert.equal(result.perfumeMatches, undefined);
});

test("later empty products clear previous cards while text-only results leave them alone", async (t) => {
  const responses = [
    {
      message: {
        role: "assistant",
        content: "",
        tool_calls: [
          call("list_products", {}),
          call("celsius_to_fahrenheit", { celsius: 20 }),
        ],
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

test("validates a batch before executing any product tool", () => {
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
      dispatchToolCalls([
        call("list_products", {}),
        call("search_products", {}),
      ]),
    { status: 400 },
  );
  assert.throws(
    () => dispatchToolCalls([call("get_product_by_id", { id: "" })]),
    { status: 400 },
  );
});
