import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createApi, type Brand, type BrandId, type Cart, type KadeApi, type Session } from "../api";
import { demoCustomer } from "../mocks/store";
import { impact } from "../../modules/kade-haptics";

export interface KadeState {
  api: KadeApi;
  brands: Brand[];
  session: Session | null;
  brand: Brand | null;
  cart: Cart | null;
  busy: boolean;
  error: string | null;
  selectBrand(brandId: BrandId): void;
  clearBrand(): void;
  addToCart(sku: string, quantity?: number): Promise<Cart>;
  setLineQuantity(lineId: string, quantity: number): Promise<Cart>;
  resetCart(): Promise<void>;
  dismissError(): void;
  /** Bumped whenever an order changes outside the list screen so it refetches. */
  ordersVersion: number;
  notifyOrdersChanged(): void;
}

const Ctx = createContext<KadeState | null>(null);

export function KadeProvider({
  api: injected,
  children,
}: {
  api?: KadeApi;
  children: React.ReactNode;
}) {
  const apiRef = useRef<KadeApi>(injected ?? createApi());
  const api = apiRef.current;
  const [brands, setBrands] = useState<Brand[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ordersVersion, setOrdersVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    api
      .listBrands()
      .then((b) => alive && setBrands(b))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [api]);

  const brand = useMemo(
    () => brands.find((b) => b.id === session?.brand) ?? null,
    [brands, session],
  );

  const ensureCart = useCallback(
    async (s: Session): Promise<Cart> => {
      if (cart && cart.brand === s.brand && cart.status === "open") return cart;
      const created = await api.createCart(s);
      setCart(created);
      return created;
    },
    [api, cart],
  );

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setBusy(false);
    }
  }, []);

  const value = useMemo<KadeState>(
    () => ({
      api,
      brands,
      session,
      brand,
      cart,
      busy,
      error,
      selectBrand: (brandId) => {
        setSession({ brand: brandId, user: demoCustomer(brandId), role: "customer" });
        setCart(null);
      },
      clearBrand: () => {
        setSession(null);
        setCart(null);
      },
      addToCart: (sku, quantity = 1) =>
        run(async () => {
          if (!session) throw new Error("pick a brand first");
          const c = await ensureCart(session);
          const next = await api.addCartLine(session, c.id, sku, quantity);
          setCart(next);
          void impact("medium");
          return next;
        }),
      setLineQuantity: (lineId, quantity) =>
        run(async () => {
          if (!session || !cart) throw new Error("no cart");
          const next = await api.updateCartLine(session, cart.id, lineId, quantity);
          setCart(next);
          return next;
        }),
      resetCart: async () => setCart(null),
      dismissError: () => setError(null),
      ordersVersion,
      notifyOrdersChanged: () => setOrdersVersion((v) => v + 1),
    }),
    [api, brands, session, brand, cart, busy, error, run, ensureCart, ordersVersion],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useKade(): KadeState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useKade must be used inside <KadeProvider>");
  return v;
}

/** Fetch helper that tracks loading/error and refetches when `deps` change. */
export function useAsync<T>(fn: () => Promise<T> | null, deps: React.DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    const p = fn();
    if (!p) {
      setLoading(false);
      return;
    }
    setLoading(true);
    p.then((d) => {
      if (!alive) return;
      setData(d);
      setError(null);
    })
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [...deps, tick]);
  return { data, loading, error, reload: () => setTick((t) => t + 1) };
}
