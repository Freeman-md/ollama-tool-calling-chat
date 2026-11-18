import assert from "node:assert/strict";
import test from "node:test";
import {
  getProductById,
  listProducts,
  searchProducts,
} from "@/modules/catalog/service";

test("lists products in catalog order with a default and explicit limit", () => {
  assert.deepEqual(
    listProducts({}).map((product) => product.id),
    ["cedar-dusk", "emberwood", "rose-veil"],
  );
  assert.deepEqual(
    listProducts({ limit: 2 }).map((product) => product.id),
    ["cedar-dusk", "emberwood"],
  );
});

test("searches by name, category, scent and inclusive price", () => {
  assert.deepEqual(
    searchProducts({ name: " DUSK " }).map((product) => product.id),
    ["cedar-dusk"],
  );
  assert.deepEqual(
    searchProducts({
      category: "PERFUME",
      scentFamily: "woody",
      maxPricePence: 4000,
    }).map((product) => product.id),
    ["cedar-dusk"],
  );
  assert.deepEqual(
    searchProducts({ scentFamily: "woody", maxPricePence: 3999 }),
    [],
  );
  assert.deepEqual(
    searchProducts({ scentFamily: "woody", minPricePence: 4001 }).map(
      (product) => product.id,
    ),
    ["emberwood"],
  );
  assert.deepEqual(searchProducts({ name: "nonexistent" }), []);
});

test("returns catalog details and availability or null for an unknown ID", () => {
  const product = getProductById("cedar-dusk");
  assert.equal(product.category, "perfume");
  assert.equal(product.pricePence, 4000);
  assert.equal(product.availability, "in_stock");
  assert.match(product.description, /Sample/);
  assert.deepEqual(product.details, {
    scentFamily: "woody",
    notes: ["cedarwood", "sandalwood", "vetiver"],
    bottleSizeMl: 50,
  });
  assert.equal(getProductById("rose-veil").availability, "out_of_stock");
  assert.equal(getProductById("unknown"), null);
});

test("filters by each scent or price boundary and applies both bounds", () => {
  assert.deepEqual(
    searchProducts({ scentFamily: "woody" }).map((product) => product.name),
    ["Cedar Dusk", "Emberwood"],
  );
  assert.deepEqual(
    searchProducts({ maxPricePence: 4000 }).map((product) => product.name),
    ["Cedar Dusk", "Rose Veil"],
  );
  assert.deepEqual(
    searchProducts({
      scentFamily: "woody",
      minPricePence: 4000,
      maxPricePence: 4000,
    }).map((product) => product.name),
    ["Cedar Dusk"],
  );
  assert.deepEqual(searchProducts({ minPricePence: 5501 }), []);
});
