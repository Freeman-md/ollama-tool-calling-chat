import { randomUUID } from "node:crypto";
import { getProductById } from "@/modules/catalog/service";
import {
  CartQuantitySchema,
  PositiveCartQuantitySchema,
  type CartSnapshot,
} from "./types";

type CartItem = { productId: string; quantity: number };
type CartUpdateResult = { cart: CartSnapshot } | { error: string };

function buildCartSnapshot(cartItems: readonly CartItem[]): CartSnapshot {
  const items: CartSnapshot["items"] = [];
  let totalPence = 0;
  for (const { productId, quantity } of cartItems) {
    const product = getProductById(productId);
    if (!product) {
      throw new Error(`Basket contains unknown catalog product ${productId}.`);
    }
    items.push({ productId, name: product.name, quantity });
    totalPence += product.pricePence * quantity;
  }

  return { items, totalPence, currency: "GBP" };
}

export function createCartService(
  sessions = new Map<string, readonly CartItem[]>(),
) {
  function getCartItems(sessionId: string): readonly CartItem[] {
    const cartItems = sessions.get(sessionId);
    if (!cartItems) {
      throw new Error("Unknown guest basket session.");
    }
    return cartItems;
  }

  function updateQuantity(
    sessionId: string,
    { productId, quantity }: CartItem,
    operation: "add" | "set",
  ): CartUpdateResult {
    const quantitySchema =
      operation === "add" ? PositiveCartQuantitySchema : CartQuantitySchema;
    if (!quantitySchema.safeParse(quantity).success) {
      return { error: "Provide a valid whole-number basket quantity." };
    }

    const cartItems = getCartItems(sessionId);
    const product = getProductById(productId);
    if (!product) {
      return { error: "That product is not in the catalog." };
    }
    if (product.availability !== "in_stock") {
      return { error: `${product.name} is out of stock.` };
    }

    const itemIndex = cartItems.findIndex(
      (item) => item.productId === productId,
    );
    const currentQuantity = cartItems[itemIndex]?.quantity ?? 0;
    const nextQuantity =
      operation === "add" ? currentQuantity + quantity : quantity;
    if (!Number.isSafeInteger(nextQuantity)) {
      return { error: "The resulting basket quantity is too large." };
    }
    if (nextQuantity === currentQuantity) {
      return { cart: buildCartSnapshot(cartItems) };
    }

    const updatedItems = [...cartItems];
    const updatedItem = { productId, quantity: nextQuantity };
    if (itemIndex === -1) {
      updatedItems.push(updatedItem);
    } else if (nextQuantity === 0) {
      updatedItems.splice(itemIndex, 1);
    } else {
      updatedItems[itemIndex] = updatedItem;
    }

    const cart = buildCartSnapshot(updatedItems);
    if (!Number.isSafeInteger(cart.totalPence)) {
      return { error: "The resulting basket total is too large." };
    }
    sessions.set(sessionId, updatedItems);
    return { cart };
  }

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
      return buildCartSnapshot(getCartItems(sessionId));
    },

    addToCart(sessionId: string, item: CartItem): CartUpdateResult {
      return updateQuantity(sessionId, item, "add");
    },

    setCartQuantity(sessionId: string, item: CartItem): CartUpdateResult {
      return updateQuantity(sessionId, item, "set");
    },
  };
}

export const cartService = createCartService();
