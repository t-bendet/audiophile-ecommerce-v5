import type { Page } from "@playwright/test";
import { ADMIN_STORAGE_STATE, SEEDED_ADMIN, expect, test } from "./fixtures.js";

const openUserMenu = (page: Page) =>
  page.getByRole("button", { name: "Open user menu" }).click();

const dashboardHeading = (page: Page) =>
  page.getByRole("heading", { name: "Dashboard", level: 1 });

test.describe("an admin", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test("reaches the dashboard from the account menu", async ({ page }) => {
    await page.goto("/");
    await openUserMenu(page);
    await page.getByRole("link", { name: "Admin" }).click();

    await expect(page).toHaveURL("/admin");
    await expect(dashboardHeading(page)).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Admin sections" })
        .getByRole("link", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Open cart" })).toHaveCount(
      0,
    );
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

    await expect(page).toHaveURL("/admin");
    await expect(dashboardHeading(page)).toBeVisible();
  });
});
