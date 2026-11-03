import { CATALOGUE_LOCK, expect, holdRoute, test } from "./fixtures.js";

// The admin catalogue specs change the showcase slots.
test.describe.configure({ lock: CATALOGUE_LOCK });

test("the home page shows the showcase products", async ({
  page,
  catalogue,
}) => {
  const { showCaseCover, showCaseWide, showCaseGrid } =
    await catalogue.showCaseProducts();
  const showCaseProducts = [showCaseCover, showCaseWide, showCaseGrid].filter(
    (product) => product !== null,
  );
  expect(showCaseProducts).toHaveLength(3);

  await page.goto("/");

  for (const product of showCaseProducts) {
    await expect(
      page.getByRole("heading", { name: product.shortLabel }),
    ).toBeVisible();
  }
});

test("a navigation home waits for the featured product and shows the hero with no spinner", async ({
  page,
  catalogue,
}) => {
  const { featuredImage } = (await catalogue.featuredProduct()).images;
  expect(featuredImage).not.toBeNull();

  await page.goto("/category/Headphones");
  const categoryHeading = page.getByRole("heading", {
    name: "Headphones",
    level: 1,
  });
  await expect(categoryHeading).toBeVisible();

  const release = await holdRoute(page, "**/api/v1/products/featured");
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "home", exact: true })
    .click();

  const progressBar = page.getByRole("progressbar", { name: "Loading page" });
  await expect(progressBar).toBeVisible();
  await expect(categoryHeading).toBeVisible();
  await expect(page).toHaveURL("/category/Headphones");

  release();

  await expect(progressBar).toBeHidden();
  await expect(page).toHaveURL("/");
  const hero = page.getByRole("main").locator("section").first();
  await expect(
    hero.getByRole("img", { name: featuredImage!.altText }),
  ).toBeVisible();
  await expect(hero.getByText("Loading section...")).toHaveCount(0);
});
