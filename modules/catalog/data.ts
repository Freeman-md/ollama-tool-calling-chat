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
  {
    id: "harbour-classic",
    name: "Harbour Classic",
    category: "watch",
    description: "Fictional sample watch with a cream dial and leather strap.",
    pricePence: 8900,
    availability: "in_stock",
    details: {
      movement: "quartz",
      caseDiameterMm: 38,
      strapMaterial: "leather",
    },
    image: {
      src: "/catalog/watches/harbour-classic.webp",
      alt: "Silver watch with cream dial and brown leather strap",
    },
  },
  {
    id: "slate-automatic",
    name: "Slate Automatic",
    category: "watch",
    description:
      "Fictional sample watch with a charcoal dial and steel bracelet.",
    pricePence: 14500,
    availability: "out_of_stock",
    details: {
      movement: "automatic",
      caseDiameterMm: 42,
      strapMaterial: "stainless steel",
    },
    image: {
      src: "/catalog/watches/slate-automatic.webp",
      alt: "Steel watch with charcoal dial and steel bracelet",
    },
  },
  {
    id: "sun-disc-necklace",
    name: "Sun Disc Necklace",
    category: "jewellery",
    description: "Fictional sample necklace with a simple round pendant.",
    pricePence: 7200,
    availability: "in_stock",
    details: { pieceType: "necklace", material: "gold vermeil", lengthCm: 45 },
    image: {
      src: "/catalog/jewellery/sun-disc-necklace.webp",
      alt: "Gold pendant necklace with a round disc",
    },
  },
  {
    id: "silver-link-bracelet",
    name: "Silver Link Bracelet",
    category: "jewellery",
    description: "Fictional sample bracelet with polished silver links.",
    pricePence: 6200,
    availability: "out_of_stock",
    details: {
      pieceType: "bracelet",
      material: "sterling silver",
      lengthCm: 19,
    },
    image: {
      src: "/catalog/jewellery/silver-link-bracelet.webp",
      alt: "Polished silver chain bracelet",
    },
  },
];
