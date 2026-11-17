import { perfumes } from "./perfumes";
import type { Perfume } from "./types";

export function searchPerfumes(filters: {
  scentFamily?: string;
  maxPricePence?: number;
}): Perfume[] {
  const { scentFamily, maxPricePence } = filters;

  return perfumes.filter((perfume) => {
    const matchesScent = scentFamily === undefined || perfume.scentFamily === scentFamily;
    const matchesPrice = maxPricePence === undefined || perfume.pricePence <= maxPricePence;

    return matchesScent && matchesPrice;
  });
}
