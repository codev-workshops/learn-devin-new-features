import { useState } from "react";
import { Link, useParams } from "react-router";
import { ErrorNote, Loading, Price, Status, label, statusTone } from "../components/ui";
import { api } from "../lib/api";
import { describeError, useQuery } from "../lib/useApi";
import { CartTable } from "./CartPage";
import { useShop } from "./ShopLayout";

export function OrdersPage() {
  const shop = useShop();
  const q = useQuery(() => api.listOrders(shop.identity, { limit: 50 }), [shop.brand]);
  if (q.loading) return <Loading what="orders" />;
  if (q.error || !q.data) return <ErrorNote message={q.error ?? "No data"} onRetry={q.reload} />;
  return (
    <>
      <h1>Your orders</h1>
      {q.data.items.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Placed</th>
              <th scope="col">Status</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {q.data.items.map((o) => (
              <tr key={o.id}>
                <td>
                  <Link to={`/shop/${shop.brand}/orders/${o.id}`}>{o.number}</Link>
                </td>
                <td>{new Date(o.placedAt).toLocaleDateString(shop.locale)}</td>
                <td>
                  <Status tone={statusTone(o.status)}>{label(o.status)}</Status>
                </td>
                <td>
                  <Price value={o.totals.total} locale={shop.locale} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export function OrderStatusPage() {
  const shop = useShop();
  const { orderId = "" } = useParams();
  const order = useQuery(() => api.getOrder(shop.identity, orderId), [shop.brand, orderId]);
  const events = useQuery(() => api.listOrderEvents(shop.identity, orderId), [shop.brand, orderId]);
  const [error, setError] = useState<string>();

  async function cancel() {
    try {
      await api.cancelOrder(shop.identity, orderId);
      order.reload();
      events.reload();
    } catch (e) {
      setError(describeError(e));
    }
  }

  if (order.loading) return <Loading what="order" />;
  if (order.error || !order.data)
    return <ErrorNote message={order.error ?? "No data"} onRetry={order.reload} />;
  const o = order.data;
  return (
    <article className="order-status">
      <nav aria-label="Breadcrumb" className="crumbs">
        <Link to={`/shop/${shop.brand}/orders`}>Orders</Link> / {o.number}
      </nav>
      <h1>
        Order {o.number} <Status tone={statusTone(o.status)}>{label(o.status)}</Status>
      </h1>
      <p className="muted">
        Placed {new Date(o.placedAt).toLocaleString(shop.locale)}{" "}
        {o.shippingAddress && (
          <>
            {" "}
            · ships to {o.shippingAddress.city}, {o.shippingAddress.country}
          </>
        )}
      </p>
      <CartTable
        cart={{
          ...o,
          lines: o.lines.map((l) => ({ ...l, id: l.sku })),
          status: "open",
          createdAt: o.placedAt,
        }}
        locale={shop.locale}
      />
      {(o.status === "pending_payment" || o.status === "paid") && (
        <p className="actions">
          <button type="button" onClick={() => void cancel()}>
            Cancel order
          </button>
        </p>
      )}
      {error && <ErrorNote message={error} />}
      <h2>Timeline</h2>
      {events.loading ? (
        <Loading what="timeline" />
      ) : events.error ? (
        <ErrorNote message={events.error} onRetry={events.reload} />
      ) : (
        <ol className="timeline">
          {(events.data ?? []).map((e) => (
            <li key={e.id}>
              <time dateTime={e.at}>{new Date(e.at).toLocaleString(shop.locale)}</time>
              <strong>{label(e.type)}</strong>
              {e.type === "status_changed" && (
                <span>
                  {" "}
                  {label(e.from ?? "")} → {label(e.to ?? "")}
                </span>
              )}
              {e.detail && <span className="muted"> — {e.detail}</span>}
              <small className="muted"> ({e.source})</small>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
