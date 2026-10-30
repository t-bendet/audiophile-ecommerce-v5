import type { Locator } from "@playwright/test";
import { expect, test } from "./fixtures.js";

test.use({ storageState: { cookies: [], origins: [] } });

const fillAddress = async (group: Locator) => {
  await group.getByLabel("Address").fill("1 Audio Lane");
  await group.getByLabel("City").fill("Hi-Fi City");
  await group.getByLabel("State").fill("CA");
  await group.getByLabel("ZIP code").fill("90001");
  await group.getByLabel("Country").fill("United States");
};

test("checkout creates an order that appears under account orders", async ({
  page,
  catalogue,
  signUpFreshShopper,
}) => {
  const shopper = await signUpFreshShopper();
  const [product] = await catalogue.products();

  await page.goto(`/product/${product.slug}`);
  await page.getByRole("button", { name: "add to cart" }).click();
  await page.goto("/checkout");

  const shipping = page.getByRole("group", { name: "Shipping details" });
  await shipping.getByLabel("Full name").fill(shopper.name);
  await shipping.getByLabel("Email").fill(shopper.email);
  await shipping.getByLabel("Phone").fill("+1 202 555 0100");
  await fillAddress(shipping);

  const billing = page.getByRole("group", { name: "Billing address" });
  await billing.getByLabel("Full name").fill(shopper.name);
  await fillAddress(billing);

  await page.getByRole("radio", { name: "Cash on Delivery" }).check();
  await page.getByRole("button", { name: "Continue & Pay" }).click();

  await expect(
    page.getByRole("heading", { name: "Thank you for your order" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "View your orders" }).click();

  await expect(page).toHaveURL("/account/orders");
  const orders = page.getByRole("article");
  await expect(orders).toHaveCount(1);
  await expect(
    orders.getByRole("heading", { name: product.cartLabel, exact: true }),
  ).toBeVisible();
  await expect(orders.getByText("Cash on Delivery")).toBeVisible();
});
