import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router";
import { AbandonedCartsPage } from "./admin/AbandonedCartsPage";
import { AdminLayout } from "./admin/AdminLayout";
import { InventoryPage } from "./admin/InventoryPage";
import { AdminOrdersPage } from "./admin/OrdersPage";
import { PriceListsPage } from "./admin/PriceListsPage";
import { CartPage } from "./shop/CartPage";
import { Catalog, CollectionPage } from "./shop/Catalog";
import { CheckoutPage } from "./shop/CheckoutPage";
import { OrderStatusPage, OrdersPage } from "./shop/OrdersPage";
import { PayPage } from "./shop/PayPage";
import { ProductPage } from "./shop/ProductPage";
import { ShopLayout } from "./shop/ShopLayout";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/shop" element={<Navigate to="/shop/lumen-home" replace />} />
      <Route path="/shop/:brand" element={<ShopLayout />}>
        <Route index element={<Catalog />} />
        <Route path="c/:slug" element={<CollectionPage />} />
        <Route path="p/:sku" element={<ProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="pay/:paymentId" element={<PayPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:orderId" element={<OrderStatusPage />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<InventoryPage />} />
        <Route path="price-lists" element={<PriceListsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="abandoned-carts" element={<AbandonedCartsPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function Home() {
  return (
    <main className="home" id="main">
      <h1>Kadé Commerce</h1>
      <p>Two storefronts, one merchandiser console. Pick a door.</p>
      <ul>
        <li>
          <Link to="/shop/lumen-home">Lumen Home storefront</Link>
        </li>
        <li>
          <Link to="/shop/trailhead-supply">Trailhead Supply storefront</Link>
        </li>
        <li>
          <Link to="/admin">Merchandiser console</Link>
        </li>
      </ul>
    </main>
  );
}

function NotFound() {
  return (
    <main className="home" id="main">
      <h1>Page not found</h1>
      <Link to="/">Home</Link>
    </main>
  );
}
