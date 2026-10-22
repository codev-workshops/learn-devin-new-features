import { expect, test } from "@playwright/test";

test("admin smoke: fake-header login, inventory, price lists, orders, abandoned carts", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Merchandiser sign-in");
  await page.getByLabel("Brand").selectOption("trailhead-supply");
  await expect(page.getByLabel("User")).toHaveValue("lena@trailheadsupply.test");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Inventory");
  await expect(page.getByRole("cell", { name: "TS-JKT-01" }).first()).toBeVisible();
  await page.getByLabel("Only rows at or below safety stock").check();
  await expect(page.locator("tbody tr").first()).toContainText(/low|out/);

  await page.getByRole("link", { name: "Price lists" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Price lists");
  await expect(page.locator(".price-badge").first()).toBeVisible();

  await page.getByRole("link", { name: "Orders" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Orders");
  await expect(page.locator("tbody tr")).toHaveCount(25);
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByRole("button", { name: "First page" })).toBeVisible();

  await page.getByRole("link", { name: "Abandoned carts" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Abandoned carts");
  await page.getByLabel(/Idle for at least/).selectOption("48");
  await expect(page.getByText(/pending pay_/).first()).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Merchandiser sign-in");
});
