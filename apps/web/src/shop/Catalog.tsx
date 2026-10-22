import type { Product } from "@kade/contracts";
import { Link, useParams } from "react-router";
import { ErrorNote, Loading, Price, Status, label, statusTone } from "../components/ui";
import { api } from "../lib/api";
import { useQuery } from "../lib/useApi";
import { useShop } from "./ShopLayout";

export function Catalog() {
  const shop = useShop();
  const q = useQuery(() => api.listCollections(shop.identity), [shop.brand]);
  if (q.loading) return <Loading what="collections" />;
  if (q.error || !q.data) return <ErrorNote message={q.error ?? "No data"} onRetry={q.reload} />;
  return (
    <>
      <h1>{shop.name} catalog</h1>
      <ul className="collection-grid">
        {q.data.map((c) => (
          <li key={c.slug}>
            <Link to={`/shop/${shop.brand}/c/${c.slug}`}>
              <h2>{c.name}</h2>
              {c.description && <p>{c.description}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export function CollectionPage() {
  const shop = useShop();
  const { slug = "" } = useParams();
  const q = useQuery(() => api.getCollection(shop.identity, slug), [shop.brand, slug]);
  if (q.loading) return <Loading what="products" />;
  if (q.error || !q.data) return <ErrorNote message={q.error ?? "No data"} onRetry={q.reload} />;
  return (
    <>
      <nav aria-label="Breadcrumb" className="crumbs">
        <Link to={`/shop/${shop.brand}`}>Catalog</Link> / {q.data.name}
      </nav>
      <h1>{q.data.name}</h1>
      <ul className="product-grid">
        {q.data.products.map((p) => (
          <ProductCard key={p.sku} product={p} />
        ))}
      </ul>
    </>
  );
}

function ProductCard({ product }: { product: Product }) {
  const shop = useShop();
  return (
    <li className="product-card">
      <Link to={`/shop/${shop.brand}/p/${product.sku}`}>
        <div className="swatch" aria-hidden="true">
          {product.sku.split("-")[1]}
        </div>
        <h3>{product.name}</h3>
      </Link>
      <p className="price-row">
        <Price value={product.price} locale={shop.locale} className="price" />
        {product.compareAtPrice && (
          <s className="compare-at">
            <Price value={product.compareAtPrice} locale={shop.locale} />
          </s>
        )}
      </p>
      <Status tone={statusTone(product.availability)}>{label(product.availability)}</Status>
    </li>
  );
}
