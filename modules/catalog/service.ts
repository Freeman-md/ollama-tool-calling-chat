import { perfumes } from "./perfumes";
import type { Perfume } from "./types";

export function searchPerfumes(filters: {
  scentFamily?: string;
  minPricePence?: number;
  maxPricePence?: number;
}): Perfume[] {
  const { scentFamily, minPricePence, maxPricePence } = filters;

  return perfumes.filter((perfume) => {
    const matchesScent =
      scentFamily === undefined || perfume.scentFamily === scentFamily;
    const matchesMinimumPrice =
      minPricePence === undefined || perfume.pricePence >= minPricePence;
    const matchesMaximumPrice =
      maxPricePence === undefined || perfume.pricePence <= maxPricePence;
    const matchesPrice = matchesMinimumPrice && matchesMaximumPrice;

    return matchesScent && matchesPrice;
  });
}
