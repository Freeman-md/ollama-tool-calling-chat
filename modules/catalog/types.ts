import { z } from "zod";

export const PerfumeSchema = z.object({
  id: z.string(),
  name: z.string(),
  pricePence: z.number(),
  scentFamily: z.string(),
  notes: z.array(z.string()),
  image: z.object({ src: z.string(), alt: z.string() }),
});

export type Perfume = z.infer<typeof PerfumeSchema>;
