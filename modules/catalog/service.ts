import { products } from "./perfumes";
import type { Product } from "./types";

export function listProducts({ limit = 3 }: { limit?: number }): Product[] {
  return products.slice(0, limit);
}

export function searchProducts(filters: {
  name?: string;
  category?: string;
  scentFamily?: string;
  minPricePence?: number;
  maxPricePence?: number;
}): Product[] {
  const { name, category, scentFamily, minPricePence, maxPricePence } = filters;

  return products.filter((product) => {
    const matchesName =
      name === undefined ||
      product.name.toLowerCase().includes(name.trim().toLowerCase());
    const matchesCategory =
      category === undefined ||
      product.category === category.trim().toLowerCase();
    const matchesScent =
      scentFamily === undefined ||
      (product.category === "perfume" &&
        product.details.scentFamily === scentFamily.trim().toLowerCase());
    const matchesMinimumPrice =
      minPricePence === undefined || product.pricePence >= minPricePence;
    const matchesMaximumPrice =
      maxPricePence === undefined || product.pricePence <= maxPricePence;
    const matchesPrice = matchesMinimumPrice && matchesMaximumPrice;

    return matchesName && matchesCategory && matchesScent && matchesPrice;
  });
}

export function getProductById(id: string): Product | null {
  return products.find((product) => product.id === id) ?? null;
}
