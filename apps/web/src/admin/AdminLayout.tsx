import { BRAND_IDS, type BrandId, type Role } from "@harbourline/contracts";
import { createContext, useContext, useState, type FormEvent } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import type { Identity } from "../lib/api";
import { clearSession, getAdminSession, setAdminSession, type AdminSession } from "../lib/session";

const AdminContext = createContext<(AdminSession & { identity: Identity }) | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin outside AdminLayout");
  return ctx;
}

const BRAND_NAMES: Record<BrandId, string> = {
  "lumen-home": "Lumen Home",
  "trailhead-supply": "Trailhead Supply",
};
const STAFF: Record<BrandId, string> = {
  "lumen-home": "maya@lumenhome.test",
  "trailhead-supply": "lena@trailheadsupply.test",
};

export function AdminLayout() {
  const [session, setSession] = useState(getAdminSession);
  const navigate = useNavigate();
  if (!session) return <AdminLogin onLogin={setSession} />;
  const value = {
    ...session,
    identity: { brand: session.brand, user: session.user, role: session.role },
  };
  return (
    <AdminContext.Provider value={value}>
      <div className="admin" data-brand={session.brand}>
        <header className="admin-header">
          <span className="brand-mark">
            Harbourline Merchandiser · {BRAND_NAMES[session.brand]}
          </span>
          <nav aria-label="Console">
            <NavLink to="/admin" end>
              Inventory
            </NavLink>
            <NavLink to="/admin/price-lists">Price lists</NavLink>
            <NavLink to="/admin/orders">Orders</NavLink>
            <NavLink to="/admin/abandoned-carts">Abandoned carts</NavLink>
          </nav>
          <span className="who">
            {session.user} ({session.role})
            <button
              type="button"
              className="link"
              onClick={() => {
                clearSession();
                setSession(null);
                navigate("/admin");
              }}
            >
              Sign out
            </button>
          </span>
        </header>
        <main id="main">
          <Outlet />
        </main>
      </div>
    </AdminContext.Provider>
  );
}

function AdminLogin({ onLogin }: { onLogin: (s: AdminSession) => void }) {
  const [brand, setBrand] = useState<BrandId>("lumen-home");
  const [user, setUser] = useState(STAFF["lumen-home"]);
  const [role, setRole] = useState<Role>("merchandiser");
  function submit(e: FormEvent) {
    e.preventDefault();
    const s: AdminSession = { brand, user, role };
    setAdminSession(s);
    onLogin(s);
  }
  return (
    <main className="admin login" id="main">
      <h1>Merchandiser sign-in</h1>
      <p className="muted">
        Fake auth: these three values are sent as <code>X-Harbourline-Brand</code>,{" "}
        <code>X-Harbourline-User</code> and <code>X-Harbourline-Role</code>. No password.
      </p>
      <form onSubmit={submit} className="stack">
        <label>
          Brand
          <select
            value={brand}
            onChange={(e) => {
              const b = e.target.value as BrandId;
              setBrand(b);
              setUser(STAFF[b]);
            }}
          >
            {BRAND_IDS.map((b) => (
              <option key={b} value={b}>
                {BRAND_NAMES[b]}
              </option>
            ))}
          </select>
        </label>
        <label>
          User
          <input value={user} onChange={(e) => setUser(e.target.value)} required />
        </label>
        <label>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="merchandiser">merchandiser</option>
            <option value="admin">admin</option>
            <option value="customer">customer (will be refused)</option>
          </select>
        </label>
        <button type="submit" className="primary">
          Sign in
        </button>
      </form>
    </main>
  );
}
