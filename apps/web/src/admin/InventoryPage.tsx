import type { InventoryRow } from "@harbourline/contracts";
import { useState } from "react";
import { ErrorNote, Loading, Status } from "../components/ui";
import { api } from "../lib/api";
import { describeError, useQuery } from "../lib/useApi";
import { useAdmin } from "./AdminLayout";

export function InventoryPage() {
  const admin = useAdmin();
  const [belowSafety, setBelowSafety] = useState(false);
  const q = useQuery(
    () => api.listInventory(admin.identity, belowSafety),
    [admin.brand, belowSafety],
  );
  const [error, setError] = useState<string>();
  const [rows, setRows] = useState<InventoryRow[]>();
  const list = rows ?? q.data ?? [];

  async function adjust(row: InventoryRow, delta: number) {
    try {
      const updated = await api.adjustInventory(admin.identity, row.sku, {
        warehouse: row.warehouse,
        delta,
        reason: "count_correction",
      });
      setRows(
        list.map((r) => (r.sku === updated.sku && r.warehouse === updated.warehouse ? updated : r)),
      );
      setError(undefined);
    } catch (e) {
      setError(describeError(e));
    }
  }

  if (q.loading && !rows) return <Loading what="inventory" />;
  if (q.error) return <ErrorNote message={q.error} onRetry={q.reload} />;
  return (
    <>
      <h1>Inventory</h1>
      <label className="inline">
        <input
          type="checkbox"
          checked={belowSafety}
          onChange={(e) => {
            setRows(undefined);
            setBelowSafety(e.target.checked);
          }}
        />
        Only rows at or below safety stock
      </label>
      {error && <ErrorNote message={error} />}
      <table className="data">
        <thead>
          <tr>
            <th scope="col">SKU</th>
            <th scope="col">Warehouse</th>
            <th scope="col">On hand</th>
            <th scope="col">Reserved</th>
            <th scope="col">Available</th>
            <th scope="col">Safety</th>
            <th scope="col">Adjust</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => (
            <tr key={`${r.sku}/${r.warehouse}`}>
              <td>{r.sku}</td>
              <td>{r.warehouse}</td>
              <td>{r.onHand}</td>
              <td>{r.reserved}</td>
              <td>
                {r.available}{" "}
                {r.available <= r.safetyStock && (
                  <Status tone={r.available <= 0 ? "bad" : "warn"}>
                    {r.available <= 0 ? "out" : "low"}
                  </Status>
                )}
              </td>
              <td>{r.safetyStock}</td>
              <td className="icon-actions">
                {/* PLANTED (a11y-01): icon-only buttons with no accessible name. See apps/web/PLANTED.md. */}
                <button type="button" onClick={() => void adjust(r, -1)}>
                  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                    <path d="M3 8h10" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
                <button type="button" onClick={() => void adjust(r, 1)}>
                  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
