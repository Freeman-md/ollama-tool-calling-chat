import { perfumes } from "./perfumes";
import type { Perfume } from "./types";

export function searchPerfumes(filters: {
  scentFamily?: string;
  maxPricePence?: number;
}): Perfume[] {
  return perfumes.filter(
    (perfume) =>
      (filters.scentFamily === undefined || perfume.scentFamily === filters.scentFamily) &&
      (filters.maxPricePence === undefined || perfume.pricePence <= filters.maxPricePence),
  );
}
