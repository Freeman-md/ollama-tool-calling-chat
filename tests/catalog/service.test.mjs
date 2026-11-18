import assert from "node:assert/strict";
import test from "node:test";
import {
  getProductById,
  listProducts,
  searchPerfumes,
  searchProducts,
} from "@/modules/catalog/service";

test("returns the fictional catalog in order with no filters", () => {
  assert.deepEqual(searchPerfumes({}), [
    {
      id: "cedar-dusk",
      name: "Cedar Dusk",
      pricePence: 4000,
      scentFamily: "woody",
      notes: ["cedarwood", "sandalwood", "vetiver"],
      image: {
        src: "/catalog/perfumes/cedar-dusk.webp",
        alt: "Cedar Dusk perfume in an amber glass bottle",
      },
    },
    {
      id: "emberwood",
      name: "Emberwood",
      pricePence: 5500,
      scentFamily: "woody",
      notes: ["oud", "patchouli", "amber"],
      image: {
        src: "/catalog/perfumes/emberwood.webp",
        alt: "Emberwood perfume in a smoky brown glass bottle",
      },
    },
    {
      id: "rose-veil",
      name: "Rose Veil",
      pricePence: 3200,
      scentFamily: "floral",
      notes: ["rose", "peony", "white musk"],
      image: {
        src: "/catalog/perfumes/rose-veil.webp",
        alt: "Rose Veil perfume in a pale blush glass bottle",
      },
    },
  ]);
});

test("applies both filters with an inclusive price limit", () => {
  assert.deepEqual(
    searchPerfumes({ scentFamily: "woody", maxPricePence: 4000 }).map(
      (p) => p.name,
    ),
    ["Cedar Dusk"],
  );
  assert.deepEqual(
    searchPerfumes({ scentFamily: "woody", maxPricePence: 3999 }),
    [],
  );
});

test("filters by scent family alone", () => {
  assert.deepEqual(
    searchPerfumes({ scentFamily: "woody" }).map((p) => p.name),
    ["Cedar Dusk", "Emberwood"],
  );
  assert.deepEqual(searchPerfumes({ scentFamily: "unknown" }), []);
});

test("filters by maximum price alone", () => {
  assert.deepEqual(
    searchPerfumes({ maxPricePence: 4000 }).map((p) => p.name),
    ["Cedar Dusk", "Rose Veil"],
  );
  assert.deepEqual(searchPerfumes({ maxPricePence: 0 }), []);
});

test("applies the inclusive minimum alongside other filters", () => {
  assert.deepEqual(
    searchPerfumes({
      scentFamily: "woody",
      minPricePence: 4000,
      maxPricePence: 4000,
    }).map((p) => p.name),
    ["Cedar Dusk"],
  );
  assert.deepEqual(
    searchPerfumes({
      scentFamily: "woody",
      minPricePence: 4001,
      maxPricePence: 5500,
    }).map((p) => p.name),
    ["Emberwood"],
  );
  assert.deepEqual(searchPerfumes({ minPricePence: 5501 }), []);
});

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
