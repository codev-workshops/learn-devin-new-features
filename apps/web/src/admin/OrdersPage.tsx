import { ORDER_STATUSES, type OrderStatus } from "@kade/contracts";
import { useState } from "react";
import { ErrorNote, Loading, Price, Status, label, statusTone } from "../components/ui";
import { api } from "../lib/api";
import { useQuery } from "../lib/useApi";
import { useAdmin } from "./AdminLayout";

export function AdminOrdersPage() {
  const admin = useAdmin();
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [cursor, setCursor] = useState<string>();
  const q = useQuery(
    () => api.listAdminOrders(admin.identity, { status: status || undefined, limit: 25, cursor }),
    [admin.brand, status, cursor],
  );
  return (
    <>
      <h1>Orders</h1>
      <label className="inline">
        Status
        <select
          value={status}
          onChange={(e) => {
            setCursor(undefined);
            setStatus(e.target.value as OrderStatus | "");
          }}
        >
          <option value="">All</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      </label>
      {q.loading ? (
        <Loading what="orders" />
      ) : q.error || !q.data ? (
        <ErrorNote message={q.error ?? "No data"} onRetry={q.reload} />
      ) : (
        <>
          <table className="data">
            <thead>
              <tr>
                <th scope="col">Number</th>
                <th scope="col">Customer</th>
                <th scope="col">Placed</th>
                <th scope="col">Status</th>
                <th scope="col">Lines</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {q.data.items.map((o) => (
                <tr key={o.id}>
                  <td>{o.number}</td>
                  <td>{o.user}</td>
                  <td>{o.placedAt.slice(0, 16).replace("T", " ")}</td>
                  <td>
                    <Status tone={statusTone(o.status)}>{label(o.status)}</Status>
                  </td>
                  <td>{o.lines.reduce((s, l) => s + l.quantity, 0)}</td>
                  <td>
                    <Price value={o.totals.total} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="actions">
            {cursor && (
              <button type="button" onClick={() => setCursor(undefined)}>
                First page
              </button>
            )}
            {q.data.nextCursor && (
              <button type="button" onClick={() => setCursor(q.data?.nextCursor)}>
                Next page
              </button>
            )}
          </p>
        </>
      )}
    </>
  );
}
