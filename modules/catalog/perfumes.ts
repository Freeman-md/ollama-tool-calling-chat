import type { Product } from "./types";

// Fictional products for the local catalog.
export const products: Product[] = [
  {
    id: "cedar-dusk",
    name: "Cedar Dusk",
    pricePence: 4000,
    category: "perfume",
    description: "Sample fragrance with a soft, woody character.",
    availability: "in_stock",
    details: {
      scentFamily: "woody",
      notes: ["cedarwood", "sandalwood", "vetiver"],
      bottleSizeMl: 50,
    },
    image: {
      src: "/catalog/perfumes/cedar-dusk.webp",
      alt: "Cedar Dusk perfume in an amber glass bottle",
    },
  },
  {
    id: "emberwood",
    name: "Emberwood",
    pricePence: 5500,
    category: "perfume",
    description: "Sample fragrance with a warm, woody character.",
    availability: "in_stock",
    details: {
      scentFamily: "woody",
      notes: ["oud", "patchouli", "amber"],
      bottleSizeMl: 50,
    },
    image: {
      src: "/catalog/perfumes/emberwood.webp",
      alt: "Emberwood perfume in a smoky brown glass bottle",
    },
  },
  {
    id: "rose-veil",
    name: "Rose Veil",
    pricePence: 3200,
    category: "perfume",
    description: "Sample fragrance with a light, floral character.",
    availability: "out_of_stock",
    details: {
      scentFamily: "floral",
      notes: ["rose", "peony", "white musk"],
      bottleSizeMl: 50,
    },
    image: {
      src: "/catalog/perfumes/rose-veil.webp",
      alt: "Rose Veil perfume in a pale blush glass bottle",
    },
  },
];
