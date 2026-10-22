import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "../App";
import { setAdminSession } from "../lib/session";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );

const lena = {
  brand: "trailhead-supply",
  user: "lena@trailheadsupply.test",
  role: "merchandiser",
} as const;

describe("merchandiser console", () => {
  it("asks for the fake brand headers before showing anything", async () => {
    const user = userEvent.setup();
    renderAt("/admin");
    expect(
      screen.getByRole("heading", { level: 1, name: "Merchandiser sign-in" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Inventory" })).toBeInTheDocument();
    expect(await screen.findByText("LH-LAMP-01")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("harbourline.admin.session")).toContain(
      "maya@lumenhome.test",
    );
  });

  it("refuses customers with a 403 from the contract", async () => {
    setAdminSession({
      brand: "lumen-home",
      user: "customer-001@lumen-home.test",
      role: "customer",
    });
    renderAt("/admin");
    expect(await screen.findByRole("alert")).toHaveTextContent(/forbidden/);
  });

  it("adjusts inventory with the (unlabeled) icon buttons", async () => {
    const user = userEvent.setup();
    setAdminSession(lena);
    renderAt("/admin");
    const row = (await screen.findAllByText("TS-JKT-01", { selector: "td" }))[0].closest("tr")!;
    const cells = () =>
      within(row)
        .getAllByRole("cell")
        .map((c) => c.textContent);
    expect(cells()[2]).toBe("29");
    const buttons = within(row).getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual([null, null]);
    await user.click(buttons[1]);
    await waitFor(() => expect(cells()[2]).toBe("30"));
  });

  it("filters orders by status and lists abandoned carts with pending payments", async () => {
    const user = userEvent.setup();
    setAdminSession(lena);
    renderAt("/admin/orders");
    await screen.findByRole("heading", { level: 1, name: "Orders" });
    await user.selectOptions(await screen.findByLabelText("Status"), "pending_payment");
    const statuses = await screen.findAllByText("pending payment", { selector: ".status" });
    expect(statuses.length).toBeGreaterThan(0);
    expect(screen.queryByText("confirmed", { selector: ".status" })).toBeNull();

    await user.click(screen.getByRole("link", { name: "Abandoned carts" }));
    await screen.findByRole("heading", { level: 1, name: "Abandoned carts" });
    await user.selectOptions(screen.getByLabelText(/Idle for at least/), "48");
    expect((await screen.findAllByText(/pending pay_/)).length).toBeGreaterThan(0);
  });

  it("validates price list amounts on save", async () => {
    const user = userEvent.setup();
    setAdminSession(lena);
    renderAt("/admin/price-lists");
    await screen.findByRole("heading", { level: 1, name: "Price lists" });
    expect(document.querySelector(".price-badge")).not.toBeNull();
    await user.click(screen.getAllByRole("button", { name: /^Edit / })[0]);
    const input = screen.getAllByRole("textbox", { name: /Price for/ })[0];
    await user.clear(input);
    await user.type(input, "12.5");
    await user.click(screen.getByRole("button", { name: /^Save / }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/two decimals/);
  });
});
