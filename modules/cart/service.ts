import { randomUUID } from "node:crypto";
import { getProductById } from "@/modules/catalog/service";
import type { CartSnapshot } from "./types";

type CartItem = { productId: string; quantity: number };

export function createCartService(
  sessions = new Map<string, readonly CartItem[]>(),
) {
  return {
    resolveGuestSession(cookieSessionId: string | undefined): string {
      if (cookieSessionId !== undefined && sessions.has(cookieSessionId)) {
        return cookieSessionId;
      }

      const sessionId = randomUUID();
      sessions.set(sessionId, []);
      return sessionId;
    },

    getCart(sessionId: string): CartSnapshot {
      const cartItems = sessions.get(sessionId);
      if (!cartItems) {
        throw new Error("Unknown guest basket session.");
      }

      const items: CartSnapshot["items"] = [];
      let totalPence = 0;
      for (const { productId, quantity } of cartItems) {
        const product = getProductById(productId);
        if (!product) {
          throw new Error(
            `Basket contains unknown catalog product ${productId}.`,
          );
        }
        items.push({ productId, name: product.name, quantity });
        totalPence += product.pricePence * quantity;
      }

      return { items, totalPence, currency: "GBP" };
    },
  };
}

export const cartService = createCartService();
