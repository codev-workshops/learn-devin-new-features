import type { BrandId, Role } from "@kade/contracts";

export interface AdminSession {
  brand: BrandId;
  user: string;
  role: Role;
}

const ADMIN_KEY = "kade.admin.session";
const SHOPPER_KEY = (brand: BrandId) => `kade.shop.${brand}`;

interface ShopperState {
  user: string;
  cartId?: string;
}

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function read<T>(key: string): T | null {
  const raw = storage()?.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown | null) {
  const s = storage();
  if (!s) return;
  if (value === null) s.removeItem(key);
  else s.setItem(key, JSON.stringify(value));
}

export function getAdminSession(): AdminSession | null {
  return read<AdminSession>(ADMIN_KEY);
}

export function setAdminSession(session: AdminSession | null) {
  write(ADMIN_KEY, session);
}

/** Storefront identity: a deterministic seed customer per brand (no real PII anywhere). */
export function getShopper(brand: BrandId): ShopperState {
  const existing = read<ShopperState>(SHOPPER_KEY(brand));
  if (existing) return existing;
  const fresh = { user: `customer-001@${brand}.test` };
  write(SHOPPER_KEY(brand), fresh);
  return fresh;
}

export function setShopperCart(brand: BrandId, cartId: string | undefined) {
  write(SHOPPER_KEY(brand), { ...getShopper(brand), cartId });
}

export function clearSession() {
  const s = storage();
  if (!s) return;
  for (const key of Object.keys(s)) if (key.startsWith("kade.")) s.removeItem(key);
}
