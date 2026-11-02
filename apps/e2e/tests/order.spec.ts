import type { Locator, Page } from "@playwright/test";
import {
  ORDERS_LOCK,
  expect,
  test,
  type CatalogueProduct,
  type Shopper,
} from "./fixtures.js";

test.use({ storageState: { cookies: [], origins: [] } });
// These tests place orders, which the admin stats tests count.
test.describe.configure({ lock: ORDERS_LOCK });

const openCheckoutWith = async (page: Page, product: CatalogueProduct) => {
  await page.goto(`/product/${product.slug}`);
  await page.getByRole("button", { name: "add to cart" }).click();
  await page.goto("/checkout");
};

const fillAddress = async (group: Locator) => {
  await group.getByLabel("Address").fill("1 Audio Lane");
  await group.getByLabel("City").fill("Hi-Fi City");
  await group.getByLabel("State").fill("CA");
  await group.getByLabel("ZIP code").fill("90001");
  await group.getByLabel("Country").fill("United States");
};

const fillCheckout = async (
  page: Page,
  shopper: Shopper,
  shippingEmail = shopper.email,
) => {
  const shipping = page.getByRole("group", { name: "Shipping details" });
  await shipping.getByLabel("Full name").fill(shopper.name);
  await shipping.getByLabel("Email").fill(shippingEmail);
  await shipping.getByLabel("Phone").fill("+1 202 555 0100");
  await fillAddress(shipping);

  const billing = page.getByRole("group", { name: "Billing address" });
  await billing.getByLabel("Full name").fill(shopper.name);
  await fillAddress(billing);

  await page.getByRole("radio", { name: "Cash on Delivery" }).check();
};

test("checkout creates an order that appears under account orders", async ({
  page,
  catalogue,
  signUpFreshShopper,
}) => {
  const shopper = await signUpFreshShopper();
  const [product] = await catalogue.products();

  await openCheckoutWith(page, product);
  await fillCheckout(page, shopper);
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

test("checkout refuses a form with fields missing or invalid and creates no order", async ({
  page,
  catalogue,
  signUpFreshShopper,
  listOrders,
}) => {
  const shopper = await signUpFreshShopper();
  const [product] = await catalogue.products();
  const shipping = page.getByRole("group", { name: "Shipping details" });
  const billing = page.getByRole("group", { name: "Billing address" });
  const submit = page.getByRole("button", { name: "Continue & Pay" });

  await openCheckoutWith(page, product);
  await submit.click();

  // Every input is `required`, so the browser's own constraint validation
  // stops an empty submit before the form's schema runs.
  await expect(shipping.getByLabel("Full name")).toBeFocused();
  for (const group of [shipping, billing]) {
    const fields = group.getByRole("textbox");
    await expect(fields.and(page.locator(":invalid"))).toHaveCount(
      await fields.count(),
    );
  }

  // An address the browser accepts but the shared schema does not.
  await fillCheckout(page, shopper, "e2e@localhost");
  await submit.click();

  const shippingEmail = shipping
    .getByRole("group")
    .filter({ has: page.getByRole("textbox", { name: "Email" }) });
  await expect(shippingEmail.getByRole("alert")).toHaveText(
    "Valid email is required",
  );
  await expect(page.getByRole("alert")).toHaveCount(1);
  await expect(page).toHaveURL("/checkout");
  expect(await listOrders()).toHaveLength(0);
});

test("account orders shows the empty state, then every order newest first", async ({
  page,
  catalogue,
  signUpFreshShopper,
  placeOrder,
}) => {
  await signUpFreshShopper();
  const [first, second] = await catalogue.products();

  await page.goto("/account/orders");
  await expect(page.getByText("You have no orders yet.")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);

  await placeOrder(first);
  await placeOrder(second);
  await page.reload();

  const orders = page.getByRole("article");
  await expect(orders).toHaveCount(2);
  for (const [order, product] of [
    [orders.nth(0), second],
    [orders.nth(1), first],
  ] as const) {
    await expect(
      order.getByRole("heading", { name: product.cartLabel, exact: true }),
    ).toBeVisible();
  }
});
