import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "../App";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );

describe("storefront", () => {
  it("themes each brand and shows its collections", async () => {
    const { container, unmount } = renderAt("/shop/lumen-home");
    expect(
      await screen.findByRole("heading", { level: 1, name: /Lumen Home catalog/ }),
    ).toBeInTheDocument();
    expect(container.querySelector('[data-brand="lumen-home"]')).not.toBeNull();
    expect(screen.getByRole("link", { name: /Lamp Week/ })).toBeInTheDocument();
    unmount();
    renderAt("/shop/trailhead-supply");
    expect(
      await screen.findByRole("heading", { level: 1, name: /Trailhead Supply catalog/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Apparel" })).toBeInTheDocument();
  });

  it("walks product → cart → checkout → PayGate stub → order timeline", async () => {
    const user = userEvent.setup();
    renderAt("/shop/lumen-home/p/LH-MUG-01");
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(/Mug/);
    expect(screen.getByText("$36.00")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "2" } });
    await user.click(screen.getByRole("button", { name: "Add to cart" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Your cart" })).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect((await within(table).findAllByText("$72.00")).length).toBeGreaterThan(0);
    expect(within(table).getByText("$5.94")).toBeInTheDocument();
    expect(within(table).getByText("$85.89")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Increase/ }));
    expect((await within(table).findAllByText("$108.00")).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("link", { name: "Checkout" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Checkout" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Full name"), "Test Shopper");
    await user.type(screen.getByLabelText("Address line 1"), "1 Main St");
    await user.type(screen.getByLabelText("City"), "Newark");
    await user.type(screen.getByLabelText("Postal code"), "07102");
    await user.click(screen.getByRole("button", { name: "Pay with PayGate" }));

    expect(await screen.findByRole("heading", { level: 1, name: /PayGate/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Approve payment" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: /Order LH-\d{6}/ }),
    ).toHaveTextContent("confirmed");
    const timeline = await screen.findByRole("list");
    expect(
      within(timeline)
        .getAllByRole("listitem")
        .map((li) => li.querySelector("strong")?.textContent),
    ).toEqual([
      "reservation made",
      "email queued",
      "payment received",
      "status changed",
      "status changed",
      "email queued",
    ]);
  });

  it("uses EUR, VAT-inclusive totals and free shipping over €80 for Trailhead", async () => {
    const user = userEvent.setup();
    renderAt("/shop/trailhead-supply/p/TS-FLC-01");
    await screen.findByRole("heading", { level: 1 });
    await user.selectOptions(screen.getByLabelText("Variant"), "TS-FLC-01-L");
    await user.click(screen.getByRole("button", { name: "Add to cart" }));
    const table = await screen.findByRole("table");
    expect(await within(table).findByText(/Includes VAT/)).toBeInTheDocument();
    expect(within(table).getByText("Free")).toBeInTheDocument();
    expect(within(table).getAllByText(/89,00\s€/).length).toBeGreaterThan(0);
    expect(within(table).getByText(/14,21\s€/)).toBeInTheDocument();
  });

  it("surfaces the contract's out_of_stock error when over-ordering a low-stock lamp", async () => {
    const user = userEvent.setup();
    renderAt("/shop/lumen-home/p/LH-LAMP-03");
    expect(await screen.findByText("low stock")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "5" } });
    await user.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/out_of_stock/);
  });
});
