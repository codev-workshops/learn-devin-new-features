import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";

import { createHttpApi } from "@/api/client";
import { createMockFetch } from "@/mocks/mockFetch";
import { MockStore } from "@/mocks/store";
import { BrandPicker } from "@/app/index";
import { CartScreen } from "@/app/shop/cart";
import { CatalogScreen } from "@/app/shop/index";
import { OrdersScreen } from "@/app/shop/orders";
import { OrderScreen } from "@/app/shop/order/[orderId]";
import { KadeProvider, useKade } from "@/state/store";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  router: {
    push: (...a: unknown[]) => mockPush(...a),
    replace: (...a: unknown[]) => mockReplace(...a),
    back: jest.fn(),
  },
  useLocalSearchParams: () => mockParams,
}));

function makeApi() {
  const store = new MockStore({ now: new Date("2026-10-22T00:00:00Z") });
  return { store, api: createHttpApi("", createMockFetch(store)) };
}

function PickBrand({ brand }: { brand: "lumen-home" | "trailhead-supply" }) {
  const { selectBrand, session } = useKade();
  React.useEffect(() => {
    if (!session) selectBrand(brand);
  }, [brand, selectBrand, session]);
  return null;
}

beforeEach(() => {
  mockPush.mockClear();
  mockParams = {};
});

describe("brand picker", () => {
  it("lists both brands and navigates to the shop", async () => {
    const { api } = makeApi();
    render(
      <KadeProvider api={api}>
        <BrandPicker />
      </KadeProvider>,
    );
    expect(await screen.findByText("Lumen Home")).toBeOnTheScreen();
    expect(screen.getByText("Trailhead Supply")).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId("brand-trailhead-supply"));
    expect(mockPush).toHaveBeenCalledWith("/shop");
  });
});

describe("catalog + cart", () => {
  it("shows Lamp Week products with sale pricing and adds one to the cart", async () => {
    const { api } = makeApi();
    render(
      <KadeProvider api={api}>
        <PickBrand brand="lumen-home" />
        <CatalogScreen />
        <CartScreen />
      </KadeProvider>,
    );
    expect(await screen.findByTestId("product-LH-LAMP-01")).toBeOnTheScreen();
    expect(screen.getByText("$103.20")).toBeOnTheScreen();
    expect(screen.getByText("$129.00")).toBeOnTheScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId("add-LH-LAMP-01"));
    });
    expect(await screen.findByTestId("line-LH-LAMP-01")).toBeOnTheScreen();
    expect(screen.getByTestId("qty-LH-LAMP-01")).toHaveTextContent("1");
    expect(screen.getByTestId("cart-totals")).toHaveTextContent(/\$8\.51/);
    expect(screen.getByTestId("cart-totals")).toHaveTextContent(/\$119\.66/);
    expect(screen.getByTestId("haptics-mode")).toHaveTextContent(/JS fallback/);
  });

  it("switches collection and keeps component-backed bundles orderable", async () => {
    const { api } = makeApi();
    render(
      <KadeProvider api={api}>
        <PickBrand brand="lumen-home" />
        <CatalogScreen />
      </KadeProvider>,
    );
    await screen.findByTestId("catalog");
    fireEvent.press(screen.getByTestId("collection-bundles"));
    expect(await screen.findByTestId("product-LH-BNDL-01")).toBeOnTheScreen();
    expect(screen.getByTestId("add-LH-BNDL-01")).not.toBeDisabled();
  });
});

describe("orders", () => {
  it("lists seeded orders and shows a status timeline with cancel for pending ones", async () => {
    const { api, store } = makeApi();
    const pending = store.listOrders("trailhead-supply", "customer-001@trailhead-supply.test", {
      status: "pending_payment",
    }).items[0];
    mockParams = { orderId: pending.id };
    render(
      <KadeProvider api={api}>
        <PickBrand brand="trailhead-supply" />
        <OrdersScreen />
        <OrderScreen />
      </KadeProvider>,
    );
    expect(await screen.findByTestId(`order-${pending.number}`)).toBeOnTheScreen();
    expect(await screen.findByTestId("order-timeline")).toBeOnTheScreen();
    await act(async () => {
      fireEvent.press(screen.getByTestId("cancel-order"));
    });
    await waitFor(() => expect(screen.getAllByText("cancelled").length).toBeGreaterThan(0));
  });
});
