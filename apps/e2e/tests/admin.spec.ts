import type { Page } from "@playwright/test";
import { ADMIN_STORAGE_STATE, SEEDED_ADMIN, expect, test } from "./fixtures.js";

const openUserMenu = (page: Page) =>
  page.getByRole("button", { name: "Open user menu" }).click();

const statsHeading = (page: Page) =>
  page.getByRole("heading", { name: "Stats", level: 1 });

// A stat card prints one number: a count as `1,234`, revenue as `$ 1,234`.
const statValue = (page: Page, label: string) =>
  page.getByRole("region", { name: label, exact: true }).getByRole("paragraph");

const readNumber = async (page: Page, label: string) =>
  Number((await statValue(page, label).innerText()).replace(/[^\d]/g, ""));

const shownCount = (count: number) => count.toLocaleString("en-US");
const shownMoney = (amount: number) => `$ ${shownCount(amount)}`;

test.describe("an admin", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test("reaches the dashboard from the account menu", async ({ page }) => {
    await page.goto("/");
    await openUserMenu(page);
    await page.getByRole("link", { name: "Admin" }).click();

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

  test("counts a fresh shopper's paid order in the week's stats", async ({
    page,
    context,
    placeOrderAsFreshShopper,
  }) => {
    await page.goto("/admin/stats?period=7d");
    await expect(page.getByRole("tab", { name: "7 days" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      page.getByRole("region", { name: "Orders by status" }),
    ).toBeVisible();
    const before = {
      orders: await readNumber(page, "Orders"),
      revenue: await readNumber(page, "Revenue"),
    };

    const { orderId } = await placeOrderAsFreshShopper();
    // Paid by the admin through the API, the way the fulfilment form does it.
    const paid = await context.request.patch(
      `/api/v1/orders/${orderId}/payment-status`,
      { data: { paymentStatus: "PAID" } },
    );
    expect(paid.ok(), "marking the order paid").toBe(true);
    const { total } = ((await paid.json()) as { data: { total: number } }).data;

    await page.goto("/admin/stats?period=7d");
    await expect(statValue(page, "Orders")).toHaveText(
      shownCount(before.orders + 1),
    );
    await expect(statValue(page, "Revenue")).toHaveText(
      shownMoney(before.revenue + total),
    );
    await expect(
      page.getByRole("region", { name: "Best sellers" }).getByRole("link"),
    ).not.toHaveCount(0);
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
});

test.describe("an admin editing the catalogue", () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  // The storefront prints a whole-dollar price as `$ 4,500`.
  const shown = (price: number) => `$ ${price.toLocaleString("en-US")}`;

  test("changes a product's price and sees it on the storefront", async ({
    page,
    context,
    catalogue,
  }) => {
    // A product no homepage slot renders, so the home page is untouched.
    const product = await catalogue.productBySlug("xx59-headphones");
    const edited = product.price + 1;

    try {
      await page.goto("/admin/products");
      await page
        .getByRole("table")
        .getByRole("link", { name: product.name })
        .click();

      await expect(page).toHaveURL(`/admin/products/${product.id}`);
      const form = page.getByRole("form", { name: "Edit product" });
      const save = form.getByRole("button", { name: "Save" });
      await expect(save).toBeDisabled();
      await expect(form.getByText(product.slug)).toBeVisible();

      await form.getByLabel("Price", { exact: true }).fill(String(edited));
      await expect(save).toBeEnabled();
      await save.click();
      await expect(save).toBeDisabled();
      await expect(form.getByLabel("Price", { exact: true })).toHaveValue(
        String(edited),
      );

      await page.goto(`/product/${product.slug}`);
      await expect(
        page.getByText(shown(edited), { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText(shown(product.price), { exact: true }),
      ).toHaveCount(0);
    } finally {
      // Put the price back for every other spec, through the admin's session.
      const restored = await context.request.patch(
        `/api/v1/products/${product.id}`,
        { data: { price: product.price } },
      );
      expect(restored.ok(), "restoring the price").toBe(true);
    }
  });

  test("is offered for each homepage slot only the products with its image", async ({
    page,
    catalogue,
  }) => {
    const [featured, showcase, products] = await Promise.all([
      catalogue.featuredProduct(),
      catalogue.showCaseProducts(),
      catalogue.products(),
    ]);
    const nameOf = (id: string) =>
      products.find((product) => product.id === id)?.name ?? id;
    const cover = showcase.showCaseCover;
    expect(cover).not.toBeNull();

    await page.goto("/admin/homepage");
    const form = page.getByRole("form", { name: "Homepage" });
    await expect(
      form.getByRole("button", { name: "Save homepage" }),
    ).toBeDisabled();

    // The seed has one product with a featured image, so the hero can only
    // be that product and the select says so.
    const featuredSlot = form.getByRole("region", { name: "Featured" });
    await expect(featuredSlot).toContainText(nameOf(featured.id));
    await featuredSlot.getByRole("button", { name: "Change" }).click();
    await featuredSlot.getByLabel("Product").click();
    const featuredOptions = page.getByRole("option");
    await expect(featuredOptions).toHaveCount(1);
    await expect(featuredOptions.first()).toHaveText(nameOf(featured.id));
    await page.keyboard.press("Escape");

    // The three showcase images fill the three showcase slots, so the cover
    // select offers all three and disables the two held elsewhere.
    const coverSlot = form.getByRole("region", { name: "Showcase cover" });
    await expect(coverSlot).toContainText(nameOf(cover!.id));
    await coverSlot.getByRole("button", { name: "Change" }).click();
    await coverSlot.getByLabel("Product").click();
    const coverOptions = page.getByRole("option");
    await expect(coverOptions).toHaveCount(3);
    await expect(
      page.getByRole("option", { name: nameOf(cover!.id) }),
    ).toBeEnabled();
    for (const slot of [showcase.showCaseWide, showcase.showCaseGrid]) {
      await expect(
        page.getByRole("option", { name: nameOf(slot!.id) }),
      ).toBeDisabled();
    }
    await page.keyboard.press("Escape");
    await expect(
      form.getByRole("button", { name: "Save homepage" }),
    ).toBeDisabled();
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
    await expect(statsHeading(page)).toBeVisible();
  });
});
