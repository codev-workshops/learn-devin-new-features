import { useState } from "react";
import { ErrorNote, Loading, Price, Status } from "../components/ui";
import { api } from "../lib/api";
import { useQuery } from "../lib/useApi";
import { useAdmin } from "./AdminLayout";

export function AbandonedCartsPage() {
  const admin = useAdmin();
  const [olderThan, setOlderThan] = useState(24);
  const q = useQuery(
    () => api.listAbandonedCarts(admin.identity, olderThan),
    [admin.brand, olderThan],
  );
  return (
    <>
      <h1>Abandoned carts</h1>
      <label className="inline">
        Idle for at least
        <select value={olderThan} onChange={(e) => setOlderThan(Number(e.target.value))}>
          {[1, 6, 24, 48, 168].map((h) => (
            <option key={h} value={h}>
              {h} h
            </option>
          ))}
        </select>
      </label>
      {q.loading ? (
        <Loading what="abandoned carts" />
      ) : q.error || !q.data ? (
        <ErrorNote message={q.error ?? "No data"} onRetry={q.reload} />
      ) : (
        <table className="data">
          <thead>
            <tr>
              <th scope="col">Cart</th>
              <th scope="col">Customer</th>
              <th scope="col">Age</th>
              <th scope="col">Lines</th>
              <th scope="col">Value</th>
              <th scope="col">Payment</th>
            </tr>
          </thead>
          <tbody>
            {q.data.map(({ cart, ageHours, pendingPaymentId }) => (
              <tr key={cart.id}>
                <td>
                  <code>{cart.id.slice(0, 8)}</code>
                </td>
                <td>{cart.user}</td>
                <td>{ageHours} h</td>
                <td>{cart.lines.length}</td>
                <td>
                  <Price value={cart.totals.total} />
                </td>
                <td>
                  {pendingPaymentId ? (
                    <Status tone="warn">{`pending ${pendingPaymentId}`}</Status>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
