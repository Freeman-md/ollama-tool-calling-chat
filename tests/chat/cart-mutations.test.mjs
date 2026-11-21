import assert from "node:assert/strict";
import test from "node:test";
import { cartService } from "@/modules/cart/service";
import * as addToCart from "@/modules/chat/tools/cart/add-to-cart";
import * as getCart from "@/modules/chat/tools/cart/get-cart";
import * as setCartQuantity from "@/modules/chat/tools/cart/set-cart-quantity";

const productId = "cedar-dusk";
const emptyCart = { items: [], totalPence: 0, currency: "GBP" };

function cedarDuskCart(quantity) {
  return {
    items: [{ productId, name: "Cedar Dusk", quantity }],
    totalPence: quantity * 4000,
    currency: "GBP",
  };
}

test("prepares without writing and adds to the latest quantity of an existing line", () => {
  const sessionId = cartService.resolveGuestSession(undefined);
  const add = addToCart.forGuestSession(sessionId);
  const first = add.prepare({ productId, quantity: 2 });
  const second = add.prepare({ productId, quantity: 3 });
  assert.deepEqual(cartService.getCart(sessionId), emptyCart);

  assert.deepEqual(first().cart, cedarDuskCart(2));
  const cart = cedarDuskCart(5);
  assert.deepEqual(second(), { content: JSON.stringify(cart), cart });
  assert.deepEqual(getCart.forGuestSession(sessionId).prepare({})().cart, cart);
});

test("sets the exact quantity and removes the line with zero", () => {
  const sessionId = cartService.resolveGuestSession(undefined);
  const set = setCartQuantity.forGuestSession(sessionId);
  const harbourClassic = {
    productId: "harbour-classic",
    name: "Harbour Classic",
    quantity: 1,
  };
  const otherItemCart = {
    items: [harbourClassic],
    totalPence: 8900,
    currency: "GBP",
  };
  const initial = set.prepare({ productId, quantity: 2 })().cart;
  assert.deepEqual(initial, cedarDuskCart(2));
  set.prepare({ productId: harbourClassic.productId, quantity: 1 })();

  const update = set.prepare({ productId, quantity: 4 });
  assert.deepEqual(cartService.getCart(sessionId).items, [
    ...initial.items,
    harbourClassic,
  ]);
  const cart = {
    items: [...cedarDuskCart(4).items, harbourClassic],
    totalPence: 24900,
    currency: "GBP",
  };
  assert.deepEqual(update(), { content: JSON.stringify(cart), cart });
  const remove = set.prepare({ productId, quantity: 0 });
  assert.deepEqual(remove().cart, otherItemCart);
  assert.deepEqual(
    remove().cart,
    otherItemCart,
    "removing an absent line leaves the other item intact",
  );
  assert.deepEqual(cartService.getCart(sessionId), otherItemCart);
});

test("rejects invalid quantities during preparation and leaves the basket intact", () => {
  const sessionId = cartService.resolveGuestSession(undefined);
  const add = addToCart.forGuestSession(sessionId);
  const set = setCartQuantity.forGuestSession(sessionId);
  const initial = add.prepare({ productId, quantity: 2 })().cart;

  assert.throws(() => add.prepare({ productId, quantity: 0 }), { status: 400 });
  for (const tool of [add, set]) {
    for (const quantity of [
      -1,
      1.5,
      "2",
      Infinity,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      assert.throws(() => tool.prepare({ productId, quantity }), {
        status: 400,
      });
    }
    assert.throws(() => tool.prepare({ productId }), { status: 400 });
    assert.throws(
      () => tool.prepare({ productId, quantity: 1, pricePence: 1 }),
      {
        status: 400,
      },
    );
  }
  assert.deepEqual(cartService.getCart(sessionId), initial);
});

test("rejects unknown and unavailable products at execution without a basket change", () => {
  const sessionId = cartService.resolveGuestSession(undefined);
  const add = addToCart.forGuestSession(sessionId);
  const set = setCartQuantity.forGuestSession(sessionId);
  const initial = add.prepare({ productId, quantity: 2 })().cart;

  for (const tool of [add, set]) {
    const unknown = tool.prepare({ productId: "unknown-product", quantity: 1 });
    assert.throws(unknown, {
      message: "That product is not in the catalog.",
      status: 400,
    });
    assert.deepEqual(cartService.getCart(sessionId), initial);

    const unavailable = tool.prepare({ productId: "rose-veil", quantity: 1 });
    assert.throws(unavailable, {
      message: "Rose Veil is out of stock.",
      status: 400,
    });
    assert.deepEqual(cartService.getCart(sessionId), initial);
  }
});

test("rejects quantities and totals outside the safe integer range without saving", () => {
  const sessionId = cartService.resolveGuestSession(undefined);
  const add = addToCart.forGuestSession(sessionId);
  const set = setCartQuantity.forGuestSession(sessionId);
  const initial = add.prepare({ productId, quantity: 2 })().cart;
  const tooLarge = { productId, quantity: Number.MAX_SAFE_INTEGER };

  assert.throws(add.prepare(tooLarge), {
    message: "The resulting basket quantity is too large.",
    status: 400,
  });
  assert.deepEqual(cartService.getCart(sessionId), initial);
  assert.throws(set.prepare(tooLarge), {
    message: "The resulting basket total is too large.",
    status: 400,
  });
  assert.deepEqual(cartService.getCart(sessionId), initial);
});

test("keeps changes to the same product isolated by guest session", () => {
  const first = cartService.resolveGuestSession(undefined);
  const second = cartService.resolveGuestSession(undefined);
  const addFirst = addToCart.forGuestSession(first);
  const setSecond = setCartQuantity.forGuestSession(second);

  addFirst.prepare({ productId, quantity: 2 })();
  assert.deepEqual(cartService.getCart(second), emptyCart);
  setSecond.prepare({ productId, quantity: 7 })();
  assert.deepEqual(cartService.getCart(first), cedarDuskCart(2));
  assert.deepEqual(cartService.getCart(second), cedarDuskCart(7));
});
