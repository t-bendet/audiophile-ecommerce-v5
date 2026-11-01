import type { Page } from "@playwright/test";
import { ADMIN_STORAGE_STATE, SEEDED_ADMIN, expect, test } from "./fixtures.js";

const openUserMenu = (page: Page) =>
  page.getByRole("button", { name: "Open user menu" }).click();

const ordersHeading = (page: Page) =>
  page.getByRole("heading", { name: "Orders", level: 1 });

test.describe("an admin", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test("reaches the dashboard from the account menu", async ({ page }) => {
    await page.goto("/");
    await openUserMenu(page);
    await page.getByRole("link", { name: "Admin" }).click();

    await expect(page).toHaveURL("/admin/orders");
    await expect(ordersHeading(page)).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Admin sections" })
        .getByRole("link", { name: "Orders" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Open cart" })).toHaveCount(
      0,
    );
  });

  test("finds a fresh shopper's order and moves it along", async ({
    page,
    placeOrderAsFreshShopper,
  }) => {
    const { shopper, orderId } = await placeOrderAsFreshShopper();

    await page.goto("/admin/orders");
    const filters = page.getByRole("form", { name: "Filter orders" });
    await filters.getByLabel("Customer email").fill(shopper.email);
    await filters.getByRole("button", { name: "Apply" }).click();

    await expect(page).toHaveURL(/customerEmail=/);
    const rows = page.getByRole("table").getByRole("row");
    // The header row and the one order.
    await expect(rows).toHaveCount(2);
    await expect(rows.last()).toContainText(shopper.email);
    await rows.last().getByRole("link").click();

    await expect(page).toHaveURL(`/admin/orders/${orderId}`);
    const fulfilment = page.getByRole("form", { name: "Fulfilment" });
    await expect(page.getByRole("region", { name: "Customer" })).toContainText(
      shopper.email,
    );

    await fulfilment.getByLabel("Move order to").click();
    await page.getByRole("option", { name: "Processing" }).click();
    await fulfilment.getByLabel("Payment status").click();
    await page.getByRole("option", { name: "Paid" }).click();
    await fulfilment.getByRole("button", { name: "Save" }).click();

    await expect(
      fulfilment.getByRole("button", { name: "Save" }),
    ).toBeDisabled();
    await expect(fulfilment.getByLabel("Move order to")).toHaveText(
      "Processing",
    );
    await expect(fulfilment.getByLabel("Payment status")).toHaveText("Paid");

    await fulfilment.getByLabel("Move order to").click();
    await expect(page.getByRole("option", { name: "Shipped" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Pending" })).toHaveCount(0);
    await page.keyboard.press("Escape");

    await page.getByRole("link", { name: "Back to orders" }).click();
    await expect(page).toHaveURL("/admin/orders");
    await filters.getByLabel("Customer email").fill(shopper.email);
    await filters.getByRole("button", { name: "Apply" }).click();
    await expect(rows.last()).toContainText("Processing");
    await expect(rows.last()).toContainText("Paid");
  });
});

test.describe("a shopper", () => {
  test("finds nothing at the admin URL", async ({ page }) => {
    await page.goto("/admin");

    await expect(
      page.getByRole("heading", { name: "404 - Not Found", level: 1 }),
    ).toBeVisible();
    await expect(page).toHaveURL("/admin");
  });

  test("has no admin item in the account menu", async ({ page }) => {
    await page.goto("/");
    await openUserMenu(page);

    await expect(page.getByRole("link", { name: "Orders" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Admin" })).toHaveCount(0);
  });
});

test.describe("a guest", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("is sent to login and lands on the dashboard afterwards", async ({
    page,
  }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL("/auth/login?redirectTo=%2Fadmin");
    await page.getByLabel("Email").fill(SEEDED_ADMIN.email);
    await page
      .getByLabel("Password", { exact: true })
      .fill(SEEDED_ADMIN.password);
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page).toHaveURL("/admin/orders");
    await expect(ordersHeading(page)).toBeVisible();
  });
});
