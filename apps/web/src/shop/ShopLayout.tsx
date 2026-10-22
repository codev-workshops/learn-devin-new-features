import { BRAND_IDS, type BrandId, type Currency } from "@harbourline/contracts";
import { createContext, useContext, useMemo } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router";
import { apiMode, type Identity } from "../lib/api";
import { getShopper } from "../lib/session";

export { BRAND_IDS };
export const isBrandId = (v: string | undefined): v is BrandId =>
  !!v && BRAND_IDS.includes(v as BrandId);

export interface ShopContextValue {
  brand: BrandId;
  name: string;
  locale: string;
  identity: Identity;
}

const ShopContext = createContext<ShopContextValue | null>(null);

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop outside ShopLayout");
  return ctx;
}

const THEME: Record<
  BrandId,
  { name: string; locale: string; currency: Currency; tagline: string }
> = {
  "lumen-home": {
    name: "Lumen Home",
    locale: "en-US",
    currency: "USD",
    tagline: "Light, linen and the long table.",
  },
  "trailhead-supply": {
    name: "Trailhead Supply",
    locale: "de-DE",
    currency: "EUR",
    tagline: "Kit that outlasts the forecast.",
  },
};

export function ShopLayout() {
  const { brand } = useParams();
  if (!isBrandId(brand)) return <UnknownBrand />;
  return <ShopFrame brand={brand} />;
}

function ShopFrame({ brand }: { brand: BrandId }) {
  const theme = THEME[brand];
  const value = useMemo<ShopContextValue>(
    () => ({
      brand,
      name: theme.name,
      locale: theme.locale,
      identity: { brand, user: getShopper(brand).user },
    }),
    [brand, theme],
  );
  const base = `/shop/${brand}`;
  return (
    <ShopContext.Provider value={value}>
      <div className="shop" data-brand={brand}>
        <header className="shop-header">
          <Link to={base} className="brand-mark">
            <span className="brand-glyph" aria-hidden="true" />
            {theme.name}
          </Link>
          <p className="tagline">{theme.tagline}</p>
          <nav aria-label="Store">
            <NavLink to={base} end>
              Catalog
            </NavLink>
            <NavLink to={`${base}/cart`}>Cart</NavLink>
            <NavLink to={`${base}/orders`}>Orders</NavLink>
            <Link
              to={`/shop/${brand === "lumen-home" ? "trailhead-supply" : "lumen-home"}`}
              className="switch-brand"
            >
              Switch brand
            </Link>
          </nav>
        </header>
        <main id="main">
          <Outlet />
        </main>
        <footer className="shop-footer">
          Harbourline · {theme.name} · {theme.currency} · API mode {apiMode()}
        </footer>
      </div>
    </ShopContext.Provider>
  );
}

function UnknownBrand() {
  return (
    <main className="shop" id="main">
      <h1>Choose a storefront</h1>
      <ul>
        {BRAND_IDS.map((b) => (
          <li key={b}>
            <Link to={`/shop/${b}`}>{THEME[b].name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
