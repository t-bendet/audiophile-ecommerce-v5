import { CATALOGUE_LOCK, expect, test } from "./fixtures.js";

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
