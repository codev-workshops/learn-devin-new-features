import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { ErrorNote } from "../components/ui";
import { api } from "../lib/api";
import { setShopperCart } from "../lib/session";
import { describeError } from "../lib/useApi";
import { useShop } from "./ShopLayout";

/** Stand-in for the PayGate hosted checkout page. Mock mode only; the live API redirects to paygate-fake. */
export function PayPage() {
  const shop = useShop();
  const { paymentId = "" } = useParams();
  const navigate = useNavigate();
  const state = useLocation().state as { orderId?: string } | null;
  const [error, setError] = useState<string>();

  async function finish(outcome: "succeeded" | "failed") {
    try {
      const order = await api.mockSettlePayment(paymentId, outcome);
      setShopperCart(shop.brand, undefined);
      navigate(`/shop/${shop.brand}/orders/${order.id}`);
    } catch (e) {
      setError(describeError(e));
    }
  }

  return (
    <section className="paygate">
      <h1>PayGate (fake) hosted checkout</h1>
      <p className="muted">
        Payment <code>{paymentId}</code>
        {state?.orderId ? <> for order {state.orderId}</> : null}. No card details are collected in
        this fixture.
      </p>
      <p className="actions">
        <button type="button" className="primary" onClick={() => void finish("succeeded")}>
          Approve payment
        </button>
        <button type="button" onClick={() => void finish("failed")}>
          Decline payment
        </button>
      </p>
      {error && <ErrorNote message={error} />}
    </section>
  );
}
