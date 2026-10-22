import type { PriceList } from "@harbourline/contracts";
import { useState } from "react";
import { ErrorNote, Loading, Price } from "../components/ui";
import { api } from "../lib/api";
import { describeError, useQuery } from "../lib/useApi";
import { useAdmin } from "./AdminLayout";

export function PriceListsPage() {
  const admin = useAdmin();
  const q = useQuery(() => api.listPriceLists(admin.identity), [admin.brand]);
  const [draft, setDraft] = useState<PriceList>();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState<string>();

  async function save() {
    if (!draft) return;
    try {
      await api.replacePriceList(admin.identity, draft.id, draft);
      setSaved(`Saved ${draft.name}`);
      setDraft(undefined);
      setError(undefined);
      q.reload();
    } catch (e) {
      setError(describeError(e));
    }
  }

  if (q.loading) return <Loading what="price lists" />;
  if (q.error || !q.data) return <ErrorNote message={q.error ?? "No data"} onRetry={q.reload} />;
  return (
    <>
      <h1>Price lists</h1>
      {saved && <p role="status">{saved}</p>}
      {error && <ErrorNote message={error} />}
      {q.data.map((pl) => {
        const editing = draft?.id === pl.id ? draft : null;
        return (
          <section key={pl.id} className="price-list">
            <h2>
              {pl.name} <small className="muted">{pl.currency}</small>
              {pl.activeFrom && (
                <small className="muted">
                  {" "}
                  · {pl.activeFrom.slice(0, 10)} → {pl.activeTo?.slice(0, 10) ?? "open"}
                </small>
              )}
            </h2>
            <table className="data">
              <thead>
                <tr>
                  <th scope="col">SKU</th>
                  <th scope="col">Price</th>
                  <th scope="col">Compare at</th>
                </tr>
              </thead>
              <tbody>
                {(editing ?? pl).entries.map((e, i) => (
                  <tr key={e.sku}>
                    <td>{e.sku}</td>
                    <td>
                      {editing ? (
                        <input
                          aria-label={`Price for ${e.sku}`}
                          value={e.price.amount}
                          pattern="\\d+\\.\\d{2}"
                          onChange={(ev) =>
                            setDraft({
                              ...editing,
                              entries: editing.entries.map((x, j) =>
                                j === i
                                  ? { ...x, price: { ...x.price, amount: ev.target.value } }
                                  : x,
                              ),
                            })
                          }
                        />
                      ) : (
                        /* PLANTED (a11y-02): 3.1:1 contrast price badge. See apps/web/PLANTED.md. */
                        <Price value={e.price} className="price-badge" />
                      )}
                    </td>
                    <td>{e.compareAtPrice ? <Price value={e.compareAtPrice} /> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="actions">
              {editing ? (
                <>
                  <button type="button" className="primary" onClick={() => void save()}>
                    Save {pl.name}
                  </button>
                  <button type="button" onClick={() => setDraft(undefined)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setDraft(structuredClone(pl))}>
                  Edit {pl.name}
                </button>
              )}
            </p>
          </section>
        );
      })}
    </>
  );
}
