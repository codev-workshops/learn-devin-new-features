import type { Cart } from "@kade/contracts";
import { useState } from "react";
import { Link } from "react-router";
import { ErrorNote, Loading, Price } from "../components/ui";
import { api } from "../lib/api";
import { getShopper, setShopperCart } from "../lib/session";
import { describeError, useQuery } from "../lib/useApi";
import { useShop } from "./ShopLayout";

export function CartPage() {
  const shop = useShop();
  const cartId = getShopper(shop.brand).cartId;
  const q = useQuery(
    async () => (cartId ? api.getCart(shop.identity, cartId) : null),
    [shop.brand, cartId],
  );
  const [error, setError] = useState<string>();
  const [cart, setCart] = useState<Cart | null>();
  const current = cart === undefined ? q.data : cart;

  async function setQuantity(lineId: string, quantity: number) {
    if (!cartId) return;
    try {
      setCart(await api.updateCartLine(shop.identity, cartId, lineId, quantity));
      setError(undefined);
    } catch (e) {
      setError(describeError(e));
    }
  }

  if (q.loading && cart === undefined) return <Loading what="cart" />;
  if (q.error) {
    if (/not_found|conflict/.test(q.error)) setShopperCart(shop.brand, undefined);
    return <ErrorNote message={q.error} onRetry={q.reload} />;
  }
  if (!current || current.lines.length === 0 || current.status !== "open") {
    return (
      <>
        <h1>Your cart</h1>
        <p>Your cart is empty.</p>
        <Link to={`/shop/${shop.brand}`} className="button">
          Browse the catalog
        </Link>
      </>
    );
  }
  return (
    <>
      <h1>Your cart</h1>
      <CartTable cart={current} locale={shop.locale} onQuantity={setQuantity} />
      {error && <ErrorNote message={error} />}
      <p className="actions">
        <Link to={`/shop/${shop.brand}/checkout`} className="button primary">
          Checkout
        </Link>
      </p>
    </>
  );
}

export function CartTable({
  cart,
  locale,
  onQuantity,
}: {
  cart: Cart;
  locale: string;
  onQuantity?: (lineId: string, q: number) => void;
}) {
  const t = cart.totals;
  return (
    <table className="cart-table">
      <thead>
        <tr>
          <th scope="col">Item</th>
          <th scope="col">Unit price</th>
          <th scope="col">Qty</th>
          <th scope="col">Line total</th>
        </tr>
      </thead>
      <tbody>
        {cart.lines.map((l) => (
          <tr key={l.id}>
            <td>
              {l.name}
              <br />
              <small className="muted">{l.sku}</small>
            </td>
            <td>
              <Price value={l.unitPrice} locale={locale} />
            </td>
            <td>
              {onQuantity ? (
                <span className="qty">
                  <button
                    type="button"
                    aria-label={`Decrease ${l.name}`}
                    onClick={() => onQuantity(l.id, l.quantity - 1)}
                  >
                    −
                  </button>
                  <span aria-live="polite">{l.quantity}</span>
                  <button
                    type="button"
                    aria-label={`Increase ${l.name}`}
                    onClick={() => onQuantity(l.id, l.quantity + 1)}
                  >
                    +
                  </button>
                  <button type="button" className="link" onClick={() => onQuantity(l.id, 0)}>
                    Remove
                  </button>
                </span>
              ) : (
                l.quantity
              )}
            </td>
            <td>
              <Price value={l.lineTotal} locale={locale} />
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row" colSpan={3}>
            Subtotal
          </th>
          <td>
            <Price value={t.subtotal} locale={locale} />
          </td>
        </tr>
        <tr>
          <th scope="row" colSpan={3}>
            {t.taxIncluded ? "Includes VAT" : "Sales tax"}
          </th>
          <td>
            <Price value={t.tax} locale={locale} />
          </td>
        </tr>
        <tr>
          <th scope="row" colSpan={3}>
            Shipping
          </th>
          <td>
            {t.shipping.amount === "0.00" ? "Free" : <Price value={t.shipping} locale={locale} />}
          </td>
        </tr>
        <tr className="grand-total">
          <th scope="row" colSpan={3}>
            Total
          </th>
          <td>
            <Price value={t.total} locale={locale} />
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
