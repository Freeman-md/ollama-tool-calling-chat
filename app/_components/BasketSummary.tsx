import type { CartSnapshot } from "@/modules/cart/types";

export function BasketSummary({
  cart,
  notice,
}: {
  cart: CartSnapshot;
  notice?: string;
}) {
  const total = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: cart.currency,
  }).format(cart.totalPence / 100);
  const isEmpty = cart.items.length === 0;

  return (
    <section className="basket-summary" aria-label="Basket">
      <h2>Your basket</h2>
      {notice && (
        <p className="basket-notice" role="status">
          {notice}
        </p>
      )}
      {isEmpty ? (
        <p className="basket-empty">No items in your basket.</p>
      ) : (
        <ul className="basket-items">
          {cart.items.map(({ productId, name, quantity }) => (
            <li className="basket-row" key={productId}>
              <span>{name}</span>
              <span className="basket-quantity">Quantity {quantity}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="basket-row basket-total">
        <span>Total</span>
        <strong>{total}</strong>
      </p>
    </section>
  );
}
