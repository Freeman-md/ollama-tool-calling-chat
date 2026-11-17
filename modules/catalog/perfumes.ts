import type { Perfume } from "./types";

// Fictional products for the local catalog.
export const perfumes: Perfume[] = [
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
];
