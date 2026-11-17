import assert from "node:assert/strict";
import test from "node:test";
import { searchPerfumes } from "@/modules/catalog/service";

test("returns the fictional catalog in order with no filters", () => {
  assert.deepEqual(searchPerfumes({}), [
    {
      id: "cedar-dusk",
      name: "Cedar Dusk",
      pricePence: 4000,
      scentFamily: "woody",
      notes: ["cedarwood", "sandalwood", "vetiver"],
    },
    {
      id: "emberwood",
      name: "Emberwood",
      pricePence: 5500,
      scentFamily: "woody",
      notes: ["oud", "patchouli", "amber"],
    },
    {
      id: "rose-veil",
      name: "Rose Veil",
      pricePence: 3200,
      scentFamily: "floral",
      notes: ["rose", "peony", "white musk"],
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
