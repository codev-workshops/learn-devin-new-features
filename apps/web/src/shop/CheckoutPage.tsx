import type { CheckoutInput } from "@kade/contracts";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ErrorNote, Loading } from "../components/ui";
import { api } from "../lib/api";
import { getShopper } from "../lib/session";
import { describeError, useQuery } from "../lib/useApi";
import { CartTable } from "./CartPage";
import { useShop } from "./ShopLayout";

const DEFAULT_ADDRESS: Record<string, CheckoutInput["shippingAddress"]> = {
  "lumen-home": { name: "", line1: "", city: "", region: "NJ", postalCode: "", country: "US" },
  "trailhead-supply": { name: "", line1: "", city: "", postalCode: "", country: "DE" },
};

export function CheckoutPage() {
  const shop = useShop();
  const navigate = useNavigate();
  const cartId = getShopper(shop.brand).cartId;
  const q = useQuery(
    async () => (cartId ? api.getCart(shop.identity, cartId) : null),
    [shop.brand, cartId],
  );
  const [email, setEmail] = useState(shop.identity.user);
  const [address, setAddress] = useState(DEFAULT_ADDRESS[shop.brand]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  if (q.loading) return <Loading what="checkout" />;
  if (q.error || !q.data || q.data.lines.length === 0 || q.data.status !== "open") {
    return (
      <>
        <h1>Checkout</h1>
        <p>Nothing to check out yet.</p>
        <Link to={`/shop/${shop.brand}`}>Back to the catalog</Link>
      </>
    );
  }
  const cart = q.data;
  const set = (k: keyof CheckoutInput["shippingAddress"]) => (e: { target: { value: string } }) =>
    setAddress((a) => ({ ...a, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const result = await api.checkout(shop.identity, {
        cartId: cart.id,
        email,
        shippingAddress: address,
      });
      const url = new URL(result.payment.redirectUrl, window.location.origin);
      navigate(
        url.origin === window.location.origin
          ? url.pathname
          : `/shop/${shop.brand}/orders/${result.order.id}`,
        {
          state: { orderId: result.order.id },
        },
      );
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="checkout">
      <section>
        <h1>Checkout</h1>
        <form onSubmit={(e) => void submit(e)} className="stack">
          <label>
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Full name
            <input required value={address.name} onChange={set("name")} />
          </label>
          <label>
            Address line 1
            <input required value={address.line1} onChange={set("line1")} />
          </label>
          <label>
            Address line 2
            <input value={address.line2 ?? ""} onChange={set("line2")} />
          </label>
          <div className="row">
            <label>
              City
              <input required value={address.city} onChange={set("city")} />
            </label>
            <label>
              Region
              <input value={address.region ?? ""} onChange={set("region")} />
            </label>
            <label>
              Postal code
              <input required value={address.postalCode} onChange={set("postalCode")} />
            </label>
            <label>
              Country
              <input
                required
                pattern="[A-Z]{2}"
                maxLength={2}
                value={address.country}
                onChange={set("country")}
              />
            </label>
          </div>
          <button type="submit" className="primary" disabled={busy}>
            {busy ? "Placing order…" : "Pay with PayGate"}
          </button>
          {error && <ErrorNote message={error} />}
        </form>
      </section>
      <aside aria-label="Order summary">
        <h2>Order summary</h2>
        <CartTable cart={cart} locale={shop.locale} />
      </aside>
    </div>
  );
}
