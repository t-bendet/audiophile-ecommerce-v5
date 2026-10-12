import { expect, test } from "./fixtures.js";

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
