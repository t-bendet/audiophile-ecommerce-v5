import type { Locator, Page } from "@playwright/test";
import {
  ADMIN_STORAGE_STATE,
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
  // A full page load would cancel the add if it were still in flight.
  await expect(page.getByRole("button", { name: "Open cart" })).toHaveText("1");
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

test("checkout creates an order, says how payment is taken and emails the shopper", async ({
  page,
  catalogue,
  signUpFreshShopper,
  listOrders,
  outbox,
  browser,
  placeOrderAsFreshShopper,
}) => {
  const shopper = await signUpFreshShopper();
  const [product] = await catalogue.products();

  await openCheckoutWith(page, product);
  await fillCheckout(page, shopper);
  await page.getByRole("button", { name: "Continue & Pay" }).click();

  const thankYou = page.getByRole("dialog", {
    name: "Thank you for your order",
  });
  await expect(thankYou).toBeVisible();
  const [order] = await listOrders();
  await expect(
    thankYou.getByText(
      `We have received your order ${order.id}. You pay in cash when your order is delivered. We have sent a confirmation to ${shopper.email}.`,
    ),
  ).toBeVisible();
  await expect(
    thankYou.getByText(product.cartLabel, { exact: true }),
  ).toBeVisible();
  await expect(thankYou.getByText("Grand total")).toBeVisible();

  // The receipt sits over the emptied checkout page, and a click outside leaves it open.
  await expect(
    page.getByRole("heading", {
      name: "Your cart is empty",
      includeHidden: true,
    }),
  ).toBeAttached();
  await page.mouse.click(8, 8);
  await expect(thankYou).toHaveAttribute("data-state", "open");
  await expect(page).toHaveURL("/checkout");

  // The email is sent before checkout answers, so it is already in the outbox.
  const [email, ...others] = await outbox(shopper.email);
  expect(others).toEqual([]);
  expect(email).toMatchObject({
    to: shopper.email,
    subject: `Order received: ${order.id}`,
    idempotencyKey: `order-confirmation/${order.id}`,
  });
  expect(email.text).toContain(product.cartLabel);
  expect(email.text).toContain("You pay in cash when your order is delivered.");

  await thankYou.getByRole("link", { name: "View your orders" }).click();

  await expect(page).toHaveURL("/account/orders");
  const orders = page.getByRole("article");
  await expect(orders).toHaveCount(1);
  await expect(
    orders.getByRole("heading", { name: product.cartLabel, exact: true }),
  ).toBeVisible();
  await expect(orders.getByText("Cash on Delivery")).toBeVisible();

  const other = await placeOrderAsFreshShopper();
  await orders
    .getByRole("link", { name: `Order #${order.id.slice(-8).toUpperCase()}` })
    .click();
  await expect(
    page.getByRole("heading", {
      name: `Order #${order.id.slice(-8).toUpperCase()}`,
    }),
  ).toBeVisible();
  await expect(page.getByText("We have received your order")).toBeVisible();
  await expect(page.getByText("Order placed", { exact: true })).toBeVisible();
  await expect(page.getByText("Next: Being prepared")).toBeVisible();

  const adminContext = await browser.newContext({
    storageState: ADMIN_STORAGE_STATE,
  });
  const adminPage = await adminContext.newPage();
  await adminPage.goto(`/admin/orders/${order.id}`);
  const form = adminPage.getByRole("form", { name: "Fulfilment" });
  await form.getByLabel("Move order to").click();
  await adminPage.getByRole("option", { name: "Processing" }).click();
  await form.getByRole("button", { name: "Save" }).click();
  await expect(
    form.getByText("Processing", { exact: true }).first(),
  ).toBeVisible();
  await form.getByLabel("Move order to").click();
  await adminPage.getByRole("option", { name: "Shipped" }).click();
  await form.getByLabel("Carrier").fill("UPS");
  await form.getByLabel("Tracking number").fill("1Z123");
  await form.getByRole("button", { name: "Save" }).click();
  await expect(form.getByText("1Z123")).toBeVisible();
  await adminContext.close();
  await page.reload();
  await expect(page.getByText("Your order is on its way")).toBeVisible();
  await expect(page.getByText("1Z123")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Track package" }),
  ).toHaveAttribute("href", "https://www.ups.com/track?tracknum=1Z123");
  await page.goto(`/account/orders/${other.orderId}`);
  await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible();
});

test("Escape closes the order confirmation and returns home", async ({
  page,
  catalogue,
  signUpFreshShopper,
}) => {
  const shopper = await signUpFreshShopper();
  const [product] = await catalogue.products();
  await openCheckoutWith(page, product);
  await fillCheckout(page, shopper);
  await page.getByRole("button", { name: "Continue & Pay" }).click();
  const thankYou = page.getByRole("dialog", {
    name: "Thank you for your order",
  });
  await expect(thankYou).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(thankYou).toBeHidden();
  await expect(page).toHaveURL("/");
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
  const shopper = await signUpFreshShopper();
  const [first, second] = await catalogue.products();

  await page.goto("/account/orders");
  await expect(
    page.getByRole("heading", { name: "Your account", level: 1 }),
  ).toBeVisible();
  await expect(page.getByText(`Signed in as ${shopper.email}`)).toBeVisible();
  const accountNav = page.getByRole("navigation", { name: "Account" });
  await expect(
    accountNav.getByRole("link", { name: "Orders" }),
  ).toHaveAttribute("aria-current", "page");
  await accountNav.getByRole("link", { name: "Profile" }).click();
  await expect(page).toHaveURL("/account/profile");
  await expect(
    accountNav.getByRole("link", { name: "Profile" }),
  ).toHaveAttribute("aria-current", "page");
  await accountNav.getByRole("link", { name: "Orders" }).click();
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
