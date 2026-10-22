import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ErrorNote, Loading, Price, Status, label, statusTone } from "../components/ui";
import { api } from "../lib/api";
import { useQuery, describeError } from "../lib/useApi";
import { getShopper, setShopperCart } from "../lib/session";
import { useShop } from "./ShopLayout";

export function ProductPage() {
  const shop = useShop();
  const { sku = "" } = useParams();
  const navigate = useNavigate();
  const q = useQuery(() => api.getProduct(shop.identity, sku), [shop.brand, sku]);
  const [variantSku, setVariantSku] = useState<string>();
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  if (q.loading) return <Loading what="product" />;
  if (q.error || !q.data) return <ErrorNote message={q.error ?? "No data"} onRetry={q.reload} />;
  const p = q.data;
  const chosen = p.variants.length ? (variantSku ?? p.variants[0].sku) : p.sku;
  const canBuy = p.availability !== "out_of_stock";

  async function addToCart() {
    setBusy(true);
    setError(undefined);
    try {
      let cartId: string | undefined = getShopper(shop.brand).cartId;
      if (!cartId) {
        cartId = (await api.createCart(shop.identity)).id;
        setShopperCart(shop.brand, cartId);
      }
      const ensured: string = cartId;
      try {
        await api.addCartLine(shop.identity, ensured, { sku: chosen, quantity });
      } catch (e) {
        if (!(e instanceof Error && /not_found|not open|conflict/i.test(e.message))) throw e;
        cartId = (await api.createCart(shop.identity)).id;
        setShopperCart(shop.brand, cartId);
        await api.addCartLine(shop.identity, ensured, { sku: chosen, quantity });
      }
      navigate(`/shop/${shop.brand}/cart`);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="product-detail">
      <nav aria-label="Breadcrumb" className="crumbs">
        <Link to={`/shop/${shop.brand}`}>Catalog</Link> /{" "}
        <Link to={`/shop/${shop.brand}/c/${p.collection}`}>{label(p.collection ?? "")}</Link> /{" "}
        {p.name}
      </nav>
      <div className="product-hero" aria-hidden="true">
        {p.sku}
      </div>
      <div>
        <h1>{p.name}</h1>
        <p className="price-row">
          <Price value={p.price} locale={shop.locale} className="price price-lg" />
          {p.compareAtPrice && (
            <s className="compare-at">
              <Price value={p.compareAtPrice} locale={shop.locale} />
            </s>
          )}
          <Status tone={statusTone(p.availability)}>{label(p.availability)}</Status>
        </p>
        {p.description && <p>{p.description}</p>}
        {p.bundle && <p className="muted">Bundle of {p.bundle.join(", ")}</p>}
        {p.preorder && <p className="muted">Pre-order: ships when stock arrives.</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void addToCart();
          }}
        >
          {p.variants.length > 0 && (
            <label>
              Variant
              <select value={chosen} onChange={(e) => setVariantSku(e.target.value)}>
                {p.variants.map((v) => (
                  <option key={v.sku} value={v.sku} disabled={v.onHand === 0 && !p.preorder}>
                    {Object.values(v.attributes).join(" / ")}
                    {v.onHand === 0 ? " — sold out" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Quantity
            <input
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
          <button type="submit" className="primary" disabled={!canBuy || busy}>
            {canBuy ? (p.preorder ? "Pre-order" : "Add to cart") : "Sold out"}
          </button>
        </form>
        {error && <ErrorNote message={error} />}
      </div>
    </article>
  );
}
