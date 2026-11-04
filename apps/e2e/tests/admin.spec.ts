import type { Page } from "@playwright/test";
import {
  ADMIN_STORAGE_STATE,
  ORDERS_LOCK,
  SEEDED_ADMIN,
  SEEDED_SHOPPER,
  expect,
  test,
} from "./fixtures.js";

const openUserMenu = (page: Page) =>
  page.getByRole("button", { name: "Open user menu" }).click();

const statsHeading = (page: Page) =>
  page.getByRole("heading", { name: "Stats", level: 1 });

test.describe("an admin", () => {
  // The fulfilment and user tests place orders, which the stats tests count.
  test.describe.configure({ lock: ORDERS_LOCK });
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test("reaches the dashboard from the account menu", async ({ page }) => {
    await page.goto("/");
    await openUserMenu(page);
    await page.getByRole("menuitem", { name: "Admin" }).click();

    await expect(page).toHaveURL("/admin");
    await expect(statsHeading(page)).toBeVisible();
    const sections = page
      .getByRole("navigation", { name: "Admin sections" })
      .getByRole("link");
    await expect(sections.first()).toHaveText("Orders");
    await expect(sections.last()).toHaveText("Stats");
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

    // The form rebases on the saved order in place, so a select opened while
    // the order is refetched stays open.
    await fulfilment.getByLabel("Move order to").click();
    await expect(page.getByRole("option", { name: "Shipped" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Pending" })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await fulfilment.getByLabel("Payment status").click();
    await expect(page.getByRole("option", { name: "Refunded" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Pending" })).toHaveCount(0);
    await expect(page.getByRole("option", { name: "Failed" })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(
      fulfilment.getByRole("button", { name: "Save" }),
    ).toBeDisabled();

    await page.getByRole("link", { name: "Back to orders" }).click();
    await expect(page).toHaveURL("/admin/orders");
    await filters.getByLabel("Customer email").fill(shopper.email);
    await filters.getByRole("button", { name: "Apply" }).click();
    await expect(rows.last()).toContainText("Processing");
    await expect(rows.last()).toContainText("Paid");
  });

  test("deactivates a fresh shopper and reactivates them", async ({
    page,
    browser,
    baseURL,
    placeOrderAsFreshShopper,
  }) => {
    const { shopper } = await placeOrderAsFreshShopper();

    await page.goto("/admin/users");
    const filters = page.getByRole("form", { name: "Filter users" });
    await filters.getByLabel("Search").fill(shopper.email);
    await filters.getByRole("button", { name: "Apply" }).click();

    await expect(page).toHaveURL(/search=/);
    const rows = page.getByRole("table").getByRole("row");
    await expect(rows).toHaveCount(2);
    await expect(rows.last()).toContainText(shopper.email);
    await rows.last().getByRole("link").click();

    await expect(page).toHaveURL(/\/admin\/users\/[0-9a-f]{24}$/);
    const account = page.getByRole("region", { name: "Account" });
    await expect(account.getByText("Active", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Orders (1)" }).getByRole("link"),
    ).toHaveCount(1);

    await account.getByRole("button", { name: "Deactivate account" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Deactivate", exact: true })
      .click();
    await expect(account.getByText("Deactivated")).toBeVisible();

    // The shopper, in a browser of their own, is told why they cannot sign in.
    // A context made inside a test inherits the describe's storageState (the
    // admin's) unless told otherwise, so the shopper starts signed out here.
    const shopperContext = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const shopperPage = await shopperContext.newPage();
    const signIn = async () => {
      await shopperPage.goto("/auth/login");
      await shopperPage.getByLabel("Email").fill(shopper.email);
      await shopperPage
        .getByLabel("Password", { exact: true })
        .fill(shopper.password);
      await shopperPage.getByRole("button", { name: "Login" }).click();
    };
    await signIn();
    await expect(shopperPage.getByRole("alert")).toHaveText(
      "This account has been deactivated.",
    );
    await expect(shopperPage).toHaveURL("/auth/login");

    await account.getByRole("button", { name: "Reactivate account" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Reactivate", exact: true })
      .click();
    await expect(account.getByText("Active", { exact: true })).toBeVisible();

    await signIn();
    await expect(shopperPage).toHaveURL(/\/account/);
    await shopperContext.close();
  });

  test("promotes a fresh shopper and demotes them again", async ({
    page,
    browser,
    baseURL,
    placeOrderAsFreshShopper,
  }) => {
    const { shopper } = await placeOrderAsFreshShopper();
    const filters = page.getByRole("form", { name: "Filter users" });
    const rows = page.getByRole("table").getByRole("row");
    const openShopper = async () => {
      await filters.getByLabel("Search").fill(shopper.email);
      await filters.getByRole("button", { name: "Apply" }).click();
      await expect(rows).toHaveCount(2);
      await rows.last().getByRole("link").click();
    };
    const account = page.getByRole("region", { name: "Account" });

    await page.goto("/admin/users");
    await openShopper();
    await expect(account.getByText("User", { exact: true })).toBeVisible();
    await account.getByRole("button", { name: "Make admin" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Promote", exact: true })
      .click();
    await expect(account.getByText("Admin", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Back to users" }).click();
    await filters.getByLabel("Search").fill(shopper.email);
    await filters.getByRole("button", { name: "Apply" }).click();
    await expect(rows.last().getByText("Admin", { exact: true })).toBeVisible();

    // The shopper starts signed out in a browser of their own, as above.
    const shopperContext = await browser.newContext({
      baseURL,
      storageState: { cookies: [], origins: [] },
    });
    const shopperPage = await shopperContext.newPage();
    const adminItem = shopperPage.getByRole("menuitem", {
      name: "Admin",
      exact: true,
    });
    await shopperPage.goto("/auth/login");
    await shopperPage.getByLabel("Email").fill(shopper.email);
    await shopperPage
      .getByLabel("Password", { exact: true })
      .fill(shopper.password);
    await shopperPage.getByRole("button", { name: "Login" }).click();
    await expect(shopperPage).toHaveURL(/\/account/);
    await openUserMenu(shopperPage);
    await expect(adminItem).toBeVisible();

    await page.goto("/admin/users");
    await openShopper();
    await account.getByRole("button", { name: "Make shopper" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Demote", exact: true })
      .click();
    await expect(account.getByText("User", { exact: true })).toBeVisible();

    await shopperPage.goto("/");
    await openUserMenu(shopperPage);
    await expect(
      shopperPage.getByRole("menuitem", { name: "Orders" }),
    ).toBeVisible();
    await expect(adminItem).toHaveCount(0);
    await shopperContext.close();
  });

  test("offers no role control on their own page", async ({ page }) => {
    await page.goto("/admin/users");
    const filters = page.getByRole("form", { name: "Filter users" });
    await filters.getByLabel("Search").fill(SEEDED_ADMIN.email);
    await filters.getByRole("button", { name: "Apply" }).click();
    const rows = page.getByRole("table").getByRole("row");
    await expect(rows).toHaveCount(2);
    await rows.last().getByRole("link").click();

    const account = page.getByRole("region", { name: "Account" });
    await expect(account).toContainText(SEEDED_ADMIN.email);
    await expect(account.getByText("Admin", { exact: true })).toBeVisible();
    await expect(
      account.getByRole("button", { name: /^Make (admin|shopper)$/ }),
    ).toHaveCount(0);
  });

  test("covers the whole viewport behind an account confirmation", async ({
    page,
  }) => {
    await page.goto("/admin/users");
    const filters = page.getByRole("form", { name: "Filter users" });
    await filters.getByLabel("Search").fill(SEEDED_SHOPPER.email);
    await filters.getByRole("button", { name: "Apply" }).click();
    const rows = page.getByRole("table").getByRole("row");
    await expect(rows).toHaveCount(2);
    await rows.last().getByRole("link").click();

    const account = page.getByRole("region", { name: "Account" });
    await account.getByRole("button", { name: "Deactivate account" }).click();
    const dialog = page.getByRole("dialog", {
      name: "Deactivate this account?",
    });
    await expect(dialog).toBeVisible();

    // The overlay has neither a role nor text, so it is the suite's one test id.
    const overlay = page.getByTestId("dialog-overlay");
    await expect(overlay).toHaveCSS("top", "0px");
    expect(await overlay.boundingBox()).toEqual({
      x: 0,
      y: 0,
      ...page.viewportSize(),
    });

    await overlay.click({ position: { x: 5, y: 5 } });
    await expect(dialog).toBeHidden();
    const trigger = account.getByRole("button", { name: "Deactivate account" });
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(account.getByText("Active", { exact: true })).toBeVisible();
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

    await expect(page.getByRole("menuitem", { name: "Orders" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Admin" })).toHaveCount(0);
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
    await expect(statsHeading(page)).toBeVisible();
  });
});

test.describe("sole admin", () => {
  test.describe.configure({ lock: ORDERS_LOCK });
  test("the sole active admin cannot deactivate their account", async ({
    page,
    login,
    context,
  }) => {
    await login(SEEDED_ADMIN);
    const response = await context.request.get(
      "/api/v1/users?role=ADMIN&active=true",
    );
    expect(response.ok()).toBe(true);
    const { data } = (await response.json()) as {
      data: { id: string; email: string }[];
    };
    const others = data.filter(
      (user) =>
        user.email === "admin2@example.com" ||
        user.email === "admin3@example.com",
    );
    expect(others).toHaveLength(2);
    try {
      for (const user of others) {
        expect(
          (
            await context.request.patch(`/api/v1/users/${user.id}`, {
              data: { active: false },
            })
          ).ok(),
        ).toBe(true);
      }
      await page.goto("/account/security");
      const button = page.getByRole("button", { name: "Deactivate account" });
      await expect(button).toBeDisabled();
      await expect(button).toHaveAttribute(
        "aria-describedby",
        "sole-admin-notice",
      );
      await expect(
        page.getByText(
          "You are the only active admin. Make another user an admin from the dashboard before deactivating this account.",
        ),
      ).toBeVisible();
    } finally {
      for (const user of others) {
        expect(
          (
            await context.request.patch(`/api/v1/users/${user.id}`, {
              data: { active: true },
            })
          ).ok(),
        ).toBe(true);
      }
    }
  });
});
