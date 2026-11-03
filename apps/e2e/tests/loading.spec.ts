import { CATALOGUE_LOCK, expect, holdRoute, test } from "./fixtures.js";

// A guest has no `/users/me` wait, and each fresh page starts with a cold cache.
test.use({ storageState: { cookies: [], origins: [] } });

// The admin catalogue specs change the showcase slots and the listed products.
test.describe.configure({ lock: CATALOGUE_LOCK });

test("a category navigation keeps the home page under the loading bar until its products arrive", async ({
  page,
  catalogue,
}) => {
  const [product] = await catalogue.productsByCategory("Headphones");
  const { showCaseWide } = await catalogue.showCaseProducts();
  expect(product).toBeDefined();
  expect(showCaseWide).not.toBeNull();

  const release = await holdRoute(
    page,
    "**/api/v1/categories/Headphones/products",
  );

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: showCaseWide!.shortLabel, exact: true }),
  ).toBeVisible();

  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Headphones", exact: true })
    .click();

  const progressBar = page.getByRole("progressbar", { name: "Loading page" });
  await expect(progressBar).toBeVisible();
  await expect(
    page
      .locator("[aria-busy='true']")
      .getByRole("heading", { name: showCaseWide!.shortLabel, exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL("/");

  release();

  await expect(progressBar).toBeHidden();
  await expect(page).toHaveURL("/category/Headphones");
  await expect(
    page.getByRole("heading", { name: "Headphones", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("article").filter({
      has: page.getByRole("heading", { name: product.fullLabel.join(" ") }),
    }),
  ).toBeVisible();
});

test("a product navigation keeps the home page under the loading bar until the product arrives", async ({
  page,
  catalogue,
}) => {
  const { showCaseWide } = await catalogue.showCaseProducts();
  expect(showCaseWide).not.toBeNull();
  const product = await catalogue.productBySlug(showCaseWide!.slug);

  const release = await holdRoute(
    page,
    `**/api/v1/products/slug/${product.slug}`,
  );

  await page.goto("/");
  const showcaseHeading = page.getByRole("heading", {
    name: showCaseWide!.shortLabel,
    exact: true,
  });
  await expect(showcaseHeading).toBeVisible();

  await page
    .getByRole("article")
    .filter({ has: showcaseHeading })
    .getByRole("link", { name: "see product" })
    .click();

  const progressBar = page.getByRole("progressbar", { name: "Loading page" });
  await expect(progressBar).toBeVisible();
  await expect(
    page
      .locator("[aria-busy='true']")
      .getByRole("heading", { name: showCaseWide!.shortLabel, exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL("/");

  release();

  await expect(progressBar).toBeHidden();
  await expect(page).toHaveURL(`/product/${product.slug}`);
  await expect(
    page.getByRole("heading", {
      name: product.fullLabel.join(" "),
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "add to cart" })).toBeVisible();
});
