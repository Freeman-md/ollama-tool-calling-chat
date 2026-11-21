import { randomBytes, randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { getProductById } from "@/modules/catalog/service";
import type { CheckoutReview, Order } from "@/modules/checkout/types";
import {
  CartQuantitySchema,
  PositiveCartQuantitySchema,
  type BasketChange,
  type CartSnapshot,
} from "./types";

type CartItem = { productId: string; quantity: number };
type CartState = {
  items: readonly CartItem[];
  revision: number;
  orders: readonly Order[];
};
type CartFailure = { error: string; conflict?: true };
type CartUpdateResult = { cart: CartSnapshot } | CartFailure;
export type CartOperation = "add" | "set";
export type CartReview = { revision: number; preview: BasketChange };
type ReviewedCheckout = { revision: number; preview: CheckoutReview };

type CartUpdate = {
  items: readonly CartItem[];
  cart: CartSnapshot;
  preview: BasketChange;
};

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

function buildCheckoutReview(
  cartItems: readonly CartItem[],
): CheckoutReview | CartFailure {
  if (cartItems.length === 0) {
    return { error: "Add an item to your basket before checking out." };
  }

  const items: CheckoutReview["items"] = [];
  let totalPence = 0;
  for (const { productId, quantity } of cartItems) {
    const product = getProductById(productId);
    if (!product) {
      return { error: "An item in your basket is no longer in the catalog." };
    }
    if (product.availability !== "in_stock") {
      return { error: `${product.name} is out of stock.` };
    }

    const unitPricePence = product.pricePence;
    if (!Number.isSafeInteger(unitPricePence) || unitPricePence < 0) {
      return { error: `${product.name} has an invalid price.` };
    }
    items.push({ productId, name: product.name, quantity, unitPricePence });
    totalPence += unitPricePence * quantity;
  }
  if (!Number.isSafeInteger(totalPence)) {
    return { error: "The basket total is too large to check out." };
  }

  return { items, totalPence, currency: "GBP" };
}

function calculateUpdate(
  cartItems: readonly CartItem[],
  { productId, quantity }: CartItem,
  operation: CartOperation,
): CartUpdate | CartFailure {
  const quantitySchema =
    operation === "add" ? PositiveCartQuantitySchema : CartQuantitySchema;
  if (!quantitySchema.safeParse(quantity).success) {
    return { error: "Provide a valid whole-number basket quantity." };
  }

  const product = getProductById(productId);
  if (!product) {
    return { error: "That product is not in the catalog." };
  }
  if (product.availability !== "in_stock") {
    return { error: `${product.name} is out of stock.` };
  }

  const itemIndex = cartItems.findIndex((item) => item.productId === productId);
  const previousQuantity = cartItems[itemIndex]?.quantity ?? 0;
  const nextQuantity =
    operation === "add" ? previousQuantity + quantity : quantity;
  if (!Number.isSafeInteger(nextQuantity)) {
    return { error: "The resulting basket quantity is too large." };
  }

  let items = cartItems;
  if (nextQuantity !== previousQuantity) {
    const updatedItems = [...cartItems];
    const updatedItem = { productId, quantity: nextQuantity };
    if (itemIndex === -1) {
      updatedItems.push(updatedItem);
    } else if (nextQuantity === 0) {
      updatedItems.splice(itemIndex, 1);
    } else {
      updatedItems[itemIndex] = updatedItem;
    }
    items = updatedItems;
  }

  const cart = buildCartSnapshot(items);
  if (!Number.isSafeInteger(cart.totalPence)) {
    return { error: "The resulting basket total is too large." };
  }

  return {
    items,
    cart,
    preview: {
      productName: product.name,
      previousQuantity,
      quantity: nextQuantity,
      totalPence: cart.totalPence,
      currency: cart.currency,
    },
  };
}

export function createCartService(sessions = new Map<string, CartState>()) {
  function getCartState(sessionId: string): CartState {
    const state = sessions.get(sessionId);
    if (!state) {
      throw new Error("Unknown guest basket session.");
    }
    return state;
  }

  function updateQuantity(
    sessionId: string,
    item: CartItem,
    operation: CartOperation,
    review?: CartReview,
  ): CartUpdateResult {
    const state = getCartState(sessionId);
    const { items, revision } = state;
    if (review && revision !== review.revision) {
      return {
        error: "Your basket changed. Ask for this change again.",
        conflict: true,
      };
    }

    const update = calculateUpdate(items, item, operation);
    if ("error" in update) {
      return update;
    }
    if (
      review &&
      (update.preview.totalPence !== review.preview.totalPence ||
        update.preview.productName !== review.preview.productName ||
        update.preview.previousQuantity !== review.preview.previousQuantity ||
        update.preview.quantity !== review.preview.quantity)
    ) {
      return {
        error: "The catalog changed. Ask for this change again.",
        conflict: true,
      };
    }

    if (items !== update.items) {
      sessions.set(sessionId, {
        ...state,
        items: update.items,
        revision: revision + 1,
      });
    }
    return { cart: update.cart };
  }

  return {
    resolveGuestSession(cookieSessionId: string | undefined): string {
      if (cookieSessionId !== undefined && sessions.has(cookieSessionId)) {
        return cookieSessionId;
      }

      const sessionId = randomUUID();
      sessions.set(sessionId, { items: [], revision: 0, orders: [] });
      return sessionId;
    },

    getCart(sessionId: string): CartSnapshot {
      return buildCartSnapshot(getCartState(sessionId).items);
    },

    getRevision(sessionId: string): number {
      return getCartState(sessionId).revision;
    },

    reviewChange(
      sessionId: string,
      item: CartItem,
      operation: CartOperation,
    ): CartReview | CartFailure {
      const { items, revision } = getCartState(sessionId);
      const update = calculateUpdate(items, item, operation);
      if ("error" in update) {
        return update;
      }
      return { revision, preview: update.preview };
    },

    addToCart(
      sessionId: string,
      item: CartItem,
      review?: CartReview,
    ): CartUpdateResult {
      return updateQuantity(sessionId, item, "add", review);
    },

    setCartQuantity(
      sessionId: string,
      item: CartItem,
      review?: CartReview,
    ): CartUpdateResult {
      return updateQuantity(sessionId, item, "set", review);
    },

    reviewCheckout(sessionId: string): ReviewedCheckout | CartFailure {
      const { items, revision } = getCartState(sessionId);
      const preview = buildCheckoutReview(items);
      if ("error" in preview) {
        return preview;
      }
      return { revision, preview };
    },

    placeOrder(
      sessionId: string,
      review: ReviewedCheckout,
    ): { orderReference: string } | { error: string } {
      const { items, revision, orders } = getCartState(sessionId);
      const changedReview = {
        error:
          "Your basket or catalog changed. Ask for a fresh checkout review.",
      };
      if (revision !== review.revision) {
        return changedReview;
      }

      const current = buildCheckoutReview(items);
      if ("error" in current || !isDeepStrictEqual(current, review.preview)) {
        return changedReview;
      }

      const order = {
        ...current,
        reference: `ORD-${randomBytes(8).toString("hex").toUpperCase()}`,
      };
      sessions.set(sessionId, {
        items: [],
        revision: revision + 1,
        orders: [...orders, order],
      });
      return { orderReference: order.reference };
    },

    listOrders(sessionId: string): readonly Order[] {
      return structuredClone(getCartState(sessionId).orders);
    },
  };
}

export const cartService = createCartService();
