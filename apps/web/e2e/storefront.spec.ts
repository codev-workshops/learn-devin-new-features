import { expect, test } from "@playwright/test";

test("storefront smoke: both brands, product → cart → checkout → order", async ({ page }) => {
  await page.goto("/shop/lumen-home");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Lumen Home catalog/);
  await page.getByRole("link", { name: /Lamp Week/ }).click();
  await page.getByRole("link", { name: /Ember Table Lamp/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Lamp");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your cart");
  await expect(page.getByRole("table")).toContainText("Sales tax");
  await page.getByRole("link", { name: "Checkout" }).click();
  await page.getByLabel("Full name").fill("Smoke Shopper");
  await page.getByLabel("Address line 1").fill("1 Main St");
  await page.getByLabel("City").fill("Newark");
  await page.getByLabel("Postal code").fill("07102");
  await page.getByRole("button", { name: "Pay with PayGate" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("PayGate");
  await page.getByRole("button", { name: "Approve payment" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Order LH-\d{6}/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("confirmed");
  await expect(page.getByRole("list")).toContainText("payment received");

  await page.getByRole("link", { name: "Switch brand" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Trailhead Supply catalog/);
  await expect(page.locator('[data-brand="trailhead-supply"]')).toBeVisible();
  await page.getByRole("link", { name: "Apparel" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Apparel");
  await expect(page.locator(".price").first()).toContainText("€");
});
