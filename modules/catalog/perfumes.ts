import type { Perfume } from "./types";

// Fictional products for the local catalog.
export const perfumes: Perfume[] = [
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
];
